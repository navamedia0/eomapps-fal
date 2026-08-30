import type { ImageSourcePropType } from 'react-native';

export type DeckCardItem = {
  id: string;
  name: string;
  image?: ImageSourcePropType;
  suitSymbol?: string;
  rankLabel?: string;
  themeColor?: string;
};

export type CardDeckInfo = {
  id: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  cardCount: number;
  accent: string;
  accentSoft: string;
  glowColor: string;
  priceVisualCoins: number;
  priceExplainedCoins: number;
  figureSource: ImageSourcePropType;
  sectionBg: ImageSourcePropType;
  cardBackImage: ImageSourcePropType;
  tags: string[];
  sampleCards: DeckCardItem[];
};

export const POPULAR_CARD_DECKS: CardDeckInfo[] = [
  {
    id: 'tarot',
    title: 'Klasik Rider-Waite Tarot',
    shortTitle: 'Klasik Tarot',
    tagline: '78 Kadim Arkana · Evrensel Sembolizm & Kozmik Kapılar',
    description:
      'Yüzyıllık ezoterik bilgelik. Büyük ve Küçük Arkana ile kaderin, aşkın ve ruhsal yolculuğun en berrak aynası.',
    cardCount: 78,
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.25)',
    glowColor: 'rgba(124, 58, 237, 0.45)',
    priceVisualCoins: 0, // Ücretsiz Başlangıç Hediyesi
    priceExplainedCoins: 200,
    figureSource: require('@/assets/tarot/buyucu.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/tarot_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Evrensel', '78 Kart', 'Kader & Ruh', 'Başlangıç'],
    sampleCards: [
      { id: 'deli', name: 'Deli', image: require('@/assets/tarot/deli.jpg') },
      { id: 'buyucu', name: 'Büyücü', image: require('@/assets/tarot/buyucu.jpg') },
      { id: 'asiklar', name: 'Aşıklar', image: require('@/assets/tarot/asiklar.jpg') },
      { id: 'gunes', name: 'Güneş', image: require('@/assets/tarot/gunes.jpg') },
    ],
  },
  {
    id: 'katina',
    title: 'Katina Aşk & İlişki Destesi',
    shortTitle: 'Katina Aşkı',
    tagline: '65 Mistik Kart · Helenik Tutku, Ruh Eşi & Gizli Hisler',
    description:
      'İzmir ve Ege saraylarının efsanevi aşk kehaneti. Aklındaki kişinin gerçek hisleri, üçüncü kişiler ve tutkulu yüzleşmeler.',
    cardCount: 65,
    accent: '#E11D48',
    accentSoft: 'rgba(225, 29, 72, 0.25)',
    glowColor: 'rgba(225, 29, 72, 0.5)',
    priceVisualCoins: 120,
    priceExplainedCoins: 280,
    figureSource: require('@/assets/tarot/asiklar.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/katina_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Aşk Falı', '65 Kart', 'Ruh Eşi', 'Popüler'],
    sampleCards: [
      { id: 'valide_sultan', name: 'Valide Sultan', suitSymbol: '♥', rankLabel: 'Q', themeColor: '#E11D48' },
      { id: 'yakut_kalp', name: 'Yakut Kalp', suitSymbol: '♦', rankLabel: 'A', themeColor: '#F43F5E' },
      { id: 'zumrut_yilan', name: 'Zümrüt Yılan', suitSymbol: '♠', rankLabel: 'J', themeColor: '#10B981' },
      { id: 'elmas_anahtar', name: 'Elmas Anahtar', suitSymbol: '♣', rankLabel: 'K', themeColor: '#38BDF8' },
    ],
  },
  {
    id: 'lenormand',
    title: 'Petit Lenormand Kehanet Destesi',
    shortTitle: 'Lenormand',
    tagline: '36 Somut Kart · Günlük Olaylar, Haberler & Net Cevaplar',
    description:
      'Fransız saray kahini Mlle Lenormand’ın doğrudan ve net kehanet sistemi. Süvari, Yüzük, Gemi, Ağaç gibi somut işaretler.',
    cardCount: 36,
    accent: '#06B6D4',
    accentSoft: 'rgba(6, 182, 212, 0.25)',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    priceVisualCoins: 100,
    priceExplainedCoins: 250,
    figureSource: require('@/assets/tarot/kader_carki.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/lenormand_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Net Kehanet', '36 Kart', 'Günlük Hayat', 'Tavsiye'],
    sampleCards: [
      { id: 'suvari', name: '1. Süvari', suitSymbol: '🐎', rankLabel: '01', themeColor: '#06B6D4' },
      { id: 'yonca', name: '2. Yonca', suitSymbol: '🍀', rankLabel: '02', themeColor: '#10B981' },
      { id: 'gemi', name: '3. Gemi', suitSymbol: '⛵', rankLabel: '03', themeColor: '#3B82F6' },
      { id: 'yuzuk', name: '25. Yüzük', suitSymbol: '💍', rankLabel: '25', themeColor: '#F59E0B' },
    ],
  },
  {
    id: 'angel',
    title: 'Melek Rehberlik & Şifa Kartları',
    shortTitle: 'Melek Kartları',
    tagline: '44 Işık Kartı · İlahi Koruma, Şifa, Huzur & Günün Mesajı',
    description:
      'Korku ve endişeleri dağıtan saf ışık enerjisi. Meleklerin yumuşak dokunuşu, rehberliği ve yüksek frekanslı şifa telkinleri.',
    cardCount: 44,
    accent: '#C084FC',
    accentSoft: 'rgba(192, 132, 252, 0.25)',
    glowColor: 'rgba(192, 132, 252, 0.55)',
    priceVisualCoins: 110,
    priceExplainedCoins: 260,
    figureSource: require('@/assets/tarot/yildiz.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/angel_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Huzur', '44 Kart', 'Pozitif Enerji', 'Şifa'],
    sampleCards: [
      { id: 'koruyucu_melek', name: 'Koruyucu Melek', suitSymbol: '🪽', rankLabel: '✦', themeColor: '#C084FC' },
      { id: 'mucizeler_isigi', name: 'Mucizeler Işığı', suitSymbol: '✨', rankLabel: '✦', themeColor: '#FCD34D' },
      { id: 'sifa_ve_huzur', name: 'Şifa & Huzur', suitSymbol: '🕊️', rankLabel: '✦', themeColor: '#34D399' },
      { id: 'ilahi_zamanlama', name: 'İlahi Zamanlama', suitSymbol: '⏳', rankLabel: '✦', themeColor: '#60A5FA' },
    ],
  },
  {
    id: 'iskambil',
    title: 'İskambil Saray Falı Destesi',
    shortTitle: 'İskambil Sarayı',
    tagline: '52 Klasik Kart · Kupa, Karo, Sinek & Maça Hanedanı',
    description:
      'Kahvehanelerden saray salonlarına uzanan klasik iskambil falı. Kalp meseleleri, para kapıları ve resmi işlerin şaşmaz dengesi.',
    cardCount: 52,
    accent: '#EF4444',
    accentSoft: 'rgba(239, 68, 68, 0.25)',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    priceVisualCoins: 90,
    priceExplainedCoins: 220,
    figureSource: require('@/assets/tarot/imparator.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/iskambil_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Klasik', '52 Kart', 'Kader & Para', 'Geleneksel'],
    sampleCards: [
      { id: 'kupa_asi', name: 'Kupa Ası (Aşk)', suitSymbol: '♥', rankLabel: 'A', themeColor: '#EF4444' },
      { id: 'karo_asi', name: 'Karo Ası (Altın)', suitSymbol: '♦', rankLabel: 'A', themeColor: '#F59E0B' },
      { id: 'maca_krali', name: 'Maça Papazı', suitSymbol: '♠', rankLabel: 'K', themeColor: '#64748B' },
      { id: 'sinek_kizi', name: 'Sinek Kızı', suitSymbol: '♣', rankLabel: 'Q', themeColor: '#10B981' },
    ],
  },
  {
    id: 'osho_zen',
    title: 'Osho Zen Bilgelik & Meditasyon',
    shortTitle: 'Zen Bilgeliği',
    tagline: '56 Farkındalık Kartı · Zihin Sessizliği, Dönüşüm & Akış',
    description:
      'Geleceği kehanet etmekten öte, ‘Şimdi’nin farkındalığına uyanış. Zihnin yanılsamalarını kıran derin içsel aydınlanma.',
    cardCount: 56,
    accent: '#10B981',
    accentSoft: 'rgba(16, 185, 129, 0.25)',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    priceVisualCoins: 110,
    priceExplainedCoins: 270,
    figureSource: require('@/assets/tarot/dunya.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/osho_zen_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Meditasyon', '56 Kart', 'Farkındalık', 'İç Huzur'],
    sampleCards: [
      { id: 'bosluk_ve_sukut', name: 'Sessizlik & Boşluk', suitSymbol: '☯', rankLabel: 'Zen', themeColor: '#34D399' },
      { id: 'donusum', name: 'Büyük Dönüşüm', suitSymbol: '🦋', rankLabel: 'Zen', themeColor: '#A78BFA' },
      { id: 'kutlama', name: 'Kutlama & Dans', suitSymbol: '🌸', rankLabel: 'Zen', themeColor: '#F472B6' },
    ],
  },
  {
    id: 'rune',
    title: 'Nordik Elder Futhark Rün Taşları',
    shortTitle: 'Rünik Taşlar',
    tagline: '24 Kutsal Rün · Viking Kadim Savaşçı & Koruma Enerjisi',
    description:
      'Odin’in dokuz diyardan getirdiği 24 kutsal rünik taş. Güç, direnç, bolluk ve görünmeyen tuzaklara karşı ilahi kalkan.',
    cardCount: 24,
    accent: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.25)',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    priceVisualCoins: 90,
    priceExplainedCoins: 230,
    figureSource: require('@/assets/themes/figures/rune.png'),
    sectionBg: require('@/assets/runes/casting_mat.jpg'),
    cardBackImage: require('@/assets/runes/stone_blank.png'),
    tags: ['Viking', '24 Rün', 'Kadim Güç', 'Koruma'],
    sampleCards: [
      { id: 'fehu', name: 'ᚠ Fehu (Bolluk)', suitSymbol: 'ᚠ', rankLabel: 'Rune', themeColor: '#60A5FA' },
      { id: 'ansuz', name: 'ᚨ Ansuz (Bilgelik)', suitSymbol: 'ᚨ', rankLabel: 'Rune', themeColor: '#38BDF8' },
      { id: 'algiz', name: 'ᛉ Algiz (Koruma)', suitSymbol: 'ᛉ', rankLabel: 'Rune', themeColor: '#818CF8' },
    ],
  },
  {
    id: 'thoth_egypt',
    title: 'Hermetik Mısır & Thoth Destesi',
    shortTitle: 'Mısır Thoth',
    tagline: '78 Ezoterik Kart · Piramit Sırları, Anubis & İsis Simyası',
    description:
      'İskenderiye simyası ve Antik Mısır tapınaklarının gizli bilimi. Hakikat terazisi, kaderin gizli ipleri ve kozmik arketipler.',
    cardCount: 78,
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.25)',
    glowColor: 'rgba(217, 119, 6, 0.5)',
    priceVisualCoins: 130,
    priceExplainedCoins: 290,
    figureSource: require('@/assets/tarot/imparatorice.jpg'),
    sectionBg: require('@/assets/backgrounds/decks/thoth_bg.jpg'),
    cardBackImage: require('@/assets/tarot-backs/premium-back.jpg'),
    tags: ['Antik Mısır', '78 Kart', 'Simya & Gizem', 'Kozmik'],
    sampleCards: [
      { id: 'anubis', name: 'Anubis (Terazi)', suitSymbol: '⚖️', rankLabel: 'Kmt', themeColor: '#F59E0B' },
      { id: 'isis', name: 'İsis (Büyü)', suitSymbol: '𓋹', rankLabel: 'Kmt', themeColor: '#FBBF24' },
      { id: 'horus_gozu', name: 'Horus Gözü', suitSymbol: '𓂀', rankLabel: 'Kmt', themeColor: '#FCD34D' },
    ],
  },
];
