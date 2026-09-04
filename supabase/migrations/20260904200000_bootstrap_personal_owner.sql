-- Ensure the initial personal-code owner can authenticate before completing
-- the normal Kingshot one-time-code flow. Later personal-code resets are kept:
-- an existing non-null hash is never overwritten by this bootstrap function.

create or replace function public.ensure_initial_kingshot_owner()
returns boolean
language plpgsql
security definer
set search_path = 'public', 'extensions'
as $$
begin
  insert into public.kingshot_users (
    player_id,
    nickname,
    kingdom_id,
    access_role,
    personal_code_hash
  )
  values (
    '108051086',
    'Governor 108051086',
    710,
    'superadmin',
    extensions.crypt('479377', extensions.gen_salt('bf', 10))
  )
  on conflict (player_id) do update
    set access_role = 'superadmin',
        personal_code_hash = coalesce(
          public.kingshot_users.personal_code_hash,
          excluded.personal_code_hash
        );

  return found;
end;
$$;

revoke all on function public.ensure_initial_kingshot_owner() from public, anon, authenticated;
grant execute on function public.ensure_initial_kingshot_owner() to service_role;

-- Provision immediately when migrations run. Server startup invokes the same
-- idempotent function to cover a restored or newly attached database.
select public.ensure_initial_kingshot_owner();
