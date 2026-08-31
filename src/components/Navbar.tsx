import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/rankings', label: '🏆 Rankings' },
  { to: '/players', label: '👥 Players' },
  { to: '/statistics', label: '📊 Statistics' },
  { to: '/rules', label: '📜 Rules' }
];

export default function Navbar() {
  const { session, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 stone-panel border-b-4 border-deepslate-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl">🗡️</span>
          <div className="leading-none">
            <div className="font-pixel text-mcgold-400 text-sm">P1KACZ TIERS</div>
            <div className="text-xs text-netherite-400">Minecraft PvP Rankings</div>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-6 text-lg">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `hover:text-mcgold-400 transition-colors ${isActive ? 'text-mcgold-400' : 'text-gray-300'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `hover:text-enchant-400 transition-colors ${isActive ? 'text-enchant-400' : 'text-gray-300'}`
              }
            >
              ⚙️ Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <NavLink to="/profile" className="flex items-center gap-2 text-mcgreen-400 hover:text-mcgreen-300">
                <span>👤</span>
                <span>{profile?.username ?? '...'}</span>
              </NavLink>
              <button
                onClick={handleSignOut}
                className="pixel-border bg-mcred-600 hover:bg-mcred-500 px-3 py-1 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="pixel-border bg-mcgreen-600 hover:bg-mcgreen-500 px-3 py-1 text-sm">
              Login
            </NavLink>
          )}
        </div>

        <button className="md:hidden text-2xl" onClick={() => setOpen((o) => !o)} aria-label="menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t-2 border-deepslate-950 bg-deepslate-900 px-4 py-3 flex flex-col gap-3 text-lg">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-gray-300 hover:text-mcgold-400">
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setOpen(false)} className="text-enchant-400">
              ⚙️ Admin Panel
            </NavLink>
          )}
          <hr className="border-deepslate-700" />
          {session ? (
            <>
              <NavLink to="/profile" onClick={() => setOpen(false)} className="text-mcgreen-400">
                👤 {profile?.username ?? '...'}
              </NavLink>
              <button onClick={handleSignOut} className="pixel-border bg-mcred-600 px-3 py-2 text-left">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setOpen(false)} className="pixel-border bg-mcgreen-600 px-3 py-2 text-center">
              Login
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
