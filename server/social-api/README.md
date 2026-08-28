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

## 4. Uygulama gizli anahtarı (opsiyonel ama önerilir)

`ai-proxy`'deki gibi, isteklerin gerçekten kendi uygulamanızdan geldiğini doğrulamak için:

```bash
npm run secret:app
```

Bunu ayarlarsanız, mobil uygulama her istekte `X-App-Secret` header'ını göndermeli (ai-proxy ile aynı desen).

## 5. Deploy

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

## Sırada ne var

Bu backend hazır olduğunda, mobil tarafta:
- `expo-apple-authentication` (Apple giriş butonu)
- Google girişi için `expo-auth-session`

paketlerini ekleyip bir giriş ekranı kuracağız — Google/Apple client ID'lerini (adım 2-3) oluşturduğunuzda haber verin, o ekranı birlikte bağlayalım.
