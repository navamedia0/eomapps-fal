import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TarotOrientation } from '@/services/tarot';
import type { SpreadId } from '@/services/tarotSpreads';

export type TarotPick = { id: string; orientation: TarotOrientation };
export type TarotLayoutId = 'grid' | 'fullgrid' | 'fan' | 'radial';

export type RootStackParamList = {
  Home: undefined;
  TumFallar: undefined;
  TarotSpread: undefined;
  TarotLayout: { spreadId: SpreadId | number };
  Tarot: { spreadId: SpreadId | number; layout: TarotLayoutId };
  TarotResult: {
    spreadId: SpreadId | number;
    picks: TarotPick[];
    isPrepaid?: boolean;
    isRelationship?: boolean;
    p1Name?: string;
    p2Name?: string;
    relFocus?: string;
    // "Kendi Kartlarınla Fal Bak" (CardDeckTableScreen) kendi ayrı açılım
    // katalogunu kullanıyor — spreadId sadece kart sayısı, findSpread()'in
    // ürettiği pozisyonlar bu katalogla eşleşmeyebilir (özellikle 5/7/10 kart
    // ve karşılıklı uyum açılımlarında). Verildiğinde bu, kullanıcının
    // gerçekten seçtiği pozisyon etiketlerinin üzerine yazılır.
    positions?: string[];
  };
  DreamChat: undefined;
  ProfileChat: undefined;
  ImageReading: { kind: 'coffee' | 'palm' | 'face' | 'tea' };
  MatrixOfDestiny: undefined;
  RuneReading: undefined;
  IChingReading: undefined;
  BaklaReading: undefined;
  WaxReading: undefined;
  CelticTreeReading: undefined;
  AuraEnergy: undefined;
  ScryingReading: undefined;
  Zodiac: undefined;
  Numerology: undefined;
  Compatibility: undefined;
  AngelCard: undefined;
  MagicBall: undefined;
  Daisy: undefined;
  BirthChart: undefined;
  Biorhythm: undefined;
  MoonCalendar: undefined;
  Tasks: undefined;
  MiniGames: undefined;
  Favorites: undefined;
  History: undefined;
  Katina: undefined;
  MoodJournal: undefined;
  BreathingExercise: undefined;
  Affirmation: undefined;
  NotificationSettings: undefined;
  Premium: undefined;
  VoiceReading: undefined;
  RisingSign: undefined;
  Dice: undefined;
  CardDesigns: undefined;
  CoinShop: undefined;
  ZodiacTraits: undefined;
  Solitaire: undefined;
  SuFal: undefined;
  RuyaKitapligi: undefined;
  KartAnlamlari: { deck: 'iskambil' | 'tarot' };
  BilgiMakale: { topic: 'kahve_tarihi' | 'katina_nedir' | 'burc_kokeni' };
  BilgiKosesi: undefined;
  SozlerKosku: undefined;
  HaftaninSevilenleri: undefined;
  EkolDetay: { ekolKey: string };
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  DMThread: { userId: string; displayName?: string | null; avatarUrl?: string | null };
  Room: { roomId: string; roomName?: string };
  Shop: undefined;
  VipTiers: undefined;
  Achievements: undefined;
  Popularity: undefined;
  Garden: undefined;
  KaderKasabasi: undefined;
  KesifSalonu: undefined;
  KesifSalonuOyun: undefined;
  CardDeckHub: undefined;
  CardDeckTable: { deckId: string };
  LenormandResult: {
    picks: { id: string; orientation: 'upright' | 'reversed' }[];
    positions: string[];
    readingTechnique: string;
  };
  RuneResult: {
    picks: { id: string; orientation: 'upright' | 'reversed' }[];
    positions: string[];
    readingTechnique: string;
  };
};

export type MainTabParamList = {
  AnaSayfa: undefined;
  Kesfet: undefined;
  Sohbet: undefined;
  Magaza: undefined;
  Profil: undefined;
};

// The 5 tab screens live inside a hand-rolled swipeable TabView (see
// MainTabs.tsx), not a real React Navigation tab navigator, so they only
// ever get the root stack's navigation object — which is all they use
// (they never call tab-specific methods like jumpTo).
export type TabScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };
