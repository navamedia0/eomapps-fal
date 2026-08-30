import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RUNE_ASSETS } from '@/assets/runes';
import RuneStoneItem from './RuneStoneItem';
import { isSymmetricRune, type Rune } from '@/services/runeEngine';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_MUTED, TEXT_PRIMARY } from '@/theme/colors';

type Props = {
  rune: Rune | null;
  visible: boolean;
  onClose: () => void;
  positionLabel?: string;
};

export default function RuneInspectModal({ rune, visible, onClose, positionLabel }: Props) {
  if (!rune) return null;

  const isReversed = !!rune.isReversed;
  const symmetric = isSymmetricRune(rune.id);
  const showReversed = isReversed && !symmetric;
  const accent = showReversed ? '#F2A65A' : '#38BDF8';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleBadge}>
              <MaterialCommunityIcons name="shield-sword-outline" size={18} color={accent} />
              <Text style={[styles.positionText, { color: accent }]}>
                {positionLabel || 'Kutsal Rün İnceleme'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Hero Stone Display with Close-Up Visual */}
            <View style={styles.heroSection}>
              <View style={styles.heroStoneWrapper}>
                <RuneStoneItem rune={rune} size="lg" revealed={true} isReversed={rune.isReversed} glowColor={accent} />
              </View>

              <Text style={styles.runeName}>
                {rune.symbol} {rune.name}
              </Text>

              <View style={styles.tagRow}>
                <View style={[styles.tag, { borderColor: accent }]}>
                  <Text style={[styles.tagText, { color: accent }]}>
                    Element: {rune.element}
                  </Text>
                </View>

                <View style={[styles.tag, { borderColor: showReversed ? '#F2A65A' : '#38BDF8' }]}>
                  <Text style={[styles.tagText, { color: showReversed ? '#F2A65A' : '#38BDF8' }]}>
                    {symmetric ? 'Simetrik (Tersi Yok)' : showReversed ? 'Ters Durum (Merkstave)' : 'Düz Durum (Upright)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ritual Nordic Quote Banner */}
            <View style={styles.ritualBanner}>
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.15)', 'rgba(15, 23, 42, 0.85)']}
                style={styles.bannerOverlay}
              >
                <MaterialCommunityIcons name="feather" size={16} color="#38BDF8" style={{ marginBottom: 4 }} />
                <Text style={styles.bannerQuote}>
                  “Odin'in dokuz diyardan fısıldadığı kadim kehanet dokusu...”
                </Text>
              </LinearGradient>
            </View>

            {/* Meaning & Interpretation */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Temel Öz / Arketip</Text>
              <Text style={styles.infoBody}>{rune.meaning}</Text>
            </View>

            <View style={[styles.infoBlock, styles.highlightBlock, { borderColor: accent }]}>
              <Text style={[styles.infoLabel, { color: accent }]}>
                {showReversed ? 'Ters Konumun Mesajı' : 'Düz Konumun Mesajı'}
              </Text>
              <Text style={styles.infoBody}>
                {showReversed ? rune.reversed : rune.upright}
              </Text>
            </View>

            {rune.advice && (
              <View style={styles.infoBlock}>
                <Text style={[styles.infoLabel, { color: GOLD_SOFT }]}>Bilgenin Tavsiyesi</Text>
                <Text style={styles.infoBody}>{rune.advice}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Close Button */}
          <Pressable onPress={onClose} style={[styles.dismissBtn, { backgroundColor: accent }]}>
            <Text style={styles.dismissBtnText}>İncelemeyi Tamamla</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: 'rgba(20, 14, 38, 0.96)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 14,
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  heroStoneWrapper: {
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runeName: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ritualBanner: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 20, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerQuote: {
    fontSize: 11.5,
    color: '#E0F2FE',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  highlightBlock: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoBody: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 19,
  },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: NIGHT_DEEP,
  },
});
