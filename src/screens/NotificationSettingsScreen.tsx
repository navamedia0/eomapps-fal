import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import {
  isNotificationsSupported,
  getNotificationSettings,
  requestNotificationPermission,
  setDailyZodiacReminder,
  setDailyMotivationReminder,
  setMoonPhaseReminders,
  type NotificationSettings,
} from '@/services/notifications';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const supported = isNotificationsSupported();

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  const toggle = useCallback(
    async (key: keyof NotificationSettings, setter: (enabled: boolean) => Promise<void>, nextValue: boolean) => {
      if (!settings) return;
      setPermissionDenied(false);
      if (nextValue) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setPermissionDenied(true);
          return;
        }
      }
      setSettings({ ...settings, [key]: nextValue });
      await setter(nextValue);
    },
    [settings],
  );

  const rows = [
    {
      key: 'dailyZodiac' as const,
      icon: 'star-outline' as const,
      title: 'Günlük Burç Hatırlatması',
      subtitle: 'Her sabah 09:00\'da günlük burç yorumun hazır olduğunu hatırlat',
      setter: setDailyZodiacReminder,
    },
    {
      key: 'dailyMotivation' as const,
      icon: 'flash-outline' as const,
      title: 'Bugün Senin İçin',
      subtitle: 'Her akşam 19:00\'da kişisel bir motivasyon mesajı gönder',
      setter: setDailyMotivationReminder,
    },
    {
      key: 'moonPhases' as const,
      icon: 'moon-outline' as const,
      title: 'Ay Evresi Bildirimleri',
      subtitle: 'Yeni ay ve dolunay gecelerinde haber ver',
      setter: setMoonPhaseReminders,
    },
  ];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="notifications-outline" size={28} color={GOLD} />
          <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        </View>

        {!supported && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={GOLD} />
            <Text style={styles.infoText}>Bildirimler yalnızca mobil uygulamada desteklenir.</Text>
          </View>
        )}

        {permissionDenied && (
          <View style={styles.infoBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#E08A8A" />
            <Text style={styles.infoText}>
              Bildirim izni verilmedi. Açmak için cihaz ayarlarından uygulama izinlerini kontrol et.
            </Text>
          </View>
        )}

        <View style={styles.list}>
          {rows.map((row) => (
            <View key={row.key} style={[styles.row, !supported && styles.rowDisabled]}>
              <View style={styles.iconWrap}>
                <Ionicons name={row.icon} size={20} color={GOLD} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
              </View>
              <Switch
                value={!!settings?.[row.key]}
                onValueChange={(value) => toggle(row.key, row.setter, value)}
                disabled={!supported || !settings}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: GOLD_SOFT }}
                thumbColor={settings?.[row.key] ? GOLD : '#888'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: TEXT_PRIMARY,
    lineHeight: 17,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 15,
  },
});
