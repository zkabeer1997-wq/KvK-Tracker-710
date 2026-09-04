-- Allow a signed-in member to change their own PIN after proving knowledge of
-- the current PIN. This RPC is server-only; raw PINs are never persisted.
create or replace function public.change_member_pin(
  p_member_id text,
  p_current_pin text,
  p_new_pin text
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
declare
  current_hash text;
begin
  if nullif(btrim(p_member_id), '') is null
     or p_current_pin !~ '^[0-9]{6}$'
     or p_new_pin !~ '^[0-9]{6}$'
     or p_new_pin = p_current_pin then
    return false;
  end if;

  select pin_hash into current_hash
  from public.submissions
  where member_id = btrim(p_member_id)
  for update;

  if current_hash is null
     or current_hash !~ '^\$2[aby]\$[0-9]{2}\$'
     or current_hash <> extensions.crypt(p_current_pin, current_hash) then
    return false;
  end if;

  update public.submissions
  set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where member_id = btrim(p_member_id);

  return true;
end;
$$;

revoke all on function public.change_member_pin(text, text, text) from public, anon, authenticated;
grant execute on function public.change_member_pin(text, text, text) to service_role;
