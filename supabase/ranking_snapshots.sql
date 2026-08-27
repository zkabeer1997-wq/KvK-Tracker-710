-- Rankings, append-only: every upload is a new row, never a mutation of
-- an existing one, so trend deltas between snapshots are always comparing
-- real historical values, not overwritten ones. `rows` is a flexible
-- jsonb array of {rank, name, value} so kingdom/alliance/player scopes
-- (which have different natural columns) don't need three separate
-- tables.
--
-- Same pattern as every other new table this project: RLS enabled, no
-- anon/authenticated grants, service_role only, published filtering in
-- application code.
create table if not exists public.ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  metric text not null,
  source text,
  rows jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now(),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ranking_snapshots_scope_check check (scope in ('kingdom', 'alliance', 'player'))
);

create index if not exists ranking_snapshots_scope_captured_idx
  on public.ranking_snapshots (scope, captured_at desc);

alter table public.ranking_snapshots enable row level security;
revoke all on table public.ranking_snapshots from anon, authenticated;
grant select, insert, update, delete on table public.ranking_snapshots to service_role;
-- `update` is granted only for the `published` visibility flag - the admin
-- API (see app/api/admin-rankings/[id]/route.js) rejects any PATCH that
-- touches rows/metric/source/scope. Correcting a bad upload still means
-- deleting that snapshot and posting a new one, not editing values in
-- place, so trend deltas always compare real historical uploads.
