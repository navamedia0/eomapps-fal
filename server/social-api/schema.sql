-- Mistik Rehber Social API — D1 şeması
-- Faz 0: hesap sistemi + Faz 1: takip/engelle ilişkileri + Keşfet gönderileri

-- xp/avatar_gender sonradan eklendi (Faz 9, profil/karakter sistemi) — var
-- olan uzak veritabanında ayrı bir ALTER TABLE ile (bkz. README "Seviye ve
-- Karakter Sistemi"); burada fresh-DB kurulumları için tanımlıdır.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,          -- 'google' | 'apple'
  provider_sub TEXT NOT NULL,      -- sağlayıcının sabit kullanıcı kimliği (JWT 'sub')
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  avatar_gender TEXT,              -- 'female' | 'male' | NULL (henüz seçmedi)
  created_at TEXT NOT NULL,
  UNIQUE(provider, provider_sub)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,          -- opak oturum belirteci (rastgele, JWT değil)
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id),
  followee_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id),
  blocked_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL REFERENCES posts(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

-- Sosyal özellikler (hediye, popülerlik puanı, mağaza) için merkezi işlem
-- defteri. Uygulamanın mevcut fal kredisi/coin sistemi (cihaz-yerel, girişsiz)
-- bilerek bunun dışında tutuluyor — bu ledger sadece hesaba bağlı yeni sosyal
-- ekonomi özellikleri için. İki para birimi var: coin (aktiviteyle kazanılan)
-- ve crystal (gerçek parayla alınan premium birim) — roadmap'in "ikili ekonomi"
-- maddesi. Henüz hiçbir özellik kazanç işlemi yazmıyor (kazanma/IAP akışları
-- ayrı bir sonraki adım), bu yüzden bakiyeler bugün için hep 0.
CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL,      -- 'coin' | 'crystal'
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, currency)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL,       -- 'coin' | 'crystal'
  amount INTEGER NOT NULL,      -- pozitif: kazanç, negatif: harcama
  reason TEXT NOT NULL,         -- örn. 'gift_sent', 'shop_purchase', 'vip_subscribe'
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id);

-- Mağaza (Faz 4) — sadece altyapı: şema + satın alma/envanter mekaniği.
-- Gerçek çerçeve/rozet/efekt kataloğu (isim, görsel, fiyat) ayrı bir
-- araştırma belgesini bekliyor; aşağıdaki [Örnek] önekli satırlar sadece
-- akışı test etmek için — gerçek içerik değil.
CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- 'frame' | 'badge' | 'entrance_effect' | 'avatar_hat' | 'avatar_cape' | 'avatar_outfit' | 'avatar_pants'
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL,        -- 'coin' | 'crystal'
  price INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON shop_purchases(user_id);
-- Aynı ürünü iki kez satın almayı (ve dolayısıyla çift ücretlendirmeyi)
-- eşzamanlı isteklerde bile DB seviyesinde imkansız kılar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_purchases_unique ON shop_purchases(user_id, item_id);

-- Karakter/avatar giydirme (Faz 9). Giyilebilir eşyalar shop_items'ın
-- 'avatar_hat'/'avatar_cape'/'avatar_outfit'/'avatar_pants' kategorileri
-- olarak modellenir — satın alma/sahiplik zaten shop_purchases'ta var,
-- burada sadece "şu an hangisi kuşanılı" durumu tutulur. Slot boşsa
-- (hiçbir şey kuşanılmamış) ilgili sütun NULL — bu her zaman geçerli bir
-- seçim, ücretsiz "yalın" görünüm.
CREATE TABLE IF NOT EXISTS user_avatars (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  hat_item_id TEXT REFERENCES shop_items(id),
  cape_item_id TEXT REFERENCES shop_items(id),
  outfit_item_id TEXT REFERENCES shop_items(id),
  pants_item_id TEXT REFERENCES shop_items(id),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vip_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price_crystal INTEGER NOT NULL,
  perks TEXT,                    -- JSON dizi: kısa ayrıcalık açıklamaları
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vip_subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  tier_id TEXT NOT NULL REFERENCES vip_tiers(id),
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

INSERT OR IGNORE INTO shop_items (id, category, name, description, currency, price, active, created_at) VALUES
  ('seed-frame-basic', 'frame', '[Örnek] Basit Çerçeve', 'Gerçek katalog gelene kadar akışı test etmek için yer tutucu.', 'coin', 500, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-frame-gold', 'frame', '[Örnek] Altın Çerçeve', 'Gerçek katalog gelene kadar akışı test etmek için yer tutucu.', 'crystal', 200, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-badge-star', 'badge', '[Örnek] Yıldız Rozeti', 'Gerçek katalog gelene kadar akışı test etmek için yer tutucu.', 'coin', 300, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-badge-diamond', 'badge', '[Örnek] Elmas Rozeti', 'Gerçek katalog gelene kadar akışı test etmek için yer tutucu.', 'crystal', 150, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-entrance-sparkle', 'entrance_effect', '[Örnek] Parıltı Girişi', 'Gerçek katalog gelene kadar akışı test etmek için yer tutucu.', 'crystal', 250, 1, '2026-01-01T00:00:00.000Z');

-- Karakter dolabı (Faz 9) — 4 temel slot (şapka/pelerin/kıyafet/pantolon),
-- her birinde 3 seçenek. id'ler görsel prompt kütüphanesindeki katman
-- adlarıyla birebir eşleşecek şekilde seçildi (bkz. "Avatar Atölyesi"
-- Artifact'ı) — gerçek PNG'ler hazır olunca AvatarRenderer'daki yerel
-- varlık haritasına bu id'lerle eklenecek, satırların kendisi değişmeyecek.
INSERT OR IGNORE INTO shop_items (id, category, name, description, currency, price, active, created_at) VALUES
  ('avatar_hat_star', 'avatar_hat', 'Yıldız Tacı', 'Ucunda küçük bir yıldız parıldayan sivri mistik şapka.', 'coin', 250, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_hat_crescent', 'avatar_hat', 'Hilal Başlık', 'Alnında hilal ay motifi olan yumuşak başlık.', 'coin', 250, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_hat_flowercrown', 'avatar_hat', 'Çiçek Tacı', 'Küçük mor çiçeklerden örülü hafif taç.', 'crystal', 90, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_cape_starry', 'avatar_cape', 'Yıldızlı Pelerin', 'İçi gece gökyüzü desenli, hafif dalgalanan pelerin.', 'coin', 350, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_cape_shadow', 'avatar_cape', 'Gölge Pelerini', 'Kenarları duman gibi dağılan koyu mor pelerin.', 'coin', 350, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_cape_royal', 'avatar_cape', 'Asil Pelerin', 'Altın işlemeli, kadife dokulu görkemli pelerin.', 'crystal', 120, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_outfit_mystic', 'avatar_outfit', 'Falcı Cübbesi', 'Ay ve yıldız işlemeli klasik mistik kaftan.', 'coin', 300, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_outfit_scholar', 'avatar_outfit', 'Bilge Kıyafeti', 'Sade, şık, kemerli bir kaftan.', 'coin', 300, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_outfit_festive', 'avatar_outfit', 'Şölen Kıyafeti', 'Rengarenk kurdele ve pullarla süslü bayramlık kıyafet.', 'crystal', 100, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_pants_night', 'avatar_pants', 'Gece Pantolonu', 'Koyu mor, yıldız tozu desenli rahat pantolon.', 'coin', 200, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_pants_forest', 'avatar_pants', 'Orman Pantolonu', 'Toprak tonlarında, günlük rahat pantolon.', 'coin', 200, 1, '2026-01-01T00:00:00.000Z'),
  ('avatar_pants_royal', 'avatar_pants', 'Asil Pantolon', 'Altın şeritli, gösterişli tören pantolonu.', 'crystal', 80, 1, '2026-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO vip_tiers (id, name, monthly_price_crystal, perks, sort_order, active, created_at) VALUES
  ('seed-vip-silver', '[Örnek] Gümüş', 300, '["Örnek ayrıcalık 1","Örnek ayrıcalık 2"]', 1, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-vip-gold', '[Örnek] Altın', 600, '["Örnek ayrıcalık 1","Örnek ayrıcalık 2","Örnek ayrıcalık 3"]', 2, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-vip-diamond', '[Örnek] Elmas', 1200, '["Örnek ayrıcalık 1","Örnek ayrıcalık 2","Örnek ayrıcalık 3","Örnek ayrıcalık 4"]', 3, 1, '2026-01-01T00:00:00.000Z');

-- Şikayet/moderasyon: kullanıcılar gönderi/yorum/profil şikayet edebilir.
-- Yeterli şikayeti biriken içerik otomatik olarak akıştan gizlenir (aşağıdaki
-- REPORT_HIDE_THRESHOLD); manuel inceleme şimdilik doğrudan D1 sorgusuyla
-- yapılıyor — ayrı bir admin panosu henüz yok.
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,   -- 'post' | 'comment' | 'user'
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS push_tokens (
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  platform TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, token)
);

-- Sesli/yazılı odalar (Faz 2). Bir odanın 10 koltuğu var; koltuktaki
-- katılımcılar hem LiveKit ses akışına hem oda yazılı sohbetine dahil.
-- Sınırsız "sadece dinleyici" modeli bilinçli olarak bu sürümde yok.
-- capacity/topic sütunları sonradan eklendi (var olan uzak veritabanında
-- ayrı bir ALTER TABLE ile); burada fresh-DB kurulumları için tanımlıdır.
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL REFERENCES users(id),
  capacity INTEGER NOT NULL DEFAULT 10,
  topic TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_seats (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  seat_index INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL,
  PRIMARY KEY (room_id, seat_index)
);
CREATE INDEX IF NOT EXISTS idx_room_seats_user ON room_seats(user_id);

-- Odayı açık tutan (ekranda görüntüleyen) ama koltuğa oturmamış kullanıcılar
-- — "sadece dinleyici" listesi. Gerçek zamanlı bir bağlantı yok, istemci
-- düzenli aralıklarla POST ile "hâlâ buradayım" bildiriyor (heartbeat);
-- ROOM_VIEWER_TIMEOUT_SECONDS'tan eski kayıtlar sorgudan otomatik düşüyor.
CREATE TABLE IF NOT EXISTS room_viewers (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id, created_at);

-- Host moderasyonu: yasaklanan kullanıcı koltuğa oturamaz, mesaj atamaz;
-- susturulan kullanıcı yalnızca oda yazılı sohbetine mesaj atamaz (ses
-- tarafında LiveKit admin API entegrasyonu henüz yok).
CREATE TABLE IF NOT EXISTS room_bans (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  banned_at TEXT NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_mutes (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  muted_at TEXT NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id),
  recipient_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, sender_id, created_at);

-- Rehber olma: kullanıcı başvurur, onay şimdilik doğrudan D1 sorgusuyla
-- yapılıyor (ayrı bir admin panosu yok — bkz. README "Rehber başvuruları").
-- En son başvurusunun durumu kullanıcının güncel rehber durumu sayılır.
CREATE TABLE IF NOT EXISTS guide_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  decided_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_guide_applications_user ON guide_applications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_guide_applications_status ON guide_applications(status);

-- Başarımlar (Faz 6). Her tanım kademeli eşiklerle geliyor (tiers JSON);
-- kullanıcı bir eşiği geçince user_achievements'a satır düşer. Şu an sadece
-- sunucu tarafında hesaplanabilen "Sosyallik" kategorisi dolu — Fal/Oyun/
-- Popülerlik kategorileri ilgili sistemler (yerel fal geçmişi, oyunlar,
-- popülerlik listesi) bağlanınca eklenecek.
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tiers TEXT NOT NULL,     -- JSON: [{"tier":1,"threshold":10,"label":"10"}, ...]
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
  tier INTEGER NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, achievement_id, tier)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

INSERT OR IGNORE INTO achievement_definitions (id, category, name, description, tiers, created_at) VALUES
  ('social_first_follow', 'social', 'İlk Arkadaş', 'İlk kez birini takip et.', '[{"tier":1,"threshold":1,"label":"İlk takip"}]', '2026-01-01T00:00:00.000Z'),
  ('social_first_post', 'social', 'İlk Gönderi', 'Keşfet''te ilk gönderini paylaş.', '[{"tier":1,"threshold":1,"label":"İlk gönderi"}]', '2026-01-01T00:00:00.000Z'),
  ('social_followers', 'social', 'Popüler Profil', 'Takipçi sayın arttıkça yeni kademeler açılır.', '[{"tier":1,"threshold":10,"label":"10"},{"tier":2,"threshold":50,"label":"50"},{"tier":3,"threshold":100,"label":"100"},{"tier":4,"threshold":500,"label":"500"},{"tier":5,"threshold":1000,"label":"1000"},{"tier":6,"threshold":5000,"label":"5000"}]', '2026-01-01T00:00:00.000Z'),
  ('popularity_weekly_star', 'popularity', 'Haftalık Yıldız', 'Hafta sonunda harcama liderliğinde ilk 10''a girdin.', '[{"tier":1,"threshold":1,"label":"İlk 10"}]', '2026-01-01T00:00:00.000Z'),
  ('popularity_legend', 'popularity', 'Efsane', 'Toplamda 1 milyon popülerlik puanına ulaştın.', '[{"tier":1,"threshold":1000000,"label":"1M"}]', '2026-01-01T00:00:00.000Z');

-- Kader Bahçesi (Faz 5, ilk mekanik denemesi). Tohum kataloğu yer tutucu
-- ([Örnek] önekli) — çalışma mekanizmasını test etmek için, gerçek görsel/
-- isimler hazır olunca değişecek. Büyüme/hasat süresi ve verimi gerçek ay
-- evresine göre hafifçe değişiyor (yeni ayda ekim daha hızlı büyür, dolunayda
-- hasat daha verimli) — moon_illumination() sunucu tarafında hesaplıyor.
CREATE TABLE IF NOT EXISTS garden_seed_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,       -- 'coin' | 'crystal'
  price INTEGER NOT NULL,
  grow_minutes INTEGER NOT NULL,
  yield_coin INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS garden_plots (
  user_id TEXT NOT NULL REFERENCES users(id),
  slot_index INTEGER NOT NULL,
  seed_type_id TEXT REFERENCES garden_seed_types(id),
  planted_at TEXT,
  ready_at TEXT,
  PRIMARY KEY (user_id, slot_index)
);

-- Kader Kasabası içindeki hyper-casual oyunların (Keşif Salonu vb.) en iyi
-- skorları. game_key jenerik tutuldu (örn. 'kesif_salonu') — ileride eklenecek
-- 5-6 farklı oyun aynı tabloyu paylaşabilsin diye. Sadece final sonuç
-- yazılıyor (her vuruşta değil) — D1 yazma kotasını korumak için.
CREATE TABLE IF NOT EXISTS game_scores (
  user_id TEXT NOT NULL REFERENCES users(id),
  game_key TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, game_key)
);

INSERT OR IGNORE INTO garden_seed_types (id, name, currency, price, grow_minutes, yield_coin, active, created_at) VALUES
  ('seed-mystic-basic', '[Örnek] Basit Tohum', 'coin', 50, 30, 80, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-mystic-silver', '[Örnek] Gümüş Tohum', 'coin', 150, 120, 260, 1, '2026-01-01T00:00:00.000Z'),
  ('seed-mystic-crystal', '[Örnek] Kristal Tohum', 'crystal', 20, 240, 500, 1, '2026-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO achievement_definitions (id, category, name, description, tiers, created_at) VALUES
  ('game_harvests', 'game', 'Bahçıvan', 'Kader Bahçesinde toplam hasat sayın.', '[{"tier":1,"threshold":1,"label":"1"},{"tier":2,"threshold":10,"label":"10"},{"tier":3,"threshold":50,"label":"50"},{"tier":4,"threshold":200,"label":"200"}]', '2026-01-01T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
