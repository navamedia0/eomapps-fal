

export type TarotCard = {
  id: string;
  name: string;
  arcanaType: 'Major' | 'Minor';
  rarity: 'rare' | 'epic' | 'legendary';
  description: string;
  collectionPoints: number;
  combatBonus: number;
  costCoins: number;
  iconName: string;
  glowColor: string;
};

export const TAROT_CARDS: TarotCard[] = [
  {
    id: 'card_magician',
    name: 'I. Büyücü (The Magician)',
    arcanaType: 'Major',
    rarity: 'rare',
    description: 'Evrenin dört elementini kontrol eden kadim irade. Sezgileri ve büyü gücünü artırır.',
    collectionPoints: 75,
    combatBonus: 150,
    costCoins: 250,
    iconName: 'auto-fix',
    glowColor: '#38BDF8',
  },
  {
    id: 'card_empress',
    name: 'III. İmparatoriçe (The Empress)',
    arcanaType: 'Major',
    rarity: 'rare',
    description: 'Bereket, zarafet ve doğanın sonsuz yaratıcı gücü. Günlük altın gelirini artırır.',
    collectionPoints: 90,
    combatBonus: 180,
    costCoins: 300,
    iconName: 'crown',
    glowColor: '#EC4899',
  },
  {
    id: 'card_wheel_of_fortune',
    name: 'X. Kader Çarkı (Wheel of Fortune)',
    arcanaType: 'Major',
    rarity: 'epic',
    description: 'Kaderin dönen çarkı. Şans faktörünü yükseltir ve mini oyunlarda ekstra ödül şansı verir.',
    collectionPoints: 160,
    combatBonus: 320,
    costCoins: 500,
    iconName: 'ferris-wheel',
    glowColor: '#A855F7',
  },
  {
    id: 'card_the_moon',
    name: 'XVIII. Ay (The Moon)',
    arcanaType: 'Major',
    rarity: 'epic',
    description: 'Bilinçaltının derinlikleri ve mistik gece enerjisi. Fal odalarında gizli mesajları açar.',
    collectionPoints: 180,
    combatBonus: 360,
    costCoins: 600,
    iconName: 'moon-waning-crescent',
    glowColor: '#818CF8',
  },
  {
    id: 'card_the_sun',
    name: 'XIX. Güneş (The Sun)',
    arcanaType: 'Major',
    rarity: 'legendary',
    description: 'Mutlak aydınlanma, zafer ve saf ışık enerjisi. Kasaba sıralamasında parıldayan altın aura kazandırır.',
    collectionPoints: 300,
    combatBonus: 600,
    costCoins: 950,
    iconName: 'white-balance-sunny',
    glowColor: '#F59E0B',
  },
  {
    id: 'card_the_world',
    name: 'XXI. Dünya (The World)',
    arcanaType: 'Major',
    rarity: 'legendary',
    description: 'Tüm evrensel döngünün tamamlanışı. En yüksek koleksiyon puanını ve efsanevi unvanı bahşeder.',
    collectionPoints: 450,
    combatBonus: 900,
    costCoins: 1400,
    iconName: 'earth',
    glowColor: '#10B981',
  },
];

import { getCoins, spendCoins } from './coins';
import { saveSecureItem, getSecureItem } from './secureEconomy';

const TAROT_CARDS_KEY = 'unlocked_tarot_cards';

export async function getUnlockedTarotCards(): Promise<string[]> {
  return await getSecureItem<string[]>(TAROT_CARDS_KEY, ['card_magician']);
}

export async function buyTarotCard(cardId: string): Promise<{ success: boolean; message: string }> {
  const card = TAROT_CARDS.find((c) => c.id === cardId);
  if (!card) return { success: false, message: 'Kart bulunamadı.' };

  const currentUnlocked = await getUnlockedTarotCards();
  if (currentUnlocked.includes(cardId)) {
    return { success: false, message: 'Bu karta zaten sahipsiniz.' };
  }

  const coins = await getCoins();
  if (coins < card.costCoins) {
    return { success: false, message: `Yetersiz altın! Bu kart için ${card.costCoins} Altın gerekiyor.` };
  }

  await spendCoins(card.costCoins);
  const updated = [...currentUnlocked, cardId];
  await saveSecureItem(TAROT_CARDS_KEY, updated);

  return {
    success: true,
    message: `Tebrikler! ${card.name} koleksiyonunuza eklendi. +${card.collectionPoints} Koleksiyon Puanı ve +${card.combatBonus} Savaş Gücü kazandınız!`,
  };
}

export function calculateCollectionStats(unlockedIds: string[]): { totalPoints: number; totalCombatBonus: number; rankTitle: string } {
  let totalPoints = 0;
  let totalCombatBonus = 0;

  unlockedIds.forEach((id) => {
    const card = TAROT_CARDS.find((c) => c.id === id);
    if (card) {
      totalPoints += card.collectionPoints;
      totalCombatBonus += card.combatBonus;
    }
  });

  let rankTitle = 'Kart Çırağı';
  if (totalPoints >= 1000) rankTitle = 'Büyük Tarot Üstadı';
  else if (totalPoints >= 600) rankTitle = 'Kader Koleksiyoneri';
  else if (totalPoints >= 300) rankTitle = 'Mistik Okuyucu';
  else if (totalPoints >= 100) rankTitle = 'Kart İnisiyesi';

  return { totalPoints, totalCombatBonus, rankTitle };
}
