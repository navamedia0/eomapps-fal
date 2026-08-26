import { Ionicons } from '@expo/vector-icons';
import { Modal, View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CardDesign } from '@/constants/cardDesigns';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  design: CardDesign | null;
  coins: number;
  onBuyWithCoins: () => void;
  onBuyWithTL: () => void;
  onNeedCoins: () => void;
  onClose: () => void;
};

export default function CardPurchaseModal({ design, coins, onBuyWithCoins, onBuyWithTL, onNeedCoins, onClose }: Props) {
  const hasEnoughCoins = design ? coins >= design.priceCoins : false;

  return (
    <Modal visible={!!design} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{design?.name}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>
          </View>

          {design && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={design.image} style={styles.preview} resizeMode="cover" />

              <Pressable
                onPress={hasEnoughCoins ? onBuyWithCoins : onNeedCoins}
                style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
              >
                <Ionicons name="disc-outline" size={18} color={NIGHT_CARD} />
                <Text style={styles.optionButtonText}>{design.priceCoins} Coin ile Satın Al</Text>
              </Pressable>
              {!hasEnoughCoins && (
                <Text style={styles.insufficientText}>
                  Yetersiz coin ({coins}/{design.priceCoins}). Coin yüklemek için dokun.
                </Text>
              )}

              <Pressable
                onPress={onBuyWithTL}
                style={({ pressed }) => [styles.optionButtonSecondary, pressed && styles.optionButtonPressed]}
              >
                <Text style={styles.optionButtonSecondaryText}>{design.priceTL} ile Satın Al</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '85%',
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  preview: {
    width: 170,
    height: 283,
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
  },
  optionButtonPressed: {
    opacity: 0.85,
  },
  optionButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  insufficientText: {
    fontSize: 11,
    color: '#E08A8A',
    textAlign: 'center',
    marginTop: 8,
  },
  optionButtonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
  },
  optionButtonSecondaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
  },
});
