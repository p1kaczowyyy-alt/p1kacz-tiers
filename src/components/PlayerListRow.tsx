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
  votes: number;
  votesRequired: number;
}

const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

export default function PlayerListRow({ rank, username, uuid, tier, rating, votes, votesRequired }: Props) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`stone-panel flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 w-full transition-transform hover:translate-x-1 ${
        isTop3 ? 'border-mcgold-500/60 shadow-glow' : ''
      }`}
    >
      <div className="flex items-center gap-3 sm:w-16 shrink-0">
        <span className="font-pixel text-sm text-netherite-400 w-8">{medal(rank) ?? `#${rank}`}</span>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MinecraftHead uuid={uuid} size={40} />
        <div className="min-w-0">
          <div className="text-xl truncate">{username}</div>
          <div className="sm:hidden text-sm text-netherite-400">{rating} Rating</div>
        </div>
      </div>

      <div className="hidden sm:block w-20 text-center">
        <TierBadge tier={tier} />
      </div>

      <div className="hidden sm:block w-28 text-center text-mcgreen-400">{rating} Rating</div>

      <div className="hidden sm:block w-28 text-center text-mcblue-400">
        {votes}/{votesRequired} Votes
      </div>

      <div className="flex sm:hidden items-center justify-between gap-3">
        <TierBadge tier={tier} />
        <span className="text-mcblue-400 text-sm">
          {votes}/{votesRequired} Votes
        </span>
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
