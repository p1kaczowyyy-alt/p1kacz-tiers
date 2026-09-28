import type { Tier } from '../types/database';

export const TIER_ORDER: Tier[] = ['HT1', 'MT1', 'LT1', 'HT2', 'MT2', 'LT2', 'HT3', 'MT3', 'LT3', 'HT4', 'MT4', 'LT4', 'HT5', 'MT5', 'LT5', 'NOTIER'];

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
  LT5: 'bg-netherite-600/70 text-white',
  MT5: 'bg-netherite-500 text-white',
  MT4: 'bg-mcgreen-500/80 text-deepslate-950',
  MT3: 'bg-mcblue-500/80 text-white',
  MT2: 'bg-enchant-500/80 text-white',
  MT1: 'bg-mcgold-500/85 text-deepslate-950',
  NOTIER: 'bg-deepslate-600 text-netherite-300 border border-netherite-500/50'
};

export function minecraftHeadUrl(uuid: string, size = 64): string {
  const cleanUuid = uuid?.trim();
  if (!cleanUuid) return '';
  // Crafthead pulls fresh from Mojang's session server and caches less
  // aggressively than Crafatar, so skin changes show up faster.
  return `https://crafthead.net/avatar/${cleanUuid}/${size}`;
}


export const TIER_POINTS: Record<Tier, number> = {
  NOTIER: 0,
  LT5: 1, MT5: 2, HT5: 3,
  LT4: 4, MT4: 5, HT4: 7,
  LT3: 9, MT3: 12, HT3: 15,
  LT2: 20, MT2: 25, HT2: 30,
  LT1: 40, MT1: 48, HT1: 60
};

export function tierPoints(tier: Tier): number {
  return TIER_POINTS[tier] ?? 0;
}
