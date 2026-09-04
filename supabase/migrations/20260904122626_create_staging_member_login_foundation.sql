create extension if not exists pgcrypto with schema extensions;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  member_id text not null unique,
  infantry_tier text,
  infantry_tg text,
  cavalry_tier text,
  cavalry_tg text,
  archer_tier text,
  archer_tg text,
  heroes text[] not null default '{}',
  availability text,
  pin_hash text not null,
  current_alliance text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_member_id_format check (member_id ~ '^[0-9]{6,12}$')
);

alter table public.submissions enable row level security;
revoke all on table public.submissions from public, anon, authenticated;
grant select, insert, update, delete on table public.submissions to service_role;

create or replace function public.verify_page_pin(p_member_id text, p_pin text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select s.pin_hash = extensions.crypt(p_pin, s.pin_hash)
      from public.submissions as s
      where s.member_id = btrim(p_member_id)
        and s.pin_hash ~ '^\$2[aby]\$[0-9]{2}\$'
      limit 1
    ),
    false
  );
$$;

revoke all on function public.verify_page_pin(text, text) from public, anon, authenticated;
grant execute on function public.verify_page_pin(text, text) to service_role;

create table if not exists public.member_login_security_events (
  id bigint generated always as identity primary key,
  member_id_fingerprint text not null,
  event_type text not null check (event_type in ('success','failure','locked','pin_changed','session_revoked')),
  source_fingerprint text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.member_login_security_events enable row level security;
revoke all on table public.member_login_security_events from public, anon, authenticated;
grant select, insert, update, delete on table public.member_login_security_events to service_role;

comment on table public.member_login_security_events is
  'Staging-only security events. Never store submitted PINs, cookies, raw IPs, or authorization headers.';
