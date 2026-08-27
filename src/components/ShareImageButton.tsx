import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import QuoteShareCard from '@/components/QuoteShareCard';
import { QUOTE_PALETTES } from '@/constants/quotePalettes';
import { shareImageUri } from '@/utils/shareImage';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = { text: string; label?: string };

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
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const press = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    setPaletteIndex(Math.floor(Math.random() * QUOTE_PALETTES.length));
    await new Promise((resolve) => setTimeout(resolve, 80));
    try {
      const uri =
        Platform.OS === 'web'
          ? await captureWebCard(cardRef.current)
          : await captureRef(cardRef, { width: 1080, height: 1080, format: 'png', quality: 1, result: 'tmpfile' });

      // Web üzerinde doğrudan önizleme modalı açıp kullanıcının görmesini sağla
      if (Platform.OS === 'web') {
        setPreviewUri(uri);
      }

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

      {/* Arka planda 1080x1080 resim oluşturan gizli kart */}
      <View style={styles.hiddenWrap} pointerEvents="none">
        <QuoteShareCard ref={cardRef} text={text} paletteIndex={paletteIndex} />
      </View>

      {/* Bilgisayar / Web kullanıcıları için Görsel Önizleme Modalı */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreviewUri(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD} />
                <Text style={styles.modalTitle}>Oluşturulan Paylaşım Görseli</Text>
              </View>
              <Pressable onPress={() => setPreviewUri(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={TEXT_MUTED} />
              </Pressable>
            </View>

            <View style={styles.previewImageContainer}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
              ) : null}
            </View>

            <Text style={styles.modalNotice}>
              Görsel 1080×1080 Instagram / WhatsApp hikaye formatında oluşturuldu ve bilgisayarınıza indirildi.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalDownloadBtn}
                onPress={async () => {
                  if (previewUri) await shareImageUri(previewUri);
                }}
              >
                <Ionicons name="download-outline" size={16} color="#1A0D33" />
                <Text style={styles.modalDownloadBtnText}>Görseli Yeniden İndir</Text>
              </Pressable>
              <Pressable style={styles.modalCloseBtn} onPress={() => setPreviewUri(null)}>
                <Text style={styles.modalCloseBtnText}>Kapat</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 14, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: NIGHT_CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 20,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: GOLD,
  },
  previewImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0a061c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  modalNotice: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalDownloadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalDownloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A0D33',
  },
  modalCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
});
