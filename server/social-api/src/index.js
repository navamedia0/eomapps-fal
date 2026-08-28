import { jwtVerify, createRemoteJWKSet } from 'jose';

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
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname;

    if (!(await requireAppSecret(request, env))) return json({ error: 'unauthorized' }, 401);

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

      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'internal error' }, 500);
    }
  },
};
