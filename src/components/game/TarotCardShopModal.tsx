import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TAROT_CARDS,
  type TarotCard,
  getUnlockedTarotCards,
  buyTarotCard,
  calculateCollectionStats,
} from '@/services/tarotCollection';
import { showAlert } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onCardPurchased?: () => void;
};

export default function TarotCardShopModal({ visible, onClose, onCardPurchased }: Props) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const loadCards = async () => {
    const ids = await getUnlockedTarotCards();
    setUnlockedIds(ids);
  };

  useEffect(() => {
    if (visible) {
      loadCards();
    }
  }, [visible]);

  const stats = calculateCollectionStats(unlockedIds);

  const handleBuy = async (card: TarotCard) => {
    const result = await buyTarotCard(card.id);
    showAlert(result.success ? 'Koleksiyona Eklendi!' : 'İşlem Başarısız', result.message);
    if (result.success) {
      await loadCards();
      onCardPurchased?.();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <LinearGradient colors={['#2D1B69', '#140D36']} style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="cards-playing-outline" size={24} color={GOLD} />
              <View>
                <Text style={styles.headerTitle}>Mistik Kart Tapınağı</Text>
                <Text style={styles.headerSubtitle}>Özel Tarot Kartları & Koleksiyon Puanı</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>

          {/* Collection Status Scoreboard */}
          <LinearGradient colors={['#1E1245', '#0F0A28']} style={styles.scoreBanner}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>Koleksiyon Puanı</Text>
              <View style={styles.scoreValRow}>
                <MaterialCommunityIcons name="star-four-points" size={18} color="#F59E0B" />
                <Text style={styles.scoreValText}>{stats.totalPoints} Puan</Text>
              </View>
            </View>

            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>Koleksiyon Unvanı</Text>
              <View style={styles.rankPill}>
                <Text style={styles.rankPillText}>{stats.rankTitle}</Text>
              </View>
            </View>

            <View style={styles.scoreCol}>
              <Text style={styles.scoreLabel}>Kazanılan Güç</Text>
              <Text style={styles.combatBonusText}>+{stats.totalCombatBonus} Savaş Gücü</Text>
            </View>
          </LinearGradient>

          {/* Cards Grid */}
          <ScrollView contentContainerStyle={styles.cardList} showsVerticalScrollIndicator={false}>
            {TAROT_CARDS.map((card) => {
              const isOwned = unlockedIds.includes(card.id);

              return (
                <View
                  key={card.id}
                  style={[
                    styles.tarotCardItem,
                    { borderColor: card.glowColor },
                    isOwned && styles.tarotCardItemOwned,
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.3)']}
                    style={styles.tarotInner}
                  >
                    {/* Top Row: Arcana & Points */}
                    <View style={styles.cardTopRow}>
                      <View style={[styles.rarityBadge, { backgroundColor: card.glowColor }]}>
                        <Text style={styles.rarityBadgeText}>{card.rarity.toUpperCase()}</Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.pointsText}>+{card.collectionPoints} Puan</Text>
                      </View>
                    </View>

                    {/* Card Center Art Icon */}
                    <View style={[styles.cardArtCircle, { borderColor: card.glowColor }]}>
                      <MaterialCommunityIcons
                        name={card.iconName as never}
                        size={32}
                        color={card.glowColor}
                      />
                    </View>

                    {/* Card Title & Desc */}
                    <Text style={styles.cardTitle}>{card.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {card.description}
                    </Text>

                    {/* Bottom Action */}
                    <View style={styles.cardActionRow}>
                      {isOwned ? (
                        <View style={styles.ownedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.ownedBadgeText}>Koleksiyonda</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => handleBuy(card)} style={styles.buyCardBtn}>
                          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.buyBtnGradient}>
                            <MaterialCommunityIcons name="circle-multiple" size={14} color="#140D36" />
                            <Text style={styles.buyBtnText}>{card.costCoins} Altın</Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.88)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    width: '100%',
    height: SCREEN_H * 0.88,
    backgroundColor: NIGHT_DEEP,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: GOLD,
  },
  headerSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  scoreCol: {
    alignItems: 'center',
    gap: 2,
  },
  scoreLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  scoreValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreValText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F59E0B',
  },
  rankPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderWidth: 1,
    borderColor: '#A855F7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#E9D5FF',
  },
  combatBonusText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#10B981',
  },
  cardList: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  tarotCardItem: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  tarotCardItemOwned: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  tarotInner: {
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  cardTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rarityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#140D36',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pointsText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  cardArtCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(20, 13, 54, 0.9)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 16,
  },
  cardActionRow: {
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ownedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  buyCardBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#140D36',
  },
});
