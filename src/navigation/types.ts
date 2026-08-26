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
  Mindfulness: undefined;
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
};

export type MainTabParamList = {
  AnaSayfa: undefined;
  Kesfet: undefined;
  Magaza: undefined;
  Profil: undefined;
};
