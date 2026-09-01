import type { ImageSourcePropType } from 'react-native';

export type FortuneSignatureItem = {
  key: string;
  title: string;
  subtitle: string;
  tags: string[];
  accent: string;
  badgeText?: string;
  badgeColor?: string;
  ctaText?: string;
  imageSource: ImageSourcePropType;
  actionType: 'tarot_modal' | 'rune_modal' | 'navigation';
  route?: string;
  params?: any;
  category: 'fallar' | 'astroloji' | 'psikoloji' | 'ruya' | 'sayilar' | 'huzur';
};

// Türkiye'deki gerçek popülerlik ve bilinirlik sırasına göre dizilmiş kadim fallar:
// 1. Kahve Falı (Açık ara Türkiye'nin 1 numaralı geleneksel falı)
// 2. Tarot Falı (En popüler evrensel kart falı)
// 3. Katina Aşk Falı (Türkiye'de en çok tercih edilen aşk destesi)
// 4. El Falı (Kiromansi / Avuç içi çizgileri)
// 5. İskambil Falı (52 kart klasik saray falı)
// 6. Su Falı (Durugörü / Kozmik su aynası)
// 7. Yüz Falı (Fizyonomi & karakter haritası)
// 8. Melek Kartları (Günün mesajı & rehberlik)
// 9. Balmumu Falı (Ateş ve eriyen mum kehaneti)
// 10. 41 Bakla Falı (Anadolu geleneksel remil falı)
// 11. Petit Lenormand (36 kart net kehanet)
// 12. Nordik Rün Falı (24 Elder Futhark taşı)
// 13. Çin I Ching (3 kutsal sikke & 64 heksagram)
// 14. Osho Zen (Farkındalık & iç huzur kartları)
// 15. Mısır Thoth (Hermetik simya kartları)
// 16. Sesli Falcı (Canlı sesli danışman)
export const ALL_SIGNATURE_FORTUNES: FortuneSignatureItem[] = [
  // 1. Kahve Falı
  {
    key: 'coffee',
    title: 'Kahve Falı',
    subtitle: 'Fincandaki telve sembollerinin kadim yorumu & sır kapıları',
    tags: ['Kahve', 'Fotoğraflı', 'Telve', 'Kısmet', 'Geleneksel'],
    accent: '#D97706',
    badgeText: '🔥 En Popüler',
    badgeColor: '#D97706',
    ctaText: 'Fincanını Çek & Falına Bak →',
    imageSource: require('@/assets/ekoller/ekol_bg_2_osmanli.jpg'),
    actionType: 'navigation',
    route: 'ImageReading',
    params: { kind: 'coffee' },
    category: 'fallar',
  },

  // 2. Tarot Falı (Özel 3 Modlu Modal Açılır)
  {
    key: 'tarot',
    title: 'Tarot Falı',
    subtitle: '78 Kadim Arkana · 3 Farklı Açılım ve Kehanet Modu',
    tags: ['Tarot', '78 Kart', 'Kader & Aşk', 'Klasik'],
    accent: '#F59E0B',
    badgeText: '⭐ Çok Sevilen',
    badgeColor: '#F59E0B',
    ctaText: 'Açılım Modunu Seç →',
    imageSource: require('@/assets/backgrounds/decks/tarot_bg.jpg'),
    actionType: 'tarot_modal',
    category: 'fallar',
  },

  // 3. Katina Aşk Falı
  {
    key: 'katina',
    title: 'Katina Aşk Falı',
    subtitle: '65 Mistik Kart · Helenik Tutku, Ruh Eşi & Gizli Hisler',
    tags: ['Katina', 'Aşk Falı', '65 Kart', 'Ruh Eşi'],
    accent: '#E11D48',
    badgeText: '🌹 Aşk & İlişki',
    badgeColor: '#E11D48',
    ctaText: 'Masaya Geç & Fal Bak →',
    imageSource: require('@/assets/backgrounds/decks/katina_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'katina' },
    category: 'fallar',
  },

  // 4. El Falı
  {
    key: 'palm',
    title: 'El Falı',
    subtitle: 'Avuç içindeki yaşam, kalp ve akıl çizgilerinin kadersel haritası',
    tags: ['El Falı', 'Kiromansi', 'Yaşam Çizgisi', 'Fotoğraflı'],
    accent: '#EC4899',
    badgeText: '✋ Çizgi Analizi',
    badgeColor: '#EC4899',
    ctaText: 'Elini Tara & Falına Bak →',
    imageSource: require('@/assets/ekoller/ekol_bg_4_bati_ezoterik.jpg'),
    actionType: 'navigation',
    route: 'ImageReading',
    params: { kind: 'palm' },
    category: 'fallar',
  },

  // 5. İskambil Saray Falı
  {
    key: 'iskambil',
    title: 'İskambil Falı',
    subtitle: '52 Klasik Kart · Kupa, Karo, Sinek & Maça Hanedanı',
    tags: ['İskambil', '52 Kart', 'Saray Falı', 'Kısmet'],
    accent: '#E11D48',
    badgeText: '👑 52 Kart',
    badgeColor: '#E11D48',
    ctaText: 'İskambil Masasına Geç →',
    imageSource: require('@/assets/backgrounds/decks/iskambil_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'iskambil' },
    category: 'fallar',
  },

  // 6. Su Falı
  {
    key: 'sufal',
    title: 'Su Falı',
    subtitle: 'Kozmik su aynasında beliren durugörü vizyonları ve sırlar',
    tags: ['Su Falı', 'Durugörü', 'Mistik', 'Vizyon'],
    accent: '#38BDF8',
    badgeText: '💧 Durugörü',
    badgeColor: '#38BDF8',
    ctaText: 'Suya Bak & Kehaneti Gör →',
    imageSource: require('@/assets/ekoller/ekol_bg_6_klasik.jpg'),
    actionType: 'navigation',
    route: 'SuFal',
    category: 'fallar',
  },

  // 7. Yüz Falı
  {
    key: 'face',
    title: 'Yüz Falı',
    subtitle: 'Yüz hatlarındaki mikro geometriler ve karakter şifresi',
    tags: ['Yüz Falı', 'Fizyonomi', 'Karakter', 'Fotoğraflı'],
    accent: '#8B5CF6',
    badgeText: '👤 Yüz Analizi',
    badgeColor: '#8B5CF6',
    ctaText: 'Yüzünü Tara & Keşfet →',
    imageSource: require('@/assets/ekoller/ekol_bg_1_cin.jpg'),
    actionType: 'navigation',
    route: 'ImageReading',
    params: { kind: 'face' },
    category: 'fallar',
  },

  // 8. Melek Kartları
  {
    key: 'angel',
    title: 'Melek Kartları',
    subtitle: '44 Işık Kartı · İlahi Koruma, Şifa, Huzur & Günün Mesajı',
    tags: ['Melek', 'Melek Kartları', 'Şifa', 'Işık'],
    accent: '#C084FC',
    badgeText: '🪽 44 Işık Kartı',
    badgeColor: '#C084FC',
    ctaText: 'Melek Kartını Çek →',
    imageSource: require('@/assets/backgrounds/decks/angel_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'angel' },
    category: 'fallar',
  },

  // 9. Balmumu Falı
  {
    key: 'wax',
    title: 'Balmumu Falı',
    subtitle: 'Eriyen mum damlalarının suya bıraktığı gizemli şekiller',
    tags: ['Balmumu', 'Ateş Falı', 'Eriyen Mum', 'Kısmet'],
    accent: '#F97316',
    badgeText: '🕯️ Mum Şekilleri',
    badgeColor: '#F97316',
    ctaText: 'Mumu Damlat & Yorumla →',
    imageSource: require('@/assets/ekoller/ekol_bg_2_osmanli.jpg'),
    actionType: 'navigation',
    route: 'WaxReading',
    category: 'fallar',
  },

  // 10. 41 Bakla Falı
  {
    key: 'bakla',
    title: '41 Bakla Falı',
    subtitle: '3 ocak remil açılımı ve 41 ak baklanın kadersel kümelenmesi',
    tags: ['Bakla Falı', '41 Bakla', 'Remil', 'Geleneksel'],
    accent: '#10B981',
    badgeText: '🌾 3 Ocak Remil',
    badgeColor: '#10B981',
    ctaText: 'Baklaları Dağıt & Oku →',
    imageSource: require('@/assets/ekoller/osmanli_reading_card.jpg'),
    actionType: 'navigation',
    route: 'BaklaReading',
    category: 'fallar',
  },

  // 11. Petit Lenormand
  {
    key: 'lenormand',
    title: 'Lenormand Falı',
    subtitle: '36 Somut Kart · Günlük Olaylar, Haberler & Net Cevaplar',
    tags: ['Lenormand', 'Net Kehanet', '36 Kart', 'Gelecek'],
    accent: '#06B6D4',
    badgeText: '✨ 36 Kart',
    badgeColor: '#06B6D4',
    ctaText: 'Masaya Geç & Fal Bak →',
    imageSource: require('@/assets/backgrounds/decks/lenormand_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'lenormand' },
    category: 'fallar',
  },

  // 12. Nordik Runik Taşlar & Kehanet
  {
    key: 'rune',
    title: 'Rün Falı',
    subtitle: '24 Kadim Elder Futhark Taşı · Keseden Dökülsün & Rün Masası',
    tags: ['Rün', 'Nordik', '24 Taş', 'Viking'],
    accent: '#38BDF8',
    badgeText: 'ᚱ 24 Taş',
    badgeColor: '#38BDF8',
    ctaText: 'Rün Modunu Seç & Fal Bak →',
    imageSource: require('@/assets/backgrounds/decks/rune_bg.jpg'),
    actionType: 'rune_modal',
    category: 'fallar',
  },

  // 13. Çin I Ching
  {
    key: 'iching',
    title: 'I Ching Falı',
    subtitle: '3 kutsal sikke atımı ile 64 heksagram kozmik dengesi',
    tags: ['I Ching', 'Çin Falı', '64 Heksagram', 'Sikke Atımı'],
    accent: '#EF4444',
    badgeText: '☯️ 64 Heksagram',
    badgeColor: '#EF4444',
    ctaText: 'Sikkeleri At & Aç →',
    imageSource: require('@/assets/ekoller/iching_screen_bg.jpg'),
    actionType: 'navigation',
    route: 'IChingReading',
    category: 'fallar',
  },

  // 14. Osho Zen Bilgelik
  {
    key: 'osho_zen',
    title: 'Osho Zen Falı',
    subtitle: 'Gelecek kaygısını bırakıp şimdi ve burada olmanın dinginliği',
    tags: ['Osho Zen', 'Zen Kartları', 'İç Huzur', 'Farkındalık'],
    accent: '#14B8A6',
    badgeText: '🌸 Zen Bilgeliği',
    badgeColor: '#14B8A6',
    ctaText: 'Masaya Geç & İncele →',
    imageSource: require('@/assets/backgrounds/decks/osho_zen_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'osho_zen' },
    category: 'fallar',
  },

  // 15. Hermetik Mısır Thoth
  {
    key: 'thoth',
    title: 'Mısır Thoth Falı',
    subtitle: 'Mısır panteonu, kutsal geometri ve ezoterik simya rehberi',
    tags: ['Thoth', 'Mısır Falı', 'Hermetik', 'Simya'],
    accent: '#EAB308',
    badgeText: '📜 Mısır Simyası',
    badgeColor: '#EAB308',
    ctaText: 'Masaya Geç & İncele →',
    imageSource: require('@/assets/backgrounds/decks/thoth_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'thoth' },
    category: 'fallar',
  },

  // 16. Sesli Mistik Falcı
  {
    key: 'voiceReading',
    title: 'Sesli Falcı',
    subtitle: 'Mikrofona hislerini ve sorunu anlat, sesli canlı rehberlik al',
    tags: ['Sesli Fal', 'Canlı Falcı', 'Sesli Sohbet', 'Danışman'],
    accent: '#F43F5E',
    badgeText: '🎙️ Canlı Sesli',
    badgeColor: '#F43F5E',
    ctaText: 'Sesli Danışmana Başla →',
    imageSource: require('@/assets/ekoller/ekol_bg_5_ruya.jpg'),
    actionType: 'navigation',
    route: 'VoiceReading',
    category: 'fallar',
  },
];
