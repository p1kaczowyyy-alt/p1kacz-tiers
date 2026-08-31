-- P1KACZ TIERS: Overall ranking + Unranked support
-- Run this once in the Supabase SQL Editor on the existing project.

alter table public.players
  add column if not exists unranked boolean not null default false;

-- Existing players remain ranked by default.
update public.players
set unranked = false
where unranked is null;
