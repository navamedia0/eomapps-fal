import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { CARD_DESIGNS, type CardDesign } from '@/constants/cardDesigns';
import {
  getOwnedDesignIds,
  getSelectedDesignId,
  selectDesign,
  purchaseDesignWithCoins,
  purchaseDesignWithTL,
} from '@/services/cardDesigns';
import { getCoins } from '@/services/coins';
import CardPurchaseModal from '@/components/CardPurchaseModal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { showAlert } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CardDesigns'>;

export default function CardDesignsScreen({ navigation }: Props) {
  const [ownedIds, setOwnedIds] = useState<string[]>(['default']);
  const [selectedId, setSelectedId] = useState('default');
  const [coins, setCoins] = useState(0);
  const [purchaseTarget, setPurchaseTarget] = useState<CardDesign | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(() => {
    Promise.all([getOwnedDesignIds(), getSelectedDesignId(), getCoins()]).then(([owned, selected, coinBalance]) => {
      setOwnedIds(owned);
      setSelectedId(selected);
      setCoins(coinBalance);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePress = useCallback(
    (design: CardDesign) => {
      if (ownedIds.includes(design.id)) {
        selectDesign(design.id).then(() => setSelectedId(design.id));
      } else {
        setPurchaseTarget(design);
      }
    },
    [ownedIds],
  );

  const buyWithCoins = useCallback(async () => {
    if (!purchaseTarget) return;
    try {
      const success = await purchaseDesignWithCoins(purchaseTarget.id);
      if (success) {
        await selectDesign(purchaseTarget.id);
        setFeedback(`${purchaseTarget.name} kilidi açıldı! ✨`);
        setPurchaseTarget(null);
        refresh();
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch (err) {
      showAlert('Alınamadı', err instanceof Error ? err.message : 'Bir sorun oluştu, coin iade edildi.');
    }
  }, [purchaseTarget, refresh]);

  const buyWithTL = useCallback(async () => {
    if (!purchaseTarget) return;
    await purchaseDesignWithTL(purchaseTarget.id);
    await selectDesign(purchaseTarget.id);
    setFeedback(`${purchaseTarget.name} kilidi açıldı! ✨`);
    setPurchaseTarget(null);
    refresh();
    setTimeout(() => setFeedback(null), 2500);
  }, [purchaseTarget, refresh]);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.coinBadge}>
            <Ionicons name="disc-outline" size={16} color={GOLD} />
            <Text style={styles.coinBadgeText}>{coins} Coin</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.coinShopButton}>
            <Ionicons name="add-circle-outline" size={16} color={NIGHT_CARD} />
            <Text style={styles.coinShopButtonText}>Coin Yükle</Text>
          </Pressable>
        </View>

        <Text style={styles.instruction}>
          Buradan seçtiğin tasarım, Tarot Falı'nda kartları seçtiğin ekrandaki kartların arka yüzünü değiştirir.
          Kartların ön yüzündeki fal görselleri etkilenmez.
        </Text>

        {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

        <View style={styles.grid}>
          {CARD_DESIGNS.map((design) => {
            const owned = ownedIds.includes(design.id);
            const isSelected = selectedId === design.id;
            return (
              <Pressable key={design.id} onPress={() => handlePress(design)} style={styles.designCard}>
                <Image source={design.image} style={styles.designImage} resizeMode="cover" />
                {!owned && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={22} color={NIGHT_CARD} />
                  </View>
                )}
                {isSelected && owned && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={14} color={NIGHT_CARD} />
                  </View>
                )}
                <Text style={styles.designName}>{design.name}</Text>
                <Text style={styles.designPrice}>
                  {design.free ? 'Ücretsiz' : `${design.priceCoins} Coin · ${design.priceTL}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <CardPurchaseModal
        design={purchaseTarget}
        coins={coins}
        onBuyWithCoins={buyWithCoins}
        onBuyWithTL={buyWithTL}
        onNeedCoins={() => {
          setPurchaseTarget(null);
          navigation.navigate('CoinShop');
        }}
        onClose={() => setPurchaseTarget(null)}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  coinBadgeText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '700',
  },
  coinShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  coinShopButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  instruction: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  designCard: {
    width: 108,
    alignItems: 'center',
    gap: 4,
  },
  designImage: {
    width: 108,
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 108,
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  designName: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 4,
  },
  designPrice: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
