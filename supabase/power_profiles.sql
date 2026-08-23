create table if not exists public.power_profiles (
 member_id text primary key,
 name text not null,
 governor_gear text,
 charms text,
 hero_gear text,
 pet_power text,
 masters_power text,
 infantry_tier text,
 infantry_tg text,
 cavalry_tier text,
 cavalry_tg text,
 archer_tier text,
 archer_tg text,
 heroes text[] not null default '{}',
 pin_hash text not null,
 updated_at timestamptz not null default now()
);

alter table public.power_profiles
  add column if not exists infantry_tier text,
  add column if not exists infantry_tg text,
  add column if not exists cavalry_tier text,
  add column if not exists cavalry_tg text,
  add column if not exists archer_tier text,
  add column if not exists archer_tg text,
  add column if not exists heroes text[] not null default '{}';

alter table public.power_profiles enable row level security;

drop policy if exists "Service role can manage power profiles" on public.power_profiles;
create policy "Service role can manage power profiles"
on public.power_profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
