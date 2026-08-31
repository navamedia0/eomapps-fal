// Seviye, sunucudaki users.xp'den saf bir formülle türetilir — ayrı bir
// "levels" tablosu/servisi yok. Eğri: seviye N'e ulaşmak için gereken toplam
// xp = 25 * (N-1)^2 (seviye 2: 25xp, 5: 400xp, 10: 2025xp). Bu formül
// server/social-api/src/index.js'teki levelForXp() ile birebir aynı olmalı —
// ikisi de bağımsız, tek satırlık saf fonksiyon olduğu için worker/RN
// arasında ortak pakete gerek duyulmadı.
export function xpForLevel(level: number): number {
  return 25 * Math.pow(Math.max(1, level) - 1, 2);
}

export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1;
}

export type XpProgress = {
  level: number;
  levelStartXp: number;
  levelEndXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  ratio: number;
};

export function xpProgress(xp: number): XpProgress {
  const level = levelForXp(xp);
  const levelStartXp = xpForLevel(level);
  const levelEndXp = xpForLevel(level + 1);
  const span = levelEndXp - levelStartXp;
  const ratio = span > 0 ? Math.min(1, Math.max(0, (xp - levelStartXp) / span)) : 1;
  return {
    level,
    levelStartXp,
    levelEndXp,
    xpIntoLevel: Math.max(0, xp - levelStartXp),
    xpForNextLevel: span,
    ratio,
  };
}
