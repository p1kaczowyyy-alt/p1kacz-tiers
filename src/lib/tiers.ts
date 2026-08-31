import type { Tier } from '../types/database';

export const TIER_ORDER: Tier[] = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

export const TIER_STYLES: Record<Tier, string> = {
  HT1: 'bg-mcgold-500 text-deepslate-950',
  LT1: 'bg-mcgold-600/70 text-deepslate-950',
  HT2: 'bg-enchant-500 text-white',
  LT2: 'bg-enchant-600/70 text-white',
  HT3: 'bg-mcblue-500 text-white',
  LT3: 'bg-mcblue-600/70 text-white',
  HT4: 'bg-mcgreen-500 text-deepslate-950',
  LT4: 'bg-mcgreen-600/70 text-deepslate-950',
  HT5: 'bg-netherite-500 text-white',
  LT5: 'bg-netherite-600/70 text-white'
};

export function minecraftHeadUrl(uuid: string, size = 64): string {
  const cleanUuid = uuid?.trim();
  if (!cleanUuid) return '';
  // Crafthead pulls fresh from Mojang's session server and caches less
  // aggressively than Crafatar, so skin changes show up faster.
  return `https://crafthead.net/avatar/${cleanUuid}/${size}`;
}


export const TIER_POINTS: Record<Tier, number> = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 6,
  HT3: 10,
  LT2: 16,
  HT2: 28,
  LT1: 44,
  HT1: 60
};

export function tierPoints(tier: Tier): number {
  return TIER_POINTS[tier] ?? 0;
}
