import type { ImageSourcePropType } from 'react-native';

// Custom gold/velvet feature icons, sourced by the user and resized to fit
// each button slot. Keys match the `key` used on the corresponding
// HomeScreen/KesfetScreen/MagazaScreen/ProfilScreen item.
export const FEATURE_ICONS: Partial<Record<string, ImageSourcePropType>> = {
  palm: require('./palm.jpg'),
  moonCalendar: require('./moonCalendar.jpg'),
  notificationSettings: require('./notificationSettings.png'),
  biorhythm: require('./biorhythm.jpg'),
  zodiacTraits: require('./zodiacTraits.jpg'),
  compatibility: require('./compatibility.jpg'),
  coinShop: require('./coinShop.png'),
  tarotSpread: require('./tarotSpread.jpg'),
  birthChart: require('./birthChart.jpg'),
  moodJournal: require('./moodJournal.jpg'),
  tasks: require('./tasks.png'),
  horoscope: require('./horoscope.jpg'),
  affirmation: require('./affirmation.jpg'),
  angelCard: require('./angelCard.jpg'),
  coffee: require('./coffee.jpg'),
  cardDesigns: require('./cardDesigns.png'),
  katina: require('./katina.jpg'),
  profileChat: require('./profileChat.png'),
  breathing: require('./breathing.jpg'),
  numerology: require('./numerology.jpg'),
  daisy: require('./daisy.jpg'),
  premium: require('./premium.png'),
  dream: require('./dream.jpg'),
  voiceReading: require('./voiceReading.jpg'),
  magicBall: require('./magicBall.jpg'),
  solitaire: require('./solitaire.jpg'),
  tarot: require('./tarot.jpg'),
  risingSign: require('./risingSign.jpg'),
  dice: require('./dice.jpg'),
  dreamLibrary: require('./dreamLibrary.jpg'),
  suFal: require('./suFal.png'),
};
