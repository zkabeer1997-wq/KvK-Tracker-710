-- Extends the pre-existing event-cycle archiving system (event_cycle_archives,
-- submissions_archive, prep_backpack_submissions_archive,
-- flamedragon_forms_archive, noble_advisor_submissions_archive, and the
-- archive_cycle_occurrence() function) that already lived in this project's
-- database but wasn't reflected anywhere in this repo, and makes it
-- copy-only. This backs the time-period picker on the KvK Members and Prep
-- Ministers admin tabs.
--
-- Adds:
--  - an admin-typed label on event_cycle_archives, so an admin can name a
--    period (e.g. "Before Sept 4, 2026") instead of only having an event/
--    occurrence-date pair
--  - admin_rallies_archive, so the rally board is archived alongside the
--    submissions roster - the pre-existing system had no rally counterpart
--
-- Replaces:
--  - archive_cycle_occurrence(), which previously did
--    `delete from public.submissions` / `prep_backpack_submissions` /
--    `flamedragon_forms` / `noble_advisor_submissions` immediately after
--    copying them into their *_archive tables. For submissions that meant
--    deleting every member's pin_hash (their login credential) along with
--    their roster row. The replacement below only ever INSERTs; nothing it
--    calls can delete or modify a live row. The old 4-argument overload is
--    explicitly dropped (see below) so it can no longer be called even
--    positionally - `create or replace` with an added parameter creates a
--    new overload rather than replacing the dangerous one.

alter table public.event_cycle_archives
  add column if not exists label text;

create table if not exists public.admin_rallies_archive (
  id                uuid primary key default gen_random_uuid(),
  cycle_archive_id  uuid not null references public.event_cycle_archives(id) on delete cascade,
  rally_id          text not null,
  name              text not null,
  position          integer not null,
  member_ids        text[] not null default '{}',
  lead_member_id    text,
  formation         jsonb not null default '{"infantry": 0, "cavalry": 0, "archer": 0}'::jsonb,
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz not null default now()
);

create index if not exists admin_rallies_archive_cycle_idx
  on public.admin_rallies_archive (cycle_archive_id);

alter table public.admin_rallies_archive enable row level security;
-- No policy: service-role only, same pattern as admin_rallies.

-- The dangerous 4-arg overload (p_kind, p_event_id, p_starts_at, p_ends_at)
-- must be dropped explicitly - CREATE OR REPLACE with an added parameter
-- creates a new, separate overload rather than replacing it.
drop function if exists public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz);

create or replace function public.archive_cycle_occurrence(
  p_kind text,
  p_event_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_label text default null
)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_cycle_id uuid;
begin
  if p_kind not in ('kvk', 'prep', 'tyrant') then
    raise exception 'Unsupported cycle kind: %', p_kind;
  end if;

  insert into public.event_cycle_archives (event_id, kind, occurrence_starts_at, occurrence_ends_at, label)
  values (p_event_id, p_kind, p_starts_at, p_ends_at, p_label)
  on conflict (event_id, occurrence_starts_at) do nothing
  returning id into v_cycle_id;

  if v_cycle_id is null then
    return null;
  end if;

  if p_kind = 'kvk' then
    insert into public.submissions_archive (
      cycle_archive_id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
      archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
    )
    select v_cycle_id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
           archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
    from public.submissions;
    -- no delete: submissions (and its pin_hash/login column) is left untouched.

    insert into public.admin_rallies_archive (
      cycle_archive_id, rally_id, name, position, member_ids, lead_member_id, formation, updated_at
    )
    select v_cycle_id, id, name, position, member_ids, lead_member_id, formation, updated_at
    from public.admin_rallies;
    -- no delete.

  elsif p_kind = 'prep' then
    insert into public.prep_backpack_submissions_archive (
      cycle_archive_id, member_id, in_game_name, want_construction, construction_upgrades,
      ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
      want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
      avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
    )
    select v_cycle_id, member_id, in_game_name, want_construction, construction_upgrades,
           ttg_used, tg_used, want_research, t11_troops, tg_dust, research_speedup_days,
           want_troop_training, is_transfer, troop_speedup_days, promoting_t11,
           avail_day1, avail_day2, avail_day4, avail_day5, notes, created_at
    from public.prep_backpack_submissions;
    -- no delete.

  elsif p_kind = 'tyrant' then
    insert into public.flamedragon_forms_archive (
      cycle_archive_id, member_id, name, current_alliance, infantry_tier, infantry_tg,
      cavalry_tier, cavalry_tg, archer_tier, archer_tg, heroes, charms,
      governor_gear, pet_power, masters_power, mystic_trial_score, availability,
      voice_chat, auto_help, updated_at
    )
    select v_cycle_id, member_id, name, current_alliance, infantry_tier, infantry_tg,
           cavalry_tier, cavalry_tg, archer_tier, archer_tg, heroes, charms,
           governor_gear, pet_power, masters_power, mystic_trial_score, availability,
           voice_chat, auto_help, updated_at
    from public.flamedragon_forms;
    -- no delete.

    insert into public.noble_advisor_submissions_archive (
      cycle_archive_id, member_id, in_game_name, want_troop_training, is_transfer,
      troop_speedup_days, promoting_t11, avail_day4, created_at
    )
    select v_cycle_id, member_id, in_game_name, want_troop_training, is_transfer,
           troop_speedup_days, promoting_t11, avail_day4, created_at
    from public.noble_advisor_submissions;
    -- no delete.
  end if;

  return v_cycle_id;
end;
$function$;
