import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp, signInWithDiscord } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) setError(error);
      else navigate('/rankings');
    } else {
      if (username.trim().length < 3) {
        setError('Username musi mieć min. 3 znaki.');
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, username.trim());
      setSubmitting(false);
      if (error) setError(error);
      else setRegistered(true);
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="stone-panel w-full max-w-md p-6">
        <h1 className="font-pixel text-lg text-mcgold-400 text-center mb-6">
          {mode === 'login' ? '⛏️ Login' : '⛏️ Register'}
        </h1>

        {registered ? (
          <div className="text-center text-mcgreen-400 py-6">
            ✓ Konto utworzone! Sprawdź maila, aby potwierdzić rejestrację, a potem zaloguj się.
            <button onClick={() => { setMode('login'); setRegistered(false); }} className="block mx-auto mt-4 pixel-border bg-deepslate-700 px-4 py-2">
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-netherite-400">Minecraft Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 bg-deepslate-800 pixel-border outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-netherite-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 bg-deepslate-800 pixel-border outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-netherite-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full mt-1 px-3 py-2 bg-deepslate-800 pixel-border outline-none"
              />
            </div>

            {error && <p className="text-mcred-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="pixel-border bg-mcgreen-600 hover:bg-mcgreen-500 py-2 disabled:opacity-50"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>

            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={signInWithDiscord}
                  className="pixel-border bg-[#5865F2] hover:opacity-90 py-2"
                >
                  Continue with Discord
                </button>
                <p className="text-xs text-netherite-400 text-center">
                  Tylko dla kont, które już połączyły Discorda w swoim profilu.
                  Rejestracja jest możliwa wyłącznie mailem.
                </p>
              </>
            ) : (
              <p className="text-xs text-netherite-400 text-center">
                Po rejestracji będziesz mógł połączyć konto z Discordem w swoim profilu, aby logować się nim szybciej.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-sm text-mcblue-400 hover:underline mt-2"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
