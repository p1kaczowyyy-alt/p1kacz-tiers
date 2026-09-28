import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useCategories';
import PlayerListRow from '../components/PlayerListRow';
import CategoryIcon from '../components/CategoryIcon';
import TierBadge from '../components/TierBadge';
import MinecraftHead from '../components/MinecraftHead';
import { LoadingSkeletonRows, EmptyState, ErrorState } from '../components/States';
import { tierPoints } from '../lib/tiers';
import type { CategoryRow, PlayerRow, PlayerTierRow, Tier } from '../types/database';

interface RankingRow {
  player_id: string;
  username: string;
  minecraft_uuid: string;
  rating: number;
  tier: Tier;
  votes_count: number;
  votes_required: number;
}

interface OverallRow {
  player: PlayerRow;
  tiers: Map<string, Tier>;
  points: number;
}

type SortKey = 'rating' | 'tier' | 'rankups' | 'username';

const TIER_RANK: Record<Tier, number> = {
  HT1: 1, MT1: 2, LT1: 3, HT2: 4, MT2: 5, LT2: 6, HT3: 7, MT3: 8, LT3: 9, HT4: 10, MT4: 11, LT4: 12, HT5: 13, MT5: 14, LT5: 15, NOTIER: 99
};

const rankClass = (rank: number) => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-amber-700';
  return 'text-netherite-400';
};

function OverallPlayerRow({
  rank,
  row,
  categories
}: {
  rank: number;
  row: OverallRow;
  categories: CategoryRow[];
}) {
  const glow = rank === 1 ? 'border-mcgold-500/80 shadow-[0_0_18px_rgba(245,197,24,0.65)]' : rank === 2 ? 'border-gray-300/80 shadow-[0_0_18px_rgba(209,213,219,0.5)]' : rank === 3 ? 'border-amber-700/80 shadow-[0_0_18px_rgba(180,83,9,0.5)]' : 'border-enchant-500/60 shadow-glow';

  return (
    <div
      className={`stone-panel flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 w-full transition-transform hover:translate-x-1 ${
        ${glow}
      }`} 
    >
      <span className={`font-pixel text-sm w-8 shrink-0 ${rankClass(rank)}`}>#{rank}</span>

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MinecraftHead uuid={row.player.minecraft_uuid} size={40} />
        <div className="min-w-0">
          <div className="text-xl truncate flex items-center gap-2">
            {row.player.username}

          </div>
          <div className="text-sm text-netherite-400">
            {`${row.points} Points`}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:max-w-[55%] justify-start sm:justify-end">
        {categories.map((category) => {
          const tier = row.tiers.get(category.id);
          if (!tier) return null;
          return (
            <div key={category.id} title={category.name} className="flex items-center gap-1">
              <CategoryIcon icon={category.icon} size={16} />
              <TierBadge tier={tier} />
            </div>
          );
        })}
      </div>

      <div className="sm:w-24 text-left sm:text-right font-pixel text-mcgold-400 shrink-0">
        {row.points} pts
      </div>

      <Link
        to={`/player/${row.player.username}`}
        className="pixel-border bg-deepslate-700 hover:bg-enchant-600 text-center px-3 py-2 text-sm shrink-0"
      >
        VIEW PROFILE
      </Link>
    </div>
  );
}

export default function Rankings() {
  const { categories, loading: catLoading } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [overallRows, setOverallRows] = useState<OverallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('tier');
  const [tierFilter, setTierFilter] = useState<Tier | 'ALL'>('ALL');

  useEffect(() => {
    if (categories.length && !activeCategory) setActiveCategory('overall');
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      if (activeCategory === 'overall') {
        const [{ data: playersData, error: playersErr }, { data: tiersData, error: tiersErr }] = await Promise.all([
          supabase.from('players').select('*'),
          supabase.from('player_tiers').select('player_id, category_id, tier')
        ]);

        if (!active) return;
        if (playersErr || tiersErr) {
          setError(playersErr?.message ?? tiersErr?.message ?? 'Failed to load Overall ranking.');
          setOverallRows([]);
          setLoading(false);
          return;
        }

        const tiersByPlayer = new Map<string, Map<string, Tier>>();
        (tiersData ?? []).forEach((t: any) => {
          if (!tiersByPlayer.has(t.player_id)) tiersByPlayer.set(t.player_id, new Map());
          tiersByPlayer.get(t.player_id)!.set(t.category_id, t.tier as Tier);
        });

        const mapped = ((playersData ?? []) as PlayerRow[]).map((player) => {
          const tiers = tiersByPlayer.get(player.id) ?? new Map<string, Tier>();
          const points = Array.from(tiers.values()).reduce((sum, tier) => sum + tierPoints(tier), 0);
          return { player, tiers, points };
        });

        setOverallRows(mapped);
        setRows([]);
        setLoading(false);
        return;
      }

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
            votes_required: r.votes_required,
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
    if (tierFilter !== 'ALL') result = result.filter((r) => r.tier === tierFilter);

    return [...result].sort((a, b) => {
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
  }, [rows, search, tierFilter, sortKey]);

  const filteredOverall = useMemo(() => {
    let result = overallRows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.player.username.toLowerCase().includes(q));
    }
    if (tierFilter !== 'ALL') {
      result = result.filter((r) => Array.from(r.tiers.values()).includes(tierFilter));
    }
    return [...result].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.player.username.localeCompare(b.player.username);
    });
  }, [overallRows, search, tierFilter]);

  const tiers: Tier[] = ['HT1', 'MT1', 'LT1', 'HT2', 'MT2', 'LT2', 'HT3', 'MT3', 'LT3', 'HT4', 'MT4', 'LT4', 'HT5', 'MT5', 'LT5', 'NOTIER'];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-8 rankings-hero">
        <h1 className="font-pixel text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-enchant-400 via-purple-300 to-mcgold-400 mb-3 drop-shadow-[0_0_18px_rgba(138,43,226,0.55)]">P1KACZ TIERS</h1>
        <p className="text-netherite-400 text-xl">Minecraft PvP Rankings</p>
      </div>

      {catLoading ? (
        <LoadingSkeletonRows count={3} />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => { setActiveCategory('overall'); setSortKey('tier'); }}
            className={`pixel-border px-4 py-2 whitespace-nowrap text-sm shrink-0 ${
              activeCategory === 'overall' ? 'bg-enchant-600 animate-enchant' : 'bg-deepslate-800 hover:bg-deepslate-700'
            }`}
          >
            🏆 Overall
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setSortKey('tier'); }}
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
          {activeCategory !== 'overall' && (
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
          )}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as Tier | 'ALL')}
            className="stone-panel px-2 py-2 text-sm"
          >
            <option value="ALL">All Tiers</option>
            {tiers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {loading ? (
        <LoadingSkeletonRows />
      ) : activeCategory === 'overall' ? (
        filteredOverall.length === 0 ? (
          <EmptyState message="No players found." />
        ) : (
          <div className="flex flex-col gap-2 rankings-table-enter">
            {filteredOverall.map((r, i) => (
              <OverallPlayerRow key={r.player.id} rank={i + 1} row={r} categories={categories} />
            ))}
          </div>
        )
      ) : filteredSorted.length === 0 ? (
        <EmptyState message="No players found." />
      ) : (
        <div className="flex flex-col gap-2 rankings-table-enter">
          {filteredSorted.map((r, i) => (
            <PlayerListRow
              key={r.player_id}
              rank={i + 1}
              username={r.username}
              uuid={r.minecraft_uuid}
              tier={r.tier}
              rating={r.rating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
