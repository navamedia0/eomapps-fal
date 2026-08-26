import AsyncStorage from '@react-native-async-storage/async-storage';
import angelCards from '@/data/angel_cards.json';

export type AngelCard = { id: string; name: string; moods: string[]; message: string };

const CARDS: AngelCard[] = angelCards;
const STORAGE_KEY = '@mistik-rehber/angel-card-of-day';

type CacheState = { date: string; cardId: string };

const today = () => new Date().toISOString().slice(0, 10);

async function readTodaysCard(): Promise<AngelCard | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed: CacheState | null = raw ? JSON.parse(raw) : null;
  if (!parsed || parsed.date !== today()) return null;
  return CARDS.find((card) => card.id === parsed.cardId) ?? null;
}

export async function hasTodaysAngelCard(): Promise<boolean> {
  return (await readTodaysCard()) !== null;
}

export async function getDailyAngelCard(mood?: string): Promise<AngelCard> {
  const cached = await readTodaysCard();
  if (cached) return cached;

  const pool = mood ? CARDS.filter((card) => card.moods.includes(mood)) : CARDS;
  const source = pool.length ? pool : CARDS;
  const card = source[Math.floor(Math.random() * source.length)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), cardId: card.id }));
  return card;
}
