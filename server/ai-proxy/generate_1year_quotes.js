#!/usr/bin/env node
/**
 * Keşfet — 1 Yıllık (5.500 Adet) Estetik & Göndermeli & Derin Söz Stok Üretici
 * ===========================================================================
 * Hedef: 183 dönem (48 saatte bir 30 söz = 5.490 söz ~ 5.500 söz)
 * Konular:
 *   - Zarif göndermeler & sosyal medya hikaye sözleri
 *   - Derin psikolojik farkındalık & öz-değer
 *   - Aşk, ayrılık & duygusal rezonans
 *   - Geçmiş, anılar & ruhsal büyüme
 *   - Karma, kader & sezgisel hakikatler
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY || 'REDACTED_ROTATE_THIS_KEY';
const GEMINI_MODEL    = 'gemini-3.5-flash-lite';
const TARGET_TOTAL    = 5500;    // 183 × 30 söz = 5490 ~ 5500
const BATCH_SIZE      = 50;
const DELAY_MS        = 1400;

const CHECKPOINT_FILE = path.join(__dirname, 'quotes_checkpoint.json');
const OUTPUT_FILE     = path.join(__dirname, 'kesfet_sozleri_stock.json');
const APP_DATA_FILE   = path.join('c:', 'Users', 'PC', 'Desktop', 'Fal', 'src', 'data', 'kesfet_sozleri.json');

const THEMES = [
  'Zarif Göndermeli Sözler (Sosyal medya hikayelerinde paylaşılacak, ince zeka ürünü, asil ve etkileyici göndermeler)',
  'Psikolojik Farkındalık & Öz-Değer (İçsel güç, sınır koyma, kendini sevme ve kendi değerini bilme üzerine derin tespitler)',
  'Aşk, Bağlanma ve Ayrılık (Kalp kırıklığı, gerçek bağ, vazgeçiş ve sevginin sessiz gücü üzerine edebi sözler)',
  'Geçmiş, Hatıralar & Ruhsal İyileşme (Zamanın dönüştürücü gücü, affediş, eskiyi geride bırakıp yenilenme)',
  'Kader, Sezgi & Karma (Evrenin dengesi, hak ediş, tesadüf olmayan karşılaşmalar ve içsel rehberlik)',
];

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

function saveOutput(quotes) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(quotes, null, 2), 'utf8');
  // Doğrudan uygulama veritabanına da senkronize et
  try {
    fs.writeFileSync(APP_DATA_FILE, JSON.stringify(quotes, null, 2), 'utf8');
  } catch {}
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
    req.setTimeout(30000, () => req.destroy(new Error('Request timeout')));
    req.write(body);
    req.end();
  });
}

async function generateQuotesBatch(batchIndex) {
  const theme = THEMES[batchIndex % THEMES.length];
  const prompt = `
Sen Türk edebiyatına, derin psikolojiye ve sosyal medya estetiğine son derece hakim usta bir yazarsın.
Fal ve astroloji uygulamamızın "Keşfet" bölümü için TAM OLARAK ${BATCH_SIZE} adet benzersiz, Türkçe, çok etkileyici ve paylaşılabilir söz üret.

Bu batch için ana tema: "${theme}".

KURALLAR:
1. Kesinlikle kamyon arkası, laubali, ucuz ya da kaba sözler OLMAYACAK.
2. Instagram, WhatsApp ve TikTok hikayelerinde arka plana müzik veya görsel koyulup gururla paylaşılabilecek kadar estetik, anlamlı, derin, göndermeli ve edebi olacak.
3. Kimi zaman aşkın sessiz kırgınlığı, kimi zaman asil bir vazgeçiş, kimi zaman kendini keşfetme ve öz-değer, kimi zaman karmik adalet ve geçmişin muhasebesi temasını işleyecek.
4. Her söz 1 veya en fazla 2 cümle olacak (ortalama 60-150 karakter).
5. Daha önce üretilmiş klişelerden kaçın, her söz kendine has bir ruh ve derinlik taşısın.

SADECE JSON string dizisi döndür, başka hiçbir metin veya markdown ekleme:
["Söz 1", "Söz 2", "Söz 3", ...]`;

  const text = await callGemini(prompt);
  let items;
  try {
    items = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      items = JSON.parse(match[0]);
    } else {
      throw new Error(`JSON parse hatası: ${text.slice(0, 100)}`);
    }
  }

  if (!Array.isArray(items)) throw new Error('Dizi bekleniyor');

  return items
    .map((item) => (typeof item === 'string' ? item.trim() : (item.text || item.quote || '').trim()))
    .filter((str) => str.length >= 15 && str.length <= 250);
}

async function main() {
  log('\n╔══════════════════════════════════════════════════════╗', 'bold');
  log('║  Keşfet — 1 Yıllık (5.500 Söz) Stok Üretici         ║', 'bold');
  log('╚══════════════════════════════════════════════════════╝\n', 'bold');

  const allQuotes = loadOutput();
  const existingSet = new Set(allQuotes);

  const startCount = allQuotes.length;
  const batchesNeeded = Math.ceil((TARGET_TOTAL - startCount) / BATCH_SIZE);
  const totalBatches = Math.ceil(TARGET_TOTAL / BATCH_SIZE);
  const startBatchIndex = Math.floor(startCount / BATCH_SIZE);

  log(`Hedef: ${TARGET_TOTAL} söz`, 'cyan');
  log(`Mevcut: ${startCount} söz`, 'cyan');
  log(`Kalan: ${Math.max(0, TARGET_TOTAL - startCount)} söz`, 'cyan');
  log(`Üretilecek batch: ${Math.max(0, batchesNeeded)}\n`, 'cyan');

  let errors = 0;

  for (let batchNum = 0; batchNum < batchesNeeded; batchNum++) {
    const batchIndex = startBatchIndex + batchNum;
    const currentTotal = allQuotes.length;
    const progress = ((currentTotal / TARGET_TOTAL) * 100).toFixed(1);

    process.stdout.write(`\rBatch ${batchIndex + 1}/${totalBatches} | ${currentTotal}/${TARGET_TOTAL} söz (${progress}%) | Hata: ${errors}...`);

    try {
      const batch = await generateQuotesBatch(batchIndex);
      let added = 0;
      for (const q of batch) {
        if (!existingSet.has(q)) {
          existingSet.add(q);
          allQuotes.push(q);
          added++;
        }
      }

      saveOutput(allQuotes);
      await sleep(DELAY_MS);
    } catch (err) {
      errors++;
      log(`\n  ✗ Batch ${batchIndex + 1} hatası: ${err.message}`, 'red');

      if (errors > 15) {
        log('\nÇok fazla hata. Script durduruluyor.', 'red');
        process.exit(1);
      }

      if (err.message.includes('429') || err.message.includes('quota')) {
        log('  Rate limit! 25 saniye bekleniyor...', 'yellow');
        await sleep(25000);
      } else {
        await sleep(4000);
      }
    }
  }

  log('\n\n╔══════════════════════════════════╗', 'green');
  log('║  ✓ KEŞFET STOK İŞLEMİ TAMAMLANDI ║', 'green');
  log('╚══════════════════════════════════╝', 'green');
  log(`Toplam biriken söz: ${allQuotes.length}`, 'green');
  log(`Hedef dosya: ${APP_DATA_FILE}`, 'green');
}

main().catch((err) => {
  log(`\nKRİTİK HATA: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
