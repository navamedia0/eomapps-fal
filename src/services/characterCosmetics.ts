import AsyncStorage from '@react-native-async-storage/async-storage';

export type ItemCategory = 'outfit' | 'wings' | 'headwear' | 'weapon' | 'cape';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CosmeticItem = {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  powerBonus: number;
  hpBonus: number;
  atkBonus: number;
  defBonus: number;
  description: string;
  costCoins?: number;
  costDiamonds?: number;
  iconName: string;
  previewHero: 'hero_novice' | 'hero_knight' | 'hero_mage';
};

export type EquippedCosmetics = {
  outfit: string;
  wings: string;
  headwear: string;
  weapon: string;
  cape: string;
};

export type PlayerProfile = {
  level: number;
  exp: number;
  nextExp: number;
  vipLevel: number;
  title: string;
  combatPower: number;
  equipped: EquippedCosmetics;
  unlockedIds: string[];
  lastDailyClaimDate: string | null;
  consecutiveDailyDays: number;
};

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // Kıyafetler (Outfits)
  {
    id: 'outfit_novice',
    name: 'Gezgin Cübbesi',
    category: 'outfit',
    rarity: 'common',
    powerBonus: 80,
    hpBonus: 120,
    atkBonus: 15,
    defBonus: 20,
    description: 'Kasabaya yeni gelen maceracıların rahat kıyafeti.',
    costCoins: 0,
    iconName: 'tshirt-crew-outline',
    previewHero: 'hero_novice',
  },
  {
    id: 'outfit_knight',
    name: 'Altın Aslan Zırhı',
    category: 'outfit',
    rarity: 'legendary',
    powerBonus: 650,
    hpBonus: 950,
    atkBonus: 140,
    defBonus: 180,
    description: 'Efsanevi şövalyelerin dövdüğü kudretli altın zırh.',
    costDiamonds: 350,
    iconName: 'shield-sword',
    previewHero: 'hero_knight',
  },
  {
    id: 'outfit_mage',
    name: 'Yıldız Büyücüsü Elbisesi',
    category: 'outfit',
    rarity: 'epic',
    powerBonus: 480,
    hpBonus: 600,
    atkBonus: 160,
    defBonus: 90,
    description: 'Yıldız tozlarıyla dokunmuş mistik gece elbisesi.',
    costCoins: 2500,
    iconName: 'creation',
    previewHero: 'hero_mage',
  },

  // Kanatlar (Wings)
  {
    id: 'wings_none',
    name: 'Kanatsız',
    category: 'wings',
    rarity: 'common',
    powerBonus: 0,
    hpBonus: 0,
    atkBonus: 0,
    defBonus: 0,
    description: 'Sıradan yürüyüş modu.',
    costCoins: 0,
    iconName: 'close-circle-outline',
    previewHero: 'hero_novice',
  },
  {
    id: 'wings_holy_angel',
    name: 'Kutsal Melek Kanatları',
    category: 'wings',
    rarity: 'legendary',
    powerBonus: 950,
    hpBonus: 1200,
    atkBonus: 220,
    defBonus: 210,
    description: 'Göklerden süzülen parıldayan efsanevi melek kanatları.',
    costDiamonds: 500,
    iconName: 'feather',
    previewHero: 'hero_knight',
  },
  {
    id: 'wings_cosmic_fairy',
    name: 'Kozmik Kelebek Kanatları',
    category: 'wings',
    rarity: 'epic',
    powerBonus: 680,
    hpBonus: 750,
    atkBonus: 180,
    defBonus: 140,
    description: 'Mistik mor yıldız ışıkları saçan parıltılı kelebek kanatları.',
    costCoins: 3800,
    iconName: 'butterfly',
    previewHero: 'hero_mage',
  },

  // Şapkalar / Başlıklar (Headwear)
  {
    id: 'head_none',
    name: 'Başlıksız',
    category: 'headwear',
    rarity: 'common',
    powerBonus: 0,
    hpBonus: 0,
    atkBonus: 0,
    defBonus: 0,
    description: 'Doğal saç stili.',
    costCoins: 0,
    iconName: 'close-circle-outline',
    previewHero: 'hero_novice',
  },
  {
    id: 'head_crown',
    name: 'Hükümdar Altın Tacı',
    category: 'headwear',
    rarity: 'legendary',
    powerBonus: 520,
    hpBonus: 650,
    atkBonus: 110,
    defBonus: 130,
    description: 'Saf altından ve yakutlardan işlenmiş hükümdar tacı.',
    costDiamonds: 280,
    iconName: 'crown',
    previewHero: 'hero_knight',
  },
  {
    id: 'head_witch_hat',
    name: 'Yıldızlı Cadı Şapkası',
    category: 'headwear',
    rarity: 'epic',
    powerBonus: 380,
    hpBonus: 400,
    atkBonus: 130,
    defBonus: 70,
    description: 'Ay ve yıldız tokalı kadife büyücü şapkası.',
    costCoins: 1800,
    iconName: 'wizard-hat',
    previewHero: 'hero_mage',
  },

  // Silahlar / Asalar (Weapons)
  {
    id: 'weapon_novice_wand',
    name: 'Çırak Değneği',
    category: 'weapon',
    rarity: 'common',
    powerBonus: 50,
    hpBonus: 0,
    atkBonus: 30,
    defBonus: 0,
    description: 'Meşe ağacından oyulmuş başlangıç asası.',
    costCoins: 0,
    iconName: 'wand',
    previewHero: 'hero_novice',
  },
  {
    id: 'weapon_holy_sword',
    name: 'Kutsal Işık Kılıcı',
    category: 'weapon',
    rarity: 'legendary',
    powerBonus: 820,
    hpBonus: 300,
    atkBonus: 280,
    defBonus: 110,
    description: 'Rünlerle kutsanmış, parıldayan kadim şövalye kılıcı.',
    costDiamonds: 420,
    iconName: 'sword',
    previewHero: 'hero_knight',
  },
  {
    id: 'weapon_nebula_staff',
    name: 'Kristal Nebula Asası',
    category: 'weapon',
    rarity: 'epic',
    powerBonus: 590,
    hpBonus: 250,
    atkBonus: 220,
    defBonus: 60,
    description: 'Tepesinde elmas kristal parlayan mistik büyü asası.',
    costCoins: 3000,
    iconName: 'flare',
    previewHero: 'hero_mage',
  },

  // Pelerinler (Capes)
  {
    id: 'cape_none',
    name: 'Pelerinsiz',
    category: 'cape',
    rarity: 'common',
    powerBonus: 0,
    hpBonus: 0,
    atkBonus: 0,
    defBonus: 0,
    description: 'Pelerin takılı değil.',
    costCoins: 0,
    iconName: 'close-circle-outline',
    previewHero: 'hero_novice',
  },
  {
    id: 'cape_royal_red',
    name: 'Asil Yakut Pelerin',
    category: 'cape',
    rarity: 'rare',
    powerBonus: 240,
    hpBonus: 350,
    atkBonus: 40,
    defBonus: 60,
    description: 'Altın işlemeli kırmızı asil pelerin.',
    costCoins: 1200,
    iconName: 'coat-rack',
    previewHero: 'hero_knight',
  },
  {
    id: 'cape_stardust',
    name: 'Yıldız Tozu Pelerini',
    category: 'cape',
    rarity: 'epic',
    powerBonus: 450,
    hpBonus: 550,
    atkBonus: 90,
    defBonus: 110,
    description: 'Karanlıkta parlayan gece göğü pelerini.',
    costDiamonds: 220,
    iconName: 'star-shooting',
    previewHero: 'hero_mage',
  },
];

const STORAGE_KEY = 'mistik_player_profile_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  level: 12,
  exp: 1450,
  nextExp: 2500,
  vipLevel: 3,
  title: 'Kasaba Muhafızı',
  combatPower: 1850,
  equipped: {
    outfit: 'outfit_novice',
    wings: 'wings_none',
    headwear: 'head_none',
    weapon: 'weapon_novice_wand',
    cape: 'cape_none',
  },
  unlockedIds: ['outfit_novice', 'wings_none', 'head_none', 'weapon_novice_wand', 'cape_none'],
  lastDailyClaimDate: null,
  consecutiveDailyDays: 0,
};

type ProfileListener = (profile: PlayerProfile) => void;
let cachedProfile: PlayerProfile | null = null;
const listeners = new Set<ProfileListener>();

function notify(): void {
  if (cachedProfile) {
    listeners.forEach((fn) => fn(cachedProfile!));
  }
}

export function subscribePlayerProfile(listener: ProfileListener): () => void {
  listeners.add(listener);
  if (cachedProfile) {
    listener(cachedProfile);
  } else {
    getPlayerProfile().then(listener);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function calculateCombatPower(profile: PlayerProfile): number {
  let basePower = profile.level * 100 + profile.vipLevel * 150;
  const equippedIds = Object.values(profile.equipped);
  for (const id of equippedIds) {
    const item = COSMETIC_ITEMS.find((c) => c.id === id);
    if (item) {
      basePower += item.powerBonus;
    }
  }
  return basePower;
}

export async function getPlayerProfile(): Promise<PlayerProfile> {
  if (cachedProfile) return cachedProfile;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: PlayerProfile = JSON.parse(raw);
      parsed.combatPower = calculateCombatPower(parsed);
      cachedProfile = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('getPlayerProfile error:', err);
  }
  cachedProfile = { ...DEFAULT_PROFILE };
  cachedProfile.combatPower = calculateCombatPower(cachedProfile);
  return cachedProfile;
}

export async function savePlayerProfile(profile: PlayerProfile): Promise<void> {
  profile.combatPower = calculateCombatPower(profile);
  cachedProfile = profile;
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('savePlayerProfile error:', err);
  }
}

export async function equipCosmetic(category: ItemCategory, itemId: string): Promise<PlayerProfile> {
  const profile = await getPlayerProfile();
  const nextEquipped = { ...profile.equipped, [category]: itemId };
  const updated: PlayerProfile = {
    ...profile,
    equipped: nextEquipped,
  };
  await savePlayerProfile(updated);
  return updated;
}

export async function unlockCosmetic(itemId: string): Promise<PlayerProfile> {
  const profile = await getPlayerProfile();
  if (profile.unlockedIds.includes(itemId)) return profile;
  const updated: PlayerProfile = {
    ...profile,
    unlockedIds: [...profile.unlockedIds, itemId],
  };
  await savePlayerProfile(updated);
  return updated;
}

export function getHeroSpriteForEquipped(equipped: EquippedCosmetics): 'hero_knight' | 'hero_mage' | 'hero_novice' {
  if (equipped.wings === 'wings_holy_angel' || equipped.outfit === 'outfit_knight') {
    return 'hero_knight';
  }
  if (equipped.wings === 'wings_cosmic_fairy' || equipped.outfit === 'outfit_mage') {
    return 'hero_mage';
  }
  return 'hero_novice';
}
