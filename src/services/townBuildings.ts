import { getCoins, spendCoins } from './coins';

export type BuildingStatus = 'ruined' | 'built' | 'stored';

export type TownBuildingData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: BuildingStatus;
  level: number;
  maxLevel: number;
  repairCostCoins: number;
  upgradeCostCoins: number;
  glowColor: string;
  route?: string;
  kind?: 'route' | 'wardrobe' | 'tarot_shop';
  isExpansion?: boolean;
};

export const INITIAL_BUILDINGS: Record<string, TownBuildingData> = {
  'birlik-kulubu': {
    id: 'birlik-kulubu',
    title: 'Klan Kalesi',
    subtitle: 'Birlik Kulübü & Şato',
    description: 'Eski savaşlardan kalan kadim kale. Onarıldığında kasaba üyeleriyle klan kurup boss avlayabilirsiniz.',
    icon: 'shield-crown',
    status: 'ruined',
    level: 0,
    maxLevel: 5,
    repairCostCoins: 300,
    upgradeCostCoins: 600,
    glowColor: '#38BDF8',
    kind: 'route',
  },
  'oyun-salonu': {
    id: 'oyun-salonu',
    title: 'Oyun Salonu',
    subtitle: 'Mistik Karnaval Arenası',
    description: 'Karnaval çadırını inşa ederek çok oyunculu mini oyunlara ve mistik turnuvalara katılın.',
    icon: 'gamepad-variant',
    status: 'ruined',
    level: 0,
    maxLevel: 5,
    repairCostCoins: 250,
    upgradeCostCoins: 500,
    glowColor: '#EC4899',
    route: 'MiniGames',
    kind: 'route',
  },
  'kart-dukkani': {
    id: 'kart-dukkani',
    title: 'Mistik Kart Tapınağı',
    subtitle: 'Özel Tarot Kartları & Koleksiyon',
    description: 'Özel altın yaldızlı tarot kartları edin, koleksiyon puanını ve kasaba gücünü zirveye taşı.',
    icon: 'cards-playing-outline',
    status: 'built',
    level: 1,
    maxLevel: 5,
    repairCostCoins: 0,
    upgradeCostCoins: 400,
    glowColor: '#F59E0B',
    kind: 'tarot_shop',
  },
  'nikah-salonu': {
    id: 'nikah-salonu',
    title: 'Nikah Salonu',
    subtitle: 'Sevgi & Nişan Mabedi',
    description: 'Gül bahçeleriyle çevrili nikah tapınağı. Onarıldığında mistik eşleşme ve nişan törenleri açılır.',
    icon: 'ring',
    status: 'ruined',
    level: 0,
    maxLevel: 5,
    repairCostCoins: 350,
    upgradeCostCoins: 700,
    glowColor: '#F43F5E',
    kind: 'route',
  },
  'alisveris-merkezi': {
    id: 'alisveris-merkezi',
    title: 'Büyü Dükkanı',
    subtitle: 'Kıyafet, Kanat & Gardırop',
    description: 'Karakterin için efsanevi kanatlar, cübbeler, taçlar ve asalar kuşanabileceğin büyü butiği.',
    icon: 'storefront',
    status: 'built',
    level: 1,
    maxLevel: 5,
    repairCostCoins: 0,
    upgradeCostCoins: 350,
    glowColor: '#A855F7',
    kind: 'wardrobe',
  },
  'ciftlik': {
    id: 'ciftlik',
    title: 'Mistik Çiftlik',
    subtitle: 'Bahçe & Büyülü Hasat',
    description: 'Mistik tohumlar ekip hasat toplayacağınız bereketli çiftlik.',
    icon: 'flower-tulip',
    status: 'built',
    level: 1,
    maxLevel: 5,
    repairCostCoins: 0,
    upgradeCostCoins: 300,
    glowColor: '#10B981',
    route: 'Garden',
    kind: 'route',
  },
  'kesif-rihtimi': {
    id: 'kesif-rihtimi',
    title: 'Keşif Rıhtımı',
    subtitle: 'Hyper-Casual Keşif Oyunları',
    description: 'Rıhtımı onararak gemileri denize indirin ve bilinmeyen adalara keşfe çıkın.',
    icon: 'compass',
    status: 'ruined',
    level: 0,
    maxLevel: 5,
    repairCostCoins: 400,
    upgradeCostCoins: 800,
    glowColor: '#06B6D4',
    route: 'KesifSalonu',
    kind: 'route',
  },
  'onur-listesi': {
    id: 'onur-listesi',
    title: 'Onur Listesi',
    subtitle: 'En Güçlüler & Zafer Rotundası',
    description: 'Kasabanın en yüksek savaş gücüne ve kart koleksiyonuna sahip kahramanlarının anıtı.',
    icon: 'trophy',
    status: 'built',
    level: 1,
    maxLevel: 5,
    repairCostCoins: 0,
    upgradeCostCoins: 500,
    glowColor: '#F59E0B',
    route: 'Popularity',
    kind: 'route',
  },
};

type BuildingsListener = (buildings: Record<string, TownBuildingData>) => void;
let cachedBuildings: Record<string, TownBuildingData> | null = null;
const listeners = new Set<BuildingsListener>();

function notify(): void {
  if (cachedBuildings) {
    listeners.forEach((fn) => fn({ ...cachedBuildings! }));
  }
}

export function subscribeTownBuildings(listener: BuildingsListener): () => void {
  listeners.add(listener);
  if (cachedBuildings) {
    listener({ ...cachedBuildings });
  } else {
    getTownBuildings().then((b) => listener({ ...b }));
  }
  return () => {
    listeners.delete(listener);
  };
}

import { saveSecureItem, getSecureItem } from './secureEconomy';

const TOWN_BUILDINGS_KEY = 'town_buildings_state';

export async function getTownBuildings(): Promise<Record<string, TownBuildingData>> {
  if (cachedBuildings) return cachedBuildings;
  const stored = await getSecureItem<Record<string, TownBuildingData> | null>(TOWN_BUILDINGS_KEY, null);
  const data = stored ? { ...INITIAL_BUILDINGS, ...stored } : { ...INITIAL_BUILDINGS };
  cachedBuildings = data;
  return data;
}

export async function saveTownBuildings(data: Record<string, TownBuildingData>): Promise<void> {
  cachedBuildings = data;
  notify();
  await saveSecureItem(TOWN_BUILDINGS_KEY, data);
}

export async function repairBuilding(buildingId: string): Promise<{ success: boolean; message: string }> {
  const all = await getTownBuildings();
  const target = all[buildingId];
  if (!target) return { success: false, message: 'Bina bulunamadı.' };

  if (target.status === 'built') {
    return { success: false, message: 'Bu bina zaten inşa edilmiş durumda.' };
  }

  const cost = target.repairCostCoins;
  const currentCoins = await getCoins();
  if (currentCoins < cost) {
    return { success: false, message: `Yetersiz altın! Bu binayı onarmak için ${cost} Altın gerekiyor.` };
  }

  await spendCoins(cost);

  const updated: Record<string, TownBuildingData> = {
    ...all,
    [buildingId]: {
      ...target,
      status: 'built',
      level: 1,
    },
  };

  await saveTownBuildings(updated);
  return { success: true, message: `Tebrikler! ${target.title} başarıyla onarıldı ve Seviye 1 olarak açıldı!` };
}

export async function upgradeBuilding(buildingId: string): Promise<{ success: boolean; message: string }> {
  const all = await getTownBuildings();
  const target = all[buildingId];
  if (!target) return { success: false, message: 'Bina bulunamadı.' };

  if (target.level >= target.maxLevel) {
    return { success: false, message: 'Bu bina maksimum seviyeye ulaştı!' };
  }

  const cost = target.upgradeCostCoins * target.level;
  const currentCoins = await getCoins();
  if (currentCoins < cost) {
    return { success: false, message: `Yetersiz altın! Seviye ${target.level + 1} için ${cost} Altın gerekiyor.` };
  }

  await spendCoins(cost);

  const updated: Record<string, TownBuildingData> = {
    ...all,
    [buildingId]: {
      ...target,
      level: target.level + 1,
    },
  };

  await saveTownBuildings(updated);
  return { success: true, message: `${target.title} başarıyla Seviye ${target.level + 1}'e yükseltildi!` };
}

export async function toggleStoreBuilding(buildingId: string): Promise<{ success: boolean; message: string }> {
  const all = await getTownBuildings();
  const target = all[buildingId];
  if (!target) return { success: false, message: 'Bina bulunamadı.' };

  const isCurrentlyStored = target.status === 'stored';
  const newStatus: BuildingStatus = isCurrentlyStored ? 'built' : 'stored';

  const updated: Record<string, TownBuildingData> = {
    ...all,
    [buildingId]: {
      ...target,
      status: newStatus,
    },
  };

  await saveTownBuildings(updated);
  return {
    success: true,
    message: isCurrentlyStored
      ? `${target.title} kasabaya yeniden yerleştirildi!`
      : `${target.title} envantere/depoya kaldırıldı.`,
  };
}
