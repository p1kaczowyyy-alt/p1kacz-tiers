import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function UsernameSetupGate({ children }: { children: JSX.Element }) {
  const { session, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsSetup = !!session && !!profile?.needs_username_setup;

  if (!needsSetup) return children;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Nick musi mieć min. 3 znaki.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed, needs_username_setup: false })
      .eq('id', session!.user.id);
    setSubmitting(false);
    if (error) {
      setError(error.message.includes('duplicate') ? 'Ten nick jest już zajęty.' : error.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="stone-panel w-full max-w-md p-6">
        <h1 className="font-pixel text-lg text-mcgold-400 text-center mb-2">⛏️ Ustaw swój nick</h1>
        <p className="text-netherite-400 text-sm text-center mb-6">
          Zalogowałeś się przez Discord — zanim przejdziesz dalej, podaj swój Minecraft username.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Minecraft Username"
            className="w-full px-3 py-2 bg-deepslate-800 pixel-border outline-none"
          />
          {error && <p className="text-mcred-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="pixel-border bg-mcgreen-600 hover:bg-mcgreen-500 py-2 disabled:opacity-50"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz i kontynuuj'}
          </button>
        </form>
      </div>
    </div>
  );
}
