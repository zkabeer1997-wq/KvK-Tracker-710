-- Secure member-access prototype. Production app does not use these tables unless
-- the agent/member-access-v2 branch (or a later approved rollout) is deployed.

create table if not exists public.member_access_v2_accounts (
  member_id text primary key,
  display_name text not null default '',
  role text not null default 'member' check (role in ('member','leadership','recruitment','admin')),
  status text not null default 'active' check (status in ('active','revoked')),
  passphrase_salt text,
  passphrase_hash text,
  claimed_at timestamptz,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  approved_at timestamptz not null default now(),
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_access_v2_sessions (
  token_hash text primary key,
  member_id text not null references public.member_access_v2_accounts(member_id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists member_access_v2_sessions_member_idx on public.member_access_v2_sessions(member_id);
create index if not exists member_access_v2_sessions_expiry_idx on public.member_access_v2_sessions(expires_at);

alter table public.member_access_v2_accounts enable row level security;
alter table public.member_access_v2_sessions enable row level security;

revoke all on table public.member_access_v2_accounts from anon, authenticated;
revoke all on table public.member_access_v2_sessions from anon, authenticated;
grant select, insert, update, delete on table public.member_access_v2_accounts to service_role;
grant select, insert, update, delete on table public.member_access_v2_sessions to service_role;

-- Initial rollout only: freeze the current roster as approved. Future submissions
-- are deliberately NOT auto-approved and must be approved from Admin > Member Access.
insert into public.member_access_v2_accounts (member_id, display_name, role, status, approved_by)
select s.member_id, s.name, 'member', 'active', 'initial_roster_snapshot'
from public.submissions s
where coalesce(trim(s.member_id), '') <> ''
on conflict (member_id) do nothing;
