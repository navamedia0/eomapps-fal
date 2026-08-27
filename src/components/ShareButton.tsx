import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, StyleSheet } from 'react-native';
import { shareText } from '@/utils/share';
import { GOLD, GOLD_SOFT } from '@/theme/colors';

type Props = { text: string; label?: string };

export default function ShareButton({ text, label = 'Paylaş' }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const press = useCallback(async () => {
    const formatted = text.includes('Mistik Rehber') ? text : `"${text}"\n\n— Mistik Rehber —`;
    const outcome = await shareText(formatted);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (outcome === 'copied') {
      setFeedback('Panoya kopyalandı!');
      timeoutRef.current = setTimeout(() => setFeedback(null), 2200);
    } else if (outcome === 'unavailable') {
      setFeedback('Paylaşılamadı.');
      timeoutRef.current = setTimeout(() => setFeedback(null), 2200);
    }
  }, [text]);

  return (
    <Pressable onPress={press} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Ionicons name="share-social-outline" size={16} color={GOLD} />
      <Text style={styles.text}>{feedback ?? label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    flexBasis: 0,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
});
