import { useState } from 'react';
import { minecraftHeadUrl } from '../lib/tiers';

export default function MinecraftHead({
  uuid,
  size = 48,
  className = ''
}: {
  uuid: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = minecraftHeadUrl(uuid, size);

  if (failed || !src) {
    return (
      <div
        className={`pixel-border bg-stone-700 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label="brak głowy gracza"
      >
        <span style={{ fontSize: size * 0.5 }}>⛏️</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Minecraft head"
      className={`pixel-border ${className}`}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  );
}
