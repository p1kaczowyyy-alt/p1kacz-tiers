-- =====================================================================
-- P1KACZ TIERS — Supabase schema (tables, constraints, RLS, functions)
-- Run this whole file once in Supabase SQL Editor on a fresh project.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type public.app_role as enum ('user', 'admin');
create type public.tier_enum as enum ('HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5','NOTIER');
create type public.rankup_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role public.app_role not null default 'user',
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- CATEGORIES (fixed list — no "Kit Bed")
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default '⚔️',
  sort_order int not null default 0
);

insert into public.categories (slug, name, icon, sort_order) values
  ('sword',       'Sword',       '⚔️', 1),
  ('axe',         'Axe',         '🪓', 2),
  ('crystal',     'Crystal',     '💎', 3),
  ('potpvp',      'PotPvP',      '🧪', 4),
  ('npot',        'NPot',        '🧪', 5),
  ('mace',        'Mace',        '🔨', 6),
  ('spear_mace',  'Spear Mace',  '⚔️', 7),
  ('gildie',      'Gildie',      '🛡️', 8),
  ('totemy',      'Totemy',      '🔱', 9),
    ('carty',       'Carty',       '🛒', 11),
  ('creeper',     'Creeper',     '💥', 12),
  ('dsmp',        'DSMP',        '🌑', 12);

-- ---------------------------------------------------------------------
-- PLAYERS
-- ---------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  minecraft_uuid text not null,
  rating int not null default 1000,
  created_at timestamptz not null default now()
);

create index players_rating_idx on public.players (rating desc);
create index players_username_idx on public.players (lower(username));

-- ---------------------------------------------------------------------
-- PLAYER TIERS (one row per player+category)
-- ---------------------------------------------------------------------
create table public.player_tiers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  tier public.tier_enum not null default 'LT5',
  votes_count int not null default 0,
  votes_required int not null default 20,
  updated_at timestamptz not null default now(),
  unique (player_id, category_id)
);

create index player_tiers_player_idx on public.player_tiers (player_id);
create index player_tiers_category_idx on public.player_tiers (category_id);

-- ---------------------------------------------------------------------
-- RANKUP REQUESTS (created lazily the first time someone votes)
-- ---------------------------------------------------------------------
create table public.rankup_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  from_tier public.tier_enum not null,
  to_tier public.tier_enum not null,
  votes_count int not null default 0,
  votes_required int not null default 20,
  status public.rankup_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  -- only one PENDING request per player+category at a time
  unique (player_id, category_id, status) deferrable initially immediate
);

-- The unique constraint above would block having multiple resolved rows.
-- Replace with a partial unique index instead (Postgres-correct approach):
alter table public.rankup_requests drop constraint rankup_requests_player_id_category_id_status_key;
create unique index rankup_requests_one_pending_idx
  on public.rankup_requests (player_id, category_id)
  where (status = 'pending');

create index rankup_requests_status_idx on public.rankup_requests (status);

-- ---------------------------------------------------------------------
-- VOTES — one vote per user per player per category per rankup request
-- ---------------------------------------------------------------------
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  rankup_request_id uuid references public.rankup_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, player_id, category_id, rankup_request_id)
);

create index votes_user_idx on public.votes (user_id);
create index votes_player_category_idx on public.votes (player_id, category_id);

-- ---------------------------------------------------------------------
-- RANKUP HISTORY (immutable audit log)
-- ---------------------------------------------------------------------
create table public.rankup_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  from_tier public.tier_enum not null,
  to_tier public.tier_enum not null,
  status public.rankup_status not null,
  resolved_at timestamptz not null default now()
);

create index rankup_history_player_idx on public.rankup_history (player_id);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Is the current JWT user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Next tier lookup, e.g. LT2 -> HT2 -> LT3 ...
create or replace function public.next_tier(t public.tier_enum)
returns public.tier_enum
language sql
immutable
as $$
  select (case t
    when 'NOTIER' then 'NOTIER'
    when 'LT5' then 'HT5'
    when 'HT5' then 'LT4'
    when 'LT4' then 'HT4'
    when 'HT4' then 'LT3'
    when 'LT3' then 'HT3'
    when 'HT3' then 'LT2'
    when 'LT2' then 'HT2'
    when 'HT2' then 'LT1'
    when 'LT1' then 'HT1'
    else 'HT1' -- HT1 is already max
  end)::public.tier_enum;
$$;

-- Cast a vote for a player's rankup in a category.
-- Creates the pending rankup_request if one doesn't exist yet.
-- Raises an exception (caught by the frontend) on a duplicate vote.
create or replace function public.cast_rankup_vote(p_player_id uuid, p_category_id uuid)
returns public.rankup_requests
language plpgsql
security definer set search_path = public
as $$
declare
  v_pt public.player_tiers;
  v_req public.rankup_requests;
  v_to_tier public.tier_enum;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_pt from public.player_tiers
    where player_id = p_player_id and category_id = p_category_id
    for update;

  if not found then
    raise exception 'PLAYER_TIER_NOT_FOUND';
  end if;

  if v_pt.tier in ('HT1', 'NOTIER') then
    raise exception 'ALREADY_MAX_TIER';
  end if;

  v_to_tier := public.next_tier(v_pt.tier);

  select * into v_req from public.rankup_requests
    where player_id = p_player_id and category_id = p_category_id and status = 'pending'
    for update;

  if not found then
    insert into public.rankup_requests (player_id, category_id, from_tier, to_tier, votes_count, votes_required)
    values (p_player_id, p_category_id, v_pt.tier, v_to_tier, 0, v_pt.votes_required)
    returning * into v_req;
  end if;

  -- This insert enforces "one vote per user per player per category per request"
  -- via the unique constraint; duplicate votes raise unique_violation.
  insert into public.votes (user_id, player_id, category_id, rankup_request_id)
  values (auth.uid(), p_player_id, p_category_id, v_req.id);

  update public.rankup_requests
    set votes_count = votes_count + 1
    where id = v_req.id
    returning * into v_req;

  update public.player_tiers
    set votes_count = v_req.votes_count
    where player_id = p_player_id and category_id = p_category_id;

  return v_req;
exception
  when unique_violation then
    raise exception 'ALREADY_VOTED';
end;
$$;

-- Admin: approve a pending rankup request.
create or replace function public.approve_rankup(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.rankup_requests;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_req from public.rankup_requests where id = p_request_id and status = 'pending' for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  update public.rankup_requests
    set status = 'approved', resolved_at = now()
    where id = p_request_id;

  update public.player_tiers
    set tier = v_req.to_tier, votes_count = 0, updated_at = now()
    where player_id = v_req.player_id and category_id = v_req.category_id;

  -- Votes tied to this resolved request are cleared so users can vote again next cycle.
  delete from public.votes where rankup_request_id = p_request_id;

  insert into public.rankup_history (player_id, category_id, from_tier, to_tier, status, resolved_at)
  values (v_req.player_id, v_req.category_id, v_req.from_tier, v_req.to_tier, 'approved', now());
end;
$$;

-- Admin: reject a pending rankup request.
create or replace function public.reject_rankup(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_req public.rankup_requests;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_req from public.rankup_requests where id = p_request_id and status = 'pending' for update;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  update public.rankup_requests
    set status = 'rejected', resolved_at = now()
    where id = p_request_id;

  update public.player_tiers
    set votes_count = 0, updated_at = now()
    where player_id = v_req.player_id and category_id = v_req.category_id;

  delete from public.votes where rankup_request_id = p_request_id;

  insert into public.rankup_history (player_id, category_id, from_tier, to_tier, status, resolved_at)
  values (v_req.player_id, v_req.category_id, v_req.from_tier, v_req.to_tier, 'rejected', now());
end;
$$;

-- Convenience trigger: whenever a player is created, seed all 13 category rows at LT5.
create or replace function public.seed_player_tiers()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.player_tiers (player_id, category_id, tier, votes_count, votes_required)
  select new.id, c.id, 'LT5', 0, 20 from public.categories c;
  return new;
end;
$$;

create trigger on_player_created
  after insert on public.players
  for each row execute function public.seed_player_tiers();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.categories enable row level security;
alter table public.player_tiers enable row level security;
alter table public.votes enable row level security;
alter table public.rankup_requests enable row level security;
alter table public.rankup_history enable row level security;

-- PROFILES
create policy "profiles are publicly readable"
  on public.profiles for select using (true);
create policy "users can update own profile username"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = 'user' or public.is_admin());
create policy "admins manage all profiles"
  on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- CATEGORIES — public read, admin write
create policy "categories are publicly readable"
  on public.categories for select using (true);
create policy "owner manages categories"
  on public.categories for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_owner));
create policy "admins update categories"
  on public.categories for update using (public.is_admin());
create policy "owner deletes categories"
  on public.categories for delete using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_owner));

-- PLAYERS — public read, admin write
create policy "players are publicly readable"
  on public.players for select using (true);
create policy "admins insert players"
  on public.players for insert with check (public.is_admin());
create policy "admins update players"
  on public.players for update using (public.is_admin());
create policy "admins delete players"
  on public.players for delete using (public.is_admin());

-- PLAYER_TIERS — public read, admin write (votes_count is updated via SECURITY DEFINER fn)
create policy "player_tiers are publicly readable"
  on public.player_tiers for select using (true);
create policy "admins update player_tiers"
  on public.player_tiers for update using (public.is_admin());
create policy "admins insert player_tiers"
  on public.player_tiers for insert with check (public.is_admin());
create policy "admins delete player_tiers"
  on public.player_tiers for delete using (public.is_admin());

-- VOTES — users can read their own votes (+ admins read all); writes go through the RPC only
create policy "users read own votes"
  on public.votes for select using (auth.uid() = user_id or public.is_admin());
create policy "no direct insert into votes"
  on public.votes for insert with check (false);
create policy "no direct update of votes"
  on public.votes for update using (false);
create policy "admins delete votes"
  on public.votes for delete using (public.is_admin());

-- RANKUP_REQUESTS — public read, writes only via SECURITY DEFINER functions / admin
create policy "rankup_requests are publicly readable"
  on public.rankup_requests for select using (true);
create policy "no direct insert into rankup_requests"
  on public.rankup_requests for insert with check (false);
create policy "no direct update of rankup_requests"
  on public.rankup_requests for update using (false);
create policy "admins delete rankup_requests"
  on public.rankup_requests for delete using (public.is_admin());

-- RANKUP_HISTORY — public read, no direct writes (only via functions)
create policy "rankup_history is publicly readable"
  on public.rankup_history for select using (true);
create policy "no direct insert into rankup_history"
  on public.rankup_history for insert with check (false);

-- =====================================================================
-- Grant execute on RPC functions to authenticated + anon (anon calls will
-- fail auth checks inside the function itself, which is intended).
-- =====================================================================
grant execute on function public.cast_rankup_vote(uuid, uuid) to authenticated;
grant execute on function public.approve_rankup(uuid) to authenticated;
grant execute on function public.reject_rankup(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.next_tier(public.tier_enum) to authenticated, anon;

-- =====================================================================
-- Make yourself an admin after signing up once, by running:
--   update public.profiles set role = 'admin' where username = 'YourUsername';
-- =====================================================================


-- P1KACZ TIERS v2 migration:
-- Run this block on an EXISTING database after the original schema.
-- It removes Nemosy, adds NOTIER per category, and introduces owner-only mode management.
alter table public.profiles add column if not exists is_owner boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='tier_enum' and e.enumlabel='NOTIER') then
    alter type public.tier_enum add value 'NOTIER';
  end if;
end $$;

delete from public.categories where slug = 'nemosy';

-- Owner-only category management is enforced by RLS, not just the UI.
drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "admins update categories" on public.categories;
drop policy if exists "admins delete categories" on public.categories;
drop policy if exists "owner manages categories" on public.categories;
drop policy if exists "owner updates categories" on public.categories;
drop policy if exists "owner deletes categories" on public.categories;
create policy "owner manages categories" on public.categories for insert
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_owner=true));
create policy "admins update categories" on public.categories for update
  using (public.is_admin()) with check (public.is_admin());
create policy "owner deletes categories" on public.categories for delete
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_owner=true));
