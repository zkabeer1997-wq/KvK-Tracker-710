-- Unify cycle archiving: a single KvK event drives all four forms.
--
-- Previously KvK Members, Prep Ministers, and Flamedragon Tyrant each
-- archived off their own event kind ('kvk', 'prep', 'tyrant'), requiring a
-- separate calendar event per form. In practice all four forms (KvK
-- Members, Prep Ministers, Flamedragon Tyrant, and Noble Advisor) run on
-- the same KvK cycle, so a single 'kvk' event ending should archive and
-- reset all four together. The 'prep' and 'tyrant' kinds are removed - they
-- never drove anything on their own now.

create table public.noble_advisor_submissions_archive (
  id                   uuid primary key default gen_random_uuid(),
  cycle_archive_id     uuid not null references public.event_cycle_archives(id) on delete cascade,
  member_id            text not null,
  in_game_name         text not null,
  want_troop_training  text default '',
  is_transfer          text default '',
  troop_speedup_days   text default '',
  promoting_t11        text default '',
  avail_day4           text[] not null default '{}',
  created_at           timestamptz,
  archived_at          timestamptz not null default now()
);

create index noble_advisor_submissions_archive_cycle_id_idx on public.noble_advisor_submissions_archive (cycle_archive_id);
alter table public.noble_advisor_submissions_archive enable row level security;
revoke all on table public.noble_advisor_submissions_archive from anon, authenticated;
grant select, insert, delete on table public.noble_advisor_submissions_archive to service_role;

-- 'prep' and 'tyrant' event kinds are no longer meaningful - fold any
-- existing ones into 'custom' before tightening the constraint back down.
update public.events set kind = 'custom' where kind in ('prep', 'tyrant');
alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check
  check (kind in ('kvk', 'championship', 'swordland', 'custom'));

create or replace function public.archive_cycle_occurrence(
  p_kind text, p_event_id uuid, p_starts_at timestamptz, p_ends_at timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cycle_id uuid;
begin
  if p_kind <> 'kvk' then
    raise exception 'Unsupported cycle kind: %', p_kind;
  end if;

  insert into public.event_cycle_archives (event_id, kind, occurrence_starts_at, occurrence_ends_at)
  values (p_event_id, p_kind, p_starts_at, p_ends_at)
  on conflict (event_id, occurrence_starts_at) do nothing
  returning id into v_cycle_id;

  if v_cycle_id is null then
    return null;
  end if;

  insert into public.submissions_archive (
    cycle_archive_id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
    archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
  )
  select v_cycle_id, name, member_id, infantry_tier, infantry_tg, cavalry_tier, cavalry_tg,
         archer_tier, archer_tg, heroes, availability, current_alliance, created_at, updated_at
  from public.submissions;
  delete from public.submissions;

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
  delete from public.prep_backpack_submissions;

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
  delete from public.flamedragon_forms;

  insert into public.noble_advisor_submissions_archive (
    cycle_archive_id, member_id, in_game_name, want_troop_training, is_transfer,
    troop_speedup_days, promoting_t11, avail_day4, created_at
  )
  select v_cycle_id, member_id, in_game_name, want_troop_training, is_transfer,
         troop_speedup_days, promoting_t11, avail_day4, created_at
  from public.noble_advisor_submissions;
  delete from public.noble_advisor_submissions;

  return v_cycle_id;
end;
$$;

revoke all on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) to service_role;
