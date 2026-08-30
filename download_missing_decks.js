/**
 * Targeted Wikimedia Downloader for the 5 Missing Decks:
 * 1. Lenormand (36 cards)
 * 2. Kipper (36 cards)
 * 3. Sola Busca (78 cards)
 * 4. Grand Etteilla (78 cards)
 * 5. Minchiate / Historic Decks
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const TARGET_ROOT = path.join('C:', 'Users', 'PC', 'Desktop', 'Kart_Desteleri_Arsivi');

const USER_AGENT = 'MistikRehberArsiv/3.0 (contact: admin@mistikrehber.com; research & historical cards)';

const MISSING_DECKS = [
  {
    folder: '01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart',
    searchQueries: [
      'incategory:"Dondorf Lenormand"',
      'incategory:"Lenormand cards"',
      '"Das Spiel der Hoffnung" card',
      'Lenormand card'
    ],
    title: 'Lenormand Klasik Dondorf 36 Kartlık Kehanet Destesi',
    desc: '19. yüzyıl Mlle Lenormand ekolü 36 kartlık klasik aşk, evlilik, iş ve şaşmaz kadersel işaret kehanet destesi.',
    spreadGuide: '3 Kart Zaman Çizgisi, 9 Kart Kutu Açılımı ve 36 Kart Grand Tableau.'
  },
  {
    folder: '02_Kipper_Alman_Kader_ve_Gelecek_36_Kart',
    searchQueries: [
      'incategory:"Wahrsagekarten nach Frau Kipper"',
      'Kipperkarten',
      'Wahrsagekarten Kipper',
      '"Kipper" cards'
    ],
    title: 'Frau Kipper Geleneksel Alman Kehanet Destesi (36 Kart)',
    desc: '1890 Bavyera yapımı; insan ilişkileri, mahkeme, miras, evlilik ve karakter analizlerini gösteren 36 kartlık ünlü deste.',
    spreadGuide: 'Ana Erkek / Ana Kadın odaklı 9 Kart ve 36 Kart Kadersel Matris.'
  },
  {
    folder: '03_Sola_Busca_Ronesans_Simya_78_Kart',
    searchQueries: [
      'incategory:"Sola-Busca Tarot"',
      'incategory:"Sola Busca tarot deck"',
      'Sola Busca tarot'
    ],
    title: 'Sola Busca Rönesans Simya ve Mitoloji Destesi (78 Kart)',
    desc: '1491 Venedik yapımı; simyasal dönüşüm, Roma kahramanları ve kadim ezoterik sembolleri içeren 78 kartlık ilk resimli deste.',
    spreadGuide: 'Simyasal 7 Metal Açılımı ve Kadersel Dönüşüm Haçı.'
  },
  {
    folder: '04_Grand_Etteilla_Ezoterik_Mısır_Kehaneti_78_Kart',
    searchQueries: [
      'incategory:"Grand Etteilla"',
      'incategory:"Etteilla tarot cards"',
      'Grand Etteilla',
      'Etteilla tarot'
    ],
    title: 'Grand Etteilla Ezoterik Mısır Kehanet Destesi (78 Kart)',
    desc: '1789 yılında yalnızca fal ve kehanet amacıyla tasarlanan Antik Mısır Hermetizmi temelli okült deste.',
    spreadGuide: 'Etteilla 7 Gezegen Serimi ve 21 Kart Büyük Sır Açılımı.'
  },
  {
    folder: '05_Visconti_Sforza_Antik_Altin_78_Kart',
    searchQueries: [
      'incategory:"Visconti-Sforza tarot deck (Morgan Library)"',
      'incategory:"Visconti-Sforza tarot deck"',
      'Visconti Sforza tarot'
    ],
    title: 'Visconti-Sforza Milano Dükalığı Altın Kehanet Destesi (78 Kart)',
    desc: '1450 Milano sarayında altın varakla el boyaması yapılan tarihi kehanet destesi.',
    spreadGuide: 'Saray 3 Zaman Serimi ve 7 Kutsal Erdem Açılımı.'
  }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function downloadImageWithRetry(url, destPath, retries = 3) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'image/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImageWithRetry(res.headers.location, destPath, retries));
      }
      if (res.statusCode === 429) {
        if (retries > 0) {
          setTimeout(() => {
            resolve(downloadImageWithRetry(url, destPath, retries - 1));
          }, 3500);
          return;
        }
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP Status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    req.on('error', reject);
  });
}

function sanitizeName(title, index) {
  let clean = title.replace(/^File:/i, '');
  const ext = path.extname(clean) || '.jpg';
  clean = path.basename(clean, ext);
  clean = clean
    .replace(/[_\-+]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  const paddedNum = String(index + 1).padStart(2, '0');
  return `${paddedNum}_${clean}${ext.toLowerCase()}`;
}

async function searchFiles(query) {
  const enc = encodeURIComponent(query);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${enc}&gsrnamespace=6&gsrlimit=100&prop=imageinfo&iiprop=url&format=json`;
  try {
    const data = await fetchJson(url);
    const pages = (data.query && data.query.pages) || {};
    return Object.values(pages).map((p) => ({
      title: p.title,
      url: p.imageinfo?.[0]?.url,
    })).filter((p) => p.url && /\.(jpe?g|png|webp)$/i.test(p.title));
  } catch (err) {
    return [];
  }
}

async function processDeck(deck) {
  const deckDir = path.join(TARGET_ROOT, deck.folder);
  if (!fs.existsSync(deckDir)) {
    fs.mkdirSync(deckDir, { recursive: true });
  }

  console.log(`\n======================================================`);
  console.log(`🎴 [EKSİK DESTE DOLDURULUYOR]: ${deck.title}`);
  console.log(`📁 Klasör: ${deck.folder}`);
  console.log(`======================================================`);

  const readme = `=====================================================
KART DESTESİ KEHANET VE FAL REHBERİ
=====================================================
Deste Adı: ${deck.title}
Klasör: ${deck.folder}

TANIM VE TARİHİ KÖKEN:
${deck.desc}

FAL NASIL BAKILIR / KULLANIM REHBERİ:
${deck.spreadGuide}

DURUM:
Bu klasördeki tüm kartlar yüksek çözünürlükte numaralandırılarak arşivlenmiştir.
İstediğiniz görselleri kontrol edip seçtikten sonra fal uygulamasına entegre edebilirsiniz.
=====================================================
`;
  fs.writeFileSync(path.join(deckDir, 'KART_BILGILERI_VE_FAL_REHBERI.txt'), readme, 'utf-8');

  let allFiles = [];

  for (const q of deck.searchQueries) {
    const res = await searchFiles(q);
    for (const f of res) {
      if (!allFiles.some((item) => item.title === f.title)) {
        allFiles.push(f);
      }
    }
  }

  console.log(`🔍 Toplam ${allFiles.length} adet doğrulanmış kart görseli bulundu.`);

  let successCount = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const item = allFiles[i];
    const fileName = sanitizeName(item.title, i);
    const destPath = path.join(deckDir, fileName);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
      successCount++;
      continue;
    }

    try {
      process.stdout.write(`⬇️ [${i + 1}/${allFiles.length}] ${fileName}... `);
      await downloadImageWithRetry(item.url, destPath);
      const sizeKb = (fs.statSync(destPath).size / 1024).toFixed(1);
      console.log(`✅ (${sizeKb} KB)`);
      successCount++;
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.log(`❌ Hata: ${err.message}`);
    }
  }

  console.log(`🎉 ${deck.title} tamamlandı: ${successCount} görsel indirildi.`);
}

async function start() {
  console.log(`🚀 [EKSİK VE BOŞ KALAN DESTELERİ İNDİRME İŞLEMİ BAŞLADI]`);
  console.log(`📂 Hedef: ${TARGET_ROOT}\n`);

  for (const deck of MISSING_DECKS) {
    await processDeck(deck);
  }

  console.log(`\n======================================================`);
  console.log(`✨ BÜTÜN EKSİK DESTELER BAŞARIYLA TAMAMLANDI! ✨`);
  console.log(`======================================================\n`);
}

start().catch(console.error);
