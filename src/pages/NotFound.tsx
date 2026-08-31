import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-6xl">🧱</div>
      <h1 className="font-pixel text-xl text-mcgold-400">404 — Block Not Found</h1>
      <Link to="/" className="pixel-border bg-deepslate-700 px-4 py-2">
        Back to Rankings
      </Link>
    </div>
  );
}
