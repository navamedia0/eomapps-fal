import React, { useState } from 'react';
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
import CharacterAvatarView from './CharacterAvatarView';
import {
  COSMETIC_ITEMS,
  type ItemCategory,
  type PlayerProfile,
  type CosmeticItem,
  equipCosmetic,
  unlockCosmetic,
} from '@/services/characterCosmetics';
import { getCoins, spendCoins } from '@/services/coins';
import { showAlert } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CATEGORIES: { key: ItemCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'outfit', label: 'Kıyafet', icon: 'tshirt-crew-outline' },
  { key: 'wings', label: 'Kanat', icon: 'feather' },
  { key: 'headwear', label: 'Başlık', icon: 'crown-outline' },
  { key: 'weapon', label: 'Silah', icon: 'sword' },
  { key: 'cape', label: 'Pelerin', icon: 'coat-rack' },
];

const RARITY_COLORS: Record<string, { border: string; bg: string; label: string }> = {
  common: { border: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.05)', label: 'Sıradan' },
  rare: { border: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Nadir' },
  epic: { border: '#A855F7', bg: 'rgba(168, 85, 247, 0.18)', label: 'Destansı' },
  legendary: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.22)', label: 'Efsanevi' },
};

const DEFAULT_ITEMS: Record<ItemCategory, string> = {
  outfit: 'outfit_novice',
  wings: 'wings_none',
  headwear: 'head_none',
  weapon: 'weapon_novice_wand',
  cape: 'cape_none',
};

type Props = {
  visible: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onProfileUpdated: (updated: PlayerProfile) => void;
};

export default function CharacterWardrobeModal({ visible, profile, onClose, onProfileUpdated }: Props) {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('outfit');

  const categoryItems = COSMETIC_ITEMS.filter((item) => item.category === activeCategory);

  const handleEquip = async (item: CosmeticItem) => {
    const updated = await equipCosmetic(item.category, item.id);
    onProfileUpdated(updated);
  };

  const handleUnequip = async (category: ItemCategory) => {
    const defaultItemId = DEFAULT_ITEMS[category];
    const updated = await equipCosmetic(category, defaultItemId);
    onProfileUpdated(updated);
  };

  const handleBuyAndEquip = async (item: CosmeticItem) => {
    const coins = await getCoins();

    if (item.costCoins && item.costCoins > 0) {
      if (coins < item.costCoins) {
        showAlert('Yetersiz Altın', `${item.name} için ${item.costCoins} altın gerekiyor.`);
        return;
      }
      await spendCoins(item.costCoins);
    } else if (item.costDiamonds && item.costDiamonds > 0) {
      const diamondInCoins = item.costDiamonds * 10;
      if (coins < diamondInCoins) {
        showAlert('Yetersiz Bakiye', `${item.name} için ${item.costDiamonds} elmas (${diamondInCoins} altın) gerekiyor.`);
        return;
      }
      await spendCoins(diamondInCoins);
    }

    let updated = await unlockCosmetic(item.id);
    updated = await equipCosmetic(item.category, item.id);
    onProfileUpdated(updated);
    showAlert('Kuşanıldı!', `${item.name} başarıyla açıldı ve karakterine giydirildi! +${item.powerBonus} Savaş Gücü kazandın.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <LinearGradient colors={['#2D1B69', '#140D36']} style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="shield-account" size={24} color={GOLD} />
              <Text style={styles.headerTitle}>Gardırop & Karakter</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </LinearGradient>

          {/* Character Stage & Stats */}
          <View style={styles.heroStageWrap}>
            <LinearGradient colors={['#1F1347', '#0E0926']} style={styles.heroStage}>
              {/* Dynamic Live Avatar */}
              <CharacterAvatarView equipped={profile.equipped} size={150} />

              {/* Combat Power Floating Badge */}
              <View style={styles.powerBadge}>
                <MaterialCommunityIcons name="sword-cross" size={16} color="#F59E0B" />
                <Text style={styles.powerBadgeText}>Savaş Gücü: {profile.combatPower.toLocaleString()}</Text>
              </View>

              {/* Title & Level */}
              <View style={styles.heroInfoRow}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>Lv.{profile.level}</Text>
                </View>
                <Text style={styles.heroTitleText}>{profile.title}</Text>
                <View style={styles.vipPill}>
                  <Text style={styles.vipPillText}>VIP {profile.vipLevel}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Category Tabs */}
          <View style={styles.tabsRow}>
            {CATEGORIES.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveCategory(tab.key)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={18}
                    color={isActive ? '#140D36' : TEXT_MUTED}
                  />
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Items Grid */}
          <ScrollView contentContainerStyle={styles.itemsList} showsVerticalScrollIndicator={false}>
            {categoryItems.map((item) => {
              const isEquipped = profile.equipped[activeCategory] === item.id;
              const isUnlocked = profile.unlockedIds.includes(item.id);
              const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
              const isDefault = DEFAULT_ITEMS[activeCategory] === item.id;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    { borderColor: rarityStyle.border, backgroundColor: rarityStyle.bg },
                    isEquipped && styles.itemCardEquipped,
                  ]}
                >
                  <View style={styles.itemHeaderRow}>
                    <View style={[styles.rarityBadge, { borderColor: rarityStyle.border }]}>
                      <Text style={[styles.rarityText, { color: rarityStyle.border }]}>{rarityStyle.label}</Text>
                    </View>
                    <View style={styles.powerBonusRow}>
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color="#F59E0B" />
                      <Text style={styles.powerBonusText}>+{item.powerBonus} Güç</Text>
                    </View>
                  </View>

                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Actions: Giydir / Çıkart / Satın Al */}
                  <View style={styles.itemFooterRow}>
                    {isEquipped ? (
                      <View style={styles.equippedGroup}>
                        <View style={styles.equippedBadge}>
                          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                          <Text style={styles.equippedBadgeText}>Kuşanıldı</Text>
                        </View>
                        {!isDefault && (
                          <Pressable onPress={() => handleUnequip(activeCategory)} style={styles.unequipBtn}>
                            <Text style={styles.unequipBtnText}>Çıkart</Text>
                          </Pressable>
                        )}
                      </View>
                    ) : isUnlocked ? (
                      <Pressable onPress={() => handleEquip(item)} style={styles.equipBtn}>
                        <Text style={styles.equipBtnText}>Kuşan</Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => handleBuyAndEquip(item)} style={styles.buyBtn}>
                        {item.costDiamonds ? (
                          <>
                            <Ionicons name="diamond" size={14} color="#67E8F9" />
                            <Text style={styles.buyBtnText}>{item.costDiamonds} Elmas</Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="circle-multiple" size={14} color={GOLD} />
                            <Text style={styles.buyBtnText}>{item.costCoins} Altın</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
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
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStageWrap: {
    padding: 12,
    alignItems: 'center',
  },
  heroStage: {
    width: '100%',
    height: 195,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  powerBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 10, 35, 0.85)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  powerBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  heroInfoRow: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelPill: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fff',
  },
  heroTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  vipPill: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vipPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabButtonActive: {
    backgroundColor: GOLD,
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  tabButtonTextActive: {
    color: '#140D36',
  },
  itemsList: {
    padding: 14,
    gap: 10,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 12,
    gap: 6,
  },
  itemCardEquipped: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rarityText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  powerBonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  powerBonusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  itemDesc: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  equippedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  equippedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  unequipBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  unequipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  equipBtn: {
    backgroundColor: GOLD,
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  equipBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#140D36',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    borderWidth: 1,
    borderColor: GOLD,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buyBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
  },
});
