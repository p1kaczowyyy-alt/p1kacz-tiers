import { Link } from 'react-router-dom';
import MinecraftHead from './MinecraftHead';
import TierBadge from './TierBadge';
import type { Tier } from '../types/database';

interface Props {
  rank: number;
  username: string;
  uuid: string;
  tier: Tier;
  rating: number;
}

const rankClass = (rank: number) => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-amber-700';
  return 'text-netherite-400';
};

export default function PlayerListRow({ rank, username, uuid, tier, rating }: Props) {
  const glow = rank === 1 ? 'border-mcgold-500/80 shadow-[0_0_18px_rgba(245,197,24,0.65)]' : rank === 2 ? 'border-gray-300/80 shadow-[0_0_18px_rgba(209,213,219,0.5)]' : rank === 3 ? 'border-amber-700/80 shadow-[0_0_18px_rgba(180,83,9,0.5)]' : 'border-enchant-500/60 shadow-glow';

  return (
    <div
      className={`stone-panel flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 w-full transition-transform hover:translate-x-1 ${
        ${glow}
      }`}
    >
      <div className="flex items-center gap-3 sm:w-16 shrink-0">
        <span className={`font-pixel text-sm w-8 ${rankClass(rank)}`}>#{rank}</span>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MinecraftHead uuid={uuid} size={40} />
        <div className="min-w-0">
          <div className="text-xl truncate flex items-center gap-2">
            {username}

          </div>
          <div className="sm:hidden text-sm text-netherite-400">
            {`${rating} Rating`}
          </div>
        </div>
      </div>

      <div className="hidden sm:block w-20 text-center">
        <TierBadge tier={tier} />
      </div>

      <div className="hidden sm:block w-28 text-center text-mcgreen-400">
        {`${rating} Rating`}
      </div>

      <div className="flex sm:hidden items-center justify-between gap-3">
        <TierBadge tier={tier} />
      </div>

      <Link
        to={`/player/${username}`}
        className="pixel-border bg-deepslate-700 hover:bg-enchant-600 text-center px-3 py-2 text-sm shrink-0"
      >
        VIEW PROFILE
      </Link>
    </div>
  );
}
