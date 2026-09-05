-- Time-period archiving for the KvK Members and Prep Ministers admin tabs.
--
-- submissions, admin_rallies and prep_backpack_submissions are all "one row
-- per member" tables that get upserted in place on every resubmission, so
-- there is no historical data to switch between out of the box. These tables
-- let an admin take a point-in-time COPY of the live tables into a named
-- period before a new KvK's submissions start coming in, without ever
-- touching the live tables themselves.
--
-- This file only ever INSERTs into the *_archive tables below. Nothing here
-- deletes or updates a row in submissions, admin_rallies or
-- prep_backpack_submissions - member logins/PINs (pin_hash lives on
-- submissions) are never touched by this feature.

create table if not exists public.kvk_periods (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('members', 'prep')),
  label       text not null,
  archived_at timestamptz not null default now()
);

create index if not exists kvk_periods_scope_idx
  on public.kvk_periods (scope, archived_at desc);

alter table public.kvk_periods enable row level security;
-- No policy: service-role only, same pattern as submissions/admin_rallies.

create table if not exists public.submissions_archive (
  period_id        uuid not null references public.kvk_periods(id) on delete cascade,
  id               uuid not null,
  name             text not null,
  member_id        text not null,
  infantry_tier    text,
  infantry_tg      text,
  cavalry_tier     text,
  cavalry_tg       text,
  archer_tier      text,
  archer_tg        text,
  heroes           text[] not null default '{}'::text[],
  availability     text,
  current_alliance text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- Deliberately no pin_hash column: archived rows are a read-only historical
-- view of roster fields, never a login credential store.

create index if not exists submissions_archive_period_idx
  on public.submissions_archive (period_id);

alter table public.submissions_archive enable row level security;

create table if not exists public.admin_rallies_archive (
  period_id       uuid not null references public.kvk_periods(id) on delete cascade,
  id              text not null,
  name            text not null,
  position        integer not null,
  member_ids      text[] not null default '{}',
  lead_member_id  text,
  formation       jsonb not null default '{"infantry": 0, "cavalry": 0, "archer": 0}'::jsonb,
  updated_at      timestamptz not null default now()
);

create index if not exists admin_rallies_archive_period_idx
  on public.admin_rallies_archive (period_id);

alter table public.admin_rallies_archive enable row level security;

create table if not exists public.prep_backpack_submissions_archive (
  period_id             uuid not null references public.kvk_periods(id) on delete cascade,
  id                    uuid not null,
  member_id             text not null,
  in_game_name          text not null,
  want_construction     text default '',
  construction_upgrades text[] not null default '{}',
  ttg_used              text default '',
  tg_used               text default '',
  want_research         text default '',
  t11_troops            text[] not null default '{}',
  tg_dust               text default '',
  research_speedup_days text default '',
  want_troop_training   text default '',
  is_transfer           text default '',
  troop_speedup_days    text default '',
  promoting_t11         text default '',
  avail_day1            text[] not null default '{}',
  avail_day2            text[] not null default '{}',
  avail_day4            text[] not null default '{}',
  avail_day5            text[] not null default '{}',
  notes                 text default '',
  created_at            timestamptz not null default now()
);

create index if not exists prep_backpack_archive_period_idx
  on public.prep_backpack_submissions_archive (period_id);

alter table public.prep_backpack_submissions_archive enable row level security;

-- ---------------------------------------------------------------------------
-- Archive functions: pure "insert ... select" copies. No delete/update
-- statement appears anywhere below - a partial failure just means no archive
-- rows were written, never that live data was lost.
-- ---------------------------------------------------------------------------

create or replace function public.admin_archive_members_period(p_period_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.submissions_archive (
    period_id, id, name, member_id, infantry_tier, infantry_tg, cavalry_tier,
    cavalry_tg, archer_tier, archer_tg, heroes, availability, current_alliance,
    created_at, updated_at
  )
  select
    p_period_id, id, name, member_id, infantry_tier, infantry_tg, cavalry_tier,
    cavalry_tg, archer_tier, archer_tg, heroes, availability, current_alliance,
    created_at, updated_at
  from public.submissions;

  insert into public.admin_rallies_archive (
    period_id, id, name, position, member_ids, lead_member_id, formation, updated_at
  )
  select
    p_period_id, id, name, position, member_ids, lead_member_id, formation, updated_at
  from public.admin_rallies;
end;
$$;

create or replace function public.admin_archive_prep_period(p_period_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.prep_backpack_submissions_archive (
    period_id, id, member_id, in_game_name, want_construction, construction_upgrades,
    ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
    want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
    avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
  )
  select
    p_period_id, id, member_id, in_game_name, want_construction, construction_upgrades,
    ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
    want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
    avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
  from public.prep_backpack_submissions;
end;
$$;

revoke all on function public.admin_archive_members_period(uuid) from public, anon, authenticated;
revoke all on function public.admin_archive_prep_period(uuid) from public, anon, authenticated;
grant execute on function public.admin_archive_members_period(uuid) to service_role;
grant execute on function public.admin_archive_prep_period(uuid) to service_role;
