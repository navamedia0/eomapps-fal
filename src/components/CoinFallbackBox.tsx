import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY } from '@/theme/colors';

type Props = {
  cost: number;
  coins: number;
  onContinue: () => void;
  onBuyCoins: () => void;
  onDismiss: () => void;
  dismissLabel?: string;
};

// Shown once the daily free credit is used up, instead of a dead-end
// "come back tomorrow" message — lets the user pay a coin to continue right
// now, or top up if they're short.
export default function CoinFallbackBox({ cost, coins, onContinue, onBuyCoins, onDismiss, dismissLabel }: Props) {
  const canAfford = coins >= cost;

  return (
    <View style={styles.box}>
      <Ionicons name="moon" size={22} color={GOLD} />
      <Text style={styles.text}>Bugünkü ücretsiz fal hakkın doldu.</Text>
      <Text style={styles.subText}>
        {canAfford
          ? `${cost} coin karşılığında hemen devam edebilirsin. Bakiyen: ${coins} coin.`
          : `Devam etmek için ${cost} coin gerekiyor. Bakiyen: ${coins} coin.`}
      </Text>

      {canAfford ? (
        <Pressable onPress={onContinue} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="disc-outline" size={16} color={NIGHT_CARD} />
          <Text style={styles.primaryButtonText}>{cost} Coin Karşılığı Devam Et</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onBuyCoins} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={16} color={NIGHT_CARD} />
          <Text style={styles.primaryButtonText}>Coin Yükle</Text>
        </Pressable>
      )}

      <Pressable onPress={onDismiss} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Text style={styles.secondaryButtonText}>{dismissLabel ?? 'Ana Sayfaya Dön'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  text: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  subText: {
    color: TEXT_PRIMARY,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  secondaryButton: {
    paddingVertical: 6,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
