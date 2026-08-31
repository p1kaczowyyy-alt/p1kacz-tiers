export type Tier = 'HT1' | 'LT1' | 'HT2' | 'LT2' | 'HT3' | 'LT3' | 'HT4' | 'LT4' | 'HT5' | 'LT5';

export type CategorySlug =
  | 'sword'
  | 'axe'
  | 'crystal'
  | 'potpvp'
  | 'npot'
  | 'mace'
  | 'spear_mace'
  | 'gildie'
  | 'totemy'
  | 'nemosy'
  | 'carty'
  | 'creeper'
  | 'dsmp';

export interface CategoryRow {
  id: string;
  slug: CategorySlug;
  name: string;
  icon: string;
  sort_order: number;
}

export interface PlayerRow {
  id: string;
  username: string;
  minecraft_uuid: string;
  rating: number;
  unranked: boolean;
  created_at: string;
}

export interface PlayerTierRow {
  id: string;
  player_id: string;
  category_id: string;
  tier: Tier;
  votes_count: number;
  votes_required: number;
  updated_at: string;
}

export interface VoteRow {
  id: string;
  user_id: string;
  player_id: string;
  category_id: string;
  rankup_request_id: string | null;
  created_at: string;
}

export type RankupStatus = 'pending' | 'approved' | 'rejected';

export interface RankupRequestRow {
  id: string;
  player_id: string;
  category_id: string;
  from_tier: Tier;
  to_tier: Tier;
  votes_count: number;
  votes_required: number;
  status: RankupStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface RankupHistoryRow {
  id: string;
  player_id: string;
  category_id: string;
  from_tier: Tier;
  to_tier: Tier;
  status: RankupStatus;
  resolved_at: string;
}

export type AppRole = 'user' | 'admin';

export interface ProfileRow {
  id: string;
  username: string;
  role: AppRole;
  needs_username_setup: boolean;
  created_at: string;
}

// Minimal Database type for the supabase-js generic client.
// Regenerate with `supabase gen types typescript` once your schema is live
// for full type safety; this hand-written version covers what the app uses.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      players: { Row: PlayerRow; Insert: Partial<PlayerRow>; Update: Partial<PlayerRow> };
      categories: { Row: CategoryRow; Insert: Partial<CategoryRow>; Update: Partial<CategoryRow> };
      player_tiers: { Row: PlayerTierRow; Insert: Partial<PlayerTierRow>; Update: Partial<PlayerTierRow> };
      votes: { Row: VoteRow; Insert: Partial<VoteRow>; Update: Partial<VoteRow> };
      rankup_requests: { Row: RankupRequestRow; Insert: Partial<RankupRequestRow>; Update: Partial<RankupRequestRow> };
      rankup_history: { Row: RankupHistoryRow; Insert: Partial<RankupHistoryRow>; Update: Partial<RankupHistoryRow> };
    };
  };
}
