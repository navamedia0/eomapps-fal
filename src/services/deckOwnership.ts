import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCoins, spendCoins } from '@/services/coins';

export type DeckTier = 'none' | 'visual' | 'explained';

const DECK_OWNERSHIP_PREFIX = 'user_deck_tier_';

type Listener = (deckId: string, tier: DeckTier) => void;
const listeners = new Set<Listener>();

function notify(deckId: string, tier: DeckTier): void {
  listeners.forEach((listener) => listener(deckId, tier));
}

export function subscribeDeckOwnership(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getDeckTier(deckId: string): Promise<DeckTier> {
  try {
    const val = await AsyncStorage.getItem(`${DECK_OWNERSHIP_PREFIX}${deckId}`);
    if (val === 'visual' || val === 'explained') {
      return val;
    }
    // Klasik Tarot varsayılan olarak başlangıçta Görsel sürümü açık gelir
    if (deckId === 'tarot') {
      return 'visual';
    }
    return 'none';
  } catch {
    return deckId === 'tarot' ? 'visual' : 'none';
  }
}

export async function getAllDeckTiers(deckIds: string[]): Promise<Record<string, DeckTier>> {
  const result: Record<string, DeckTier> = {};
  for (const id of deckIds) {
    result[id] = await getDeckTier(id);
  }
  return result;
}

export async function purchaseDeckWithCoins(
  deckId: string,
  targetTier: 'visual' | 'explained',
  priceCoins: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentTier = await getDeckTier(deckId);

    if (currentTier === 'explained') {
      return { success: true };
    }

    if (currentTier === 'visual' && targetTier === 'visual') {
      return { success: true };
    }

    const currentCoins = await getCoins();
    if (currentCoins < priceCoins) {
      return {
        success: false,
        error: `Yetersiz Coin! Bu desteyi açmak için ${priceCoins} Coin gerekiyor. Mevcut bakiyen: ${currentCoins} Coin.`,
      };
    }

    const spent = await spendCoins(priceCoins);
    if (!spent) {
      return { success: false, error: 'Coin harcama işlemi gerçekleştirilemedi.' };
    }

    await AsyncStorage.setItem(`${DECK_OWNERSHIP_PREFIX}${deckId}`, targetTier);
    notify(deckId, targetTier);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Deste satın alımı sırasında bir hata oluştu.',
    };
  }
}
