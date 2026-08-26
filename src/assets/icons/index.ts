import type { ImageSourcePropType } from 'react-native';

// "Cosmic Indigo" feature icons — self-contained square badge art (own
// rounded frame + glow border baked in), sourced by the user. Keys match the
// `key`/`iconKey` used on the corresponding HomeScreen/KesfetScreen/
// MagazaScreen/ProfilScreen item.
export const FEATURE_ICONS: Partial<Record<string, ImageSourcePropType>> = {
  palm: require('./el_fali.png'),
  moonCalendar: require('./ay_takvimi.png'),
  notificationSettings: require('./bildirim_ayarlari.png'),
  biorhythm: require('./biyoritim.png'),
  zodiacTraits: require('./burc_ozellikleri.png'),
  compatibility: require('./burc_uyumu.png'),
  coinShop: require('./coin_magazasi.png'),
  tarotSpread: require('./detayli_tarot_acilimlari.png'),
  birthChart: require('./dogum_haritasi.png'),
  moodJournal: require('./duygu_gunlugu.png'),
  tasks: require('./gorevler.png'),
  horoscope: require('./gunluk_burc.png'),
  affirmation: require('./gunluk_olumlama.png'),
  angelCard: require('./gunun_ilham_karti.png'),
  coffee: require('./kahve_fali.png'),
  cardDesigns: require('./kart_tasarimlari.png'),
  katina: require('./katina_fali.png'),
  profileChat: require('./kendinden_bahset.png'),
  breathing: require('./nefes_egzersizi.png'),
  numerology: require('./numeroloji.png'),
  daisy: require('./papatya_fali.png'),
  premium: require('./premium.png'),
  dream: require('./ruya_yorumlama.png'),
  voiceReading: require('./sesli_fal.png'),
  magicBall: require('./sihirli_kure.png'),
  solitaire: require('./solitaire_fali.png'),
  tarot: require('./tarot_fali.png'),
  risingSign: require('./yukselen_burcum.png'),
  dice: require('./zar_fali.png'),
  dreamLibrary: require('./ruya_kitapligi.png'),

  // Profil / Mağaza / Coin — previously plain Ionicons, now custom art.
  favorites: require('./favorilerim.png'),
  history: require('./gecmis.png'),
  coinIcon: require('./coin_ikonu.png'),
  freeCoins: require('./ucretsiz_coin_kazan.png'),
  miniGames: require('./mini_oyunlar.png'),

  // Bilgi Köşesi rozetleri — sadece burç ve iskambil/kart konuları için
  // özel rozet var; diğer konular (tarot/kahve/katina/astroloji) fallback
  // Ionicons ile kalıyor.
  burclarBadge: require('./burclar_rozeti.png'),
  kartlarBadge: require('./kartlar_rozeti.png'),

  // suFal: bu özellik için yeni tema ikonu tasarlanmadı, fallback Ionicons kalıyor.
};
