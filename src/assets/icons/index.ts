import type { ImageSourcePropType } from 'react-native';

// "Cosmic Indigo" feature icons — self-contained square badge art (own
// rounded frame + glow border baked in), sourced by the user. Keys match the
// `key`/`iconKey` used on the corresponding HomeScreen/KesfetScreen/
// MagazaScreen/ProfilScreen item.
export const FEATURE_ICONS: Partial<Record<string, ImageSourcePropType>> = {
  face: require('./yuz_fali.webp'),
  palm: require('./el_fali.webp'),
  moonCalendar: require('./ay_takvimi.webp'),
  notificationSettings: require('./bildirim_ayarlari.webp'),
  biorhythm: require('./biyoritim.webp'),
  zodiacTraits: require('./burc_ozellikleri.webp'),
  compatibility: require('./burc_uyumu.webp'),
  coinShop: require('./coin_magazasi.webp'),
  tarotSpread: require('./detayli_tarot_acilimlari.webp'),
  birthChart: require('./dogum_haritasi.webp'),
  moodJournal: require('./duygu_gunlugu.webp'),
  tasks: require('./gorevler.webp'),
  horoscope: require('./gunluk_burc.webp'),
  affirmation: require('./gunluk_olumlama.webp'),
  angelCard: require('./gunun_ilham_karti.webp'),
  coffee: require('./kahve_fali.webp'),
  cardDesigns: require('./kart_tasarimlari.webp'),
  katina: require('./katina_fali.webp'),
  profileChat: require('./kendinden_bahset.webp'),
  breathing: require('./nefes_egzersizi.webp'),
  numerology: require('./numeroloji.webp'),
  daisy: require('./papatya_fali.webp'),
  premium: require('./premium.webp'),
  dream: require('./ruya_yorumlama.webp'),
  voiceReading: require('./sesli_fal.webp'),
  magicBall: require('./sihirli_kure.webp'),
  solitaire: require('./solitaire_fali.webp'),
  tarot: require('./tarot_fali.webp'),
  risingSign: require('./yukselen_burcum.webp'),
  dice: require('./zar_fali.webp'),
  dreamLibrary: require('./ruya_kitapligi.webp'),

  // Profil / Mağaza / Coin — previously plain Ionicons, now custom art.
  favorites: require('./favorilerim.webp'),
  history: require('./gecmis.webp'),
  coinIcon: require('./coin_ikonu.png'),
  freeCoins: require('./ucretsiz_coin_kazan.webp'),
  miniGames: require('./mini_oyunlar.webp'),
  suFal: require('./su_fali.webp'),

  // Bilgi Köşesi rozetleri — sadece burç ve iskambil/kart konuları için
  // özel rozet var; diğer konular (tarot/kahve/katina/astroloji) fallback
  // Ionicons ile kalıyor.
  burclarBadge: require('./burclar_rozeti.webp'),
  kartlarBadge: require('./kartlar_rozeti.webp'),
};

// Alt navigasyon barı ikonları — "mistik gold mor" setinden, solid gold
// doldurma sayesinde küçük boyutta da önceki ince-çizgi versiyondan çok
// daha net okunuyor.
export const NAV_ICONS = {
  AnaSayfa: require('./ana_sayfa.webp'),
  Kesfet: require('./kesfet.webp'),
  BilgiKosesi: require('./bilgi_kosesi.webp'),
  Magaza: require('./magaza.webp'),
  Profil: require('./profil.webp'),
} as const satisfies Record<string, ImageSourcePropType>;
