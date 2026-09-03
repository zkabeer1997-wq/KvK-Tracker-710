-- Cycle archiving for KvK Members, Prep Ministers, and Flamedragon Tyrant.
--
-- Each of those admin tabs writes into a single flat, current-state-only
-- table (submissions, prep_backpack_submissions, flamedragon_forms). This
-- adds the ability to roll a finished cycle's submissions into a read-only
-- history table (selectable from a "Previous KvK/Prep/Tyrant" dropdown) and
-- reset the live table for the next cycle, automatically, once the linked
-- calendar event's ends_at has passed.
--
-- submissions.member_id is unique and flamedragon_forms.member_id is the
-- primary key, so a member can only ever have one live row. That means a
-- finished cycle's rows have to be physically moved into a separate archive
-- table (not just tagged with an event_id) before the live table is
-- cleared for the next cycle.

-- ---------------------------------------------------------------------------
-- events: mark cycles that have already been archived, and allow the two
-- new kinds these tabs use to define their cycles.
-- ---------------------------------------------------------------------------

alter table public.events add column if not exists archived_at timestamptz;

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check
  check (kind in ('kvk', 'championship', 'swordland', 'custom', 'prep', 'tyrant'));

-- ---------------------------------------------------------------------------
-- Archive tables. pin_hash is deliberately omitted, same as
-- public_submissions - history is a read surface, not an auth surface.
-- ---------------------------------------------------------------------------

create table if not exists public.submissions_archive (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  name           text not null,
  member_id      text not null,
  infantry_tier  text,
  infantry_tg    text,
  cavalry_tier   text,
  cavalry_tg     text,
  archer_tier    text,
  archer_tg      text,
  heroes         text[] not null default '{}'::text[],
  availability   text,
  current_alliance text,
  created_at     timestamptz,
  updated_at     timestamptz,
  archived_at    timestamptz not null default now()
);

create index if not exists submissions_archive_event_id_idx on public.submissions_archive (event_id);
alter table public.submissions_archive enable row level security;
revoke all on table public.submissions_archive from anon, authenticated;
grant select, insert, delete on table public.submissions_archive to service_role;

create table if not exists public.prep_backpack_submissions_archive (
  id                     uuid primary key default gen_random_uuid(),
  event_id               uuid not null references public.events(id) on delete cascade,
  member_id              text not null,
  in_game_name           text not null,
  want_construction      text default '',
  construction_upgrades  text[] not null default '{}',
  ttg_used               text default '',
  tg_used                text default '',
  want_research          text default '',
  t11_troops             text[] not null default '{}',
  tg_dust                text default '',
  research_speedup_days  text default '',
  want_troop_training    text default '',
  is_transfer            text default '',
  troop_speedup_days     text default '',
  promoting_t11          text default '',
  avail_day1             text[] not null default '{}',
  avail_day2             text[] not null default '{}',
  avail_day4             text[] not null default '{}',
  avail_day5             text[] not null default '{}',
  notes                  text default '',
  created_at             timestamptz,
  archived_at            timestamptz not null default now()
);

create index if not exists prep_backpack_submissions_archive_event_id_idx on public.prep_backpack_submissions_archive (event_id);
alter table public.prep_backpack_submissions_archive enable row level security;
revoke all on table public.prep_backpack_submissions_archive from anon, authenticated;
grant select, insert, delete on table public.prep_backpack_submissions_archive to service_role;

create table if not exists public.flamedragon_forms_archive (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.events(id) on delete cascade,
  member_id          text not null,
  name               text not null,
  current_alliance   text,
  infantry_tier      text,
  infantry_tg        text,
  cavalry_tier       text,
  cavalry_tg         text,
  archer_tier        text,
  archer_tg          text,
  heroes             text[] not null default '{}',
  charms             text,
  governor_gear      text,
  pet_power          text,
  masters_power      text,
  mystic_trial_score text,
  availability       text,
  voice_chat         text,
  auto_help          text,
  updated_at         timestamptz,
  archived_at        timestamptz not null default now()
);

create index if not exists flamedragon_forms_archive_event_id_idx on public.flamedragon_forms_archive (event_id);
alter table public.flamedragon_forms_archive enable row level security;
revoke all on table public.flamedragon_forms_archive from anon, authenticated;
grant select, insert, delete on table public.flamedragon_forms_archive to service_role;

-- ---------------------------------------------------------------------------
-- Archive functions. Each finds the most recent not-yet-archived event of
-- its kind whose ends_at has passed, copies the live table into the
-- matching archive table tagged with that event, clears the live table, and
-- marks the event archived - all in one transaction (a plpgsql function body
-- is one transaction). Returns the archived event's id, or null if there
-- was nothing due to archive yet. Called from the admin GET routes so
-- archiving happens automatically on next load, with no cron needed.
-- ---------------------------------------------------------------------------

create or replace function public.archive_kvk_cycle()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
begin
  select * into v_event from public.events
    where kind = 'kvk' and archived_at is null and ends_at is not null and ends_at < now()
    order by starts_at desc
    limit 1;

  if v_event.id is null then
    return null;
  end if;

  insert into public.submissions_archive (
    event_id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
    archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
  )
  select v_event.id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
         archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
  from public.submissions;

  delete from public.submissions;

  update public.events set archived_at = now() where id = v_event.id;

  return v_event.id;
end;
$$;

revoke all on function public.archive_kvk_cycle() from public, anon, authenticated;
grant execute on function public.archive_kvk_cycle() to service_role;

create or replace function public.archive_prep_cycle()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
begin
  select * into v_event from public.events
    where kind = 'prep' and archived_at is null and ends_at is not null and ends_at < now()
    order by starts_at desc
    limit 1;

  if v_event.id is null then
    return null;
  end if;

  insert into public.prep_backpack_submissions_archive (
    event_id, member_id, in_game_name, want_construction, construction_upgrades,
    ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
    want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
    avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
  )
  select v_event.id, member_id, in_game_name, want_construction, construction_upgrades,
         ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
         want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
         avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
  from public.prep_backpack_submissions;

  delete from public.prep_backpack_submissions;

  update public.events set archived_at = now() where id = v_event.id;

  return v_event.id;
end;
$$;

revoke all on function public.archive_prep_cycle() from public, anon, authenticated;
grant execute on function public.archive_prep_cycle() to service_role;

create or replace function public.archive_tyrant_cycle()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
begin
  select * into v_event from public.events
    where kind = 'tyrant' and archived_at is null and ends_at is not null and ends_at < now()
    order by starts_at desc
    limit 1;

  if v_event.id is null then
    return null;
  end if;

  insert into public.flamedragon_forms_archive (
    event_id, member_id, name, current_alliance, infantry_tier, infantry_tg,
    cavalry_tier, cavalry_tg, archer_tier, archer_tg, heroes, charms,
    governor_gear, pet_power, masters_power, mystic_trial_score, availability,
    voice_chat, auto_help, updated_at
  )
  select v_event.id, member_id, name, current_alliance, infantry_tier, infantry_tg,
         cavalry_tier, cavalry_tg, archer_tier, archer_tg, heroes, charms,
         governor_gear, pet_power, masters_power, mystic_trial_score, availability,
         voice_chat, auto_help, updated_at
  from public.flamedragon_forms;

  delete from public.flamedragon_forms;

  update public.events set archived_at = now() where id = v_event.id;

  return v_event.id;
end;
$$;

revoke all on function public.archive_tyrant_cycle() from public, anon, authenticated;
grant execute on function public.archive_tyrant_cycle() to service_role;
