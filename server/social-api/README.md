# Mistik Rehber Social API

Hesap sistemi (Google/Apple girişi), takip ve engelleme için Cloudflare Worker + D1 backend'i.

## 1. D1 veritabanını oluştur

```bash
cd server/social-api
npm install
npm run db:create
```

Çıktıda görünen `database_id`'yi `wrangler.toml` içindeki `REPLACE_AFTER_WRANGLER_D1_CREATE` yerine yapıştırın. Sonra şemayı uygulayın:

```bash
npm run db:migrate          # yerel (wrangler dev için)
npm run db:migrate:remote   # gerçek/canlı veritabanı
```

## 2. Google girişi için gereken kurulum (siz yapmanız gerekiyor)

1. [Google Cloud Console](https://console.cloud.google.com/) → yeni bir proje oluşturun (örn. "Mistik Rehber").
2. **APIs & Services → OAuth consent screen** → "External" seçip uygulama adı/logo gibi temel bilgileri doldurun.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**. Expo/React Native için genelde **3 ayrı client ID** gerekir:
   - **Web application** (Expo'nun kimlik doğrulama akışı arka planda bunu kullanır)
   - **iOS** (bundle identifier'ınızla, örn. `com.mistikrehber.app`)
   - **Android** (package name + SHA-1 imza parmak iziyle)
4. Web client ID'yi kopyalayıp sunucuya tanımlayın:
   ```bash
   npm run secret:google
   # istendiğinde Web client ID'yi yapıştırın
   ```

## 3. Apple girişi için gereken kurulum (siz yapmanız gerekiyor)

1. [Apple Developer](https://developer.apple.com/account) hesabınızda **Certificates, Identifiers & Profiles → Identifiers** → uygulamanızın App ID'sinde **"Sign In with Apple"** özelliğini aktif edin.
2. Aynı yerden bir **Services ID** oluşturun (bu, sunucu tarafında token doğrulaması için kullanılacak `audience` değeri — genelde bundle identifier'ınızla aynı ya da ona yakın bir string).
3. Services ID'yi sunucuya tanımlayın:
   ```bash
   npm run secret:apple
   # istendiğinde Services ID'yi yapıştırın
   ```

> Not: Apple, kullanıcı bilgisini (e-posta/isim) **yalnızca ilk yetkilendirmede** gönderir. Bu yüzden client tarafı bu bilgiyi ilk seferde yakalayıp `/auth/apple` isteğine eklemeli — worker kodu (`src/index.js`) bunu zaten bekliyor.

## 4. Keşfet gönderi görselleri için R2 bucket'ı oluştur

```bash
npm run r2:create
```

`wrangler.toml` içindeki `IMAGES` binding'i bu bucket'a işaret ediyor. Bucket oluşturulmadan `wrangler deploy` başarısız olur.

## 5. Uygulama gizli anahtarı (opsiyonel ama önerilir)

`ai-proxy`'deki gibi, isteklerin gerçekten kendi uygulamanızdan geldiğini doğrulamak için:

```bash
npm run secret:app
```

Bunu ayarlarsanız, mobil uygulama her istekte `X-App-Secret` header'ını göndermeli (ai-proxy ile aynı desen).

## 6. Deploy

```bash
npm run deploy
```

## Uçlar (endpoints)

| Yöntem | Yol | Açıklama |
|---|---|---|
| POST | `/auth/google` | `{ idToken }` → `{ token, user }` |
| POST | `/auth/apple` | `{ identityToken, email?, fullName? }` → `{ token, user }` |
| GET | `/me` | `Authorization: Bearer <token>` → `{ user }` |
| POST/DELETE | `/follow/:userId` | Takip et / takipten çık |
| POST/DELETE | `/block/:userId` | Engelle / engeli kaldır (engellemek karşılıklı takibi de siler) |
| GET | `/users/:userId` | Herkese açık profil + takipçi/takip sayıları |
| GET | `/blocks` | Kendi engellediğin kullanıcıların listesi (giriş gerekli) |
| GET | `/conversations` | Sohbet listesi: son mesaj + okunmamış sayısı, kişi başına |
| GET | `/messages/:userId` | Bir kullanıcıyla mesaj geçmişi (son 100) — açılınca okundu olarak işaretlenir |
| POST | `/messages/:userId` | `{ text }` → mesaj gönderir, karşı tarafa push bildirimi yollar |
| GET | `/rooms` | Aktif odaların listesi (isim, koltuk doluluğu) |
| POST | `/rooms` | `{ name }` → oda oluşturur, kurucuyu 0. koltuğa oturtur |
| GET | `/rooms/:id` | Oda detayı: 10 koltukluk dizi + koltuksuz dinleyiciler listesi |
| POST | `/rooms/:id/viewers` | Dinleyici olarak varlığını bildirir (heartbeat, ~45sn geçerli) |
| DELETE | `/rooms/:id/viewers` | Dinleyici listesinden çıkar |
| POST | `/rooms/:id/seats/:index` | Belirtilen koltuğa otur (0-9) |
| DELETE | `/rooms/:id/seat` | Koltuktan kalk — son kişi kalkınca oda silinir |
| GET | `/rooms/:id/messages` | Odanın yazılı sohbet geçmişi |
| POST | `/rooms/:id/messages` | `{ text }` → oda sohbetine yaz (koltukta oturmalısın) |
| POST | `/rooms/:id/token` | LiveKit erişim token'ı üretir (koltukta oturmalısın) → `{ token }` |
| POST | `/guide-applications` | `{ message }` → rehberlik başvurusu yapar |
| GET | `/guide-applications/me` | Kendi son başvurunun durumu → `{ application }` (`null` olabilir) |
| GET | `/guides` | Onaylanmış rehberlerin listesi (herkese açık) |
| GET | `/posts` | Son 50 gönderi (engellenen kullanıcılar hariç, girişsiz de çalışır) |
| POST | `/posts` | `multipart/form-data`: `text`, `image?` → `{ post }` (giriş gerekli) |
| DELETE | `/posts/:id` | Kendi gönderini sil (görsel varsa R2'den de silinir) |
| POST | `/posts/:id/like` | Beğeniyi aç/kapat → `{ liked, likeCount }` |
| GET | `/images/:key` | Gönderi görseli (R2'den, app secret gerektirmez) |
| GET | `/posts/:id/comments` | Bir gönderinin yorumları (girişsiz de çalışır) |
| POST | `/posts/:id/comments` | `{ text }` → `{ comment }` (giriş gerekli) |
| DELETE | `/comments/:id` | Kendi yorumunu sil |
| GET | `/wallet` | Sosyal ekonomi cüzdanı: `{ balances: { coin, crystal }, entries }` (giriş gerekli) |
| GET | `/shop/items` | Mağaza kataloğu (`?category=frame\|badge\|entrance_effect` opsiyonel) |
| POST | `/shop/items/:id/purchase` | Ürünü satın alır (bakiye/cüzdandan düşer) |
| GET | `/shop/inventory` | Sahip olunan ürünler |
| GET | `/vip/tiers` | VIP kademeleri (herkese açık) |
| POST | `/vip/tiers/:id/subscribe` | Kademeye abone olur (kristal düşer, 30 gün) |
| GET | `/vip/me` | Güncel VIP aboneliği → `{ subscription }` (`null` olabilir) |
| GET | `/achievements` | Kendi başarımların: tanımlar + açılan kademeler + ilerleme |
| GET | `/popularity/leaderboard` | Bu haftanın harcama liderlik tablosu (herkese açık) |
| GET | `/garden/seeds` | Tohum kataloğu (herkese açık) |
| GET | `/garden` | Kendi bahçen: 6 arsa + o anki ay evresi bilgisi |
| POST | `/garden/plant` | `{ slotIndex, seedTypeId }` → eker (bakiyeden düşer) |
| POST | `/garden/harvest` | `{ slotIndex }` → hazırsa hasat eder, coin kazandırır |
| POST | `/push-token` | `{ token, platform? }` → cihazın Expo push tokenını kaydeder |
| DELETE | `/push-token` | `{ token }` → çıkış yapılan cihazın tokenını siler |
| POST | `/reports` | `{ targetType: 'post'\|'comment'\|'user', targetId, reason }` → şikayet kaydeder |

## Sesli/yazılı odalar (LiveKit)

`rooms` + `room_seats` (10 koltuk) + `room_messages` tabloları D1'de. Gerçek ses akışı LiveKit Cloud üzerinden — `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` worker secret olarak tanımlı (`wrangler secret put` ile), `createLiveKitToken()` bu ikisiyle erişim JWT'si üretiyor (LiveKit'in resmi Node SDK'sı Workers'ta çalışmadığı için `jose` ile elle imzalanıyor). Bilinen sınır: bir koltuk sahipliği, bağlantı LiveKit tarafında düşse bile D1'de otomatik boşalmıyor (`DELETE /rooms/:id/seat` çağrılmadıkça) — ileride LiveKit webhook'larıyla senkronize edilebilir.

## Mağaza (Faz 4)

Şema + satın alma/envanter/VIP mekaniği hazır, canlı — ama katalog içeriği (`[Örnek]` önekli satırlar) sadece akışı test etmek için, gerçek değil. Gerçek çerçeve/rozet/efekt kataloğu (isim, görsel, fiyat) ayrı bir araştırma belgesini bekliyor; o belge hazır olunca `shop_items`/`vip_tiers` tablolarına gerçek satırlar eklenip `[Örnek]` satırları silinecek (`DELETE FROM shop_items WHERE id LIKE 'seed-%'` vb.). Yeni ürün eklemek için:

```bash
wrangler d1 execute mistik-rehber-social --remote --command "INSERT INTO shop_items (id, category, name, description, currency, price, active, created_at) VALUES ('<id>', 'frame', '<isim>', '<açıklama>', 'coin', 500, 1, datetime('now'))"
```

Not: `coin` aktiviteyle kazanılan, `crystal` gerçek parayla alınan premium birim olarak tasarlandı, ama şu an hiçbir özellik bu bakiyelere kazanç yazmıyor (IAP/kazanma akışı ayrı bir sonraki adım) — bu yüzden satın alma/abonelik uçları bugün için herkeste "yetersiz bakiye" ile başarısız olur, bu beklenen bir durum.

## Haftalık popülerlik (Faz 7)

Ayrı bir "popülerlik puanı" ledger'ı yok — puan, `ledger_entries`'teki harcamalardan (negatif tutarlar) canlı hesaplanıyor, bu yüzden ayrı bir "sıfırlama" işlemine gerek yok: `GET /popularity/leaderboard` her zaman o anki haftanın (Pazartesi 00:00 UTC başlangıçlı) toplamını döner. Her Pazartesi çalışan zamanlanmış görev (`grantWeeklyPopularityAwards`, aynı cron içinde `purgeExpiredPosts` ile birlikte) biten haftanın ilk 10'una "Haftalık Yıldız" başarımını veriyor; "Efsane" başarımı (toplam 1M harcama) her harcamada (`debitWallet` içinde) otomatik kontrol ediliyor.

Hediye sistemine (Faz 8) bağlı `pop-guard` (kendi kendine gönderip puan şişirme koruması) bilinçli olarak henüz yapılmadı — hediye mekaniği yokken önlenecek somut bir istismar yolu da yok; hediye sistemi yazılınca ele alınacak.

## Kader Bahçesi (Faz 5, ilk deneme)

Tohum kataloğu (`garden_seed_types`) [Örnek] önekli yer tutucu içerik — mekanizmayı test etmek için, gerçek isim/görsel/fiyat ayrı belgeyi bekliyor (roadmap'teki `farm-concept`). Büyüme süresi ve hasat verimi gerçek ay evresine göre hafifçe değişiyor: `moonIllumination()` bağımsız bir sinodik-ay yaklaşık hesabı (uygulamanın `astronomy-engine` kullanan Ay Takvimi kadar hassas değil ama küçük bir oyun bonusu için yeterli, worker'a yeni bağımlılık eklemiyor). Yeni ayda ekim daha hızlı büyür, dolunayda hasat daha fazla coin verir. Her hasat "Bahçıvan" başarımını (Faz 6, `game` kategorisi) ilerletir.

## Başarımlar (Faz 6)

`achievement_definitions` (kademeli eşikler, JSON) + `user_achievements` (açılan kademeler) hazır; `checkAndGrantAchievement()` (`src/index.js`) genel amaçlı yardımcı fonksiyon — bir olay gerçekleştiğinde (takip, gönderi vb.) güncel değeri geçirip çağırıyorsunuz, eşik aşıldıysa otomatik açıp push bildirimi yolluyor. Şu an sadece "Sosyallik" kategorisi dolu (İlk Arkadaş, İlk Gönderi, Popüler Profil — takipçi kademeleri) çünkü diğer kategoriler (Fal/İçerik, Oyun, Popülerlik) henüz var olmayan sistemlere bağlı. Yeni başarım eklemek için:

```bash
wrangler d1 execute mistik-rehber-social --remote --command "INSERT INTO achievement_definitions (id, category, name, description, tiers, created_at) VALUES ('<id>', '<kategori>', '<isim>', '<açıklama>', '[{\"tier\":1,\"threshold\":10,\"label\":\"10\"}]', datetime('now'))"
```

## Rehber başvuruları

Onay şimdilik ayrı bir admin panosu yerine doğrudan D1 sorgusuyla yapılıyor. Bekleyen başvuruları görmek için:

```bash
wrangler d1 execute mistik-rehber-social --remote --command "SELECT guide_applications.id, users.display_name, guide_applications.message, guide_applications.created_at FROM guide_applications JOIN users ON users.id = guide_applications.user_id WHERE guide_applications.status = 'pending' ORDER BY guide_applications.created_at ASC"
```

Bir başvuruyu onaylamak/reddetmek için (yukarıdaki listeden `id`'yi alıp yerine yazın):

```bash
wrangler d1 execute mistik-rehber-social --remote --command "UPDATE guide_applications SET status = 'approved', decided_at = datetime('now') WHERE id = '<application-id>'"
wrangler d1 execute mistik-rehber-social --remote --command "UPDATE guide_applications SET status = 'rejected', decided_at = datetime('now') WHERE id = '<application-id>'"
```

Reddedilen bir kullanıcı yeniden başvurabilir (yeni satır oluşur, en son başvuru geçerli sayılır).

## Moderasyon

`reports` tablosu gönderi/yorum/profil şikayetlerini tutuyor. `REPORT_HIDE_THRESHOLD` (şu an 3) farklı kullanıcı aynı içeriği şikayet ederse o içerik manuel inceleme beklenmeden Keşfet akışından/yorum listesinden otomatik gizlenir (satır silinmiyor, sadece sorgudan hariç tutuluyor). Manuel inceleme için ayrı bir admin panosu henüz yok — `wrangler d1 execute mistik-rehber-social --remote --command "SELECT * FROM reports ORDER BY created_at DESC"` ile doğrudan sorgulanabilir.

## Push bildirimleri

`push_tokens` tablosu + dahili `sendPushNotifications(env, userId, title, body, data)` yardımcı fonksiyonu (`src/index.js`) Expo'nun push API'sine (`exp.host/--/api/v2/push/send`) istek atar. Şu an sadece bir olay tetikliyor: birini takip etmek (`POST /follow/:userId`) o kişiye "Yeni takipçi" bildirimi gönderiyor. Hediye/mesaj/popülerlik gibi diğer olaylar kendi uçları yazıldığında aynı fonksiyonu çağıracak.

## Sosyal ekonomi cüzdanı

`wallets` + `ledger_entries` tabloları, hediye/popülerlik puanı/mağaza gibi hesaba bağlı yeni sosyal ekonomi özellikleri için hazırlanan ortak ledger. Uygulamanın mevcut fal kredisi/coin sistemi (cihaz-yerel, girişsiz) bilerek bunun dışında — ikisi ayrı sistemler. `creditWallet(env, userId, amount, reason)` (`src/index.js`) o özellikler yazıldığında kendi uçlarından çağıracakları dahili yardımcı fonksiyon; henüz hiçbir özellik bunu tetiklemiyor, bu yüzden `GET /wallet` şu an herkes için `balance: 0` döner.

## Gönderi ömrü

Keşfet kalıcı bir arşiv değil: gönderiler `POST_RETENTION_DAYS` (şu an 3 gün) sonunda feed'den düşer ve her gün 03:00 UTC'de çalışan zamanlanmış görev (`scheduled` handler, `wrangler.toml`'daki cron trigger) tarafından veritabanından ve R2'den tamamen silinir. Süreyi değiştirmek için `src/index.js` içindeki `POST_RETENTION_DAYS` sabitini güncelleyip yeniden deploy edin.

## Sırada ne var

Bu backend hazır olduğunda, mobil tarafta:
- `expo-apple-authentication` (Apple giriş butonu)
- Google girişi için `expo-auth-session`

paketlerini ekleyip bir giriş ekranı kuracağız — Google/Apple client ID'lerini (adım 2-3) oluşturduğunuzda haber verin, o ekranı birlikte bağlayalım.
