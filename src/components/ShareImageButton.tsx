import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import QuoteShareCard from '@/components/QuoteShareCard';
import { QUOTE_PALETTES } from '@/constants/quotePalettes';
import { shareImageUri } from '@/utils/shareImage';
import { GOLD, GOLD_SOFT } from '@/theme/colors';

type Props = { text: string; label?: string };

// react-native-view-shot's captureRef() calls RN Web's findNodeHandle(), which
// newer react-native-web builds no longer support and throws on. On web a
// View ref already points at its underlying DOM node, so we snapshot it
// directly with html2canvas (the same library view-shot uses internally).
async function captureWebCard(node: unknown): Promise<string> {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(node as HTMLElement, { backgroundColor: null });
  const resized = document.createElement('canvas');
  resized.width = 1080;
  resized.height = 1080;
  resized.getContext('2d')?.drawImage(canvas, 0, 0, 1080, 1080);
  return resized.toDataURL('image/png', 1);
}

export default function ShareImageButton({ text, label = 'Görsel Paylaş' }: Props) {
  const cardRef = useRef<View>(null);
  const [paletteIndex, setPaletteIndex] = useState(() => Math.floor(Math.random() * QUOTE_PALETTES.length));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const press = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    setPaletteIndex(Math.floor(Math.random() * QUOTE_PALETTES.length));
    await new Promise((resolve) => setTimeout(resolve, 60));
    try {
      const uri =
        Platform.OS === 'web'
          ? await captureWebCard(cardRef.current)
          : await captureRef(cardRef, { width: 1080, height: 1080, format: 'png', quality: 1, result: 'tmpfile' });
      const outcome = await shareImageUri(uri);
      if (outcome === 'downloaded') setFeedback('Görsel indirildi!');
      else if (outcome === 'unavailable') setFeedback('Paylaşılamadı.');
    } catch {
      setFeedback('Görsel oluşturulamadı.');
    } finally {
      setBusy(false);
      setTimeout(() => setFeedback(null), 2500);
    }
  }, [busy]);

  return (
    <>
      <Pressable onPress={press} disabled={busy} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Ionicons name={busy ? 'hourglass-outline' : 'image-outline'} size={16} color={GOLD} />
        <Text style={styles.text} numberOfLines={1}>
          {feedback ?? label}
        </Text>
      </Pressable>
      <View style={styles.hiddenWrap} pointerEvents="none">
        <QuoteShareCard ref={cardRef} text={text} paletteIndex={paletteIndex} />
      </View>
    </>
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
  hiddenWrap: {
    position: 'absolute',
    top: 0,
    left: -99999,
  },
});
