import celticData from '@/data/ogham_celtic_trees.json';

export type CelticTree = {
  key: string;
  name: string;
  dates: string;
  ruler: string;
  element: string;
  essence: string;
  desc: string;
};

export function getCelticTreeByDate(day: number, month: number): CelticTree {
  // Ay ve güne göre 13 Kelt burcu aralığı
  const m = month;
  const d = day;

  if ((m === 12 && d >= 24) || (m === 1 && d <= 20)) return celticData.trees[0]; // Birch
  if ((m === 1 && d >= 21) || (m === 2 && d <= 17)) return celticData.trees[1]; // Rowan
  if ((m === 2 && d >= 18) || (m === 3 && d <= 17)) return celticData.trees[2]; // Ash
  if ((m === 3 && d >= 18) || (m === 4 && d <= 14)) return celticData.trees[3]; // Alder
  if ((m === 4 && d >= 15) || (m === 5 && d <= 12)) return celticData.trees[4]; // Willow
  if ((m === 5 && d >= 13) || (m === 6 && d <= 9)) return celticData.trees[5]; // Hawthorn
  if ((m === 6 && d >= 10) || (m === 7 && d <= 7)) return celticData.trees[6]; // Oak
  if ((m === 7 && d >= 8) || (m === 8 && d <= 4)) return celticData.trees[7]; // Holly
  if ((m === 8 && d >= 5) || (m === 9 && d <= 1)) return celticData.trees[8]; // Hazel
  if ((m === 9 && d >= 2) || (m === 9 && d <= 29)) return celticData.trees[9]; // Vine
  if ((m === 9 && d >= 30) || (m === 10 && d <= 27)) return celticData.trees[10]; // Ivy
  if ((m === 10 && d >= 28) || (m === 11 && d <= 24)) return celticData.trees[11]; // Reed
  return celticData.trees[12]; // Elder (25 Nov - 23 Dec)
}
