import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="stone-panel border-t-4 border-deepslate-950 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="font-pixel text-mcgold-400 text-sm mb-1">P1KACZ TIERS</div>
          <div className="text-netherite-400 text-sm">Minecraft PvP Rankings</div>
          <div className="text-netherite-400 text-sm mt-2">© 2026 P1kacz</div>
        </div>
        <div className="flex gap-6 text-lg flex-wrap">
          <Link to="/rankings" className="hover:text-mcgold-400">Rankings</Link>
          <Link to="/players" className="hover:text-mcgold-400">Players</Link>
          <Link to="/statistics" className="hover:text-mcgold-400">Statistics</Link>
          <Link to="/rules" className="hover:text-mcgold-400">Rules</Link>
        </div>
      </div>
    </footer>
  );
}
