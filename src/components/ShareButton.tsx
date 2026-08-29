import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { shareText } from '@/utils/share';
import { GOLD, GOLD_SOFT } from '@/theme/colors';

type Props = {
  text: string;
  label?: string;
  variant?: 'standard' | 'parchment';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function ShareButton({
  text,
  label = 'Paylaş',
  variant = 'standard',
  style,
  textStyle,
}: Props) {
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

  const isParchment = variant === 'parchment';

  return (
    <Pressable
      onPress={press}
      style={({ pressed }) => [
        styles.button,
        isParchment && styles.parchmentButton,
        style,
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        name="share-social-outline"
        size={16}
        color={isParchment ? '#451A03' : GOLD}
      />
      <Text
        style={[
          styles.text,
          isParchment && styles.parchmentText,
          textStyle,
        ]}
      >
        {feedback ?? label}
      </Text>
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
  parchmentButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  parchmentText: {
    fontSize: 13.5,
    color: '#451A03',
    fontWeight: '800',
  },
});
