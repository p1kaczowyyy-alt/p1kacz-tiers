import { useEffect, useState, useCallback } from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useCategories';
import MinecraftHead from '../components/MinecraftHead';
import TierBadge from '../components/TierBadge';
import CategoryIcon from '../components/CategoryIcon';
import { Spinner, EmptyState, ErrorState } from '../components/States';
import type { PlayerRow, PlayerTierRow, ProfileRow, RankupRequestRow, Tier } from '../types/database';

const TIERS: Tier[] = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

const tabs = [
  { to: '', label: 'Dashboard' },
  { to: 'players', label: 'Players' },
  { to: 'rankups', label: 'Rankups' },
  { to: 'categories', label: 'Categories' },
  { to: 'users', label: 'Users' }
];

export default function AdminPanel() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-2xl text-enchant-400 text-center">⚙️ Admin Panel</h1>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to === '' ? '/admin' : `/admin/${t.to}`}
            end={t.to === ''}
            className={({ isActive }) =>
              `pixel-border px-4 py-2 text-sm whitespace-nowrap shrink-0 ${
                isActive ? 'bg-enchant-600' : 'bg-deepslate-800 hover:bg-deepslate-700'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="rankups" element={<AdminRankups />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}

// ---------------------------------------------------------------------
function AdminDashboard() {
  const [stats, setStats] = useState<{ players: number; votes: number; pending: number; total: number; categories: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [players, votes, pending, history, categories] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('votes').select('id', { count: 'exact', head: true }),
        supabase.from('rankup_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('rankup_history').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('categories').select('id', { count: 'exact', head: true })
      ]);
      const firstError = [players, votes, pending, history, categories].find((r) => r.error)?.error;
      if (firstError) {
        setError(firstError.message);
        return;
      }
      setStats({
        players: players.count ?? 0,
        votes: votes.count ?? 0,
        pending: pending.count ?? 0,
        total: history.count ?? 0,
        categories: categories.count ?? 0
      });
    })();
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <Spinner />;

  const cards = [
    { label: 'Total Players', value: stats.players },
    { label: 'Total Votes', value: stats.votes },
    { label: 'Pending Rankups', value: stats.pending },
    { label: 'Total Rankups', value: stats.total },
    { label: 'Categories', value: stats.categories }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="stone-panel p-4 text-center">
          <div className="text-2xl font-pixel text-mcgold-400">{c.value}</div>
          <div className="text-netherite-400 mt-2 text-sm">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
function AdminPlayers() {
  const { categories } = useCategories();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [tiersByPlayer, setTiersByPlayer] = useState<Map<string, PlayerTierRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', minecraft_uuid: '', rating: 1000 });
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: p, error: pErr } = await supabase.from('players').select('*').order('username');
    const { data: t } = await supabase.from('player_tiers').select('*');
    if (pErr) setError(pErr.message);
    setPlayers((p ?? []) as PlayerRow[]);
    const map = new Map<string, PlayerTierRow[]>();
    (t ?? []).forEach((row: PlayerTierRow) => {
      const list = map.get(row.player_id) ?? [];
      list.push(row);
      map.set(row.player_id, list);
    });
    setTiersByPlayer(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.from('players').insert({
      username: form.username.trim(),
      minecraft_uuid: form.minecraft_uuid.trim(),
      rating: form.rating
    });
    if (error) setError(error.message);
    else {
      setForm({ username: '', minecraft_uuid: '', rating: 1000 });
      setShowAdd(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunąć tego gracza na stałe?')) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) setError(error.message);
    else load();
  };

  const handleUpdatePlayer = async (id: string, updates: Partial<PlayerRow>) => {
    const { error } = await supabase.from('players').update(updates).eq('id', id);
    if (error) setError(error.message);
    else load();
  };

  const handleTierChange = async (playerId: string, categoryId: string, tier: Tier) => {
    const { error } = await supabase
      .from('player_tiers')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .eq('category_id', categoryId);
    if (error) setError(error.message);
    else load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorState message={error} />}

      <button onClick={() => setShowAdd((s) => !s)} className="pixel-border bg-mcgreen-600 hover:bg-mcgreen-500 px-4 py-2 self-start">
        {showAdd ? 'Cancel' : '+ ADD PLAYER'}
      </button>

      {showAdd && (
        <form onSubmit={handleAddPlayer} className="stone-panel p-4 grid gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Minecraft Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="px-3 py-2 bg-deepslate-800 pixel-border"
          />
          <input
            required
            placeholder="Minecraft UUID"
            value={form.minecraft_uuid}
            onChange={(e) => setForm((f) => ({ ...f, minecraft_uuid: e.target.value }))}
            className="px-3 py-2 bg-deepslate-800 pixel-border"
          />
          <input
            required
            type="number"
            placeholder="Rating"
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
            className="px-3 py-2 bg-deepslate-800 pixel-border"
          />
          <button type="submit" className="pixel-border bg-mcblue-600 hover:bg-mcblue-500 py-2 sm:col-span-3">
            Save Player
          </button>
        </form>
      )}

      {players.length === 0 ? (
        <EmptyState message="No players yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {players.map((p) => (
            <div key={p.id} className="stone-panel p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <MinecraftHead uuid={p.minecraft_uuid} size={36} />
                {editingId === p.id ? (
                  <>
                    <input
                      defaultValue={p.username}
                      onBlur={(e) => handleUpdatePlayer(p.id, { username: e.target.value })}
                      className="px-2 py-1 bg-deepslate-800 pixel-border text-sm w-32"
                    />
                    <input
                      defaultValue={p.minecraft_uuid}
                      onBlur={(e) => handleUpdatePlayer(p.id, { minecraft_uuid: e.target.value })}
                      className="px-2 py-1 bg-deepslate-800 pixel-border text-sm w-40"
                    />
                    <input
                      type="number"
                      defaultValue={p.rating}
                      onBlur={(e) => handleUpdatePlayer(p.id, { rating: Number(e.target.value) })}
                      className="px-2 py-1 bg-deepslate-800 pixel-border text-sm w-24"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-lg">{p.username}</span>
                    <span className="text-mcgreen-400 text-sm">{p.rating} Rating</span>
                  </>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                    className="pixel-border bg-deepslate-700 hover:bg-deepslate-600 px-3 py-1 text-sm"
                  >
                    {editingId === p.id ? 'Done' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="pixel-border bg-mcred-600 hover:bg-mcred-500 px-3 py-1 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {categories.map((c) => {
                  const pt = (tiersByPlayer.get(p.id) ?? []).find((t) => t.category_id === c.id);
                  return (
                    <div key={c.id} className="flex flex-col gap-1">
                      <span className="text-xs text-netherite-400 truncate"><CategoryIcon icon={c.icon} size={14} /> {c.name}</span>
                      <select
                        value={pt?.tier ?? 'LT5'}
                        onChange={(e) => handleTierChange(p.id, c.id, e.target.value as Tier)}
                        className="bg-deepslate-800 pixel-border text-xs px-1 py-1"
                      >
                        {TIERS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
function AdminRankups() {
  const [requests, setRequests] = useState<(RankupRequestRow & { player_username: string; category_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rankup_requests')
      .select('*, players(username), categories(name)')
      .eq('status', 'pending')
      .order('created_at');
    if (error) setError(error.message);
    setRequests(
      (data ?? []).map((r: any) => ({
        ...r,
        player_username: r.players?.username ?? '—',
        category_name: r.categories?.name ?? '—'
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id);
    const { error } = await supabase.rpc(decision === 'approve' ? 'approve_rankup' : 'reject_rankup', {
      p_request_id: id
    });
    if (error) setError(error.message);
    setBusyId(null);
    load();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-pixel text-lg text-mcgold-400">Pending Rankups</h2>
      {requests.length === 0 ? (
        <EmptyState message="No pending rankups." />
      ) : (
        requests.map((r) => (
          <div key={r.id} className="stone-panel p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <div className="text-lg">{r.player_username}</div>
              <div className="text-netherite-400 text-sm">{r.category_name}</div>
              <div className="mt-1">
                <TierBadge tier={r.from_tier} /> <span className="mx-2">→</span> <TierBadge tier={r.to_tier} />
              </div>
              <div className="text-mcblue-400 text-sm mt-1">
                {r.votes_count} / {r.votes_required} votes
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busyId === r.id}
                onClick={() => handleDecision(r.id, 'approve')}
                className="pixel-border bg-mcgreen-600 hover:bg-mcgreen-500 px-4 py-2 disabled:opacity-50"
              >
                APPROVE
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => handleDecision(r.id, 'reject')}
                className="pixel-border bg-mcred-600 hover:bg-mcred-500 px-4 py-2 disabled:opacity-50"
              >
                REJECT
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
function AdminCategories() {
  const { categories, loading } = useCategories();
  const [error, setError] = useState<string | null>(null);

  const handleRename = async (id: string, name: string) => {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) setError(error.message);
  };

  const handleIconChange = async (id: string, icon: string) => {
    const { error } = await supabase.from('categories').update({ icon }).eq('id', id);
    if (error) setError(error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      {error && <ErrorState message={error} />}
      <p className="text-netherite-400 text-sm">
        Kategorie są stałą listą 13 trybów PvP (Kit Bed został trwale usunięty i nie może zostać dodany ponownie).
        Pole "Icon" przyjmuje emoji (np. ⚔️) albo link do obrazka (np. https://.../diamond_sword.png) — zostanie
        automatycznie rozpoznany i wyświetlony jako ikonka Minecraft zamiast emoji.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="stone-panel p-3 flex items-center gap-3">
            <CategoryIcon icon={c.icon} size={28} />
            <input
              defaultValue={c.name}
              onBlur={(e) => handleRename(c.id, e.target.value)}
              className="bg-deepslate-800 pixel-border px-2 py-1 flex-1"
              placeholder="Nazwa"
            />
            <input
              defaultValue={c.icon}
              onBlur={(e) => handleIconChange(c.id, e.target.value)}
              className="bg-deepslate-800 pixel-border px-2 py-1 w-40 text-sm"
              placeholder="⚔️ lub URL obrazka"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
function AdminUsers() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    setUsers((data ?? []) as ProfileRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRole = async (id: string, role: 'user' | 'admin') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) setError(error.message);
    else load();
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex flex-col gap-2">
      {users.map((u) => (
        <div key={u.id} className="stone-panel p-3 flex items-center justify-between flex-wrap gap-2">
          <span>{u.username}</span>
          <select
            value={u.role}
            onChange={(e) => toggleRole(u.id, e.target.value as 'user' | 'admin')}
            className="bg-deepslate-800 pixel-border px-2 py-1 text-sm"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
      ))}
    </div>
  );
}
