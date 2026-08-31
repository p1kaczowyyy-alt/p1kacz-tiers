import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabase';
import { Spinner, ErrorState } from '../components/States';

interface Stats {
  totalPlayers: number;
  totalVotes: number;
  totalRankups: number;
  pendingRankups: number;
  highestRating: number;
  highestRatingUsername: string;
  mostVotedPlayer: string;
  mostVotedCount: number;
  mostRankupsPlayer: string;
  mostRankupsCount: number;
  tierDistribution: { tier: string; count: number }[];
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [playersRes, votesRes, rankupsRes, tiersRes, historyRes] = await Promise.all([
          supabase.from('players').select('id, username, rating'),
          supabase.from('votes').select('player_id'),
          supabase.from('rankup_requests').select('id, status'),
          supabase.from('player_tiers').select('tier'),
          supabase.from('rankup_history').select('player_id, status')
        ]);

        if (!active) return;

        const players = playersRes.data ?? [];
        const votes = votesRes.data ?? [];
        const rankups = rankupsRes.data ?? [];
        const tiers = tiersRes.data ?? [];
        const history = historyRes.data ?? [];

        const votesByPlayer = new Map<string, number>();
        votes.forEach((v: any) => votesByPlayer.set(v.player_id, (votesByPlayer.get(v.player_id) ?? 0) + 1));

        const rankupsByPlayer = new Map<string, number>();
        history
          .filter((h: any) => h.status === 'approved')
          .forEach((h: any) => rankupsByPlayer.set(h.player_id, (rankupsByPlayer.get(h.player_id) ?? 0) + 1));

        const usernameById = new Map(players.map((p: any) => [p.id, p.username]));

        const highestRatingPlayer = [...players].sort((a: any, b: any) => b.rating - a.rating)[0];
        const mostVotedEntry = [...votesByPlayer.entries()].sort((a, b) => b[1] - a[1])[0];
        const mostRankupsEntry = [...rankupsByPlayer.entries()].sort((a, b) => b[1] - a[1])[0];

        const tierCounts = new Map<string, number>();
        tiers.forEach((t: any) => tierCounts.set(t.tier, (tierCounts.get(t.tier) ?? 0) + 1));
        const tierOrder = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

        setStats({
          totalPlayers: players.length,
          totalVotes: votes.length,
          totalRankups: history.filter((h: any) => h.status === 'approved').length,
          pendingRankups: rankups.filter((r: any) => r.status === 'pending').length,
          highestRating: highestRatingPlayer?.rating ?? 0,
          highestRatingUsername: highestRatingPlayer?.username ?? '—',
          mostVotedPlayer: mostVotedEntry ? usernameById.get(mostVotedEntry[0]) ?? '—' : '—',
          mostVotedCount: mostVotedEntry?.[1] ?? 0,
          mostRankupsPlayer: mostRankupsEntry ? usernameById.get(mostRankupsEntry[0]) ?? '—' : '—',
          mostRankupsCount: mostRankupsEntry?.[1] ?? 0,
          tierDistribution: tierOrder.map((t) => ({ tier: t, count: tierCounts.get(t) ?? 0 }))
        });
        setLoading(false);
      } catch (e: any) {
        if (active) {
          setError(e.message ?? 'Failed to load statistics.');
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  const cards = [
    { label: 'Total Players', value: stats.totalPlayers, color: 'text-mcgreen-400' },
    { label: 'Total Votes', value: stats.totalVotes, color: 'text-mcblue-400' },
    { label: 'Total Rankups', value: stats.totalRankups, color: 'text-mcgold-400' },
    { label: 'Pending Rankups', value: stats.pendingRankups, color: 'text-mcred-400' },
    { label: 'Highest Rating', value: `${stats.highestRating} (${stats.highestRatingUsername})`, color: 'text-enchant-400' },
    { label: 'Most Voted Player', value: `${stats.mostVotedPlayer} (${stats.mostVotedCount})`, color: 'text-mcblue-400' },
    { label: 'Most Rankups', value: `${stats.mostRankupsPlayer} (${stats.mostRankupsCount})`, color: 'text-mcgold-400' }
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-pixel text-2xl text-mcgold-400 text-center">📊 Statistics</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="stone-panel p-4 text-center">
            <div className={`text-2xl font-pixel ${c.color}`}>{c.value}</div>
            <div className="text-netherite-400 mt-2 text-sm">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="stone-panel p-4">
        <h2 className="font-pixel text-sm text-mcgold-400 mb-4">Tier Distribution</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats.tierDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e36" />
            <XAxis dataKey="tier" stroke="#8b8a94" fontSize={12} />
            <YAxis stroke="#8b8a94" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#1e2127', border: '1px solid #413f47', color: '#e5e7eb' }} />
            <Bar dataKey="count" fill="#8a2be2" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
