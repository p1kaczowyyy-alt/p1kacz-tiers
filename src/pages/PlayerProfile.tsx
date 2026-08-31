import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MinecraftHead from '../components/MinecraftHead';
import TierBadge from '../components/TierBadge';
import CategoryIcon from '../components/CategoryIcon';
import { Spinner, ErrorState, EmptyState } from '../components/States';
import type { CategoryRow, PlayerRow, PlayerTierRow, RankupHistoryRow, Tier } from '../types/database';

interface CategoryTierInfo {
  category: CategoryRow;
  playerTier: PlayerTierRow;
  hasVoted: boolean;
  pendingRequestId: string | null;
  isMaxTier: boolean;
  voting: boolean;
  voteError: string | null;
}

export default function PlayerProfile() {
  const { username } = useParams<{ username: string }>();
  const { session } = useAuth();

  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [items, setItems] = useState<CategoryTierInfo[]>([]);
  const [history, setHistory] = useState<RankupHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const { data: playerData, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (playerErr) {
      setError(playerErr.message);
      setLoading(false);
      return;
    }
    if (!playerData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPlayer(playerData as PlayerRow);

    const [{ data: categories }, { data: tiers }, { data: pendingReqs }, { data: myVotes }, { data: hist }] =
      await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('player_tiers').select('*').eq('player_id', playerData.id),
        supabase.from('rankup_requests').select('*').eq('player_id', playerData.id).eq('status', 'pending'),
        session ? supabase.from('votes').select('category_id, rankup_request_id').eq('user_id', session.user.id).eq('player_id', playerData.id) : Promise.resolve({ data: [] as any[] }),
        supabase.from('rankup_history').select('*').eq('player_id', playerData.id).order('resolved_at', { ascending: false })
      ]);

    const tiersByCategory = new Map<string, PlayerTierRow>((tiers ?? []).map((t: PlayerTierRow) => [t.category_id, t]));
    const pendingByCategory = new Map<string, string>((pendingReqs ?? []).map((r: any) => [r.category_id, r.id]));
    const votedCategoryIds = new Set<string>((myVotes ?? []).map((v: any) => v.category_id));

    const merged: CategoryTierInfo[] = (categories ?? []).map((c: CategoryRow) => {
      const pt = tiersByCategory.get(c.id);
      return {
        category: c,
        playerTier: pt ?? {
          id: '',
          player_id: playerData.id,
          category_id: c.id,
          tier: 'LT5' as Tier,
          votes_count: 0,
          votes_required: 20,
          updated_at: ''
        },
        hasVoted: votedCategoryIds.has(c.id),
        pendingRequestId: pendingByCategory.get(c.id) ?? null,
        isMaxTier: pt?.tier === 'HT1',
        voting: false,
        voteError: null
      };
    });

    setItems(merged);
    setHistory((hist ?? []) as RankupHistoryRow[]);
    setLoading(false);
  }, [username, session]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVote = async (categoryId: string) => {
    if (!session || !player) return;
    setItems((prev) => prev.map((it) => (it.category.id === categoryId ? { ...it, voting: true, voteError: null } : it)));

    const { error } = await supabase.rpc('cast_rankup_vote', {
      p_player_id: player.id,
      p_category_id: categoryId
    });

    if (error) {
      const message = error.message.includes('ALREADY_VOTED')
        ? 'Już zagłosowałeś na ten rankup.'
        : error.message.includes('AUTH_REQUIRED')
        ? 'Musisz być zalogowany, aby głosować.'
        : error.message.includes('ALREADY_MAX_TIER')
        ? 'Ten gracz osiągnął już maksymalny tier.'
        : 'Nie udało się oddać głosu.';
      setItems((prev) =>
        prev.map((it) => (it.category.id === categoryId ? { ...it, voting: false, voteError: message } : it))
      );
      return;
    }

    await load();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;
  if (notFound)
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <EmptyState message={`Player "${username}" not found.`} />
        <Link to="/players" className="pixel-border bg-deepslate-700 px-4 py-2">
          Back to Players
        </Link>
      </div>
    );
  if (!player) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="stone-panel flex flex-col items-center gap-2 py-8 px-4">
        <MinecraftHead uuid={player.minecraft_uuid} size={96} />
        <h1 className="text-3xl mt-2">{player.username}</h1>
        <p className="text-netherite-400 text-lg">Minecraft PvP Player</p>
        <p className="text-mcgreen-400 text-2xl font-pixel mt-1">{player.rating}</p>
        <p className="text-netherite-400 text-sm">Overall Rating</p>
      </div>

      <div>
        <h2 className="font-pixel text-lg text-mcgold-400 mb-4">Category Tiers</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => {
            const pct = Math.min(100, Math.round((it.playerTier.votes_count / it.playerTier.votes_required) * 100));
            const rankupReady = pct >= 100 && !it.isMaxTier;
            return (
              <div key={it.category.id} className="stone-panel p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg">
                    <CategoryIcon icon={it.category.icon} className="mr-1" /> {it.category.name}
                  </span>
                  <TierBadge tier={it.playerTier.tier} />
                </div>

                {!it.isMaxTier && (
                  <>
                    <div className="text-sm text-netherite-400">
                      Next Tier: <span className="text-mcblue-400">{nextTierLabel(it.playerTier.tier)}</span>
                    </div>
                    <div className="w-full h-3 bg-deepslate-800 rounded overflow-hidden pixel-border">
                      <div
                        className="h-full bg-enchant-500"
                        style={{ ['--fill-to' as any]: `${pct}%`, width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-sm text-right text-netherite-400">
                      {it.playerTier.votes_count} / {it.playerTier.votes_required} votes
                    </div>

                    {rankupReady && (
                      <div className="text-mcgold-400 font-pixel text-xs text-center animate-enchant py-1">
                        🔥 RANK UP READY!
                      </div>
                    )}

                    {session ? (
                      it.hasVoted ? (
                        <button disabled className="pixel-border bg-mcgreen-700/50 py-2 cursor-default">
                          ✓ VOTED
                        </button>
                      ) : (
                        <button
                          disabled={it.voting}
                          onClick={() => handleVote(it.category.id)}
                          className="pixel-border bg-mcblue-600 hover:bg-mcblue-500 py-2 disabled:opacity-50"
                        >
                          {it.voting ? 'Voting...' : '👍 VOTE FOR RANKUP'}
                        </button>
                      )
                    ) : (
                      <Link to="/login" className="pixel-border bg-deepslate-700 text-center py-2 text-sm">
                        Login to vote
                      </Link>
                    )}
                    {it.voteError && <p className="text-mcred-400 text-sm text-center">{it.voteError}</p>}
                  </>
                )}
                {it.isMaxTier && (
                  <p className="text-mcgold-400 text-sm text-center py-1">👑 Maximum tier reached</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-pixel text-lg text-mcgold-400 mb-4">Rankup History</h2>
        {history.length === 0 ? (
          <EmptyState message="No rankup history yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="stone-panel px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <span>{items.find((i) => i.category.id === h.category_id)?.category.name ?? h.category_id}</span>
                <span>
                  {h.from_tier} → {h.to_tier}
                </span>
                <span className={h.status === 'approved' ? 'text-mcgreen-400' : 'text-mcred-400'}>
                  {h.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
                <span className="text-netherite-400 text-sm">
                  {new Date(h.resolved_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function nextTierLabel(tier: Tier): Tier {
  const order: Tier[] = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];
  const idx = order.indexOf(tier);
  return idx > 0 ? order[idx - 1] : tier;
}
