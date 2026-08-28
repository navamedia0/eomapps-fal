import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Secret',
};

const SESSION_TTL_DAYS = 60;

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
  };
}

const MAX_POST_LENGTH = 280;
const MAX_COMMENT_LENGTH = 500;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 2000;
const ROOM_SEAT_COUNT = 10;
const MAX_ROOM_NAME_LENGTH = 60;
const MAX_ROOM_MESSAGE_LENGTH = 500;
const LIVEKIT_TOKEN_TTL_SECONDS = 6 * 3600;
const MAX_REPORT_REASON_LENGTH = 300;
const MAX_GUIDE_APPLICATION_LENGTH = 600;
const VALID_REPORT_TARGETS = new Set(['post', 'comment', 'user']);
// Bu kadar farklı kullanıcı şikayet ederse içerik manuel inceleme
// beklenmeden akıştan otomatik gizlenir.
const REPORT_HIDE_THRESHOLD = 3;
// Keşfet kalıcı bir arşiv değil — gönderiler bu süre sonunda feed'den
// düşer ve zamanlanmış görev tarafından tamamen silinir (metin dahil).
const POST_RETENTION_DAYS = 3;

function postRetentionCutoff() {
  return new Date(Date.now() - POST_RETENTION_DAYS * 24 * 3600 * 1000).toISOString();
}

// O anki haftanın başlangıcı (Pazartesi 00:00 UTC) — popülerlik listesi ayrı
// bir "sıfırlama" işlemi gerektirmiyor, her sorguda bu tarihten sonrası
// canlı hesaplanıyor.
function currentWeekStart(reference = new Date()) {
  const day = reference.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  return new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate() - diffToMonday),
  );
}

// Her Pazartesi çalışır: biten haftanın (bir önceki Pazartesi — bu Pazartesi
// aralığı) harcama liderlerine "Haftalık Yıldız" başarımını verir.
async function grantWeeklyPopularityAwards(env, ctx) {
  const thisMonday = currentWeekStart();
  const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 3600 * 1000);
  const { results } = await env.DB.prepare(
    `SELECT user_id, SUM(-amount) as score FROM ledger_entries
     WHERE amount < 0 AND created_at >= ? AND created_at < ?
     GROUP BY user_id HAVING score > 0 ORDER BY score DESC LIMIT 10`,
  )
    .bind(lastMonday.toISOString(), thisMonday.toISOString())
    .all();
  for (const row of results) {
    await checkAndGrantAchievement(env, ctx, row.user_id, 'popularity_weekly_star', 1);
  }
}

async function purgeExpiredPosts(env) {
  const cutoff = postRetentionCutoff();
  const { results } = await env.DB.prepare('SELECT id, image_key FROM posts WHERE created_at <= ?')
    .bind(cutoff)
    .all();
  if (results.length === 0) return;
  const ids = results.map((row) => row.id);
  const imageKeys = results.filter((row) => row.image_key).map((row) => row.image_key);
  const placeholders = ids.map(() => '?').join(',');
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM post_likes WHERE post_id IN (${placeholders})`).bind(...ids),
    env.DB.prepare(`DELETE FROM comments WHERE post_id IN (${placeholders})`).bind(...ids),
    env.DB.prepare(`DELETE FROM reports WHERE target_type = 'post' AND target_id IN (${placeholders})`).bind(...ids),
    env.DB.prepare(`DELETE FROM posts WHERE id IN (${placeholders})`).bind(...ids),
  ]);
  if (imageKeys.length > 0) await env.IMAGES.delete(imageKeys);
}

// Rehberler/kullanıcı adı sistemi henüz yok — o gelene kadar profil id'sinin
// ilk 8 karakterinden geçici bir @etiket türetiyoruz.
function publicPost(row, imagesOrigin, meId) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.display_name || 'Mistik Rehber Kullanıcısı',
    authorTag: `@${row.author_id.slice(0, 8)}`,
    isMe: !!meId && row.author_id === meId,
    text: row.text,
    imageUri: row.image_key ? `${imagesOrigin}/images/${row.image_key}` : undefined,
    createdAt: row.created_at,
    liked: !!row.liked,
    likeCount: row.like_count,
    commentCount: row.comment_count ?? 0,
  };
}

function publicComment(row, meId) {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.display_name || 'Mistik Rehber Kullanıcısı',
    authorTag: `@${row.author_id.slice(0, 8)}`,
    isMe: !!meId && row.author_id === meId,
    text: row.text,
    createdAt: row.created_at,
  };
}

// Hediye/popülerlik/mağaza gibi henüz yazılmamış özellikler bu fonksiyonu
// çağırarak kullanıcı cüzdanına işlem ekleyecek — kendi başına bir HTTP ucu
// değil, o özellikler kendi uçlarından bunu tetikleyecek.
async function creditWallet(env, userId, currency, amount, reason) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO ledger_entries (id, user_id, currency, amount, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(id, userId, currency, amount, reason, now),
    env.DB.prepare(
      `INSERT INTO wallets (user_id, currency, balance, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, currency) DO UPDATE SET balance = balance + excluded.balance, updated_at = excluded.updated_at`,
    ).bind(userId, currency, amount, now),
  ]);
}

// Bakiye yetersizse hiçbir şey yazmadan false döner; yeterliyse borç düşer
// (negatif tutarla creditWallet çağırır) ve true döner. Mağaza/VIP satın
// alma gibi harcama gerektiren her akış bunu kullanır.
async function debitWallet(env, ctx, userId, currency, amount, reason) {
  const wallet = await env.DB.prepare('SELECT balance FROM wallets WHERE user_id = ? AND currency = ?')
    .bind(userId, currency)
    .first();
  if ((wallet?.balance ?? 0) < amount) return false;
  await creditWallet(env, userId, currency, -amount, reason);
  // Harcama = popülerlik puanı (Faz 7). Ödül gösterimi ayrı bir liderlik
  // tablosu tutmuyor, doğrudan ledger_entries'ten canlı hesaplanıyor.
  const totalSpent = await env.DB.prepare('SELECT SUM(-amount) as total FROM ledger_entries WHERE user_id = ? AND amount < 0')
    .bind(userId)
    .first();
  ctx.waitUntil(checkAndGrantAchievement(env, ctx, userId, 'popularity_legend', totalSpent.total ?? 0));
  return true;
}

// Takip/hediye/mesaj gibi olaylar bu fonksiyonu çağırarak kullanıcının
// kayıtlı tüm cihazlarına Expo push bildirimi gönderir. Token geçersizse
// (uygulama kaldırılmış vb.) sessizce yutulur — bildirim en fazla gecikir,
// asıl isteği (takip etme vb.) hiçbir zaman bozmaz.
async function sendPushNotifications(env, userId, title, body, data) {
  try {
    const { results } = await env.DB.prepare('SELECT token FROM push_tokens WHERE user_id = ?').bind(userId).all();
    if (results.length === 0) return;
    const messages = results.map((row) => ({ to: row.token, title, body, data: data ?? {} }));
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch {
    // Push gönderimi en iyi çaba (best-effort) — hata sessizce yutuluyor.
  }
}

// LiveKit'in kendi sunucu SDK'sı Node'a özgü bağımlılıklar kullanıyor ve
// Workers'ta çalışmıyor — bu yüzden erişim token'ını LiveKit'in belgelenmiş
// JWT biçimine göre (HS256, `video` altında VideoGrant) doğrudan jose ile
// imzalıyoruz.
async function createLiveKitToken(env, roomName, identity, name) {
  const secret = new TextEncoder().encode(env.LIVEKIT_API_SECRET);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    name,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.LIVEKIT_API_KEY)
    .setSubject(identity)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + LIVEKIT_TOKEN_TTL_SECONDS)
    .setJti(crypto.randomUUID())
    .sign(secret);
}

// Bir başarımın eşiklerini currentValue'ya göre kontrol eder, yeni geçilen
// kademeleri user_achievements'a yazar ve her biri için push bildirimi
// yollar (fire-and-forget, ctx.waitUntil ile). Birden fazla kademe birden
// geçilmişse (örn. 5 takipçiden 60'a çıkmak) hepsini tek seferde açar.
async function checkAndGrantAchievement(env, ctx, userId, achievementId, currentValue) {
  const definition = await env.DB.prepare('SELECT tiers, name FROM achievement_definitions WHERE id = ?')
    .bind(achievementId)
    .first();
  if (!definition) return;
  const tiers = JSON.parse(definition.tiers);
  const { results: unlockedRows } = await env.DB.prepare(
    'SELECT tier FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
  )
    .bind(userId, achievementId)
    .all();
  const unlockedTiers = new Set(unlockedRows.map((row) => row.tier));
  const now = new Date().toISOString();
  for (const t of tiers) {
    if (currentValue >= t.threshold && !unlockedTiers.has(t.tier)) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, tier, unlocked_at) VALUES (?, ?, ?, ?)',
      )
        .bind(userId, achievementId, t.tier, now)
        .run();
      ctx.waitUntil(
        sendPushNotifications(env, userId, 'Yeni başarım!', `${definition.name} — ${t.label}`, {
          type: 'achievement',
          achievementId,
          tier: t.tier,
        }),
      );
    }
  }
}

async function isBlockedEitherWay(env, userIdA, userIdB) {
  const row = await env.DB.prepare(
    `SELECT 1 FROM blocks
     WHERE (blocker_id = ?1 AND blocked_id = ?2) OR (blocker_id = ?2 AND blocked_id = ?1)`,
  )
    .bind(userIdA, userIdB)
    .first();
  return !!row;
}

async function requireAppSecret(request, env) {
  // APP_SECRET henüz ayarlanmadıysa (yerel geliştirme) kontrolü atla.
  if (!env.APP_SECRET) return true;
  return request.headers.get('X-App-Secret') === env.APP_SECRET;
}

async function upsertUser(env, provider, sub, email, displayName, avatarUrl) {
  const existing = await env.DB.prepare('SELECT * FROM users WHERE provider = ? AND provider_sub = ?')
    .bind(provider, sub)
    .first();
  if (existing) {
    // Apple sadece ilk yetkilendirmede email/isim gönderir — o veri elimize
    // geçtiyse ve kayıtta yoksa burada tamamlıyoruz, üzerine yazmıyoruz.
    if ((email && !existing.email) || (displayName && !existing.display_name)) {
      await env.DB.prepare('UPDATE users SET email = COALESCE(email, ?), display_name = COALESCE(display_name, ?) WHERE id = ?')
        .bind(email ?? null, displayName ?? null, existing.id)
        .run();
      return { ...existing, email: existing.email ?? email, display_name: existing.display_name ?? displayName };
    }
    return existing;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO users (id, provider, provider_sub, email, display_name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, provider, sub, email ?? null, displayName ?? null, avatarUrl ?? null, now)
    .run();
  return { id, provider, provider_sub: sub, email, display_name: displayName, avatar_url: avatarUrl, created_at: now };
}

async function createSession(env, userId) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 3600 * 1000);
  await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, now.toISOString(), expires.toISOString())
    .run();
  return token;
}

async function getSessionUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return env.DB.prepare(
    'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?',
  )
    .bind(token, new Date().toISOString())
    .first();
}

async function verifyGoogleToken(idToken, expectedAudience) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: expectedAudience,
  });
  return payload;
}

async function verifyAppleToken(identityToken, expectedAudience) {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: expectedAudience,
  });
  return payload;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname;

    // Gönderi görselleri React Native <Image> tarafından özel header olmadan
    // yüklendiği için bu yol app secret kontrolünün dışında tutulur — içerik
    // zaten Keşfet akışında herkese açık gösteriliyor.
    if (!path.startsWith('/images/') && !(await requireAppSecret(request, env))) return json({ error: 'unauthorized' }, 401);

    try {
      if (path === '/auth/google' && request.method === 'POST') {
        const { idToken } = await request.json();
        if (!idToken) return json({ error: 'idToken gerekli' }, 400);
        if (!env.GOOGLE_CLIENT_ID) return json({ error: 'GOOGLE_CLIENT_ID sunucuda tanımlı değil' }, 500);
        const payload = await verifyGoogleToken(idToken, env.GOOGLE_CLIENT_ID);
        const user = await upsertUser(env, 'google', payload.sub, payload.email, payload.name, payload.picture);
        const token = await createSession(env, user.id);
        return json({ token, user: publicUser(user) });
      }

      if (path === '/auth/apple' && request.method === 'POST') {
        const { identityToken, email, fullName } = await request.json();
        if (!identityToken) return json({ error: 'identityToken gerekli' }, 400);
        if (!env.APPLE_CLIENT_ID) return json({ error: 'APPLE_CLIENT_ID sunucuda tanımlı değil' }, 500);
        const payload = await verifyAppleToken(identityToken, env.APPLE_CLIENT_ID);
        const user = await upsertUser(env, 'apple', payload.sub, payload.email ?? email, fullName, null);
        const token = await createSession(env, user.id);
        return json({ token, user: publicUser(user) });
      }

      if (path === '/me' && request.method === 'GET') {
        const user = await getSessionUser(request, env);
        if (!user) return json({ error: 'oturum geçersiz' }, 401);
        return json({ user: publicUser(user) });
      }

      const followMatch = path.match(/^\/follow\/([^/]+)$/);
      if (followMatch && (request.method === 'POST' || request.method === 'DELETE')) {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const targetId = followMatch[1];
        if (targetId === me.id) return json({ error: 'kendini takip edemezsin' }, 400);
        if (request.method === 'POST') {
          await env.DB.prepare('INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)')
            .bind(me.id, targetId, new Date().toISOString())
            .run();
          ctx.waitUntil(
            sendPushNotifications(
              env,
              targetId,
              'Yeni takipçi',
              `${me.display_name || 'Biri'} seni takip etmeye başladı.`,
              { type: 'follow', userId: me.id },
            ),
          );
          const [followingCount, followerCount] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(me.id).first(),
            env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE followee_id = ?').bind(targetId).first(),
          ]);
          ctx.waitUntil(checkAndGrantAchievement(env, ctx, me.id, 'social_first_follow', followingCount.c));
          ctx.waitUntil(checkAndGrantAchievement(env, ctx, targetId, 'social_followers', followerCount.c));
        } else {
          await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, targetId).run();
        }
        return json({ ok: true });
      }

      const blockMatch = path.match(/^\/block\/([^/]+)$/);
      if (blockMatch && (request.method === 'POST' || request.method === 'DELETE')) {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const targetId = blockMatch[1];
        if (targetId === me.id) return json({ error: 'kendini engelleyemezsin' }, 400);
        if (request.method === 'POST') {
          await env.DB.batch([
            env.DB.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').bind(
              me.id,
              targetId,
              new Date().toISOString(),
            ),
            env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, targetId),
            env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').bind(targetId, me.id),
          ]);
        } else {
          await env.DB.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').bind(me.id, targetId).run();
        }
        return json({ ok: true });
      }

      if (path === '/blocks' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { results } = await env.DB.prepare(
          `SELECT users.id, users.display_name, users.avatar_url, blocks.created_at AS blocked_at
           FROM blocks
           JOIN users ON users.id = blocks.blocked_id
           WHERE blocks.blocker_id = ?
           ORDER BY blocks.created_at DESC`,
        )
          .bind(me.id)
          .all();
        return json({
          blocked: results.map((row) => ({
            id: row.id,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            blockedAt: row.blocked_at,
          })),
        });
      }

      if (path === '/conversations' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { results } = await env.DB.prepare(
          `SELECT messages.id, messages.sender_id, messages.recipient_id, messages.text, messages.created_at, messages.read_at
           FROM messages
           WHERE messages.sender_id = ? OR messages.recipient_id = ?
           ORDER BY messages.created_at DESC
           LIMIT 500`,
        )
          .bind(me.id, me.id)
          .all();
        const seen = new Set();
        const conversations = [];
        for (const row of results) {
          const partnerId = row.sender_id === me.id ? row.recipient_id : row.sender_id;
          if (seen.has(partnerId)) continue;
          seen.add(partnerId);
          conversations.push({
            partnerId,
            lastText: row.text,
            lastAt: row.created_at,
            lastFromMe: row.sender_id === me.id,
          });
        }
        if (conversations.length === 0) return json({ conversations: [] });
        const placeholders = conversations.map(() => '?').join(',');
        const [{ results: partners }, { results: unreadRows }] = await Promise.all([
          env.DB.prepare(`SELECT id, display_name, avatar_url FROM users WHERE id IN (${placeholders})`)
            .bind(...conversations.map((c) => c.partnerId))
            .all(),
          env.DB.prepare(
            `SELECT sender_id, COUNT(*) as c FROM messages WHERE recipient_id = ? AND read_at IS NULL GROUP BY sender_id`,
          )
            .bind(me.id)
            .all(),
        ]);
        const partnerById = new Map(partners.map((p) => [p.id, p]));
        const unreadByPartner = new Map(unreadRows.map((r) => [r.sender_id, r.c]));
        return json({
          conversations: conversations.map((c) => {
            const partner = partnerById.get(c.partnerId);
            return {
              partnerId: c.partnerId,
              partnerName: partner?.display_name || 'Mistik Rehber Kullanıcısı',
              partnerAvatarUrl: partner?.avatar_url ?? null,
              lastText: c.lastText,
              lastAt: c.lastAt,
              lastFromMe: c.lastFromMe,
              unreadCount: unreadByPartner.get(c.partnerId) ?? 0,
            };
          }),
        });
      }

      const threadMatch = path.match(/^\/messages\/([^/]+)$/);
      if (threadMatch && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const partnerId = threadMatch[1];
        const { results } = await env.DB.prepare(
          `SELECT id, sender_id, recipient_id, text, created_at, read_at
           FROM messages
           WHERE (sender_id = ?1 AND recipient_id = ?2) OR (sender_id = ?2 AND recipient_id = ?1)
           ORDER BY created_at DESC
           LIMIT 100`,
        )
          .bind(me.id, partnerId)
          .all();
        await env.DB.prepare('UPDATE messages SET read_at = ? WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL')
          .bind(new Date().toISOString(), me.id, partnerId)
          .run();
        return json({
          messages: results.reverse().map((row) => ({
            id: row.id,
            fromMe: row.sender_id === me.id,
            text: row.text,
            createdAt: row.created_at,
            read: row.sender_id === me.id ? row.read_at !== null : true,
          })),
        });
      }

      if (threadMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const partnerId = threadMatch[1];
        if (partnerId === me.id) return json({ error: 'kendine mesaj gönderemezsin' }, 400);
        const partner = await env.DB.prepare('SELECT id, display_name FROM users WHERE id = ?').bind(partnerId).first();
        if (!partner) return json({ error: 'kullanıcı bulunamadı' }, 404);
        if (await isBlockedEitherWay(env, me.id, partnerId)) return json({ error: 'bu kullanıcıya mesaj gönderemezsin' }, 403);
        const { text } = await request.json();
        const trimmed = String(text || '').trim().slice(0, MAX_MESSAGE_LENGTH);
        if (!trimmed) return json({ error: 'Boş bir mesaj gönderilemez.' }, 400);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
          'INSERT INTO messages (id, sender_id, recipient_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(id, me.id, partnerId, trimmed, now)
          .run();
        ctx.waitUntil(
          sendPushNotifications(env, partnerId, me.display_name || 'Yeni mesaj', trimmed, { type: 'message', userId: me.id }),
        );
        return json({ message: { id, fromMe: true, text: trimmed, createdAt: now, read: false } }, 201);
      }

      if (path === '/rooms' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT rooms.id, rooms.name, rooms.host_id, rooms.created_at, users.display_name AS host_display_name,
                  (SELECT COUNT(*) FROM room_seats WHERE room_seats.room_id = rooms.id) AS seated_count
           FROM rooms
           JOIN users ON users.id = rooms.host_id
           ORDER BY rooms.created_at DESC
           LIMIT 50`,
        ).all();
        return json({
          rooms: results.map((row) => ({
            id: row.id,
            name: row.name,
            hostId: row.host_id,
            hostName: row.host_display_name || 'Mistik Rehber Kullanıcısı',
            seatedCount: row.seated_count,
            capacity: ROOM_SEAT_COUNT,
            createdAt: row.created_at,
          })),
        });
      }

      if (path === '/rooms' && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { name } = await request.json();
        const trimmed = String(name || '').trim().slice(0, MAX_ROOM_NAME_LENGTH);
        if (!trimmed) return json({ error: 'Oda adı gerekli.' }, 400);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO rooms (id, name, host_id, created_at) VALUES (?, ?, ?, ?)').bind(id, trimmed, me.id, now),
          env.DB.prepare('INSERT INTO room_seats (room_id, seat_index, user_id, joined_at) VALUES (?, 0, ?, ?)').bind(
            id,
            me.id,
            now,
          ),
        ]);
        return json(
          {
            room: {
              id,
              name: trimmed,
              hostId: me.id,
              hostName: me.display_name || 'Mistik Rehber Kullanıcısı',
              seatedCount: 1,
              capacity: ROOM_SEAT_COUNT,
              createdAt: now,
            },
          },
          201,
        );
      }

      const roomSeatMatch = path.match(/^\/rooms\/([^/]+)\/seats\/(\d+)$/);
      if (roomSeatMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const roomId = roomSeatMatch[1];
        const seatIndex = Number(roomSeatMatch[2]);
        if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= ROOM_SEAT_COUNT) {
          return json({ error: 'geçersiz koltuk' }, 400);
        }
        const room = await env.DB.prepare('SELECT id, host_id FROM rooms WHERE id = ?').bind(roomId).first();
        if (!room) return json({ error: 'oda bulunamadı' }, 404);
        const taken = await env.DB.prepare('SELECT user_id FROM room_seats WHERE room_id = ? AND seat_index = ?')
          .bind(roomId, seatIndex)
          .first();
        if (taken) return json({ error: 'bu koltuk dolu' }, 409);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM room_seats WHERE room_id = ? AND user_id = ?').bind(roomId, me.id),
          env.DB.prepare('INSERT INTO room_seats (room_id, seat_index, user_id, joined_at) VALUES (?, ?, ?, ?)').bind(
            roomId,
            seatIndex,
            me.id,
            new Date().toISOString(),
          ),
        ]);
        if (room.host_id !== me.id) {
          ctx.waitUntil(
            sendPushNotifications(env, room.host_id, 'Odana katılan var', `${me.display_name || 'Biri'} odana katıldı.`, {
              type: 'room-join',
              roomId,
            }),
          );
        }
        return json({ ok: true });
      }

      const roomLeaveMatch = path.match(/^\/rooms\/([^/]+)\/seat$/);
      if (roomLeaveMatch && request.method === 'DELETE') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const roomId = roomLeaveMatch[1];
        await env.DB.prepare('DELETE FROM room_seats WHERE room_id = ? AND user_id = ?').bind(roomId, me.id).run();
        const remaining = await env.DB.prepare('SELECT COUNT(*) as c FROM room_seats WHERE room_id = ?').bind(roomId).first();
        if (remaining.c === 0) {
          await env.DB.batch([
            env.DB.prepare('DELETE FROM room_messages WHERE room_id = ?').bind(roomId),
            env.DB.prepare('DELETE FROM rooms WHERE id = ?').bind(roomId),
          ]);
        }
        return json({ ok: true });
      }

      const roomTokenMatch = path.match(/^\/rooms\/([^/]+)\/token$/);
      if (roomTokenMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const roomId = roomTokenMatch[1];
        const seated = await env.DB.prepare('SELECT 1 FROM room_seats WHERE room_id = ? AND user_id = ?')
          .bind(roomId, me.id)
          .first();
        if (!seated) return json({ error: 'ses akışına katılmak için koltuğa oturmalısın' }, 403);
        if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) return json({ error: 'LiveKit sunucuda tanımlı değil' }, 500);
        const token = await createLiveKitToken(env, roomId, me.id, me.display_name || 'Mistik Rehber Kullanıcısı');
        return json({ token });
      }

      const roomMessagesMatch = path.match(/^\/rooms\/([^/]+)\/messages$/);
      if (roomMessagesMatch && request.method === 'GET') {
        const roomId = roomMessagesMatch[1];
        const { results } = await env.DB.prepare(
          `SELECT room_messages.id, room_messages.sender_id, room_messages.text, room_messages.created_at, users.display_name
           FROM room_messages
           JOIN users ON users.id = room_messages.sender_id
           WHERE room_messages.room_id = ?
           ORDER BY room_messages.created_at ASC
           LIMIT 200`,
        )
          .bind(roomId)
          .all();
        return json({
          messages: results.map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            senderName: row.display_name || 'Mistik Rehber Kullanıcısı',
            text: row.text,
            createdAt: row.created_at,
          })),
        });
      }

      if (roomMessagesMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const roomId = roomMessagesMatch[1];
        const seated = await env.DB.prepare('SELECT 1 FROM room_seats WHERE room_id = ? AND user_id = ?')
          .bind(roomId, me.id)
          .first();
        if (!seated) return json({ error: 'konuşmak için koltuğa oturmalısın' }, 403);
        const { text } = await request.json();
        const trimmed = String(text || '').trim().slice(0, MAX_ROOM_MESSAGE_LENGTH);
        if (!trimmed) return json({ error: 'Boş bir mesaj gönderilemez.' }, 400);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare('INSERT INTO room_messages (id, room_id, sender_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(id, roomId, me.id, trimmed, now)
          .run();
        return json(
          {
            message: {
              id,
              senderId: me.id,
              senderName: me.display_name || 'Mistik Rehber Kullanıcısı',
              text: trimmed,
              createdAt: now,
            },
          },
          201,
        );
      }

      const roomMatch = path.match(/^\/rooms\/([^/]+)$/);
      if (roomMatch && request.method === 'GET') {
        const roomId = roomMatch[1];
        const room = await env.DB.prepare(
          `SELECT rooms.id, rooms.name, rooms.host_id, rooms.created_at, users.display_name AS host_display_name
           FROM rooms JOIN users ON users.id = rooms.host_id WHERE rooms.id = ?`,
        )
          .bind(roomId)
          .first();
        if (!room) return json({ error: 'oda bulunamadı' }, 404);
        const { results: seatRows } = await env.DB.prepare(
          `SELECT room_seats.seat_index, room_seats.user_id, users.display_name, users.avatar_url
           FROM room_seats
           JOIN users ON users.id = room_seats.user_id
           WHERE room_seats.room_id = ?`,
        )
          .bind(roomId)
          .all();
        const seats = Array.from({ length: ROOM_SEAT_COUNT }, (_, index) => {
          const occupant = seatRows.find((row) => row.seat_index === index);
          return occupant
            ? {
                index,
                userId: occupant.user_id,
                displayName: occupant.display_name || 'Mistik Rehber Kullanıcısı',
                avatarUrl: occupant.avatar_url,
              }
            : null;
        });
        return json({
          room: {
            id: room.id,
            name: room.name,
            hostId: room.host_id,
            hostName: room.host_display_name || 'Mistik Rehber Kullanıcısı',
            createdAt: room.created_at,
          },
          seats,
        });
      }

      const userMatch = path.match(/^\/users\/([^/]+)$/);
      if (userMatch && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        const targetId = userMatch[1];
        const target = await env.DB.prepare(
          'SELECT id, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
        )
          .bind(targetId)
          .first();
        if (!target) return json({ error: 'kullanıcı bulunamadı' }, 404);
        const [followerCount, followingCount, followingRow] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE followee_id = ?').bind(targetId).first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(targetId).first(),
          me
            ? env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').bind(me.id, targetId).first()
            : null,
        ]);
        return json({
          user: publicUser(target),
          followerCount: followerCount.c,
          followingCount: followingCount.c,
          isFollowing: !!followingRow,
        });
      }

      if (path === '/push-token' && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { token, platform } = await request.json();
        if (!token) return json({ error: 'token gerekli' }, 400);
        await env.DB.prepare('INSERT OR IGNORE INTO push_tokens (user_id, token, platform, created_at) VALUES (?, ?, ?, ?)')
          .bind(me.id, token, platform ?? null, new Date().toISOString())
          .run();
        return json({ ok: true });
      }

      if (path === '/push-token' && request.method === 'DELETE') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { token } = await request.json();
        if (!token) return json({ error: 'token gerekli' }, 400);
        await env.DB.prepare('DELETE FROM push_tokens WHERE user_id = ? AND token = ?').bind(me.id, token).run();
        return json({ ok: true });
      }

      if (path === '/reports' && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { targetType, targetId, reason } = await request.json();
        if (!VALID_REPORT_TARGETS.has(targetType)) return json({ error: 'geçersiz hedef türü' }, 400);
        if (!targetId) return json({ error: 'targetId gerekli' }, 400);
        const trimmedReason = String(reason || '').trim().slice(0, MAX_REPORT_REASON_LENGTH);
        if (!trimmedReason) return json({ error: 'Bir sebep belirtmelisin.' }, 400);
        const id = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
          .bind(id, me.id, targetType, targetId, trimmedReason, new Date().toISOString())
          .run();
        return json({ ok: true }, 201);
      }

      if (path === '/guide-applications' && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const latest = await env.DB.prepare(
          'SELECT status FROM guide_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        )
          .bind(me.id)
          .first();
        if (latest && (latest.status === 'pending' || latest.status === 'approved')) {
          return json({ error: 'zaten bekleyen ya da onaylanmış bir başvurun var' }, 409);
        }
        const { message } = await request.json();
        const trimmed = String(message || '').trim().slice(0, MAX_GUIDE_APPLICATION_LENGTH);
        if (!trimmed) return json({ error: 'Başvuru mesajı gerekli.' }, 400);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
          'INSERT INTO guide_applications (id, user_id, message, status, created_at) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(id, me.id, trimmed, 'pending', now)
          .run();
        return json({ application: { id, message: trimmed, status: 'pending', createdAt: now } }, 201);
      }

      if (path === '/guide-applications/me' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const latest = await env.DB.prepare(
          'SELECT id, message, status, created_at, decided_at FROM guide_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        )
          .bind(me.id)
          .first();
        return json({
          application: latest
            ? {
                id: latest.id,
                message: latest.message,
                status: latest.status,
                createdAt: latest.created_at,
                decidedAt: latest.decided_at,
              }
            : null,
        });
      }

      if (path === '/guides' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT users.id, users.display_name, users.avatar_url, guide_applications.message, guide_applications.decided_at
           FROM guide_applications
           JOIN users ON users.id = guide_applications.user_id
           WHERE guide_applications.status = 'approved'
             AND guide_applications.created_at = (
               SELECT MAX(ga2.created_at) FROM guide_applications ga2 WHERE ga2.user_id = guide_applications.user_id
             )
           ORDER BY guide_applications.decided_at DESC
           LIMIT 100`,
        ).all();
        return json({
          guides: results.map((row) => ({
            id: row.id,
            displayName: row.display_name || 'Mistik Rehber Kullanıcısı',
            avatarUrl: row.avatar_url,
            bio: row.message,
          })),
        });
      }

      if (path === '/popularity/leaderboard' && request.method === 'GET') {
        const weekStart = currentWeekStart().toISOString();
        const { results } = await env.DB.prepare(
          `SELECT ledger_entries.user_id, users.display_name, users.avatar_url, SUM(-ledger_entries.amount) as score
           FROM ledger_entries
           JOIN users ON users.id = ledger_entries.user_id
           WHERE ledger_entries.amount < 0 AND ledger_entries.created_at >= ?
           GROUP BY ledger_entries.user_id
           HAVING score > 0
           ORDER BY score DESC
           LIMIT 50`,
        )
          .bind(weekStart)
          .all();
        return json({
          weekStart,
          leaderboard: results.map((row, index) => ({
            rank: index + 1,
            userId: row.user_id,
            displayName: row.display_name || 'Mistik Rehber Kullanıcısı',
            avatarUrl: row.avatar_url,
            score: row.score,
          })),
        });
      }

      if (path === '/achievements' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const [{ results: definitions }, { results: unlocked }, followingCount, followerCount, postCount] = await Promise.all([
          env.DB.prepare('SELECT * FROM achievement_definitions ORDER BY category, id').all(),
          env.DB.prepare('SELECT achievement_id, tier, unlocked_at FROM user_achievements WHERE user_id = ?').bind(me.id).all(),
          env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(me.id).first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE followee_id = ?').bind(me.id).first(),
          env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE author_id = ?').bind(me.id).first(),
        ]);
        const progressById = {
          social_first_follow: followingCount.c,
          social_followers: followerCount.c,
          social_first_post: postCount.c,
        };
        const unlockedByAchievement = new Map();
        unlocked.forEach((row) => {
          const list = unlockedByAchievement.get(row.achievement_id) ?? [];
          list.push({ tier: row.tier, unlockedAt: row.unlocked_at });
          unlockedByAchievement.set(row.achievement_id, list);
        });
        return json({
          achievements: definitions.map((def) => ({
            id: def.id,
            category: def.category,
            name: def.name,
            description: def.description,
            tiers: JSON.parse(def.tiers),
            unlockedTiers: unlockedByAchievement.get(def.id) ?? [],
            progress: progressById[def.id] ?? null,
          })),
        });
      }

      if (path === '/wallet' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const [{ results: walletRows }, { results: entryRows }] = await Promise.all([
          env.DB.prepare('SELECT currency, balance FROM wallets WHERE user_id = ?').bind(me.id).all(),
          env.DB.prepare(
            'SELECT id, currency, amount, reason, created_at FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
          )
            .bind(me.id)
            .all(),
        ]);
        const balances = { coin: 0, crystal: 0 };
        walletRows.forEach((row) => {
          balances[row.currency] = row.balance;
        });
        return json({
          balances,
          entries: entryRows.map((row) => ({
            id: row.id,
            currency: row.currency,
            amount: row.amount,
            reason: row.reason,
            createdAt: row.created_at,
          })),
        });
      }

      if (path === '/shop/items' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        const category = url.searchParams.get('category');
        const { results } = await (category
          ? env.DB.prepare('SELECT * FROM shop_items WHERE active = 1 AND category = ? ORDER BY category, price').bind(category)
          : env.DB.prepare('SELECT * FROM shop_items WHERE active = 1 ORDER BY category, price')
        ).all();
        let ownedIds = new Set();
        if (me) {
          const { results: owned } = await env.DB.prepare('SELECT item_id FROM shop_purchases WHERE user_id = ?').bind(me.id).all();
          ownedIds = new Set(owned.map((row) => row.item_id));
        }
        return json({
          items: results.map((row) => ({
            id: row.id,
            category: row.category,
            name: row.name,
            description: row.description,
            currency: row.currency,
            price: row.price,
            owned: ownedIds.has(row.id),
          })),
        });
      }

      const shopPurchaseMatch = path.match(/^\/shop\/items\/([^/]+)\/purchase$/);
      if (shopPurchaseMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const itemId = shopPurchaseMatch[1];
        const item = await env.DB.prepare('SELECT * FROM shop_items WHERE id = ? AND active = 1').bind(itemId).first();
        if (!item) return json({ error: 'ürün bulunamadı' }, 404);
        const already = await env.DB.prepare('SELECT 1 FROM shop_purchases WHERE user_id = ? AND item_id = ?')
          .bind(me.id, itemId)
          .first();
        if (already) return json({ error: 'bu ürüne zaten sahipsin' }, 409);
        const debited = await debitWallet(env, ctx, me.id, item.currency, item.price, `shop_purchase:${itemId}`);
        if (!debited) return json({ error: 'yetersiz bakiye' }, 402);
        await env.DB.prepare('INSERT INTO shop_purchases (id, user_id, item_id, created_at) VALUES (?, ?, ?, ?)')
          .bind(crypto.randomUUID(), me.id, itemId, new Date().toISOString())
          .run();
        return json({ ok: true }, 201);
      }

      if (path === '/shop/inventory' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const { results } = await env.DB.prepare(
          `SELECT shop_items.id, shop_items.category, shop_items.name, shop_items.description, shop_purchases.created_at AS purchased_at
           FROM shop_purchases
           JOIN shop_items ON shop_items.id = shop_purchases.item_id
           WHERE shop_purchases.user_id = ?
           ORDER BY shop_purchases.created_at DESC`,
        )
          .bind(me.id)
          .all();
        return json({
          items: results.map((row) => ({
            id: row.id,
            category: row.category,
            name: row.name,
            description: row.description,
            purchasedAt: row.purchased_at,
          })),
        });
      }

      if (path === '/vip/tiers' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM vip_tiers WHERE active = 1 ORDER BY sort_order').all();
        return json({
          tiers: results.map((row) => ({
            id: row.id,
            name: row.name,
            monthlyPriceCrystal: row.monthly_price_crystal,
            perks: JSON.parse(row.perks || '[]'),
          })),
        });
      }

      const vipSubscribeMatch = path.match(/^\/vip\/tiers\/([^/]+)\/subscribe$/);
      if (vipSubscribeMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const tierId = vipSubscribeMatch[1];
        const tier = await env.DB.prepare('SELECT * FROM vip_tiers WHERE id = ? AND active = 1').bind(tierId).first();
        if (!tier) return json({ error: 'kademe bulunamadı' }, 404);
        const debited = await debitWallet(env, ctx, me.id, 'crystal', tier.monthly_price_crystal, `vip_subscribe:${tierId}`);
        if (!debited) return json({ error: 'yetersiz bakiye' }, 402);
        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        await env.DB.prepare(
          `INSERT INTO vip_subscriptions (user_id, tier_id, started_at, expires_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET tier_id = excluded.tier_id, started_at = excluded.started_at, expires_at = excluded.expires_at`,
        )
          .bind(me.id, tierId, now.toISOString(), expires.toISOString())
          .run();
        return json({ ok: true, expiresAt: expires.toISOString() }, 201);
      }

      if (path === '/vip/me' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const row = await env.DB.prepare(
          `SELECT vip_subscriptions.expires_at, vip_tiers.id, vip_tiers.name, vip_tiers.perks
           FROM vip_subscriptions
           JOIN vip_tiers ON vip_tiers.id = vip_subscriptions.tier_id
           WHERE vip_subscriptions.user_id = ?`,
        )
          .bind(me.id)
          .first();
        if (!row || row.expires_at <= new Date().toISOString()) return json({ subscription: null });
        return json({
          subscription: { tierId: row.id, tierName: row.name, perks: JSON.parse(row.perks || '[]'), expiresAt: row.expires_at },
        });
      }

      if (path === '/posts' && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        const meId = me?.id ?? '';
        const { results } = await env.DB.prepare(
          `SELECT posts.id, posts.author_id, posts.text, posts.image_key, posts.created_at,
                  users.display_name,
                  (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id) AS like_count,
                  (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count,
                  EXISTS(SELECT 1 FROM post_likes WHERE post_likes.post_id = posts.id AND post_likes.user_id = ?) AS liked
           FROM posts
           JOIN users ON users.id = posts.author_id
           WHERE posts.created_at > ?
             AND posts.author_id NOT IN (
               SELECT blocked_id FROM blocks WHERE blocker_id = ?
               UNION
               SELECT blocker_id FROM blocks WHERE blocked_id = ?
             )
             AND posts.id NOT IN (
               SELECT target_id FROM reports WHERE target_type = 'post' GROUP BY target_id HAVING COUNT(*) >= ?
             )
           ORDER BY posts.created_at DESC
           LIMIT 50`,
        )
          .bind(meId, postRetentionCutoff(), meId, meId, REPORT_HIDE_THRESHOLD)
          .all();
        const origin = new URL(request.url).origin;
        return json({ posts: results.map((row) => publicPost(row, origin, meId)) });
      }

      if (path === '/posts' && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const form = await request.formData();
        const text = String(form.get('text') || '').trim().slice(0, MAX_POST_LENGTH);
        const imageFile = form.get('image');
        const hasImage = imageFile instanceof File && imageFile.size > 0;
        if (!text && !hasImage) return json({ error: 'Boş bir gönderi paylaşılamaz.' }, 400);
        if (hasImage && !imageFile.type.startsWith('image/')) {
          return json({ error: 'Sadece görsel dosyaları yüklenebilir.' }, 400);
        }
        if (hasImage && imageFile.size > MAX_IMAGE_BYTES) {
          return json({ error: "Görsel 8 MB'tan büyük olamaz." }, 400);
        }
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const imageKey = hasImage ? id : null;
        if (hasImage) {
          await env.IMAGES.put(imageKey, await imageFile.arrayBuffer(), {
            httpMetadata: { contentType: imageFile.type },
          });
        }
        await env.DB.prepare('INSERT INTO posts (id, author_id, text, image_key, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(id, me.id, text, imageKey, now)
          .run();
        const postCount = await env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE author_id = ?').bind(me.id).first();
        ctx.waitUntil(checkAndGrantAchievement(env, ctx, me.id, 'social_first_post', postCount.c));
        const origin = new URL(request.url).origin;
        return json(
          {
            post: publicPost(
              { id, author_id: me.id, text, image_key: imageKey, created_at: now, display_name: me.display_name, like_count: 0, liked: 0 },
              origin,
              me.id,
            ),
          },
          201,
        );
      }

      const likeMatch = path.match(/^\/posts\/([^/]+)\/like$/);
      if (likeMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const postId = likeMatch[1];
        const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
        if (!post) return json({ error: 'gönderi bulunamadı' }, 404);
        const existing = await env.DB.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?')
          .bind(postId, me.id)
          .first();
        if (existing) {
          await env.DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').bind(postId, me.id).run();
        } else {
          await env.DB.prepare('INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)')
            .bind(postId, me.id, new Date().toISOString())
            .run();
        }
        const { c: likeCount } = await env.DB.prepare('SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?')
          .bind(postId)
          .first();
        return json({ liked: !existing, likeCount });
      }

      const commentsMatch = path.match(/^\/posts\/([^/]+)\/comments$/);
      if (commentsMatch && request.method === 'GET') {
        const me = await getSessionUser(request, env);
        const postId = commentsMatch[1];
        const { results } = await env.DB.prepare(
          `SELECT comments.id, comments.post_id, comments.author_id, comments.text, comments.created_at, users.display_name
           FROM comments
           JOIN users ON users.id = comments.author_id
           WHERE comments.post_id = ?
             AND comments.id NOT IN (
               SELECT target_id FROM reports WHERE target_type = 'comment' GROUP BY target_id HAVING COUNT(*) >= ?
             )
           ORDER BY comments.created_at ASC
           LIMIT 200`,
        )
          .bind(postId, REPORT_HIDE_THRESHOLD)
          .all();
        return json({ comments: results.map((row) => publicComment(row, me?.id)) });
      }

      if (commentsMatch && request.method === 'POST') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const postId = commentsMatch[1];
        const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
        if (!post) return json({ error: 'gönderi bulunamadı' }, 404);
        const { text } = await request.json();
        const trimmed = String(text || '').trim().slice(0, MAX_COMMENT_LENGTH);
        if (!trimmed) return json({ error: 'Boş bir yorum gönderilemez.' }, 400);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare('INSERT INTO comments (id, post_id, author_id, text, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(id, postId, me.id, trimmed, now)
          .run();
        return json(
          {
            comment: publicComment(
              { id, post_id: postId, author_id: me.id, text: trimmed, created_at: now, display_name: me.display_name },
              me.id,
            ),
          },
          201,
        );
      }

      const commentMatch = path.match(/^\/comments\/([^/]+)$/);
      if (commentMatch && request.method === 'DELETE') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const commentId = commentMatch[1];
        const comment = await env.DB.prepare('SELECT * FROM comments WHERE id = ?').bind(commentId).first();
        if (!comment) return json({ error: 'yorum bulunamadı' }, 404);
        if (comment.author_id !== me.id) return json({ error: 'bu yorumu silemezsin' }, 403);
        await env.DB.batch([
          env.DB.prepare("DELETE FROM reports WHERE target_type = 'comment' AND target_id = ?").bind(commentId),
          env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId),
        ]);
        return json({ ok: true });
      }

      const postMatch = path.match(/^\/posts\/([^/]+)$/);
      if (postMatch && request.method === 'DELETE') {
        const me = await getSessionUser(request, env);
        if (!me) return json({ error: 'oturum geçersiz' }, 401);
        const postId = postMatch[1];
        const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(postId).first();
        if (!post) return json({ error: 'gönderi bulunamadı' }, 404);
        if (post.author_id !== me.id) return json({ error: 'bu gönderiyi silemezsin' }, 403);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(postId),
          env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(postId),
          env.DB.prepare("DELETE FROM reports WHERE target_type = 'post' AND target_id = ?").bind(postId),
          env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId),
        ]);
        if (post.image_key) await env.IMAGES.delete(post.image_key).catch(() => {});
        return json({ ok: true });
      }

      if (path.match(/^\/images\/([^/]+)$/) && request.method === 'GET') {
        const key = path.slice('/images/'.length);
        const object = await env.IMAGES.get(key);
        if (!object) return new Response('not found', { status: 404, headers: CORS_HEADERS });
        const headers = new Headers(CORS_HEADERS);
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('ETag', object.httpEtag);
        return new Response(object.body, { headers });
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'internal error' }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeExpiredPosts(env));
    if (new Date().getUTCDay() === 1) ctx.waitUntil(grantWeeklyPopularityAwards(env, ctx));
  },
};
