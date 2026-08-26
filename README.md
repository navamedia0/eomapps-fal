# Mistik Rehber

Google Play oncelikli, iOS uyumlu Expo/React Native altyapisi. Ilk asamada ekranlar yerine servis ve hesaplama katmani bulunur.

## Kurulum

1. Node.js LTS kurun.
2. Proje klasorunde `npm install` calistirin.
3. `.env.example` dosyasini `.env` olarak kopyalayin ve Gemini/Groq anahtarlarini ekleyin.
4. `npm run typecheck` ile TypeScript kontrolu, `npm start` ile Expo gelistirme sunucusu baslatin.

Expo istemci kodundaki `EXPO_PUBLIC_*` anahtarlari uygulama paketinde gorunebilir. Gercek bir urunde Gemini ve Groq cagrisini kimlik dogrulamali bir backend proxy arkasina tasiyin; mobil uygulamaya kalici API anahtari koymayin.

## Klasorler

- `src/services`: AI istemcileri, tarot cekimi, astronomi, numeroloji, kredi ve gecmis fal servisi
- `src/prompts`: Turkce AI system prompt sablonlari
- `src/constants`: model, endpoint ve cihaz saklama anahtarlari
- `src/config`: ortam degiskenleri

`calculateAstroSnapshot` temel astronomik konum verisini saglar. Dogum haritasi evleri, ay burcu ve gezegen acilari icin sonraki adimda ayni servis sinirina gezegen/ev hesaplari eklenebilir. Konum aramasi icin geocoding servisi de bu katmanda tutulmalidir.