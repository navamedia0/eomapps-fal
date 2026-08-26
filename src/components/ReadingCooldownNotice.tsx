import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { GOLD, GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Props = { remaining: number };

// Shown in place of / alongside a reading's trigger button while this
// device is in cooldown for that reading type. Frames the wait as
// intentional pacing rather than a rejected request.
export default function ReadingCooldownNotice({ remaining }: Props) {
  if (remaining <= 0) return null;
  return (
    <View style={styles.wrap}>
      <Ionicons name="hourglass-outline" size={14} color={GOLD} />
      <Text style={styles.text}>Yoğunluk nedeniyle fallar sıraya alınıyor — {formatMMSS(remaining)} sonra tekrar dene.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  text: {
    flex: 1,
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
});
