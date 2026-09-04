-- Revert to per-event-kind archiving triggers.
--
-- The previous migration unified everything behind a single 'kvk' event.
-- That's wrong: KvK Battle, KvK Prep Phase, and Flamedragon Tyrant Battle
-- are run and scheduled as separate recurring events with their own end
-- dates, so each needs to archive independently, on its own schedule.
--
-- Flamedragon Tyrant and Noble Advisor Schedule both belong to Flamedragon
-- Management and run on the same cadence, so they both archive together
-- off the 'tyrant' kind rather than each getting their own event kind.

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check
  check (kind in ('kvk', 'championship', 'swordland', 'custom', 'prep', 'tyrant'));

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
  if p_kind not in ('kvk', 'prep', 'tyrant') then
    raise exception 'Unsupported cycle kind: %', p_kind;
  end if;

  insert into public.event_cycle_archives (event_id, kind, occurrence_starts_at, occurrence_ends_at)
  values (p_event_id, p_kind, p_starts_at, p_ends_at)
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
    delete from public.submissions;

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
    delete from public.prep_backpack_submissions;

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
    delete from public.flamedragon_forms;

    insert into public.noble_advisor_submissions_archive (
      cycle_archive_id, member_id, in_game_name, want_troop_training, is_transfer,
      troop_speedup_days, promoting_t11, avail_day4, created_at
    )
    select v_cycle_id, member_id, in_game_name, want_troop_training, is_transfer,
           troop_speedup_days, promoting_t11, avail_day4, created_at
    from public.noble_advisor_submissions;
    delete from public.noble_advisor_submissions;
  end if;

  return v_cycle_id;
end;
$$;

revoke all on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) to service_role;

-- Restore the one event we can identify unambiguously by name; any other
-- event that was folded from 'prep'/'tyrant' into 'custom' by the previous
-- migration needs a human to confirm which kind it should be.
update public.events set kind = 'tyrant' where title = 'Flamedragon Tyrant Battle' and kind = 'custom';
