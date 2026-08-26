const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions';
const GEMINI_TEXT_MODEL = 'gemini-3.1-flash-lite';
const CLOUDFLARE_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
};

// Per-reading-type cooldown, in seconds — one client (by IP) can only start a
// given reading type this often. Mirrors the "sırada bekleme" durations shown
// client-side, and is the real enforcement point since the client-side timer
// alone can't protect the shared Gemini quota once many different users are
// concurrent.
const READING_COOLDOWN_SECONDS = {
  kahve: 5 * 60,
  el: 5 * 60,
  tarot3: 1 * 60,
  tarot5: 2 * 60,
  tarot7: 2 * 60,
  tarot10: 3 * 60,
  katina: 1 * 60,
  sesli: 3 * 60,
  solitaire: 1 * 60,
};

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
const BILGI_KOSESI_POOL_CAP = 600; // ~a month of stock at 20/day

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
  return json.includes('inline_data') || json.includes('inlineData');
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

async function enforceReadingCooldown(env, request, readingType) {
  if (!env.RATE_LIMIT_KV || !readingType) return null;
  const cooldownSeconds = READING_COOLDOWN_SECONDS[readingType];
  if (!cooldownSeconds) return null;

  const ip = getClientIp(request);
  const key = `cooldown:${readingType}:${ip}`;
  const existing = await env.RATE_LIMIT_KV.get(key);
  if (existing) {
    const remaining = Math.max(1, cooldownSeconds - Math.floor((Date.now() - parseInt(existing, 10)) / 1000));
    return jsonResponse(
      { error: 'Bu fal türü için kısa süre önce bir istek gönderildi. Lütfen sırasının dolmasını bekle.', retryAfterSeconds: remaining },
      429,
      { 'Retry-After': String(remaining) },
    );
  }

  await env.RATE_LIMIT_KV.put(key, String(Date.now()), { expirationTtl: cooldownSeconds });
  return null;
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
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (provider === 'groq') {
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (provider === 'cerebras') {
    const upstream = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.CEREBRAS_API_KEY}` },
      body: JSON.stringify(payload),
    });
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

  return jsonResponse({ error: 'Bilinmeyen provider. "gemini", "groq", "cerebras" veya "cloudflare" kullanin.' }, 400);
}

function dayIndex() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  return Math.floor((Date.now() - start) / 86400000);
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/bilgi-kosesi') {
      if (env.APP_SECRET && request.headers.get('X-App-Secret') !== env.APP_SECRET) {
        return jsonResponse({ error: 'Yetkisiz istek.' }, 401);
      }
      return handleGetBilgiKosesi(env);
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

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Gecersiz istek govdesi.' }, 400);
    }

    const burstBlock = await enforceRateLimits(env, request, body.payload);
    if (burstBlock) return burstBlock;

    const cooldownBlock = await enforceReadingCooldown(env, request, body.readingType);
    if (cooldownBlock) return cooldownBlock;

    return relayProvider(env, body);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(generateBilgiKosesiBatch(env));
  },
};
