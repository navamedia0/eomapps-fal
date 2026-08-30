import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import DeckPurchaseModal from '@/components/DeckPurchaseModal';
import { POPULAR_CARD_DECKS, type CardDeckInfo } from '@/constants/cardDecksData';
import {
  getAllDeckTiers,
  getDeckTier,
  purchaseDeckWithCoins,
  subscribeDeckOwnership,
  type DeckTier,
} from '@/services/deckOwnership';
import { getCoins, subscribeCoins } from '@/services/coins';
import { showAlert } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDeckHub'>;

export default function CardDeckHubScreen({ navigation }: Props) {
  const [deckTiers, setDeckTiers] = useState<Record<string, DeckTier>>({});
  const [coins, setCoins] = useState(100);
  const [selectedDeckForModal, setSelectedDeckForModal] = useState<CardDeckInfo | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const refresh = useCallback(async () => {
    const deckIds = POPULAR_CARD_DECKS.map((d) => d.id);
    const [tiers, coinBalance] = await Promise.all([
      getAllDeckTiers(deckIds),
      getCoins(),
    ]);
    setDeckTiers(tiers);
    setCoins(coinBalance);
  }, []);

  useEffect(() => {
    refresh();
    const unsubDeck = subscribeDeckOwnership(() => refresh());
    const unsubCoins = subscribeCoins((newCoins) => setCoins(newCoins));
    return () => {
      unsubDeck();
      unsubCoins();
    };
  }, [refresh]);

  const handleDeckPress = (deck: CardDeckInfo) => {
    const tier = deckTiers[deck.id] || 'none';
    if (tier === 'visual' || tier === 'explained') {
      // Doğrudan masaya geç
      navigation.navigate('CardDeckTable', { deckId: deck.id });
    } else {
      // Satın alma veya inceleme modalını aç
      setSelectedDeckForModal(deck);
    }
  };

  const handleBuyVisual = async () => {
    if (!selectedDeckForModal) return;
    setPurchaseLoading(true);
    const res = await purchaseDeckWithCoins(
      selectedDeckForModal.id,
      'visual',
      selectedDeckForModal.priceVisualCoins,
    );
    setPurchaseLoading(false);
    if (res.success) {
      showAlert('Tebrikler! ✨', `${selectedDeckForModal.title} (Görsel Sürüm) koleksiyonuna eklendi!`);
      refresh();
      setSelectedDeckForModal(null);
      navigation.navigate('CardDeckTable', { deckId: selectedDeckForModal.id });
    } else {
      showAlert('İşlem Başarısız', res.error || 'Satın alma tamamlanamadı.');
    }
  };

  const handleBuyExplained = async () => {
    if (!selectedDeckForModal) return;
    setPurchaseLoading(true);
    const currentTier = deckTiers[selectedDeckForModal.id] || 'none';
    const cost =
      currentTier === 'visual'
        ? Math.max(0, selectedDeckForModal.priceExplainedCoins - selectedDeckForModal.priceVisualCoins)
        : selectedDeckForModal.priceExplainedCoins;

    const res = await purchaseDeckWithCoins(selectedDeckForModal.id, 'explained', cost);
    setPurchaseLoading(false);
    if (res.success) {
      showAlert('Muhteşem! ✨', `${selectedDeckForModal.title} (Açıklamalı Sürüm) tüm rehberliğiyle açıldı!`);
      refresh();
      setSelectedDeckForModal(null);
      navigation.navigate('CardDeckTable', { deckId: selectedDeckForModal.id });
    } else {
      showAlert('İşlem Başarısız', res.error || 'Satın alma tamamlanamadı.');
    }
  };

  return (
    <MysticTableBackground variant="general">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Üst Başlık & Coin Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={GOLD} />
          </Pressable>

          <View style={styles.coinPill}>
            <Ionicons name="disc" size={16} color={GOLD} />
            <Text style={styles.coinPillText}>{coins} Coin</Text>
            <Pressable
              onPress={() => navigation.navigate('CoinShop')}
              style={styles.coinAddBtn}
              hitSlop={6}
            >
              <Ionicons name="add" size={14} color={NIGHT_CARD} />
            </Pressable>
          </View>
        </View>

        <View style={styles.header}>
          <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Kendi Kartlarınla Fal Bak</Text>
        </View>
        <Text style={styles.headerCaption}>
          Dünyanın en popüler kehanet desteleri ile ister kendine, ister arkadaşına fal aç
        </Text>

        {/* 8 Deste Vitrin Listesi */}
        <View style={styles.deckList}>
          {POPULAR_CARD_DECKS.map((deck) => {
            const tier = deckTiers[deck.id] || 'none';
            const isOwned = tier === 'visual' || tier === 'explained';

            return (
              <Pressable
                key={deck.id}
                onPress={() => handleDeckPress(deck)}
                style={({ pressed }) => [styles.showcaseCard, pressed && styles.showcaseCardPressed]}
              >
                <ImageBackground
                  source={deck.sectionBg}
                  style={styles.showcaseBg}
                  imageStyle={styles.showcaseImage}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={[
                      'rgba(8, 4, 18, 0.20)',
                      'rgba(8, 4, 18, 0.40)',
                      'rgba(8, 4, 18, 0.85)',
                    ]}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <View style={styles.showcaseContent}>
                    {/* Üst Kısım: Başlık, Tam Açıklama ve Etiketler */}
                    <View style={styles.topSectionWrap}>
                      <View style={styles.topRow}>
                        <View style={styles.titleWrap}>
                          <Text style={[styles.deckCardTitle, { color: deck.accent }]}>
                            {deck.title}
                          </Text>
                          <Text style={styles.deckCardTagline}>
                            {deck.tagline}
                          </Text>
                        </View>

                        {/* Durum Rozeti */}
                        {tier === 'explained' ? (
                          <View style={[styles.tierBadge, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]}>
                            <Ionicons name="sparkles" size={12} color="#10B981" />
                            <Text style={[styles.tierBadgeText, { color: '#10B981' }]}>Açıklamalı</Text>
                          </View>
                        ) : tier === 'visual' ? (
                          <View style={[styles.tierBadge, { backgroundColor: 'rgba(56, 189, 248, 0.25)', borderColor: '#38BDF8' }]}>
                            <Ionicons name="image" size={12} color="#38BDF8" />
                            <Text style={[styles.tierBadgeText, { color: '#38BDF8' }]}>Görsel Açık</Text>
                          </View>
                        ) : (
                          <View style={[styles.tierBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: GOLD }]}>
                            <Ionicons name="lock-closed" size={12} color={GOLD} />
                            <Text style={[styles.tierBadgeText, { color: GOLD }]}>
                              {deck.priceVisualCoins === 0 ? 'Ücretsiz' : `${deck.priceVisualCoins} Coin`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Tag Şeritleri — Artık üstte, başlığın hemen altında */}
                      <View style={styles.tagsRow}>
                        {deck.tags.map((tag, idx) => (
                          <View key={idx} style={[styles.tagPill, { borderColor: deck.accent + '55', backgroundColor: 'rgba(10, 6, 20, 0.7)' }]}>
                            <Text style={[styles.tagText, { color: '#F1F5F9' }]}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Alt Keşfet & Masaya Geç Şeridi */}
                    <View style={styles.bottomRow}>
                      <View
                        style={[
                          styles.explorePill,
                          {
                            backgroundColor: deck.accent + '25',
                            borderColor: deck.accent + '77',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons name="cards-playing" size={15} color={deck.accent} />
                        <Text style={[styles.explorePillText, { color: deck.accent }]}>
                          {isOwned ? 'Masaya Geç & Fal Bak' : 'İncele & Kilidi Aç'}
                        </Text>
                        <Ionicons name="arrow-forward" size={13} color={deck.accent} />
                      </View>

                      {/* Upgrade Quick Button if visual */}
                      {tier === 'visual' && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedDeckForModal(deck);
                          }}
                          style={[styles.upgradePill, { borderColor: GOLD_SOFT }]}
                        >
                          <Ionicons name="arrow-up-circle" size={13} color={GOLD} />
                          <Text style={styles.upgradePillText}>Rehberi Aç</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Satın Alma / İnceleme Modalı */}
      <DeckPurchaseModal
        visible={!!selectedDeckForModal}
        deck={selectedDeckForModal}
        currentTier={selectedDeckForModal ? deckTiers[selectedDeckForModal.id] || 'none' : 'none'}
        coins={coins}
        loading={purchaseLoading}
        onBuyVisual={handleBuyVisual}
        onBuyExplained={handleBuyExplained}
        onNeedCoins={() => {
          setSelectedDeckForModal(null);
          navigation.navigate('CoinShop');
        }}
        onClose={() => setSelectedDeckForModal(null)}
        onDirectPlay={() => {
          if (selectedDeckForModal) {
            const id = selectedDeckForModal.id;
            setSelectedDeckForModal(null);
            navigation.navigate('CardDeckTable', { deckId: id });
          }
        }}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.14)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
  },
  coinPillText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
  },
  coinAddBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerCaption: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  deckList: {
    width: '100%',
    gap: 18,
  },
  showcaseCard: {
    width: '100%',
    height: 250,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 7,
  },
  showcaseCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  showcaseBg: {
    width: '100%',
    height: '100%',
  },
  showcaseImage: {
    borderRadius: 22,
  },
  showcaseContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topSectionWrap: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  deckCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  deckCardTagline: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tierBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  explorePillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  upgradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  upgradePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
});
