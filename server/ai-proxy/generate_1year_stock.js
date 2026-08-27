#!/usr/bin/env node
/**
 * Bilgi Köşesi & Keşfet — 1 Yıllık Stok Üretim ve KV Yükleme Scripti
 * =====================================================================
 * Kullanım:
 *   1. .env dosyasında GEMINI_API_KEY ve AI_PROXY_URL ve APP_SECRET tanımlı olmalı
 *   2. node generate_1year_stock.js
 *
 * Özellikler:
 *   - 365 × 20 = 7.300 kart (1 yıllık stok)
 *   - Her batch'te 50 kart üretir → 146 API çağrısı
 *   - Checkpoint dosyasıyla kurtarılabilir (yarıda kesilirse devam eder)
 *   - Her 500 kartta bir KV'ye otomatik yükler
 *   - Rate limit koruması: istek arasında 1.5s bekleme
 *   - Sonuçlar yerel bilgi_kosesi_stock.json'a da kaydedilir
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Ayarlar ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY  || '';
const AI_PROXY_URL    = process.env.AI_PROXY_URL    || '';
const APP_SECRET      = process.env.APP_SECRET      || '';
const GEMINI_MODEL    = 'gemini-3.5-flash-lite';
const TARGET_TOTAL    = 7300;    // 365 gün × 20 kart
const BATCH_SIZE      = 50;     // Her API çağrısında üretilen kart sayısı
const UPLOAD_EVERY    = 500;    // Bu kadar kart birikince KV'ye yükle
const DELAY_MS        = 1500;   // İstekler arası bekleme (ms) — rate limit için

const CHECKPOINT_FILE = path.join(__dirname, 'stock_checkpoint.json');
const OUTPUT_FILE     = path.join(__dirname, 'bilgi_kosesi_stock.json');

const CATEGORIES = ['burc', 'kart', 'astroloji', 'tarot'];

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    } catch {
      return { cards: [], uploadedCount: 0 };
    }
  }
  return { cards: [], uploadedCount: 0 };
}

function saveCheckpoint(data) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadOutput() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveOutput(cards) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg, color = 'reset') {
  const colors = {
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    red:    '\x1b[31m',
    cyan:   '\x1b[36m',
    bold:   '\x1b[1m',
    reset:  '\x1b[0m',
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

// ─── Gemini API Çağrısı ───────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            return;
          }
          const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.write(body);
    req.end();
  });
}

// ─── Bir Batch Üret ──────────────────────────────────────────────────────────
async function generateBatch(batchIndex) {
  // Her batch için farklı bir kategori ağırlığı dağılımı kullan
  const categoryFocus = CATEGORIES[batchIndex % CATEGORIES.length];
  const prompt = `
Türkçe, mistik/fal temalı bir mobil uygulamanın "Bilgi Köşesi" bölümü için ${BATCH_SIZE} adet benzersiz, kısa, doğru ve ilginç bilgi kartı üret.

Kategoriler: "burc" (burçlar, zodyak, mitoloji), "kart" (iskambil kartları, oyun kartları, tarih), "astroloji" (gezegenler, evler, açılar, mitoloji), "tarot" (tarot kartları, semboller, Rider-Waite, Major/Minor Arcana).

Bu batch'te "${categoryFocus}" kategorisine biraz daha ağırlık ver ama hepsini karıştır.

Her kart:
- Başlık: En fazla 8 kelime, merak uyandırıcı
- Gövde: Tam olarak 1-2 cümle, en fazla 200 karakter, gerçekten bilgilendirici ve klişelerden uzak
- Kategori: burc | kart | astroloji | tarot

Başka batch'lerde üretilenlerden FARKLI olmalı. Bilinen klişeleri ve tekrarları kesinlikle kullanma.

Sadece bu JSON şemasında bir dizi döndür, başka açıklama ekleme:
[{"category":"burc|kart|astroloji|tarot","title":"...","body":"..."}]`;

  const text = await callGemini(prompt);
  let items;
  try {
    items = JSON.parse(text);
  } catch {
    // Gemini bazen markdown kod bloğuyla sarar
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      items = JSON.parse(match[0]);
    } else {
      throw new Error(`JSON parse hatası: ${text.slice(0, 100)}`);
    }
  }

  if (!Array.isArray(items)) throw new Error('Dizi bekleniyor');

  const validCats = new Set(CATEGORIES);
  return items
    .filter((item) => item && validCats.has(item.category) && item.title && item.body)
    .map((item, i) => ({
      id: `stock-${Date.now()}-${batchIndex}-${i}`,
      category: item.category,
      title: String(item.title).slice(0, 80),
      body: String(item.body).slice(0, 240),
    }));
}

// ─── KV'ye Yükleme ───────────────────────────────────────────────────────────
async function uploadToKV(cards) {
  if (!AI_PROXY_URL) {
    log('  ⚠ AI_PROXY_URL tanımlı değil, KV yüklemesi atlandı (yerel JSON\'a kaydediliyor)', 'yellow');
    return { imported: cards.length, poolSize: -1 };
  }

  const url = new URL('/bulk-import', AI_PROXY_URL);
  const body = JSON.stringify({ cards });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.toString());
    const isHttps = urlObj.protocol === 'https:';
    const mod = isHttps ? https : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(APP_SECRET ? { 'X-App-Secret': APP_SECRET } : {}),
      },
    };

    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Upload timeout')));
    req.write(body);
    req.end();
  });
}

// ─── Ana Fonksiyon ───────────────────────────────────────────────────────────
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bold');
  log('║  Bilgi Köşesi & Keşfet — 1 Yıllık Stok Üretici      ║', 'bold');
  log('╚══════════════════════════════════════════════════════╝\n', 'bold');

  if (!GEMINI_API_KEY) {
    log('HATA: GEMINI_API_KEY ortam değişkeni tanımlı değil!', 'red');
    log('Kullanım: GEMINI_API_KEY=xxx node generate_1year_stock.js', 'yellow');
    process.exit(1);
  }

  const checkpoint = loadCheckpoint();
  const allCards = loadOutput();

  // Checkpoint'ten devam
  const startCount = allCards.length;
  const batchesNeeded = Math.ceil((TARGET_TOTAL - startCount) / BATCH_SIZE);
  const totalBatchesForTarget = Math.ceil(TARGET_TOTAL / BATCH_SIZE);
  const startBatchIndex = Math.floor(startCount / BATCH_SIZE);

  log(`Hedef: ${TARGET_TOTAL} kart`, 'cyan');
  log(`Mevcut: ${startCount} kart (checkpoint'ten yüklendi)`, 'cyan');
  log(`Kalan: ${Math.max(0, TARGET_TOTAL - startCount)} kart`, 'cyan');
  log(`Üretilecek batch: ${Math.max(0, batchesNeeded)} (her biri ${BATCH_SIZE} kart)`, 'cyan');
  log(`KV yükleme eşiği: Her ${UPLOAD_EVERY} kartta bir\n`, 'cyan');

  if (startCount >= TARGET_TOTAL) {
    log('✓ Hedef zaten tamamlanmış! Sadece KV yüklemesi yapılıyor...', 'green');
    const result = await uploadToKV(allCards);
    log(`✓ KV yükleme: ${JSON.stringify(result)}`, 'green');
    return;
  }

  let uploadBuffer = [];
  let totalUploaded = checkpoint.uploadedCount || 0;
  let errors = 0;

  for (let batchNum = 0; batchNum < batchesNeeded; batchNum++) {
    const batchIndex = startBatchIndex + batchNum;
    const currentTotal = allCards.length;
    const progress = ((currentTotal / TARGET_TOTAL) * 100).toFixed(1);

    process.stdout.write(`\rBatch ${batchIndex + 1}/${totalBatchesForTarget} | ${currentTotal}/${TARGET_TOTAL} kart (${progress}%) | Hata: ${errors} | Yüklenen: ${totalUploaded}...`);

    try {
      const batch = await generateBatch(batchIndex);
      allCards.push(...batch);
      uploadBuffer.push(...batch);

      // Yerel JSON'a kaydet
      saveOutput(allCards);

      // Belirli sayıya ulaşınca KV'ye yükle
      if (uploadBuffer.length >= UPLOAD_EVERY || currentTotal + batch.length >= TARGET_TOTAL) {
        const uploadResult = await uploadToKV(uploadBuffer);
        totalUploaded += uploadBuffer.length;
        uploadBuffer = [];

        const kvSize = uploadResult.poolSize !== undefined ? ` (KV toplam: ${uploadResult.poolSize})` : '';
        log(`\n  ✓ ${totalUploaded} kart KV'ye yüklendi${kvSize}`, 'green');

        saveCheckpoint({ cards: allCards.length, uploadedCount: totalUploaded });
      }

      await sleep(DELAY_MS);
    } catch (err) {
      errors++;
      log(`\n  ✗ Batch ${batchIndex + 1} hatası: ${err.message}`, 'red');

      if (errors > 10) {
        log('\nÇok fazla hata. Script durduruluyor.', 'red');
        log(`Mevcut ilerleme kaydedildi: ${allCards.length} kart`, 'yellow');
        log('Devam etmek için scripti yeniden çalıştırın.', 'yellow');
        process.exit(1);
      }

      // Rate limit durumunda daha uzun bekle
      if (err.message.includes('429') || err.message.includes('quota')) {
        log('  Rate limit! 30 saniye bekleniyor...', 'yellow');
        await sleep(30000);
      } else {
        await sleep(5000);
      }
    }
  }

  // Kalan buffer'ı yükle
  if (uploadBuffer.length > 0) {
    log('\nKalan kartlar KV\'ye yükleniyor...', 'cyan');
    const result = await uploadToKV(uploadBuffer);
    log(`✓ ${uploadBuffer.length} kart daha yüklendi. KV toplam: ${result.poolSize}`, 'green');
    saveCheckpoint({ cards: allCards.length, uploadedCount: totalUploaded + uploadBuffer.length });
  }

  log('\n\n╔══════════════════════════════════╗', 'green');
  log('║  ✓ İŞLEM TAMAMLANDI              ║', 'green');
  log('╚══════════════════════════════════╝', 'green');
  log(`Toplam üretilen: ${allCards.length} kart`, 'green');
  log(`KV'ye yüklenen: ${totalUploaded + uploadBuffer.length} kart`, 'green');
  log(`Yerel dosya: ${OUTPUT_FILE}`, 'green');

  // Checkpoint dosyasını temizle
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }
}

main().catch((err) => {
  log(`\nKRİTİK HATA: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
