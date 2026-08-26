import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TarotOrientation } from '@/services/tarot';
import type { SpreadId } from '@/services/tarotSpreads';

export type TarotPick = { id: string; orientation: TarotOrientation };

export type RootStackParamList = {
  Home: undefined;
  TarotSpread: undefined;
  Tarot: { spreadId: SpreadId };
  TarotResult: { spreadId: SpreadId; picks: TarotPick[] };
  DreamChat: undefined;
  ProfileChat: undefined;
  ImageReading: { kind: 'coffee' | 'palm' };
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
};

export type MainTabParamList = {
  AnaSayfa: undefined;
  Kesfet: undefined;
  BilgiKosesi: undefined;
  Magaza: undefined;
  Profil: undefined;
};

// The 5 tab screens live inside a hand-rolled swipeable TabView (see
// MainTabs.tsx), not a real React Navigation tab navigator, so they only
// ever get the root stack's navigation object — which is all they use
// (they never call tab-specific methods like jumpTo).
export type TabScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };
