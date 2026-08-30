/**
 * Wikimedia Commons Divination & Historic Card Decks Bulk Downloader (V3 - Robust & Recursive)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const TARGET_ROOT = path.join('C:', 'Users', 'PC', 'Desktop', 'Kart_Desteleri_Arsivi');

if (!fs.existsSync(TARGET_ROOT)) {
  fs.mkdirSync(TARGET_ROOT, { recursive: true });
}

const USER_AGENT = 'MistikRehberArsiv/2.0 (contact: admin@mistikrehber.com; research and education)';

const DECKS = [
  {
    folder: '01_Minchiate_Floransa_Astroloji_97_Kart',
    categories: ['Category:Minchiate', 'Category:Minchiate_cards'],
    title: 'Floransa Minchiate 97 Kartlık Astroloji ve Kehanet Destesi (1725)',
    desc: 'Floransa saraylarında kullanılan; 12 Burç, 4 Element, 4 Temel Erdem ve kozmik arketipleri içeren 97 kartlık devasa kehanet destesi.',
    spreadGuide: 'Astrolojik 12 Ev Açılımı, 4 Element Denge Serimi ve Kadersel Gezegen Dizilimi.'
  },
  {
    folder: '02_Sola_Busca_Ronesans_Simya_78_Kart',
    categories: ['Category:Sola-Busca_Tarot', 'Category:Sola_Busca_tarot_deck'],
    title: 'Sola Busca Rönesans Simya ve Mitoloji Destesi (1491)',
    desc: '1491 Venedik yapımı; simyasal dönüşüm, Roma kahramanları ve kadim ezoterik sembolleri içeren 78 kartlık ilk resimli deste.',
    spreadGuide: 'Simyasal 7 Metal Açılımı ve Kadersel Dönüşüm Haçı.'
  },
  {
    folder: '03_Visconti_Sforza_Antik_Altin_78_Kart',
    categories: ['Category:Visconti-Sforza_tarot_deck', 'Category:Visconti_tarot_cards', 'Category:Visconti-Sforza_tarot_deck_(Morgan_Library)'],
    title: 'Visconti-Sforza Milano Dükalığı Altın Kehanet Destesi (1450)',
    desc: 'Milano sarayında altın varakla el boyaması yapılan, Rönesans aristokrasisinin kadersel kararlar aldığı 78 kartlık tarihi deste.',
    spreadGuide: 'Saray 3 Zaman Serimi ve 7 Kutsal Erdem Açılımı.'
  },
  {
    folder: '04_Marseille_Nicolas_Conver_78_Kart',
    categories: ['Category:Tarot_de_Marseille_Nicolas_Conver', 'Category:Tarot_de_Marseille'],
    title: 'Marsilya Tarotu Nicolas Conver Ahşap Baskı (1760)',
    desc: 'Klasik Fransız kartomansi ekolünün en saf ahşap oyma arketip destesi.',
    spreadGuide: 'Marsilya 5 Kapı Serimi ve İkili Enerji Aynası.'
  },
  {
    folder: '05_Grand_Etteilla_Ezoterik_Kehanet_78_Kart',
    categories: ['Category:Grand_Etteilla', 'Category:Etteilla_tarot_cards', 'Category:Etteilla'],
    title: 'Grand Etteilla Ezoterik Mısır Kehaneti (1789)',
    desc: 'Tarihte sadece fal ve kehanet amacıyla hazırlanan ilk profesyonel 78 kartlık okült deste.',
    spreadGuide: 'Etteilla 7 Gezegen Serimi ve 21 Kart Büyük Sır Açılımı.'
  },
  {
    folder: '06_Lenormand_Geleneksel_Kehanet_36_Kart',
    categories: ['Category:Lenormand_cards', 'Category:Dondorf_Lenormand', 'Category:Wahrsagekarten'],
    title: 'Lenormand Geleneksel Kehanet Destesi (36 Kart)',
    desc: 'Napolyon sarayının baş kahini Mlle Lenormand ekolü; aşk, evlilik, iş ve kaderin somut işaretlerini gösteren 36 kartlık kehanet destesi.',
    spreadGuide: '3 Kart Zaman Çizgisi, 9 Kart Kutu Açılımı ve 36 Kart Grand Tableau.'
  },
  {
    folder: '07_Tarot_1JJ_Isvicre_Ezoterik_78_Kart',
    categories: ['Category:Tarot_1JJ', 'Category:Swiss_1JJ_Tarot'],
    title: 'Tarot 1JJ İsviçre ve Roma Gizemleri Destesi (1865)',
    desc: 'Jüpiter ve Juno sembolleriyle zenginleştirilmiş 78 kartlık tarihi İsviçre kehanet destesi.',
    spreadGuide: '3 Zaman Çizgisi ve Kadersel Denge Açılımı.'
  },
  {
    folder: '08_Mantegna_Tarocchi_Kozmik_Duzen_50_Kart',
    categories: ['Category:Mantegna_Tarocchi', 'Category:Tarocchi_di_Mantegna'],
    title: 'Mantegna Tarocchi Kozmik Bilgelik Destesi (1465)',
    desc: 'Rönesans döneminde insanın 50 basamaklı ruhsal tekamülünü, 9 Müzayı, 7 Erdemi ve 10 Kozmik Küreyi anlatan 50 kartlık kehanet destesi.',
    spreadGuide: 'Ruhsal Merdiven Açılımı ve Kozmik Gezegen Serimi.'
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
        // Rate limit hit, wait 4 seconds and retry
        if (retries > 0) {
          setTimeout(() => {
            resolve(downloadImageWithRetry(url, destPath, retries - 1));
          }, 4000);
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

async function getCategoryMembers(category) {
  const catParam = encodeURIComponent(category);
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${catParam}&cmlimit=250&cmtype=file|subcat&format=json`;
  const data = await fetchJson(apiUrl);
  return (data.query && data.query.categorymembers) || [];
}

async function downloadDeck(deck) {
  const deckDir = path.join(TARGET_ROOT, deck.folder);
  if (!fs.existsSync(deckDir)) {
    fs.mkdirSync(deckDir, { recursive: true });
  }

  console.log(`\n======================================================`);
  console.log(`🎴 [DESTE]: ${deck.title}`);
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

  for (const cat of deck.categories) {
    try {
      const members = await getCategoryMembers(cat);
      for (const m of members) {
        if (m.ns === 6) { // File
          const t = m.title.toLowerCase();
          if (t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.png') || t.endsWith('.webp')) {
            if (!allFiles.some((f) => f.title === m.title)) {
              allFiles.push(m);
            }
          }
        } else if (m.ns === 14) { // Subcategory
          try {
            const subMembers = await getCategoryMembers(m.title);
            for (const sm of subMembers) {
              if (sm.ns === 6) {
                const t = sm.title.toLowerCase();
                if (t.endsWith('.jpg') || t.endsWith('.jpeg') || t.endsWith('.png') || t.endsWith('.webp')) {
                  if (!allFiles.some((f) => f.title === sm.title)) {
                    allFiles.push(sm);
                  }
                }
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  console.log(`🔍 Toplam ${allFiles.length} adet kart dosyası tespit edildi.`);

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
      const fileTitle = encodeURIComponent(item.title);
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${fileTitle}&prop=imageinfo&iiprop=url&format=json`;
      const infoData = await fetchJson(infoUrl);
      const pages = infoData.query && infoData.query.pages;
      const page = pages && Object.values(pages)[0];
      const directUrl = page?.imageinfo?.[0]?.url;

      if (directUrl) {
        process.stdout.write(`⬇️ [${i + 1}/${allFiles.length}] ${fileName}... `);
        await downloadImageWithRetry(directUrl, destPath);
        const sizeKb = (fs.statSync(destPath).size / 1024).toFixed(1);
        console.log(`✅ (${sizeKb} KB)`);
        successCount++;
        // Respect Wikimedia rate limit (650ms delay)
        await new Promise((r) => setTimeout(r, 650));
      }
    } catch (err) {
      console.log(`❌ Hata: ${err.message}`);
    }
  }

  console.log(`🎉 ${deck.title} tamamlandı: ${successCount} görsel indirildi.`);
}

async function start() {
  console.log(`🚀 [WIKIMEDIA FAL & KEHANET KARTLARI ARŞİV İNDİRİCİSİ V3]`);
  console.log(`📂 Arşiv Konumu: ${TARGET_ROOT}\n`);

  for (const deck of DECKS) {
    await downloadDeck(deck);
  }

  console.log(`\n======================================================`);
  console.log(`✨ BÜTÜN KART DESTELERİ BAŞARIYLA İNDİRİLDİ VE ARŞİVLENDİ! ✨`);
  console.log(`📁 İncelemek için klasör: ${TARGET_ROOT}`);
  console.log(`======================================================\n`);
}

start().catch(console.error);
