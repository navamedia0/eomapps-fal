import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateMoonPhase } from '@/services/moonPhase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = '@mistik-rehber/notification-settings';

export type NotificationSettings = {
  dailyZodiac: boolean;
  dailyMotivation: boolean;
  moonPhases: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyZodiac: false,
  dailyMotivation: false,
  moonPhases: false,
};

export const isNotificationsSupported = () => Platform.OS !== 'web';

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

const MOTIVATION_MESSAGES = [
  'Bugün senin için: küçük bir adım bile ilerlemek demektir. ✨',
  'Bugün senin için: kalbin sana ne söylüyor, bir dinle. 🌙',
  'Bugün senin için: evren senden yana. 🌟',
  'Bugün senin için: yeni bir kapı aralanabilir, gözünü açık tut. 🔮',
  'Bugün senin için: kendine biraz şefkat göster. 💫',
];

export async function setDailyZodiacReminder(enabled: boolean): Promise<void> {
  if (!isNotificationsSupported()) return;
  await Notifications.cancelScheduledNotificationAsync('daily-zodiac');
  if (enabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-zodiac',
      content: { title: 'Mistik Rehber', body: 'Bugünkü burç yorumun hazır! ✨' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 9, minute: 0 },
    });
  }
  const settings = await getNotificationSettings();
  await saveNotificationSettings({ ...settings, dailyZodiac: enabled });
}

export async function setDailyMotivationReminder(enabled: boolean): Promise<void> {
  if (!isNotificationsSupported()) return;
  await Notifications.cancelScheduledNotificationAsync('daily-motivation');
  if (enabled) {
    const message = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-motivation',
      content: { title: 'Mistik Rehber', body: message },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 19, minute: 0 },
    });
  }
  const settings = await getNotificationSettings();
  await saveNotificationSettings({ ...settings, dailyMotivation: enabled });
}

export async function setMoonPhaseReminders(enabled: boolean): Promise<void> {
  if (!isNotificationsSupported()) return;
  await Notifications.cancelScheduledNotificationAsync('moon-new');
  await Notifications.cancelScheduledNotificationAsync('moon-full');
  if (enabled) {
    const { nextNewMoon, nextFullMoon } = calculateMoonPhase();
    await Notifications.scheduleNotificationAsync({
      identifier: 'moon-new',
      content: { title: 'Mistik Rehber', body: 'Bu gece yeni ay 🌑 — niyet belirlemek için uygun bir zaman.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextNewMoon },
    });
    await Notifications.scheduleNotificationAsync({
      identifier: 'moon-full',
      content: { title: 'Mistik Rehber', body: 'Bu gece dolunay 🌕 — Ay Takvimi\'ndeki ritüel önerine göz at.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextFullMoon },
    });
  }
  const settings = await getNotificationSettings();
  await saveNotificationSettings({ ...settings, moonPhases: enabled });
}
