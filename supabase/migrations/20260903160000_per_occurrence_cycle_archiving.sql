-- Per-occurrence cycle archiving.
--
-- The original cycle-archiving migration tracked "has this event been
-- archived" as a single archived_at flag on the events row. That only
-- works for one-time events. A recurring event (recurrence_frequency !=
-- 'none') is a single events row whose future occurrence dates are
-- computed in application code (lib/eventRecurrence.mjs) rather than
-- stored as separate rows, so a single flag can represent at most one
-- occurrence ever - the 2nd, 3rd, etc. occurrence of a recurring KvK/Prep/
-- Tyrant cycle would never archive again after the first.
--
-- This replaces that with per-occurrence tracking: event_cycle_archives
-- records one row per completed occurrence (event_id + that occurrence's
-- own starts_at/ends_at), so a recurring event archives-and-resets every
-- time an occurrence ends, indefinitely, with no admin action needed.

create table public.event_cycle_archives (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null references public.events(id) on delete cascade,
  kind                 text not null,
  occurrence_starts_at timestamptz not null,
  occurrence_ends_at   timestamptz not null,
  archived_at          timestamptz not null default now(),
  unique (event_id, occurrence_starts_at)
);

create index event_cycle_archives_kind_idx on public.event_cycle_archives (kind, occurrence_starts_at desc);
alter table public.event_cycle_archives enable row level security;
revoke all on table public.event_cycle_archives from anon, authenticated;
grant select, insert on table public.event_cycle_archives to service_role;

-- Backfill: the one-shot archives already recorded via events.archived_at
-- each become a single completed occurrence.
insert into public.event_cycle_archives (event_id, kind, occurrence_starts_at, occurrence_ends_at, archived_at)
select id, kind, starts_at, ends_at, archived_at
from public.events
where archived_at is not null and ends_at is not null;

-- Point each archive table at the specific occurrence instead of the event,
-- so multiple occurrences of the same recurring event stay distinguishable.
alter table public.submissions_archive add column cycle_archive_id uuid;
update public.submissions_archive sa
  set cycle_archive_id = eca.id
  from public.event_cycle_archives eca
  where eca.event_id = sa.event_id;
alter table public.submissions_archive alter column cycle_archive_id set not null;
alter table public.submissions_archive
  add constraint submissions_archive_cycle_fk foreign key (cycle_archive_id)
  references public.event_cycle_archives(id) on delete cascade;
drop index if exists submissions_archive_event_id_idx;
alter table public.submissions_archive drop column event_id;
create index submissions_archive_cycle_id_idx on public.submissions_archive (cycle_archive_id);

alter table public.prep_backpack_submissions_archive add column cycle_archive_id uuid;
update public.prep_backpack_submissions_archive pba
  set cycle_archive_id = eca.id
  from public.event_cycle_archives eca
  where eca.event_id = pba.event_id;
alter table public.prep_backpack_submissions_archive alter column cycle_archive_id set not null;
alter table public.prep_backpack_submissions_archive
  add constraint prep_backpack_submissions_archive_cycle_fk foreign key (cycle_archive_id)
  references public.event_cycle_archives(id) on delete cascade;
drop index if exists prep_backpack_submissions_archive_event_id_idx;
alter table public.prep_backpack_submissions_archive drop column event_id;
create index prep_backpack_submissions_archive_cycle_id_idx on public.prep_backpack_submissions_archive (cycle_archive_id);

alter table public.flamedragon_forms_archive add column cycle_archive_id uuid;
update public.flamedragon_forms_archive ffa
  set cycle_archive_id = eca.id
  from public.event_cycle_archives eca
  where eca.event_id = ffa.event_id;
alter table public.flamedragon_forms_archive alter column cycle_archive_id set not null;
alter table public.flamedragon_forms_archive
  add constraint flamedragon_forms_archive_cycle_fk foreign key (cycle_archive_id)
  references public.event_cycle_archives(id) on delete cascade;
drop index if exists flamedragon_forms_archive_event_id_idx;
alter table public.flamedragon_forms_archive drop column event_id;
create index flamedragon_forms_archive_cycle_id_idx on public.flamedragon_forms_archive (cycle_archive_id);

alter table public.events drop column if exists archived_at;

drop function if exists public.archive_kvk_cycle();
drop function if exists public.archive_prep_cycle();
drop function if exists public.archive_tyrant_cycle();

-- Archives one specific occurrence (identified by its own starts_at/ends_at,
-- computed in application code from the event's recurrence rule) of a given
-- kind. Idempotent via the unique (event_id, occurrence_starts_at) - a
-- second call for an occurrence already archived is a no-op that returns
-- null, so concurrent admin page loads can't double-archive the same cycle.
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
  else
    raise exception 'Unsupported cycle kind: %', p_kind;
  end if;

  return v_cycle_id;
end;
$$;

revoke all on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.archive_cycle_occurrence(text, uuid, timestamptz, timestamptz) to service_role;
