-- Decouple archived cycle data from the calendar event that triggered it.
--
-- event_cycle_archives.event_id previously had "on delete cascade" back to
-- events, and every *_archive table cascades from event_cycle_archives.
-- That meant deleting a calendar event - a routine, low-stakes action taken
-- from the Events admin page - silently deleted every archived submission
-- tied to it, with no warning and no way back on a project with no backups.
-- Archived rosters are real historical records; a calendar entry is just
-- scheduling metadata. Deleting the latter must never delete the former.
--
-- Fix: event_id becomes nullable and "on delete set null" instead of
-- cascade, so a deleted event just stops having a title to show in the
-- history dropdown (falls back to "Cycle") - the archived data survives.

alter table public.event_cycle_archives drop constraint event_cycle_archives_event_id_fkey;
alter table public.event_cycle_archives alter column event_id drop not null;
alter table public.event_cycle_archives
  add constraint event_cycle_archives_event_id_fkey foreign key (event_id)
  references public.events(id) on delete set null;
