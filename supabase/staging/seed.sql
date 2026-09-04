-- STAGING ONLY. Never run against K710Hub Main.
insert into public.submissions (name, member_id, pin_hash, current_alliance)
values
  ('Staging Member One', '710000001', extensions.crypt('710710', extensions.gen_salt('bf', 10)), 'RED'),
  ('Staging Member Two', '710000002', extensions.crypt('246810', extensions.gen_salt('bf', 10)), 'SKY')
on conflict (member_id) do update
set name = excluded.name,
    pin_hash = excluded.pin_hash,
    current_alliance = excluded.current_alliance,
    updated_at = now();
