const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = 'C:\\Users\\PC\\Desktop\\Mistik_Gorseller';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Güçlü, lüks, saf karanlık arka planlı ve falı ANINDA tanıtan estetik stil
const STYLE_SUFFIX = ", cinematic luxury editorial photography, dramatic warm amber-gold rim light, pure black OLED background (#000000), subtle mystical golden particle glow, rich sharp details, high aesthetic, 8k resolution, centered iconic composition, vibrant symbolic clarity, no blurry generic objects, vertical 3:4 aspect ratio";

const ICON_STYLE = ", 3D luxury glossy render, glowing gold and crystal details, pure black OLED background, dramatic lighting, ultra sharp iconic symbol, 1:1 square aspect ratio";

const TASKS = [
  {
    filename: '01_kahve_fali.jpg',
    title: 'Kahve Falı',
    prompt: `An authentic ornate Turkish coffee cup turned upside down and opened to reveal distinct, clear dried coffee grounds creating mystical fortune symbols like birds and hearts inside the porcelain cup, a traditional copper cezve with gentle rising steam next to it on a dark wooden table${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '02_tarot_fali.jpg',
    title: 'Tarot Falı',
    prompt: `A beautiful hand-spread array of mystical Tarot cards showing ornate Major Arcana faces with glowing gold foil illustrations of The Sun and The Star, a small radiant crystal quartz nearby, velvet cloth table${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '03_katina_fali.jpg',
    title: 'Katina Aşk Falı',
    prompt: `Katina love fortune cards with romantic mystic symbols, glowing red heart seal, deep red fresh rose petals scattered around, a lit scented wax candle glowing with warm love aura on dark velvet${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '04_el_fali.jpg',
    title: 'El Falı (Chiromancy)',
    prompt: `A graceful mystical hand palm facing upward with luminous glowing gold chiromancy lines (life line, heart line, head line) traced in bright radiant golden light across the palm, surrounded by celestial constellation sparkles, dark background${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '05_iskambil_fali.jpg',
    title: 'İskambil Saray Falı',
    prompt: `A lavish fan of classic royal playing cards prominently displaying the ornate Ace of Spades and Queen of Hearts with gold leaf edges, resting on dark green casino baize with gold coins${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '06_su_fali.jpg',
    title: 'Su Falı & Durugörü',
    prompt: `An antique ornate silver water scrying bowl filled with crystal clear dark water, delicate glowing ripples expanding from the center where a golden crescent moon reflection shines with supernatural clarity, mystical blue water glow${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '07_yuz_fali.jpg',
    title: 'Yüz Falı (Fizyonomi)',
    prompt: `A striking mystical face reading portrait profile with luminous golden ratio grid lines and glowing facial feature markers tracing the eyes, nose, and forehead, enlightened spiritual third-eye glow on dark obsidian background${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '08_melek_kartlari.jpg',
    title: 'Melek Kartları',
    prompt: `Ethereal celestial Angel oracle cards showing a magnificent radiant winged angel surrounded by soft golden halo beams, pristine pure white angel feathers resting beside glowing divine light particles${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '09_balmumu_fali.jpg',
    title: 'Balmumu Falı',
    prompt: `Hot golden melted candle wax poured into a bowl of cool water, instantly solidifying into an intricate symbolic silhouette shape floating on the surface, lit beeswax candle with warm flame beside it${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '10_41_bakla_fali.jpg',
    title: '41 Bakla Falı',
    prompt: `Traditional Ottoman 41 fava beans (bakla remil) neatly arranged in mystic circular divination groups across an aged dark fabric, with visible carved tally marks and glowing amber side lighting on the beans${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '11_lenormand_fali.jpg',
    title: 'Lenormand Falı',
    prompt: `A 3-card spread of vintage Lenormand oracle cards clearly displaying iconic illustrated symbols of The Key, The Heart, and The Ship with classic numbered borders, on antique dark wood${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '12_run_fali.jpg',
    title: 'Nordik Rün Falı',
    prompt: `A circle of smooth Nordic wooden and granite rune stones with deeply carved, glowing fiery-gold Elder Futhark rune symbols (Fehu, Ansuz, Algiz) on dark basalt stone table${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '13_iching_fali.jpg',
    title: 'Çin I Ching Falı',
    prompt: `Ancient Chinese I Ching divination setup with a prominent Yin-Yang central symbol, three ancient bronze coins with square holes, and glowing red and gold hexagram trigram lines${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '14_osho_zen_fali.jpg',
    title: 'Osho Zen Falı',
    prompt: `Spiritual Osho Zen tarot card featuring a glowing pink lotus flower in serene meditation pond, tranquil zen stones and soft purple spiritual aura${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '15_thoth_fali.jpg',
    title: 'Mısır Thoth Falı',
    prompt: `Egyptian Thoth tarot deck spread with prominent Eye of Horus and golden Ankh symbols, papyrus scroll textures, ancient hieroglyphic gold engravings${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '16_sesli_fal.jpg',
    title: 'Canlı Sesli Falcı',
    prompt: `A glowing golden vintage broadcast microphone emitting radiant mystic sound waves and audio frequencies, surrounded by sparkling magic dust and psychic listening headphones${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '17_dogum_haritasi.jpg',
    title: 'Doğum Haritası & Astroloji',
    prompt: `An intricate 3D holographic astrological birth chart wheel with 12 zodiac signs and planet orbits (Sun, Moon, Mars) glowing with vibrant cosmic starlight on deep space background${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '18_ruya_tabiri.jpg',
    title: 'Rüya Tabirleri & Bilinçaltı',
    prompt: `A magical glowing crescent moon floating above a sleeping cosmic cloud, delicate dreamcatcher with glowing feathers and stardust, representing deep subconscious dreams and lucidity${STYLE_SUFFIX}`,
    width: 768,
    height: 1024,
  },
  {
    filename: '19_banner_gunluk_yoklama.jpg',
    title: 'Günlük Yoklama & Ödül',
    prompt: `A glowing golden calendar with daily checkmark badges, overflowing with shiny gold coins and sparkling crystals, celebration lighting, dark background, 16:9 banner${STYLE_SUFFIX}`,
    width: 1024,
    height: 512,
  },
  {
    filename: '20_kart_ucretsiz_coin.jpg',
    title: 'Ücretsiz Coin Sandığı',
    prompt: `An open antique treasure chest overflowing with glowing gold coins and gems, golden volumetric light bursting from within, dark background${STYLE_SUFFIX}`,
    width: 768,
    height: 512,
  },
  {
    filename: '21_kart_mini_oyunlar.jpg',
    title: 'Mini Oyunlar & Çarkıfelek',
    prompt: `A spinning golden fortune wheel with colorful mystical reward segments, golden sparkling dice mid-roll next to it, casino luxury game feel${STYLE_SUFFIX}`,
    width: 768,
    height: 512,
  },
  {
    filename: '22_icon_coin.jpg',
    title: 'Altın Coin İkonu',
    prompt: `A single thick 3D heavy gold coin with an embossed shining mystic star in the center, polished reflective mirror gold rim, sparkling gleam${ICON_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    filename: '23_icon_kristal.jpg',
    title: 'Mavi Kristal İkonu',
    prompt: `A single faceted 3D glowing cyan-blue crystal diamond gemstone, translucent glass refractions, brilliant inner light beam, floating in air${ICON_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    filename: '24_zodyak_carki.jpg',
    title: '12 Zodyak Çarkı',
    prompt: `A magnificent circular astrological zodiac wheel wheel with all 12 zodiac constellation symbols engraved in polished gold, centered glowing solar star${ICON_STYLE}`,
    width: 512,
    height: 512,
  },
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log(`🚀 Toplam ${TASKS.length} adet İKONİK VE NET FAL GÖRSELİ üretimi başlatılıyor...`);
  console.log(`📁 Hedef Klasör: ${OUTPUT_DIR}\n`);

  let successCount = 0;

  for (let i = 0; i < TASKS.length; i++) {
    const task = TASKS[i];
    const outPath = path.join(OUTPUT_DIR, task.filename);

    console.log(`[${i + 1}/${TASKS.length}] 🎨 Üretiliyor: ${task.filename} -> "${task.title}"...`);

    const encodedPrompt = encodeURIComponent(task.prompt);
    const seed = Math.floor(Math.random() * 9000000) + 1000000;
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${task.width}&height=${task.height}&seed=${seed}&nologo=true&model=flux`;

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await downloadImage(url, outPath);
        if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
          console.log(`       ✅ Tamamlandı: ${task.filename} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
          success = true;
          successCount++;
          break;
        }
      } catch (err) {
        console.warn(`       ⚠️ Deneme ${attempt} başarısız: ${err.message}. Yeniden deneniyor...`);
        await sleep(3000);
      }
    }

    if (!success) {
      console.error(`       ❌ Hata: ${task.filename} üretilemedi!`);
    }

    await sleep(2000);
  }

  console.log(`\n🎉 İşlem tamamlandı! Toplam ${successCount}/${TASKS.length} ikonik fal görseli Masaüstüne başarıyla kaydedildi.`);
}

run();
