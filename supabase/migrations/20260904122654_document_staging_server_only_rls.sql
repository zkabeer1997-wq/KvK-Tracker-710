create policy "deny browser reads"
on public.submissions for select
to anon, authenticated
using (false);

create policy "deny browser writes"
on public.submissions for all
to anon, authenticated
using (false)
with check (false);

create policy "deny browser security event access"
on public.member_login_security_events for all
to anon, authenticated
using (false)
with check (false);
