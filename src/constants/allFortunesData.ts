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

export const ALL_SIGNATURE_FORTUNES: FortuneSignatureItem[] = [
  // 1. Tarot (Özel 3 Modlu Modal Açılır)
  {
    key: 'tarot',
    title: 'Klasik Rider-Waite Tarot',
    subtitle: '78 Kadim Arkana · 3 Farklı Açılım ve Kehanet Modu',
    tags: ['Evrensel', '78 Kart', 'Kader & Aşk', '3 Farklı Mod'],
    accent: '#F59E0B',
    badgeText: '🔥 En Çok Tercih Edilen',
    badgeColor: '#F59E0B',
    ctaText: 'Açılım Modunu Seç →',
    imageSource: require('@/assets/backgrounds/decks/tarot_bg.jpg'),
    actionType: 'tarot_modal',
    category: 'fallar',
  },

  // 2. Katina Aşk Destesi
  {
    key: 'katina',
    title: 'Katina Aşk & İlişki Destesi',
    subtitle: '65 Mistik Kart · Helenik Tutku, Ruh Eşi & Gizli Hisler',
    tags: ['Aşk Falı', '65 Kart', 'Ruh Eşi', 'Helenik Tutku'],
    accent: '#E11D48',
    badgeText: '🌹 Aşk & Uyum',
    badgeColor: '#E11D48',
    ctaText: 'Masaya Geç & Fal Bak →',
    imageSource: require('@/assets/backgrounds/decks/katina_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'katina' },
    category: 'fallar',
  },

  // 3. Petit Lenormand
  {
    key: 'lenormand',
    title: 'Petit Lenormand Kehanet Destesi',
    subtitle: '36 Somut Kart · Günlük Olaylar, Haberler & Net Cevaplar',
    tags: ['Net Kehanet', '36 Kart', 'Günlük Hayat', 'Tavsiye'],
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

  // 4. Kahve Falı
  {
    key: 'coffee',
    title: 'Geleneksel Türk Kahvesi Falı',
    subtitle: 'Fincandaki telve sembollerinin kadim yorumu & sır kapıları',
    tags: ['Fotoğraflı Analiz', 'Telve Sembolleri', 'Aşk & Kısmet', 'Derin Yorum'],
    accent: '#D97706',
    badgeText: '☕ Fotoğraflı Analiz',
    badgeColor: '#D97706',
    ctaText: 'Fincanını Çek & Falına Bak →',
    imageSource: require('@/assets/ekoller/ekol_bg_2_osmanli.jpg'),
    actionType: 'navigation',
    route: 'ImageReading',
    params: { kind: 'coffee' },
    category: 'fallar',
  },

  // 5. El Falı
  {
    key: 'palm',
    title: 'Kadim El Çizgisi Falı (Kiromansi)',
    subtitle: 'Avuç içindeki yaşam, kalp ve akıl çizgilerinin kadersel haritası',
    tags: ['Yaşam Çizgisi', 'Kalp & Akıl', 'Kader Yolu', 'Fotoğraflı'],
    accent: '#EC4899',
    badgeText: '✋ Avuç İçi Analizi',
    badgeColor: '#EC4899',
    ctaText: 'Elini Tara & Falına Bak →',
    imageSource: require('@/assets/ekoller/ekol_bg_4_bati_ezoterik.jpg'),
    actionType: 'navigation',
    route: 'ImageReading',
    params: { kind: 'palm' },
    category: 'fallar',
  },

  // 6. Yüz Falı
  {
    key: 'face',
    title: 'Sima İlmi & Yüz Falı (Fizyonomi)',
    subtitle: 'Yüz hatlarındaki mikro geometriler ve karakter şifresi',
    tags: ['Karakter Şifresi', 'Bilinçaltı', 'Yüz Geometrisi', 'Fotoğraflı'],
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

  // 7. Su Falı
  {
    key: 'sufal',
    title: 'Kozmik Su & Durugörü Falı',
    subtitle: 'Kozmik su aynasında beliren durugörü vizyonları ve sırlar',
    tags: ['Durugörü', 'Bilinmeyen Sırlar', 'Kozmik Su', 'Mistik'],
    accent: '#38BDF8',
    badgeText: '💧 Durugörü Aynası',
    badgeColor: '#38BDF8',
    ctaText: 'Suya Bak & Kehaneti Gör →',
    imageSource: require('@/assets/ekoller/ekol_bg_6_klasik.jpg'),
    actionType: 'navigation',
    route: 'SuFal',
    category: 'fallar',
  },

  // 8. Balmumu Falı
  {
    key: 'wax',
    title: 'Balmumu & Ateş Kehaneti',
    subtitle: 'Eriyen mum damlalarının suya bıraktığı gizemli şekiller',
    tags: ['Ateş Enerjisi', 'Eriyen Mum', 'Kısmet & Nazar', 'Özel Semboller'],
    accent: '#F97316',
    badgeText: '🕯️ Mum Şekilleri',
    badgeColor: '#F97316',
    ctaText: 'Mumu Damlat & Yorumla →',
    imageSource: require('@/assets/ekoller/ekol_bg_2_osmanli.jpg'),
    actionType: 'navigation',
    route: 'WaxReading',
    category: 'fallar',
  },

  // 9. Nordik Runik Taşlar & Kehanet
  {
    key: 'rune',
    title: 'Nordik Runik Taşlar & Kehanet',
    subtitle: '24 Kadim Elder Futhark Taşı · Keseden Dökülsün & Rün Masası',
    tags: ['24 Kutsal Taş', 'Keseden Dök', 'Rün Masası', 'Viking Bilgeliği'],
    accent: '#38BDF8',
    badgeText: 'ᚱ 2 Farklı Mod',
    badgeColor: '#38BDF8',
    ctaText: 'Rün Modunu Seç & Fal Bak →',
    imageSource: require('@/assets/backgrounds/decks/rune_bg.jpg'),
    actionType: 'rune_modal',
    category: 'fallar',
  },

  // 11. Çin I Ching
  {
    key: 'iching',
    title: 'Çin I Ching (Değişimler Kitabı)',
    subtitle: '3 kutsal sikke atımı ile 64 heksagram kozmik dengesi',
    tags: ['3 Kadim Sikke', '64 Heksagram', 'Taocu Bilgelik', 'Kader Döngüsü'],
    accent: '#EF4444',
    badgeText: '☯️ 64 Heksagram',
    badgeColor: '#EF4444',
    ctaText: 'Sikkeleri At & Aç →',
    imageSource: require('@/assets/ekoller/iching_screen_bg.jpg'),
    actionType: 'navigation',
    route: 'IChingReading',
    category: 'fallar',
  },

  // 12. 41 Bakla Falı
  {
    key: 'bakla',
    title: 'Geleneksel 41 Bakla Falı',
    subtitle: '3 ocak remil açılımı ve 41 ak baklanın kadersel kümelenmesi',
    tags: ['41 Ak Bakla', 'Niyet & Kısmet', 'Geleneksel', 'Otomatik Dağıtım'],
    accent: '#10B981',
    badgeText: '🌾 3 Ocak Remil',
    badgeColor: '#10B981',
    ctaText: 'Baklaları Dağıt & Oku →',
    imageSource: require('@/assets/ekoller/osmanli_reading_card.jpg'),
    actionType: 'navigation',
    route: 'BaklaReading',
    category: 'fallar',
  },

  // 13. Hermetik Mısır Thoth
  {
    key: 'thoth',
    title: 'Hermetik Mısır & Thoth Kartları',
    subtitle: 'Mısır panteonu, kutsal geometri ve ezoterik simya rehberi',
    tags: ['Mısır Tanrıları', 'Hermetik Simya', 'Kozmik Yasa', 'Özel Deste'],
    accent: '#EAB308',
    badgeText: '📜 Hermetik Simya',
    badgeColor: '#EAB308',
    ctaText: 'Masaya Geç & İncele →',
    imageSource: require('@/assets/backgrounds/decks/thoth_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'thoth' },
    category: 'fallar',
  },

  // 14. Osho Zen Bilgelik
  {
    key: 'osho_zen',
    title: 'Osho Zen Bilgelik Kartları',
    subtitle: 'Gelecek kaygısını bırakıp şimdi ve burada olmanın dinginliği',
    tags: ['İç Huzur', 'Şimdiki An', 'Ruhsal Dönüşüm', 'Farkındalık'],
    accent: '#14B8A6',
    badgeText: '🌸 Zen Farkındalık',
    badgeColor: '#14B8A6',
    ctaText: 'Masaya Geç & İncele →',
    imageSource: require('@/assets/backgrounds/decks/osho_zen_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'osho_zen' },
    category: 'fallar',
  },

  // 15. Melek Kartları
  {
    key: 'angel',
    title: 'Melek Rehberlik & Şifa Kartları',
    subtitle: '44 Işık Kartı · İlahi Koruma, Şifa, Huzur & Günün Mesajı',
    tags: ['Huzur', '44 Kart', 'Pozitif Enerji', 'Şifa'],
    accent: '#C084FC',
    badgeText: '🪽 Işık Enerjisi',
    badgeColor: '#C084FC',
    ctaText: 'Melek Kartını Çek →',
    imageSource: require('@/assets/backgrounds/decks/angel_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'angel' },
    category: 'fallar',
  },

  // 16. İskambil Saray Falı
  {
    key: 'iskambil',
    title: 'İskambil Saray Falı Destesi',
    subtitle: '52 Klasik Kart · Kupa, Karo, Sinek & Maça Hanedanı',
    tags: ['52 Kart', 'Kalp & Para', 'Saray Falı', 'Resmî İşler'],
    accent: '#E11D48',
    badgeText: '👑 Saray Falı',
    badgeColor: '#E11D48',
    ctaText: 'İskambil Masasına Geç →',
    imageSource: require('@/assets/backgrounds/decks/iskambil_bg.jpg'),
    actionType: 'navigation',
    route: 'CardDeckTable',
    params: { deckId: 'iskambil' },
    category: 'fallar',
  },

  // 17. Sesli Mistik Falcı
  {
    key: 'voiceReading',
    title: 'Sesli Mistik Falcı & Danışman',
    subtitle: 'Mikrofona hislerini ve sorunu anlat, sesli canlı rehberlik al',
    tags: ['Canlı Ses', 'Birebir Danışmanlık', 'Mistik Ses', 'Anında Yanıt'],
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
