-- Direct Kingshot account login, durable sessions, and member/admin roles.
-- All objects are server-only: browsers never receive table grants and every
-- read/write is performed by same-origin routes using the service role.

create table if not exists public.kingshot_users (
  player_id text primary key,
  nickname text not null,
  avatar_url text,
  kingdom_id integer not null,
  access_role text not null default 'member'
    check (access_role in ('member', 'admin', 'superadmin')),
  mightpulse_uid bigint,
  alliance_id bigint,
  alliance_abbr text,
  alliance_name text,
  alliance_rank integer,
  power bigint,
  kills bigint,
  mystic_trial bigint,
  coordinate_x integer,
  coordinate_y integer,
  official_profile jsonb not null default '{}'::jsonb,
  official_api_response jsonb not null default '{}'::jsonb,
  mightpulse_search_response jsonb,
  mightpulse_profile_response jsonb,
  first_login_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kingshot_users_player_id_format check (player_id ~ '^[0-9]{4,20}$'),
  constraint kingshot_users_kingdom_id_positive check (kingdom_id > 0)
);

comment on table public.kingshot_users is
  'One protected row per Kingshot account. JSONB columns preserve the complete post-login profile responses; login tokens and one-time codes are never stored.';

create table if not exists public.kingshot_sessions (
  token_hash text primary key,
  player_id text not null references public.kingshot_users(player_id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  source_fingerprint text,
  user_agent_fingerprint text,
  constraint kingshot_sessions_token_hash_format check (token_hash ~ '^[0-9a-f]{64}$')
);

create index if not exists kingshot_sessions_player_id_idx
  on public.kingshot_sessions (player_id);
create index if not exists kingshot_sessions_active_expiry_idx
  on public.kingshot_sessions (expires_at)
  where revoked_at is null;

create table if not exists public.kingshot_login_events (
  id bigint generated always as identity primary key,
  player_id_fingerprint text,
  source_fingerprint text,
  event_type text not null check (
    event_type in ('code_requested', 'verification_failed', 'login_success', 'kingdom_denied', 'logout')
  ),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists kingshot_login_events_player_time_idx
  on public.kingshot_login_events (player_id_fingerprint, occurred_at desc);
create index if not exists kingshot_login_events_source_time_idx
  on public.kingshot_login_events (source_fingerprint, occurred_at desc);

alter table public.kingshot_users enable row level security;
alter table public.kingshot_sessions enable row level security;
alter table public.kingshot_login_events enable row level security;

revoke all on table public.kingshot_users from public, anon, authenticated;
revoke all on table public.kingshot_sessions from public, anon, authenticated;
revoke all on table public.kingshot_login_events from public, anon, authenticated;

grant select, insert, update, delete on table public.kingshot_users to service_role;
grant select, insert, update, delete on table public.kingshot_sessions to service_role;
grant select, insert, update, delete on table public.kingshot_login_events to service_role;
grant usage, select on sequence public.kingshot_login_events_id_seq to service_role;

-- The founder receives superadmin only when the account row is first created.
-- Later role changes remain intact and are never overwritten by another login.
create or replace function public.set_initial_kingshot_access_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.player_id = '108051086' then
    new.access_role := 'superadmin';
  else
    new.access_role := 'member';
  end if;
  return new;
end;
$$;

drop trigger if exists set_initial_kingshot_access_role on public.kingshot_users;
create trigger set_initial_kingshot_access_role
before insert on public.kingshot_users
for each row execute function public.set_initial_kingshot_access_role();

-- Role changes are centralized here so even a future server caller cannot
-- let an admin assign roles or let a superadmin demote their own account.
create or replace function public.set_kingshot_user_role(
  p_actor_player_id text,
  p_target_player_id text,
  p_access_role text
)
returns table (player_id text, access_role text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_role text;
begin
  if p_access_role not in ('member', 'admin', 'superadmin') then
    raise exception 'invalid_access_role';
  end if;

  select u.access_role
    into actor_role
    from public.kingshot_users as u
   where u.player_id = btrim(p_actor_player_id);

  if actor_role is distinct from 'superadmin' then
    raise exception 'superadmin_required';
  end if;

  if btrim(p_actor_player_id) = btrim(p_target_player_id)
     and p_access_role <> 'superadmin' then
    raise exception 'cannot_remove_own_superadmin';
  end if;

  return query
  update public.kingshot_users as u
     set access_role = p_access_role,
         updated_at = now()
   where u.player_id = btrim(p_target_player_id)
  returning u.player_id, u.access_role;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.set_initial_kingshot_access_role() from public, anon, authenticated;
revoke all on function public.set_kingshot_user_role(text, text, text) from public, anon, authenticated;
grant execute on function public.set_initial_kingshot_access_role() to service_role;
grant execute on function public.set_kingshot_user_role(text, text, text) to service_role;

