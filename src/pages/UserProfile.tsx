import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../components/States';

interface VoteHistoryItem {
  id: string;
  created_at: string;
  player_username: string;
  category_name: string;
}

export default function UserProfile() {
  const { session, profile, linkDiscord } = useAuth();
  const [votes, setVotes] = useState<VoteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const discordLinked = (session?.user.identities ?? []).some((i) => i.provider === 'discord');

  const handleLinkDiscord = async () => {
    setLinking(true);
    setLinkMsg(null);
    const { error } = await linkDiscord();
    setLinking(false);
    if (error) setLinkMsg(error);
    // On success Supabase redirects to Discord's consent screen, so no
    // further UI update is needed here — the user comes back authenticated.
  };

  useEffect(() => {
    if (!session) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('id, created_at, players(username), categories(name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setVotes(
          (data ?? []).map((v: any) => ({
            id: v.id,
            created_at: v.created_at,
            player_username: v.players?.username ?? '—',
            category_name: v.categories?.name ?? '—'
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session]);

  if (!session || !profile) return <Spinner />;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="stone-panel p-6 flex flex-col items-center gap-2">
        <span className="text-4xl">👤</span>
        <h1 className="text-2xl">{profile.username}</h1>
        <p className="text-netherite-400 text-sm">
          Account created: {new Date(profile.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
        {profile.role === 'admin' && (
          <Link to="/admin" className="pixel-border bg-enchant-600 px-3 py-1 text-sm mt-2">
            ⚙️ Admin Panel
          </Link>
        )}

        <div className="mt-4 w-full max-w-xs">
          {discordLinked ? (
            <p className="text-mcgreen-400 text-sm text-center">✓ Discord połączony — możesz logować się nim szybciej.</p>
          ) : (
            <button
              onClick={handleLinkDiscord}
              disabled={linking}
              className="pixel-border bg-[#5865F2] hover:opacity-90 w-full py-2 disabled:opacity-50"
            >
              {linking ? 'Łączenie...' : 'Połącz z Discordem'}
            </button>
          )}
          {linkMsg && <p className="text-mcred-400 text-sm text-center mt-2">{linkMsg}</p>}
        </div>
      </div>

      <div>
        <h2 className="font-pixel text-lg text-mcgold-400 mb-4">Vote History</h2>
        {error && <ErrorState message={error} />}
        {loading ? (
          <Spinner />
        ) : votes.length === 0 ? (
          <EmptyState message="You haven't voted yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {votes.map((v) => (
              <div key={v.id} className="stone-panel px-4 py-3 flex justify-between flex-wrap gap-2">
                <span>
                  {v.player_username} — {v.category_name}
                </span>
                <span className="text-netherite-400 text-sm">
                  {new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
