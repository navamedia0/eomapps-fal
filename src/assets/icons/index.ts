import type { ImageSourcePropType } from 'react-native';

// Custom gold/cosmic feature icons, sourced by the user and resized to fit
// each button slot. Keys match the `key` used on the corresponding
// HomeScreen/KesfetScreen/MagazaScreen/ProfilScreen/MindfulnessScreen item.
export const FEATURE_ICONS: Partial<Record<string, ImageSourcePropType>> = {
  palm: require('./palm.png'),
  moonCalendar: require('./moonCalendar.png'),
  notificationSettings: require('./notificationSettings.png'),
  biorhythm: require('./biorhythm.png'),
  zodiacTraits: require('./zodiacTraits.png'),
  compatibility: require('./compatibility.png'),
  coinShop: require('./coinShop.png'),
  tarotSpread: require('./tarotSpread.png'),
  birthChart: require('./birthChart.png'),
  moodJournal: require('./moodJournal.png'),
  mindfulness: require('./mindfulness.png'),
  tasks: require('./tasks.png'),
  horoscope: require('./horoscope.png'),
  affirmation: require('./affirmation.png'),
  angelCard: require('./angelCard.png'),
  coffee: require('./coffee.png'),
  cardDesigns: require('./cardDesigns.png'),
  katina: require('./katina.png'),
  profileChat: require('./profileChat.png'),
  breathing: require('./breathing.png'),
  numerology: require('./numerology.png'),
  daisy: require('./daisy.png'),
  premium: require('./premium.png'),
  dream: require('./dream.png'),
  voiceReading: require('./voiceReading.png'),
  magicBall: require('./magicBall.png'),
  solitaire: require('./solitaire.png'),
  tarot: require('./tarot.png'),
  risingSign: require('./risingSign.png'),
  dice: require('./dice.png'),
  dreamLibrary: require('./dreamLibrary.png'),
  suFal: require('./suFal.png'),
};
