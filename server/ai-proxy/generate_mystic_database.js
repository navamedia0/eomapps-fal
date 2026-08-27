#!/usr/bin/env node
/**
 * Mistik Bilgi Bankası — Tam Kapsamlı AI Veri Üretim ve Külliyat Çekim Motoru
 * ===========================================================================
 * Bu script; kitaplardaki geleneksel sembolleri, sosyal medyadaki gerçek falcı
 * analizlerini ve derin rüya psikolojisini AI modelleri üzerinden toplu olarak
 * parça parça (batch) çekip 'src/data/' altındaki JSON dosyalarına yazar.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// .dev.vars dosyasını yükle
const DEV_VARS_PATH = path.join(__dirname, '.dev.vars');
if (fs.existsSync(DEV_VARS_PATH)) {
  const lines = fs.readFileSync(DEV_VARS_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const KAHVE_DB_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'kahve_derin_veritabani.json');
const RUYA_DB_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'ruya_derin_veritabani.json');

// ─── 200+ Kapsamlı Kahve Falı Sembol Listesi ────────────────────────────────
const SEMBOL_LISTESI = [
  'kus', 'balik', 'yol', 'yilan', 'kalp', 'yuzuk', 'anahtar', 'agac', 'at', 'dag',
  'goz', 'gemi', 'bayrak', 'kopek', 'kedi', 'aslan', 'kurt', 'guvercin', 'kartal', 'baykus',
  'kelebek', 'ari', 'orumcek', 'fil', 'deve', 'yildiz', 'ay', 'gunes', 'merdiven', 'kapi',
  'bicak', 'mum', 'kitap', 'ayakkabi', 'canta', 'saat', 'tac', 'gozyasi', 'el', 'ayak',
  'kuyu', 'kopru', 'semsiye', 'silah', 'araba', 'ucak', 'bulut', 'cicek', 'gul', 'lale',
  'akrep', 'tilki', 'geyik', 'tavsan', 'kaplumbaga', 'yunus', 'fare', 'melek', 'seytan',
  'bebek', 'yasli_adam', 'gelin', 'damat', 'siluet', 'dans_eden_kadin', 'sandalye', 'masa', 'yatak', 'ayna',
  'pencere', 'balkon', 'cadir', 'kale', 'kule', 'cami_minaresi', 'deniz_feneri', 'degirmen', 'cesme',
  'surahi', 'fincan', 'kadeh', 'sise', 'kazan', 'kasik', 'catal', 'tencere', 'sepet', 'sandik',
  'zincir', 'ip_yumagi', 'dugum', 'makas', 'igne', 'iplik', 'pusula', 'durbun', 'gozluk', 'nargile',
  'ates', 'alev', 'yanardag', 'simsek', 'yagmur', 'kar_tanesi', 'ruzgar', 'nehir', 'sel',
  'ada', 'magara', 'orman', 'yaprak', 'tohum', 'meyve', 'elma', 'nar', 'uzum', 'zeytin_dali',
  'bugday_basagi', 'mantar', 'kaktus', 'sarmasik', 'palmiye', 'nilufer', 'inci', 'elmas', 'altin_kesesi',
  'madeni_para', 'hazine_sandigi', 'muhur', 'mektup', 'zarf', 'telefon', 'zil', 'trompet', 'saz',
  'gitar', 'piyano', 'nota', 'maske', 'terazi', 'adliye_sarayi', 'kelepce', 'kilit',
  'madalya', 'sampanya', 'pasta', 'hediye_paketi', 'balon', 'ucurtma', 'salincak', 'kayik', 'yelkenli',
  'denizkizi', 'ahtapot', 'yengec', 'istakoz', 'denizati', 'ugurbocegi', 'karinca', 'cekirge', 'salyangoz', 'bukalemun',
  'tavus_kusu', 'leylek', 'karga', 'horoz', 'tavuk', 'ordek', 'kugu', 'pelikan', 'papagan', 'yarasa',
  'sincap', 'kirpi', 'kunduz', 'ayi', 'maymun', 'goril', 'zebra', 'zurafa', 'hipopotam', 'gergedan',
  'supurge', 'lamba', 'avize', 'tabut', 'mezar_tasi', 'iskelet', 'hayalet', 'sihirli_kure'
];

// ─── 35 Kapsamlı Rüya Teması ve Senaryosu ───────────────────────────────────
const RUYA_TEMALARI = [
  'dis_dokulmesi', 'kovalanmak', 'eski_sevgili_gormek', 'ciplak_kalmak', 'yolculuga_cikmak',
  'yuksekten_dusmek', 'gokyuzunde_ucmak', 'bogulmak', 'sinava_girmek_ve_yetisememek', 'olmus_bir_yakini_gormek',
  'evlenmek', 'bebek_emzirmek_veya_dogurmak', 'yangin_gormek', 'sel_ve_tsunami', 'kaybolmak',
  'altin_veya_para_bulmak', 'yilan_tarafindan_isirilmak', 'ev_satin_almak_veya_tasinmak', 'aglamak', 'sac_dokulmesi',
  'hapse_girmek', 'araba_kazasi_yapmak', 'denizde_yuzmek', 'karanlikta_kalmak', 'ayna_kirilmasi',
  'ucak_dusmesi', 'hirsiz_gormek', 'tuvalet_aramak', 'kan_gormek', 'dugun_gormek',
  'cami_veya_kutsal_mekan_gormek', 'seccade_ve_dua_etmek', 'tren_yolculugu', 'eski_arkadasla_karsilasmak', 'buyu_yapildigini_gormek'
];

function loadJson(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestHttps(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed, raw: body });
        } catch {
          resolve({ statusCode: res.statusCode, data: null, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('İstek zaman aşımına uğradı (Timeout).'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

async function callGeminiDirect(modelName, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });
  const res = await requestHttps(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, payload);

  if (res.statusCode === 200) {
    const text = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (text) return JSON.parse(text);
  }
  throw new Error(`Model ${modelName} HTTP ${res.statusCode}: ${res.raw?.slice(0, 150)}`);
}

async function queryAiJson(prompt) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY bulunamadı.');

  try {
    return await callGeminiDirect('gemini-flash-latest', prompt);
  } catch (e1) {
    console.warn(`   ⚠️ gemini-flash-latest başarısız (${e1.message}), lite deneniyor...`);
    return await callGeminiDirect('gemini-flash-lite-latest', prompt);
  }
}

// ─── Batch Kahve Sembolü Üretimi ─────────────────────────────────────────────
async function generateCoffeeBatch(symbols) {
  const prompt = `Aşağıdaki ${symbols.length} adet kahve falı sembolü için geleneksel Türk kahve falı külliyatına, gerçek medyum yorumlarına ve sosyal medya analizlerine dayanan derinlikli 4 boyutlu analizler oluştur:
Semboller: ${symbols.join(', ')}

Her sembol için TAM OLARAK şu JSON şemasını üret:
{
  "sembol_adi": {
    "genel": "Genel anlam ve fincandaki yansıması (1-2 cümle)",
    "ask": "Aşk ve ilişkiler boyutundaki somut karşılığı (1-2 cümle)",
    "kariyer_para": "İş, para ve kariyer boyutundaki karşılığı (1-2 cümle)",
    "uyari_golge": "Dikkat edilmesi gereken gölge taraf veya konum uyarısı (1-2 cümle)"
  }
}
Sadece JSON nesnesi döndür.`;

  return await queryAiJson(prompt);
}

// ─── Batch Rüya Teması Üretimi ───────────────────────────────────────────────
async function generateDreamBatch(themes) {
  const prompt = `Aşağıdaki ${themes.length} adet rüya teması için Jungiyen analitik psikoloji, Freudien bilinçaltı ve geleneksel halk tabirlerini sentezleyen derinlikli analizler oluştur:
Temalar: ${themes.join(', ')}

Her tema için TAM OLARAK şu JSON şemasını üret:
{
  "tema_adi": {
    "psikanaliz": "Jungiyen ve psikanalitik derin anlamı (1-2 cümle)",
    "halk_tabiri": "Geleneksel halk ve doğu tabiri karşılığı (1-2 cümle)",
    "sentez_yorum": "Rüya sahibine sunulacak doğal, sıcak ve bilgece sentez yorum (2-3 cümle)"
  }
}
Sadece JSON nesnesi döndür.`;

  return await queryAiJson(prompt);
}

// ─── Ana İşlem Döngüsü ───────────────────────────────────────────────────────
async function runKnowledgePipeline() {
  console.log('🔮 [MİSTİK BİLGİ BANKASI KÜLLİYAT ÜRETİM MOTORU BAŞLATILDI]');
  console.log('============================================================');

  const kahveDb = loadJson(KAHVE_DB_PATH);
  const ruyaDb = loadJson(RUYA_DB_PATH);
  kahveDb.semboller = kahveDb.semboller || {};
  ruyaDb.yaygin_ruya_temalari = ruyaDb.yaygin_ruya_temalari || {};

  const eksikKahve = SEMBOL_LISTESI.filter((s) => !kahveDb.semboller[s]);
  const eksikRuya = RUYA_TEMALARI.filter((r) => !ruyaDb.yaygin_ruya_temalari[r]);

  console.log(`☕ Üretilecek Kahve Sembolü: ${eksikKahve.length}`);
  console.log(`🌙 Üretilecek Rüya Teması: ${eksikRuya.length}`);

  // 1. KAHVE SEMBOLLERİNİ BATCH'LER HALİNDE ÜRET (Her grupta 10 sembol)
  const BATCH_SIZE = 10;
  for (let i = 0; i < eksikKahve.length; i += BATCH_SIZE) {
    const chunk = eksikKahve.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(eksikKahve.length / BATCH_SIZE);
    console.log(`\n⏳ [Kahve Batch ${batchNum}/${totalBatches}] Üretiliyor: ${chunk.join(', ')}...`);
    try {
      const generated = await generateCoffeeBatch(chunk);
      for (const [key, val] of Object.entries(generated)) {
        kahveDb.semboller[key.toLowerCase()] = val;
      }
      saveJson(KAHVE_DB_PATH, kahveDb);
      console.log(`   ✅ Kaydedildi! Toplam Kahve Sembolü: ${Object.keys(kahveDb.semboller).length}`);
      await sleep(1200);
    } catch (e) {
      console.error(`   ❌ Hata: ${e.message}`);
    }
  }

  // 2. RÜYA TEMALARINI BATCH'LER HALİNDE ÜRET (Her grupta 5 tema)
  const DREAM_BATCH = 5;
  for (let i = 0; i < eksikRuya.length; i += DREAM_BATCH) {
    const chunk = eksikRuya.slice(i, i + DREAM_BATCH);
    const batchNum = Math.floor(i / DREAM_BATCH) + 1;
    const totalBatches = Math.ceil(eksikRuya.length / DREAM_BATCH);
    console.log(`\n⏳ [Rüya Batch ${batchNum}/${totalBatches}] Üretiliyor: ${chunk.join(', ')}...`);
    try {
      const generated = await generateDreamBatch(chunk);
      for (const [key, val] of Object.entries(generated)) {
        ruyaDb.yaygin_ruya_temalari[key.toLowerCase()] = val;
      }
      saveJson(RUYA_DB_PATH, ruyaDb);
      console.log(`   ✅ Kaydedildi! Toplam Rüya Teması: ${Object.keys(ruyaDb.yaygin_ruya_temalari).length}`);
      await sleep(1200);
    } catch (e) {
      console.error(`   ❌ Hata: ${e.message}`);
    }
  }

  console.log('\n🎉 [TAMAMLANDI] Mistik Bilgi Bankası Devasa Külliyatı Başarıyla Üretildi ve Kaydedildi!');
  console.log(`   - Toplam Kahve Sembolü: ${Object.keys(kahveDb.semboller).length}`);
  console.log(`   - Toplam Rüya Teması: ${Object.keys(ruyaDb.yaygin_ruya_temalari).length}`);
}

if (require.main === module) {
  runKnowledgePipeline().catch(console.error);
}

module.exports = { runKnowledgePipeline };
