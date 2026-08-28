const AVATAR_PALETTE = ['#8B5CF6', '#B4232A', '#B8862E', '#2F8F5B', '#6D3FD4', '#C1750E'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
