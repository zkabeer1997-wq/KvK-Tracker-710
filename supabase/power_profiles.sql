create table if not exists public.power_profiles (
 member_id text primary key,
 name text not null,
 governor_gear text,
 charms text,
 hero_gear text,
 pet_power text,
 masters_power text,
 pin_hash text not null,
 updated_at timestamptz not null default now()
);

alter table public.power_profiles enable row level security;

drop policy if exists "Service role can manage power profiles" on public.power_profiles;
create policy "Service role can manage power profiles"
on public.power_profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
