# Kingshot member login runbook

## What is implemented

The old Member ID + PIN gate and shared admin-password page have been replaced by the two-step Kingshot account flow:

1. The player enters their numeric Player ID.
2. The server prepares the same signed request used by the Kingshot storefront.
3. The player confirms that the game is open and requests a one-time code.
4. The code is exchanged server-side for the Kingshot role response.
5. MightPulse supplies the kingdom and complete public player profile.
6. Only a verified `kid = 710` account receives a website session.

The storefront token and one-time code are never stored. Pending signing credentials are encrypted into a 15-minute `HttpOnly` cookie. Successful sessions use an opaque random cookie whose SHA-256 hash is stored in Supabase, so sessions survive refreshes/new tabs and can be revoked on logout.

## Database setup

Apply this migration before deploying the code:

```text
supabase/migrations/20260904170000_kingshot_accounts_sessions_and_roles.sql
```

It creates three server-only tables:

- `kingshot_users`: one row per verified account, normalized menu/profile fields, the complete Kingshot role response, and the complete MightPulse search/profile responses.
- `kingshot_sessions`: revocable 30-day login sessions. Only a token hash is stored.
- `kingshot_login_events`: redacted code-request, failure, kingdom-denial, login, and logout events.

RLS is enabled on every table. `PUBLIC`, `anon`, and `authenticated` receive no table access; same-origin server routes use `service_role`.

## Roles

- `member`: member-only pages and tools.
- `admin`: the existing admin dashboard and admin APIs.
- `superadmin`: all admin access plus `/admin/dashboard/access`, where roles can be assigned or removed.

Player ID `108051086` becomes `superadmin` only when its `kingshot_users` row is first created. Later logins never overwrite a role decision. A database function enforces that only a superadmin can change roles and that a superadmin cannot remove their own superadmin role. They can change any other account, including another superadmin.

## Required environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MEMBER_SESSION_SECRET=
```

Use a stable, private `MEMBER_SESSION_SECRET` of at least 32 random bytes. Changing it invalidates pending login flows and their private fingerprints. Keep the service-role key server-only.

Optional endpoint overrides for controlled testing:

```text
KINGSHOT_API_BASE_URL=
KINGSHOT_PLAYER_API_URL=
KINGSHOT_PLAYER_SEARCH_URL=
```

`K710_ENABLE_LEGACY_ADMIN` and `K710_ENABLE_LEGACY_MEMBER_SESSION` must remain unset in deployed environments. They exist only for isolated legacy test fixtures.

## Deployment checks

- Apply the migration before the application deployment.
- Confirm `MEMBER_SESSION_SECRET` is stable across instances and deployments.
- Confirm `/api/session` returns `signed_out` with no cookie and `authenticated` after a successful Kingdom 710 login.
- Verify a non-710 account receives the on-page access message and no `k710_member_session` cookie.
- Verify refresh and a second tab retain the account.
- Verify logout revokes the Supabase session and clears the cookie.
- Verify a member cannot access `/admin/dashboard` or any `/api/admin-*` endpoint.
- Verify an admin can access the existing dashboard but not role management.
- Verify a superadmin cannot demote their own account.

Authentication uses the Kingshot storefront integration supplied in `D:\Kingshot\Account_Login`. Review Century Games' terms and endpoint changes before production rollout.
