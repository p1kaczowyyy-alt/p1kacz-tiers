import type { Tier } from '../types/database';
import { TIER_STYLES } from '../lib/tiers';

export default function TierBadge({ tier, className = '' }: { tier: Tier; className?: string }) {
  return <span className={`tier-badge ${TIER_STYLES[tier]} ${className}`}>{tier}</span>;
}
