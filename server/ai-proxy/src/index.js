const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const GEMINI_TEXT_MODEL = 'gemini-3.1-flash-lite';
const CLOUDFLARE_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

// 3rd fallback layer. Free OpenRouter vision models get hit hard and 429
// often on their shared upstream pool, so we hand OpenRouter a short list
// (its own server-side `models` routing tries each in order for us in one
// call) instead of a single model name — verified working 2026-08-26.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// OpenRouter caps the `models` fallback array at 3 entries, so we pick 3
// free vision models spread across different upstream providers (Google AI
// Studio, GMICloud, AtlasCloud) to avoid all three being congested together.
const OPENROUTER_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m3:free',
  'dots-studio/dots-3-note-preview:free',
];

// 4th and last fallback layer, via Hugging Face's router (the old
// api-inference.huggingface.co host is retired) — verified working 2026-08-26.
const HUGGINGFACE_URL = 'https://router.huggingface.co/v1/chat/completions';
const HUGGINGFACE_MODEL = 'Qwen/Qwen2.5-VL-72B-Instruct';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
};

// Real congestion circuit breaker — replaces the old flat per-reading-type
// cooldown (which fired unconditionally regardless of actual load, even for
// a single solo user). This only trips when the upstream Gemini API has
// genuinely rate-limited us (429) several times in a short window, i.e. the
// shared quota is actually under pressure right now. Paid (coin-spent)
// requests always bypass it — see checkCongestion below.
const CONGESTION_WINDOW_SECONDS = 60;
const CONGESTION_FAILURE_THRESHOLD = 3; // 3+ real upstream 429s within the window = genuinely congested
const CONGESTION_HOLD_SECONDS = 30; // how long the "busy" state holds once tripped

// General burst/abuse protection, independent of reading type — catches a
// single source hammering the proxy regardless of what it claims to be
// doing. "Heavy" = payload carries inline image/audio data (vision calls),
// which cost more and are slower, so they get a tighter budget than plain
// text prompts.
const BURST_LIMITS = {
  light: { perMinute: 20, perDay: 400 },
  heavy: { perMinute: 4, perDay: 60 },
};

const BILGI_KOSESI_POOL_KEY = 'bilgi_kosesi_pool';
const BILGI_KOSESI_DAILY_COUNT = 20;
const BILGI_KOSESI_POOL_CAP = 8000; // ~1 year of stock at 20/day (365 days = 7300 cards)

const POPULAR_FAVORITES_LIMIT = 10;
const POPULAR_FAVORITES_TTL = 21 * 86400; // counters outlive the week they're read in, just in case

function base64ToByteArray(base64) {
  const binary = atob(base64);
  const bytes = new Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function isHeavyPayload(payload) {
  const json = JSON.stringify(payload ?? {});
  // Gemini/Cloudflare embed images as inline_data/imageBase64; OpenRouter and
  // Hugging Face (OpenAI-style messages) use image_url content parts instead.
  return json.includes('inline_data') || json.includes('inlineData') || json.includes('image_url');
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

async function checkAndConsume(kv, key, ttlSeconds, limit) {
  // Best-effort fixed-window counter on KV. Not perfectly atomic under a true
  // simultaneous race, but more than sufficient to blunt scripted abuse —
  // real traffic never hits the exact same KV key in the same millisecond.
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: ttlSeconds });
  return true;
}

async function enforceRateLimits(env, request, payload) {
  if (!env.RATE_LIMIT_KV) {
    // KV not bound (e.g. local dev without a namespace configured yet) — skip
    // limiting rather than hard-failing every request.
    return null;
  }

  const ip = getClientIp(request);
  const heavy = isHeavyPayload(payload);
  const bucket = heavy ? 'heavy' : 'light';
  const limits = BURST_LIMITS[bucket];

  const now = Date.now();
  const minuteBucket = Math.floor(now / 60000);
  const dayBucket = Math.floor(now / 86400000);

  const minuteOk = await checkAndConsume(env.RATE_LIMIT_KV, `burst:${bucket}:${ip}:${minuteBucket}`, 60, limits.perMinute);
  if (!minuteOk) {
    return jsonResponse(
      { error: 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar dene.', retryAfterSeconds: 60 },
      429,
      { 'Retry-After': '60' },
    );
  }

  const dayOk = await checkAndConsume(env.RATE_LIMIT_KV, `daily:${bucket}:${ip}:${dayBucket}`, 86400, limits.perDay);
  if (!dayOk) {
    return jsonResponse(
      { error: 'Günlük istek sınırına ulaşıldı. Yarın tekrar deneyebilirsin.', retryAfterSeconds: 86400 },
      429,
      { 'Retry-After': '86400' },
    );
  }

  return null;
}

// Called whenever the Gemini relay actually gets rate-limited upstream.
// Tallies real failures in a rolling window; once enough pile up in a short
// span, flips on the "congestion:active" flag that checkCongestion reads.
async function recordUpstreamRateLimit(env) {
  if (!env.RATE_LIMIT_KV) return;
  const bucket = Math.floor(Date.now() / (CONGESTION_WINDOW_SECONDS * 1000));
  const key = `congestion:failures:${bucket}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: CONGESTION_WINDOW_SECONDS * 2 });
  if (count + 1 >= CONGESTION_FAILURE_THRESHOLD) {
    await env.RATE_LIMIT_KV.put('congestion:active', String(Date.now()), { expirationTtl: CONGESTION_HOLD_SECONDS });
  }
}

// Real congestion gate — only blocks when recordUpstreamRateLimit has
// actually tripped the breaker (genuine, evidence-based signal), and never
// blocks a request the user already paid coins for.
async function checkCongestion(env, isPaid) {
  if (!env.RATE_LIMIT_KV || isPaid) return null;
  const active = await env.RATE_LIMIT_KV.get('congestion:active');
  if (!active) return null;

  const elapsed = Math.floor((Date.now() - parseInt(active, 10)) / 1000);
  const remaining = Math.max(1, CONGESTION_HOLD_SECONDS - elapsed);
  return jsonResponse(
    {
      error: 'Sistem şu anda gerçekten yoğun, isteğin kısa bir süre sıraya alındı. Birazdan tekrar dene.',
      retryAfterSeconds: remaining,
      congestion: true,
    },
    429,
    { 'Retry-After': String(remaining) },
  );
}

async function relayProvider(env, body) {
  const { provider, model, payload } = body;

  if (provider === 'gemini') {
    if (!model || typeof model !== 'string') {
      return jsonResponse({ error: 'model alani gerekli.' }, 400);
    }
    const upstream = await fetch(`${GEMINI_URL(model)}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (upstream.status === 429) {
      await recordUpstreamRateLimit(env);
    }
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (provider === 'cloudflare') {
    if (!env.AI) {
      return jsonResponse({ error: 'Workers AI binding tanımlı değil.' }, 500);
    }
    // Two shapes, matching the model's actual accepted inputs (verified
    // directly against the API): { prompt, imageBase64 } for vision,
    // { messages } for plain text/chat.
    const input = payload.imageBase64
      ? { prompt: payload.prompt, image: base64ToByteArray(payload.imageBase64) }
      : { messages: payload.messages };
    try {
      const result = await env.AI.run(CLOUDFLARE_MODEL, input);
      return jsonResponse(result);
    } catch (err) {
      return jsonResponse({ error: `Cloudflare AI hatası: ${err && err.message}` }, 502);
    }
  }

  if (provider === 'openrouter') {
    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse({ error: 'OpenRouter API anahtari tanimli degil.' }, 500);
    }
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ models: OPENROUTER_MODELS, messages: payload.messages }),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (provider === 'huggingface') {
    if (!env.HUGGINGFACE_API_KEY) {
      return jsonResponse({ error: 'Hugging Face API anahtari tanimli degil.' }, 500);
    }
    const upstream = await fetch(HUGGINGFACE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
      },
      body: JSON.stringify({ model: HUGGINGFACE_MODEL, messages: payload.messages }),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return jsonResponse({ error: 'Bilinmeyen provider. "gemini", "cloudflare", "openrouter" veya "huggingface" kullanin.' }, 400);
}

function dayIndex() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  return Math.floor((Date.now() - start) / 86400000);
}

// ISO-ish week key (e.g. "2026-W35") — computed server-side so every client
// agrees on the same week boundary regardless of local timezone.
function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Cross-user popularity counter for favorited quotes/info cards — this is
// the one thing that genuinely can't live on-device, since it has to
// aggregate everyone's taps. Counting is add-only (no decrement on unfavorite)
// to keep it simple; content metadata is upserted separately so the reader
// doesn't need every client to keep resending full text.
async function handleFavoriteCount(env, body, request) {
  if (!env.RATE_LIMIT_KV) return jsonResponse({ ok: false });
  const { id, kind, title, body: text, category, deviceId } = body;
  if (!id || !text) return jsonResponse({ error: 'id ve body alanları gerekli.' }, 400);

  const weekKey = isoWeekKey();
  const userId = deviceId || (request ? getClientIp(request) : 'anonymous');
  const voteKey = `fav_vote:${weekKey}:${id}:${userId}`;

  // If this user/device already voted for this quote this week, do not increment again
  const alreadyVoted = await env.RATE_LIMIT_KV.get(voteKey);
  if (alreadyVoted) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  await env.RATE_LIMIT_KV.put(voteKey, '1', { expirationTtl: POPULAR_FAVORITES_TTL });

  const countKey = `fav_count:${weekKey}:${id}`;
  const metaKey = `fav_meta:${id}`;

  const raw = await env.RATE_LIMIT_KV.get(countKey);
  const count = raw ? parseInt(raw, 10) : 0;
  await env.RATE_LIMIT_KV.put(countKey, String(count + 1), { expirationTtl: POPULAR_FAVORITES_TTL });
  await env.RATE_LIMIT_KV.put(
    metaKey,
    JSON.stringify({ id, kind, title, body: text, category }),
    { expirationTtl: POPULAR_FAVORITES_TTL },
  );

  return jsonResponse({ ok: true });
}

async function handlePopularFavorites(env) {
  if (!env.RATE_LIMIT_KV) return jsonResponse({ items: [] });

  const weekKey = isoWeekKey();
  const prefix = `fav_count:${weekKey}:`;
  const list = await env.RATE_LIMIT_KV.list({ prefix });

  const counted = await Promise.all(
    list.keys.map(async (entry) => {
      const id = entry.name.slice(prefix.length);
      const raw = await env.RATE_LIMIT_KV.get(entry.name);
      return { id, count: raw ? parseInt(raw, 10) : 0 };
    }),
  );
  counted.sort((a, b) => b.count - a.count);
  const top = counted.slice(0, POPULAR_FAVORITES_LIMIT);

  const items = await Promise.all(
    top.map(async ({ id, count }) => {
      const rawMeta = await env.RATE_LIMIT_KV.get(`fav_meta:${id}`);
      if (!rawMeta) return null;
      return { ...JSON.parse(rawMeta), count };
    }),
  );

  return jsonResponse({ items: items.filter(Boolean) });
}

async function handleGetBilgiKosesi(env) {
  if (!env.RATE_LIMIT_KV) {
    return jsonResponse({ cards: [] });
  }
  const raw = await env.RATE_LIMIT_KV.get(BILGI_KOSESI_POOL_KEY);
  const pool = raw ? JSON.parse(raw) : [];
  if (pool.length === 0) {
    return jsonResponse({ cards: [] });
  }
  const offset = (dayIndex() * BILGI_KOSESI_DAILY_COUNT) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return jsonResponse({ cards: rotated.slice(0, Math.min(BILGI_KOSESI_DAILY_COUNT, pool.length)) });
}

// Calls Gemini to write a fresh batch of short "did you know" cards spanning
// the app's four knowledge domains, and appends them to the growing KV pool
// (capped so it stays a rolling ~month of stock, not an unbounded archive).
// Triggered by the weekly Cron in wrangler.toml, or manually via a POST with
// the app secret for a one-off refresh.
async function generateBilgiKosesiBatch(env) {
  if (!env.RATE_LIMIT_KV || !env.GEMINI_API_KEY) return { added: 0 };

  const prompt = `Türkçe, mistik/fal temalı bir uygulamanın "Bilgi Köşesi" bölümü için 20 adet kısa, doğru ve ilginç bilgi kartı üret. Kategoriler eşit dağılsın: "burc" (burçlar/zodyak), "kart" (iskambil/fal kartları), "astroloji" (genel astroloji), "tarot" (tarot kartları). Her kart bir başlık (en fazla 6 kelime) ve 1-2 cümlelik gövde metni içersin, gövde en fazla 200 karakter olsun. Klişe olmayan, gerçekten bilgilendirici ve merak uyandırıcı ol. Sadece şu JSON şemasında bir dizi döndür, başka hiçbir açıklama ekleme: [{"category":"burc|kart|astroloji|tarot","title":"...","body":"..."}]`;

  const upstream = await fetch(`${GEMINI_URL(GEMINI_TEXT_MODEL)}?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!upstream.ok) return { added: 0 };
  const data = await upstream.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

  let items;
  try {
    items = JSON.parse(text);
  } catch {
    return { added: 0 };
  }
  if (!Array.isArray(items)) return { added: 0 };

  const validCategories = new Set(['burc', 'kart', 'astroloji', 'tarot']);
  const stamp = Date.now();
  const newCards = items
    .filter((item) => item && validCategories.has(item.category) && item.title && item.body)
    .map((item, index) => ({
      id: `ai-${stamp}-${index}`,
      category: item.category,
      title: String(item.title).slice(0, 80),
      body: String(item.body).slice(0, 240),
    }));

  const raw = await env.RATE_LIMIT_KV.get(BILGI_KOSESI_POOL_KEY);
  const pool = raw ? JSON.parse(raw) : [];
  const merged = [...pool, ...newCards].slice(-BILGI_KOSESI_POOL_CAP);
  await env.RATE_LIMIT_KV.put(BILGI_KOSESI_POOL_KEY, JSON.stringify(merged));

  return { added: newCards.length, poolSize: merged.length };
}

// 12 burcun tamamı için sabah 05:00 UTC'de günlük yorumları önceden üretir ve KV'ye yazar.
// Böylece gün içinde hiçbir kullanıcı isteği Gemini'ye gitmez — hepsi anında KV'den döner.
const ALL_SIGN_NAMES = [
  'Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
  'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık',
];

async function pregenerateDailyZodiacs(env) {
  if (!env.GEMINI_API_KEY || !env.RATE_LIMIT_KV) return { generated: 0 };

  const todayStr = new Date().toISOString().slice(0, 10);
  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  let generated = 0;
  const errors = [];

  for (const signName of ALL_SIGN_NAMES) {
    const cacheKey = `daily_zodiac_${todayStr}_${signName}`;

    // Zaten varsa atla
    const existing = await env.RATE_LIMIT_KV.get(cacheKey);
    if (existing) continue;

    const prompt = `Sen deneyimli bir astrologsun. ${dateLabel} tarihi için ${signName} burcuna özel, Türkçe, mistik ve edebi bir günlük burç yorumu yaz. Kesinlikle bir uzman gibi konuş. Yorumu aşk, kariyer ve genel enerji temalarını doğal bir akışla dokuyarak, tek bir bütün metin halinde yaz. 3-4 cümlelik akıcı bir paragraf yeterli.`;

    try {
      const resp = await fetch(`${GEMINI_URL(GEMINI_TEXT_MODEL)}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!resp.ok) {
        errors.push(`${signName}: HTTP ${resp.status}`);
        continue;
      }
      const data = await resp.json();
      const reading = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (reading) {
        await env.RATE_LIMIT_KV.put(cacheKey, reading, { expirationTtl: 172800 }); // 48 saat
        generated++;
      }
      // Rate limit koruması — her burç isteği arasında 500ms bekle
      await new Promise((res) => setTimeout(res, 500));
    } catch (err) {
      errors.push(`${signName}: ${err.message}`);
    }
  }

  return { generated, errors };
}

async function handleDailyZodiac(env, url) {
  const sign = url.searchParams.get('sign');
  if (!sign) return jsonResponse({ error: 'Burc parametresi eksik.' }, 400);

  const todayStr = new Date().toISOString().slice(0, 10);
  const cacheKey = `daily_zodiac_${todayStr}_${sign}`;

  if (env.RATE_LIMIT_KV) {
    const cached = await env.RATE_LIMIT_KV.get(cacheKey);
    if (cached) {
      return jsonResponse({ date: todayStr, sign, reading: cached, source: 'cache' });
    }
  }

  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const prompt = `Sen deneyimli bir astrologsun. ${dateLabel} tarihi için ${sign} burcuna özel, Türkçe, mistik ve edebi bir günlük burç yorumu yaz. Kesinlikle bir yapay zeka olduğunu belli etme. Yorumu aşk, kariyer ve genel enerji temalarını doğal bir akışla dokuyarak, tek bir bütün metin halinde yaz. 3-4 cümlelik akıcı bir paragraf yeterli.`;

  let reading = '';
  if (env.GEMINI_API_KEY) {
    try {
      const resp = await fetch(`${GEMINI_URL(GEMINI_TEXT_MODEL)}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (resp.ok) {
        const data = await resp.json();
        reading = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      }
    } catch {}
  }

  if (reading && env.RATE_LIMIT_KV) {
    await env.RATE_LIMIT_KV.put(cacheKey, reading, { expirationTtl: 172800 });
  }

  return jsonResponse({
    date: todayStr,
    sign,
    reading: reading || `${sign} burcu için bugün gökyüzü yeni fırsatlar ve sezgisel uyanışlar vadediyor.`,
    source: 'generated',
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (
      request.method === 'GET' &&
      (url.pathname === '/bilgi-kosesi' || url.pathname === '/popular-favorites' || url.pathname === '/daily-zodiac')
    ) {
      if (env.APP_SECRET && request.headers.get('X-App-Secret') !== env.APP_SECRET) {
        return jsonResponse({ error: 'Yetkisiz istek.' }, 401);
      }
      if (url.pathname === '/daily-zodiac') return handleDailyZodiac(env, url);
      return url.pathname === '/bilgi-kosesi' ? handleGetBilgiKosesi(env) : handlePopularFavorites(env);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Sadece POST istekleri kabul edilir.' }, 405);
    }

    if (env.APP_SECRET && request.headers.get('X-App-Secret') !== env.APP_SECRET) {
      return jsonResponse({ error: 'Yetkisiz istek.' }, 401);
    }

    if (url.pathname === '/generate-bilgi-kosesi') {
      const result = await generateBilgiKosesiBatch(env);
      return jsonResponse(result);
    }

    // Toplu içerik yükleme: yerel üretim scriptinden önceden üretilmiş kartları KV'ye yazar
    if (url.pathname === '/bulk-import') {
      let importBody;
      try { importBody = await request.json(); } catch { return jsonResponse({ error: 'Gecersiz JSON.' }, 400); }
      if (!Array.isArray(importBody?.cards)) return jsonResponse({ error: 'cards dizisi gerekli.' }, 400);
      if (!env.RATE_LIMIT_KV) return jsonResponse({ error: 'KV bağlantısı yok.' }, 500);
      const validCategories = new Set(['burc', 'kart', 'astroloji', 'tarot']);
      const stamp = Date.now();
      const newCards = importBody.cards
        .filter((item) => item && validCategories.has(item.category) && item.title && item.body)
        .map((item, i) => ({ id: `bulk-${stamp}-${i}`, category: item.category, title: String(item.title).slice(0, 80), body: String(item.body).slice(0, 240) }));
      const raw = await env.RATE_LIMIT_KV.get(BILGI_KOSESI_POOL_KEY);
      const pool = raw ? JSON.parse(raw) : [];
      const merged = [...pool, ...newCards].slice(-BILGI_KOSESI_POOL_CAP);
      await env.RATE_LIMIT_KV.put(BILGI_KOSESI_POOL_KEY, JSON.stringify(merged));
      return jsonResponse({ imported: newCards.length, poolSize: merged.length });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Gecersiz istek govdesi.' }, 400);
    }

    if (url.pathname === '/favorite-count') {
      return handleFavoriteCount(env, body, request);
    }

    const burstBlock = await enforceRateLimits(env, request, body.payload);
    if (burstBlock) return burstBlock;

    const congestionBlock = await checkCongestion(env, body.isPaid === true);
    if (congestionBlock) return congestionBlock;

    return relayProvider(env, body);
  },

  async scheduled(event, env, ctx) {
    // Her gün 05:00 UTC (08:00 TR) — 12 burç günlük yorumlarını önceden üret
    if (event.cron === '0 5 * * *') {
      ctx.waitUntil(pregenerateDailyZodiacs(env));
    }
    // Her 48 saatte bir 05:00 UTC — Keşfet / Bilgi Köşesi içerik havuzuna 20 yeni kart ekle
    if (event.cron === '0 5 */2 * *') {
      ctx.waitUntil(generateBilgiKosesiBatch(env));
    }
    // Her Pazartesi 05:00 UTC — Bilgi Köşesi haftalık büyük toplu yenileme (40 kart = 2 kat)
    if (event.cron === '0 5 * * 1') {
      ctx.waitUntil(generateBilgiKosesiBatch(env).then(() => generateBilgiKosesiBatch(env)));
    }
  },
};
