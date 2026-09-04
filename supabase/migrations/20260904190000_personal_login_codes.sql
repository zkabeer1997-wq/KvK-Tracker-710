-- Personal fallback login codes for verified Kingshot accounts.
-- Codes are always stored as bcrypt hashes and are managed only through
-- service-role routes after a superadmin session has been verified.

alter table public.kingshot_users
  add column if not exists personal_code_hash text;

comment on column public.kingshot_users.personal_code_hash is
  'One-way bcrypt hash of the optional 6-digit fallback login code. The plaintext code is shown only when it is created or reset.';

-- Keep both designated owners as superadmins. The first personal code for
-- 108051086 is set only when no code has already been configured, so applying
-- this migration never overwrites a later reset.
update public.kingshot_users
   set access_role = 'superadmin',
       updated_at = now()
 where player_id = '106599852';

update public.kingshot_users
   set personal_code_hash = extensions.crypt('479377', extensions.gen_salt('bf', 10)),
       updated_at = now()
 where player_id = '108051086'
   and personal_code_hash is null;

create or replace function public.set_initial_kingshot_access_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.player_id in ('108051086', '106599852') then
    new.access_role := 'superadmin';
  else
    new.access_role := 'member';
  end if;
  if new.player_id = '108051086' and new.personal_code_hash is null then
    new.personal_code_hash := extensions.crypt('479377', extensions.gen_salt('bf', 10));
  end if;
  return new;
end;
$$;

create or replace function public.verify_kingshot_personal_code(
  p_player_id text,
  p_personal_code text
)
returns boolean
language sql
security definer
set search_path = 'public', 'extensions'
as $$
  select coalesce((
    select case
      when u.personal_code_hash ~ '^\$2[aby]\$[0-9]{2}\$'
        then u.personal_code_hash = extensions.crypt(p_personal_code, u.personal_code_hash)
      else false
    end
      from public.kingshot_users as u
     where u.player_id = btrim(p_player_id)
       and u.kingdom_id = 710
       and p_personal_code ~ '^[0-9]{6}$'
  ), false);
$$;

create or replace function public.reset_kingshot_personal_code(
  p_actor_player_id text,
  p_target_player_id text,
  p_personal_code text
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  actor_role text;
begin
  if p_personal_code is null or p_personal_code !~ '^[0-9]{6}$' then
    raise exception 'invalid_personal_code';
  end if;

  select u.access_role
    into actor_role
    from public.kingshot_users as u
   where u.player_id = btrim(p_actor_player_id);

  if actor_role is distinct from 'superadmin' then
    raise exception 'superadmin_required';
  end if;

  update public.kingshot_users as u
     set personal_code_hash = extensions.crypt(p_personal_code, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where u.player_id = btrim(p_target_player_id)
     and u.kingdom_id = 710;

  if not found then
    raise exception 'user_not_found';
  end if;

  return true;
end;
$$;

revoke all on function public.verify_kingshot_personal_code(text, text) from public, anon, authenticated;
revoke all on function public.reset_kingshot_personal_code(text, text, text) from public, anon, authenticated;
grant execute on function public.verify_kingshot_personal_code(text, text) to service_role;
grant execute on function public.reset_kingshot_personal_code(text, text, text) to service_role;
