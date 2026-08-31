import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useCategories';
import PlayerListRow from '../components/PlayerListRow';
import CategoryIcon from '../components/CategoryIcon';
import { LoadingSkeletonRows, EmptyState, ErrorState } from '../components/States';
import type { Tier } from '../types/database';

interface RankingRow {
  player_id: string;
  username: string;
  minecraft_uuid: string;
  rating: number;
  tier: Tier;
  votes_count: number;
  votes_required: number;
}

type SortKey = 'rating' | 'tier' | 'rankups' | 'username';

const TIER_RANK: Record<Tier, number> = {
  HT1: 1, LT1: 2, HT2: 3, LT2: 4, HT3: 5, LT3: 6, HT4: 7, LT4: 8, HT5: 9, LT5: 10
};

export default function Rankings() {
  const { categories, loading: catLoading } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [tierFilter, setTierFilter] = useState<Tier | 'ALL'>('ALL');

  useEffect(() => {
    if (categories.length && !activeCategory) setActiveCategory(categories[0].id);
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error } = await supabase
        .from('player_tiers')
        .select('tier, votes_count, votes_required, players(id, username, minecraft_uuid, rating)')
        .eq('category_id', activeCategory);

      if (!active) return;
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        const mapped: RankingRow[] = (data ?? [])
          .filter((r: any) => r.players)
          .map((r: any) => ({
            player_id: r.players.id,
            username: r.players.username,
            minecraft_uuid: r.players.minecraft_uuid,
            rating: r.players.rating,
            tier: r.tier,
            votes_count: r.votes_count,
            votes_required: r.votes_required
          }));
        setRows(mapped);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [activeCategory]);

  const filteredSorted = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.username.toLowerCase().includes(q));
    }
    if (tierFilter !== 'ALL') {
      result = result.filter((r) => r.tier === tierFilter);
    }
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'rating':
          return b.rating - a.rating;
        case 'tier':
          return TIER_RANK[a.tier] - TIER_RANK[b.tier];
        case 'rankups':
          return b.votes_count - a.votes_count;
        case 'username':
          return a.username.localeCompare(b.username);
        default:
          return 0;
      }
    });
    return result;
  }, [rows, search, tierFilter, sortKey]);

  const tiers: Tier[] = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-4">
        <h1 className="font-pixel text-2xl md:text-3xl text-mcgold-400 mb-2">P1KACZ TIERS</h1>
        <p className="text-netherite-400 text-xl">Minecraft PvP Rankings</p>
      </div>

      {catLoading ? (
        <LoadingSkeletonRows count={3} />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`pixel-border px-4 py-2 whitespace-nowrap text-sm shrink-0 ${
                activeCategory === c.id ? 'bg-enchant-600 animate-enchant' : 'bg-deepslate-800 hover:bg-deepslate-700'
              }`}
            >
              <CategoryIcon icon={c.icon} className="mr-1" /> {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player..."
          className="stone-panel px-3 py-2 w-full md:w-72 outline-none focus:ring-2 focus:ring-enchant-500"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="stone-panel px-2 py-2 text-sm"
          >
            <option value="rating">Sort: Rating</option>
            <option value="tier">Sort: Tier</option>
            <option value="rankups">Sort: Rankups</option>
            <option value="username">Sort: Username</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as Tier | 'ALL')}
            className="stone-panel px-2 py-2 text-sm"
          >
            <option value="ALL">All Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <LoadingSkeletonRows />
      ) : filteredSorted.length === 0 ? (
        <EmptyState message="No players found." />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredSorted.map((r, i) => (
            <PlayerListRow
              key={r.player_id}
              rank={i + 1}
              username={r.username}
              uuid={r.minecraft_uuid}
              tier={r.tier}
              rating={r.rating}
              votes={r.votes_count}
              votesRequired={r.votes_required}
            />
          ))}
        </div>
      )}
    </div>
  );
}
