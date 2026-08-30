import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CardDeckInfo } from '@/constants/cardDecksData';
import type { DeckTier } from '@/services/deckOwnership';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  deck: CardDeckInfo | null;
  currentTier: DeckTier;
  coins: number;
  loading?: boolean;
  onBuyVisual: () => void;
  onBuyExplained: () => void;
  onNeedCoins: () => void;
  onClose: () => void;
  onDirectPlay: () => void;
};

export default function DeckPurchaseModal({
  visible,
  deck,
  currentTier,
  coins,
  loading = false,
  onBuyVisual,
  onBuyExplained,
  onNeedCoins,
  onClose,
  onDirectPlay,
}: Props) {
  if (!visible || !deck) return null;

  const upgradeCost = Math.max(0, deck.priceExplainedCoins - deck.priceVisualCoins);
  const canAffordVisual = coins >= deck.priceVisualCoins;
  const canAffordExplained = currentTier === 'visual' ? coins >= upgradeCost : coins >= deck.priceExplainedCoins;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Accent Bar */}
          <LinearGradient
            colors={[deck.accent, 'rgba(10, 6, 20, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBar}
          />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Close Button */}
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>

            {/* Coin Balance Badge */}
            <View style={styles.coinBadge}>
              <Ionicons name="disc" size={14} color={GOLD} />
              <Text style={styles.coinText}>{coins} Coin</Text>
            </View>

            {/* Deck Title & Tagline */}
            <View style={styles.titleWrap}>
              <Text style={[styles.deckTitle, { color: deck.accent }]}>{deck.title}</Text>
              <Text style={styles.deckTagline}>{deck.tagline}</Text>
            </View>

            {/* Deck Description */}
            <Text style={styles.deckDesc}>{deck.description}</Text>

            {/* Preview Cards Carousel / Grid */}
            <Text style={styles.sectionHeader}>Örnek Kart Önizlemeleri</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleScroll}>
              {deck.sampleCards.map((sample) => (
                <View key={sample.id} style={[styles.sampleCardBox, { borderColor: deck.accent + '66' }]}>
                  {sample.image ? (
                    <Image source={sample.image} style={styles.sampleCardImg} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={['rgba(30, 18, 56, 0.95)', 'rgba(15, 8, 30, 0.98)']}
                      style={styles.sampleCardPlaceholder}
                    >
                      <Text style={[styles.sampleSuitSymbol, { color: sample.themeColor || deck.accent }]}>
                        {sample.suitSymbol}
                      </Text>
                      <Text style={[styles.sampleRankLabel, { color: deck.accent }]}>{sample.rankLabel}</Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.sampleCardName} numberOfLines={1}>
                    {sample.name}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Tier Comparison & Purchase Options */}
            <View style={styles.optionsWrap}>
              {/* Sadece Görsel Deste (Tier: visual) */}
              <View
                style={[
                  styles.optionCard,
                  currentTier === 'visual' && styles.optionCardOwned,
                  { borderColor: deck.accent + '44' },
                ]}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={20} color={deck.accent} />
                    <Text style={styles.optionTitle}>Görsel Deste</Text>
                  </View>
                  <Text style={[styles.priceTag, { color: deck.accent }]}>
                    {deck.priceVisualCoins === 0 ? 'ÜCRETSİZ' : `${deck.priceVisualCoins} Coin`}
                  </Text>
                </View>
                <Text style={styles.optionFeature}>✓ {deck.cardCount} Kartın tamamının yüksek çözünürlüklü görselleri</Text>
                <Text style={styles.optionFeature}>✓ Masaya dizilim, 3D çevirme ve serbest açılım</Text>
                <Text style={styles.optionFeatureMuted}>✗ Detaylı rehberlik ve aşk/kariyer metinleri dahil değildir</Text>

                {currentTier === 'visual' || currentTier === 'explained' ? (
                  <View style={styles.ownedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.ownedText}>Koleksiyonunda Mevcut</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={canAffordVisual ? onBuyVisual : onNeedCoins}
                    style={({ pressed }) => [
                      styles.buyBtn,
                      { backgroundColor: deck.accent + '25', borderColor: deck.accent },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={deck.accent} />
                    ) : (
                      <Text style={[styles.buyBtnText, { color: deck.accent }]}>
                        {canAffordVisual ? 'Görsel Desteyi Aç' : 'Coin Yükle & Satın Al'}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>

              {/* Açıklamalı & Rehberli Deste (Tier: explained) */}
              <View
                style={[
                  styles.optionCard,
                  styles.optionCardPremium,
                  currentTier === 'explained' && styles.optionCardOwned,
                  { borderColor: deck.accent },
                ]}
              >
                <View style={styles.premiumBadgeHeader}>
                  <Text style={styles.premiumBadgeText}>TAM REHBERLİK & TÜM ANLAMLAR</Text>
                </View>

                <View style={styles.optionHeader}>
                  <View style={styles.optionTitleRow}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={20} color={GOLD} />
                    <Text style={[styles.optionTitle, { color: GOLD }]}>Açıklamalı Deste</Text>
                  </View>
                  <Text style={[styles.priceTag, { color: GOLD }]}>
                    {currentTier === 'visual'
                      ? `+${upgradeCost} Coin (Yükseltme)`
                      : `${deck.priceExplainedCoins} Coin`}
                  </Text>
                </View>
                <Text style={styles.optionFeature}>✓ {deck.cardCount} Kartın tüm görsel ve anlam hazinesi</Text>
                <Text style={styles.optionFeature}>✓ Kartlara dokunulduğunda Aşk, Kariyer, Uyarı analizleri</Text>
                <Text style={styles.optionFeature}>✓ Ters / Düz detaylı anlamları ve anahtar kelimeler</Text>
                <Text style={styles.optionFeature}>✓ Profesyonel falcı masası rehberliği</Text>

                {currentTier === 'explained' ? (
                  <View style={[styles.ownedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
                    <Text style={[styles.ownedText, { color: '#10B981', fontWeight: '800' }]}>
                      Tüm Özellikler Açık ✨
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={canAffordExplained ? onBuyExplained : onNeedCoins}
                    style={({ pressed }) => [
                      styles.buyBtn,
                      { backgroundColor: GOLD, borderColor: GOLD_SOFT },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={NIGHT_CARD} />
                    ) : (
                      <Text style={[styles.buyBtnText, { color: NIGHT_CARD, fontWeight: '900' }]}>
                        {canAffordExplained
                          ? currentTier === 'visual'
                            ? 'Açıklamalı Sürüme Yükselt ✨'
                            : 'Açıklamalı Desteyi Satın Al ✨'
                          : 'Coin Yükle & Satın Al'}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>

            {/* Direct Play Button if owned */}
            {(currentTier === 'visual' || currentTier === 'explained') && (
              <Pressable
                onPress={onDirectPlay}
                style={({ pressed }) => [styles.playNowBtn, pressed && styles.btnPressed]}
              >
                <MaterialCommunityIcons name="cards-playing" size={20} color={NIGHT_CARD} />
                <Text style={styles.playNowText}>Desteyle Masaya Geç & Fal Bak</Text>
                <Ionicons name="arrow-forward" size={16} color={NIGHT_CARD} />
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0F091F',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    overflow: 'hidden',
  },
  headerBar: {
    height: 6,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  coinText: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  titleWrap: {
    marginBottom: 8,
  },
  deckTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  deckTagline: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
    marginTop: 3,
  },
  deckDesc: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sampleScroll: {
    gap: 10,
    paddingBottom: 16,
  },
  sampleCardBox: {
    width: 72,
    height: 112,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 10, 38, 0.8)',
    alignItems: 'center',
  },
  sampleCardImg: {
    width: '100%',
    height: 86,
  },
  sampleCardPlaceholder: {
    width: '100%',
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sampleSuitSymbol: {
    fontSize: 24,
  },
  sampleRankLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  sampleCardName: {
    fontSize: 9.5,
    color: '#CBD5E1',
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  optionsWrap: {
    gap: 14,
    marginVertical: 10,
  },
  optionCard: {
    backgroundColor: 'rgba(22, 13, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    gap: 6,
  },
  optionCardPremium: {
    backgroundColor: 'rgba(38, 20, 70, 0.85)',
    borderWidth: 1.6,
  },
  optionCardOwned: {
    borderColor: '#10B981',
  },
  premiumBadgeHeader: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '900',
  },
  optionFeature: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  optionFeatureMuted: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  buyBtn: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  playNowText: {
    fontSize: 14,
    fontWeight: '900',
    color: NIGHT_CARD,
    letterSpacing: 0.3,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
