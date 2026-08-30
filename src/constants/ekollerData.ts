export type EkolItem = {
  key: string;
  title: string;
  subtitle: string;
  route: string;
  params?: any;
};

export type EkolData = {
  key: string;
  title: string;
  sub: string;
  accent: string;
  sectionBg: any;
  items: EkolItem[];
};

export const EKOLLER_DATA: EkolData[] = [
  {
    key: 'cin-ekolu',
    title: 'Çin Ekolü',
    sub: 'Lake kırmızısı & imparatorluk altını sima ve I Ching ilmi',
    accent: '#E11D48',
    sectionBg: require('@/assets/ekoller/ekol_bg_1_cin.jpg'),
    items: [
      {
        key: 'face',
        title: 'Yüz Falı',
        subtitle: 'Sima ilmiyle yüz hatlarındaki kaderi keşfet',
        route: 'ImageReading',
        params: { kind: 'face' },
      },
      {
        key: 'iching',
        title: 'Çin I Ching Falı',
        subtitle: '3 kutsal sikke ile 64 heksagram kehaneti',
        route: 'IChingReading',
      },
    ],
  },
  {
    key: 'osmanli-ekolu',
    title: 'Osmanlı & Anadolu Ekolü',
    sub: 'İznik turkuazı & pirinç cezve & kadim remil geleneği',
    accent: '#0EA5E9',
    sectionBg: require('@/assets/ekoller/ekol_bg_2_osmanli.jpg'),
    items: [
      {
        key: 'coffee',
        title: 'Kahve Falı',
        subtitle: 'Fincandaki telve sembollerinin kadim yorumu',
        route: 'ImageReading',
        params: { kind: 'coffee' },
      },
      {
        key: 'bakla',
        title: '41 Bakla Falı',
        subtitle: '3 ocak remil ve 41 ak bakla açılımı',
        route: 'BaklaReading',
      },
    ],
  },
  {
    key: 'nordik-kelt-ekolu',
    title: 'Nordik & Kelt Ekolü',
    sub: 'Kutsal Viking rünleri & kadim Druid ağaç bilgeliği',
    accent: '#10B981',
    sectionBg: require('@/assets/ekoller/ekol_bg_3_nordik.jpg'),
    items: [
      {
        key: 'rune',
        title: 'Nordik Rün Falı',
        subtitle: 'Vikinglerin kadim Futhark kutsal taşları',
        route: 'RuneReading',
      },
      {
        key: 'celticTree',
        title: 'Kelt Ağaç Takvimi',
        subtitle: 'Druidlerin kutsal 13 ağaç burcu rehberi',
        route: 'CelticTreeReading',
      },
    ],
  },
  {
    key: 'bati-ezoterik-ekolu',
    title: 'Evrensel Batı Ezoterik Ekolü',
    sub: 'Ametist moru & simya & durugörü mistisizmi',
    accent: '#A855F7',
    sectionBg: require('@/assets/ekoller/ekol_bg_4_bati_ezoterik.jpg'),
    items: [
      {
        key: 'palm',
        title: 'El Falı',
        subtitle: 'Avucundaki kader, kalp ve akıl çizgilerini oku',
        route: 'ImageReading',
        params: { kind: 'palm' },
      },
      {
        key: 'tea',
        title: 'Çay Falı',
        subtitle: 'Tasseografi çay yaprak desenleri',
        route: 'ImageReading',
        params: { kind: 'tea' },
      },
      {
        key: 'wax',
        title: 'Balmumu Falı',
        subtitle: 'Alevin ve eriyen balmumunun aşk kehaneti',
        route: 'WaxReading',
      },
      {
        key: 'scrying',
        title: 'Kara Ayna Durugörü',
        subtitle: 'Obsidyen ayna ile sezgisel vizyon açılımı',
        route: 'ScryingReading',
      },
      {
        key: 'aura',
        title: 'Aura & Çakra Falı',
        subtitle: '7 çakra ve ışıltılı aura enerjisi analizi',
        route: 'AuraEnergy',
      },
      {
        key: 'matrix',
        title: 'Kader Matrisi',
        subtitle: '22 Arkana ve sekizgen ruh haritası',
        route: 'MatrixOfDestiny',
      },
    ],
  },
  {
    key: 'ruya-ekolu',
    title: 'Bilinçaltı & Rüya Ekolü',
    sub: 'Gece indigosu & aurora moru semboller alemi',
    accent: '#6366F1',
    sectionBg: require('@/assets/ekoller/ekol_bg_5_ruya.jpg'),
    items: [
      {
        key: 'dream',
        title: 'Rüya Yorumlama',
        subtitle: 'Rüyandaki kadim sembolleri yapay zeka ile çöz',
        route: 'DreamChat',
      },
      {
        key: 'dreamLibrary',
        title: 'Rüya Kitaplığı',
        subtitle: 'Geçmiş rüyalarını sakla, kategorize et ve incele',
        route: 'RuyaKitapligi',
      },
    ],
  },
  {
    key: 'klasik-evrensel',
    title: 'Klasik & Evrensel Fallar',
    sub: '24K altın arketip açılımları & geleneksel kehanetler',
    accent: '#F59E0B',
    sectionBg: require('@/assets/ekoller/ekol_bg_6_klasik.jpg'),
    items: [
      {
        key: 'tarot',
        title: 'Tarot Falı',
        subtitle: '78 kart ile kadim arketip açılımı',
        route: 'TarotSpread',
      },
      {
        key: 'katina',
        title: 'Katina Aşk Falı',
        subtitle: 'Deste-i Katina 65 kartlık ilişki açılımı',
        route: 'Katina',
      },
      {
        key: 'solitaire',
        title: 'İskambil Falı',
        subtitle: '32 kartlık klasik kader açılımı',
        route: 'Solitaire',
      },
      {
        key: 'daisy',
        title: 'Papatya Falı',
        subtitle: 'Seviyor / sevmiyor interaktif fal',
        route: 'Daisy',
      },
      {
        key: 'dice',
        title: 'Zar Falı',
        subtitle: '3 kutsal zarın kombinasyon yorumu',
        route: 'Dice',
      },
      {
        key: 'voiceReading',
        title: 'Sesli Fal',
        subtitle: 'Anlat, yapay zeka sesinle yorumlasın',
        route: 'VoiceReading',
      },
    ],
  },
];
