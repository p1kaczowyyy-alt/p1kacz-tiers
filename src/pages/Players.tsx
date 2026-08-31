import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MinecraftHead from '../components/MinecraftHead';
import { LoadingSkeletonRows, EmptyState, ErrorState } from '../components/States';
import { TIER_ORDER } from '../lib/tiers';
import TierBadge from '../components/TierBadge';
import type { PlayerRow, Tier } from '../types/database';

interface PlayerWithStats extends PlayerRow {
  highestTier: Tier;
  totalRankups: number;
}

export default function Players() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'rating' | 'username'>('rating');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: playersData, error: playersErr } = await supabase.from('players').select('*');
      if (playersErr) {
        if (active) {
          setError(playersErr.message);
          setLoading(false);
        }
        return;
      }
      const { data: tierData } = await supabase.from('player_tiers').select('player_id, tier, votes_count');
      const { data: historyData } = await supabase.from('rankup_history').select('player_id, status');

      if (!active) return;

      const bestTierByPlayer = new Map<string, Tier>();
      (tierData ?? []).forEach((row: any) => {
        const current = bestTierByPlayer.get(row.player_id);
        if (!current || TIER_ORDER.indexOf(row.tier) < TIER_ORDER.indexOf(current)) {
          bestTierByPlayer.set(row.player_id, row.tier);
        }
      });

      const rankupsByPlayer = new Map<string, number>();
      (historyData ?? []).forEach((row: any) => {
        if (row.status === 'approved') {
          rankupsByPlayer.set(row.player_id, (rankupsByPlayer.get(row.player_id) ?? 0) + 1);
        }
      });

      const merged: PlayerWithStats[] = (playersData ?? []).map((p: PlayerRow) => ({
        ...p,
        highestTier: bestTierByPlayer.get(p.id) ?? 'LT5',
        totalRankups: rankupsByPlayer.get(p.id) ?? 0
      }));

      setPlayers(merged);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.username.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) =>
      sortKey === 'rating' ? b.rating - a.rating : a.username.localeCompare(b.username)
    );
  }, [players, search, sortKey]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-2xl text-mcgold-400 text-center">👥 Players</h1>

      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player..."
          className="stone-panel px-3 py-2 w-full md:w-72 outline-none focus:ring-2 focus:ring-enchant-500"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as 'rating' | 'username')}
          className="stone-panel px-2 py-2 text-sm"
        >
          <option value="rating">Sort: Overall Rating</option>
          <option value="username">Sort: Username</option>
        </select>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <LoadingSkeletonRows />
      ) : filtered.length === 0 ? (
        <EmptyState message="No players found." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div key={p.id} className="stone-panel flex items-center gap-4 px-4 py-3 w-full">
              <MinecraftHead uuid={p.minecraft_uuid} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-xl truncate">{p.username}</div>
                <div className="text-sm text-netherite-400">{p.totalRankups} rankups</div>
              </div>
              <TierBadge tier={p.highestTier} className="hidden sm:inline-block" />
              <div className="text-mcgreen-400 w-24 text-right">{p.rating} Rating</div>
              <Link to={`/player/${p.username}`} className="pixel-border bg-deepslate-700 hover:bg-enchant-600 px-3 py-2 text-sm">
                VIEW PROFILE
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
