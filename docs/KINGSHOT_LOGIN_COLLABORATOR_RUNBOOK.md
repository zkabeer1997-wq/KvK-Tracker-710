# Kingshot login system — collaborator runbook

Owner: @zkabeer1997-wq  
Implementation branch: `dosojin/kingshot-login-system`  
Collaborator: @Dosojin

## Objective

Build a replacement member login that keeps the existing Kingshot Member ID + PIN experience, optionally verifies public player metadata through a Kingshot adapter, and never exposes production Supabase credentials or member data during development.

A successful Kingshot player lookup is **not proof of account ownership**. It may enrich or validate a member record, but it must not create an account, authenticate a user, or authorize a PIN reset by itself.

## Access boundary

Dosojin may:

- create commits on this branch;
- open a pull request to `main`;
- use the Vercel Preview deployment created from the branch;
- use only the isolated Supabase development environment and synthetic test records;
- add SQL migrations under `supabase/migrations/`.

Dosojin must not receive or use:

- production `SUPABASE_SERVICE_ROLE_KEY` or a Supabase secret key;
- production database passwords or connection strings;
- production `ADMIN_PASSWORD` or `MEMBER_SESSION_SECRET`;
- exports or copies of real member IDs, PIN hashes, transfer records, or uploaded files;
- permission to merge to `main` or promote a deployment to production.

## Owner setup

The owner completes these steps outside the code branch:

1. Create or select an isolated Supabase development branch/project with no production data.
2. Add **Preview-only** Vercel variables using development values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MEMBER_SESSION_SECRET`
   - `ADMIN_PASSWORD`
   - `KINGSHOT_API_MODE=mock`
   - `K710_ENVIRONMENT=preview`
3. Keep all production variables scoped to Production only.
4. Do not grant the collaborator access to Vercel environment-variable settings.
5. Protect `main` and require owner approval.

Generate unique preview secrets. Never reuse production values.

## Local setup

```bash
git fetch origin
git switch dosojin/kingshot-login-system
npm install
cp .env.example .env.local
npm test
npm run dev
```

Populate `.env.local` with development-only values. Never commit `.env.local`.

## Required design

### Authentication

- Member ID and PIN are accepted only by a same-origin server endpoint.
- PIN verification remains server-side.
- PINs are stored only as adaptive password hashes; never plaintext or reversible encryption.
- Login failures return one generic response for unknown IDs and wrong PINs.
- Session cookies are `HttpOnly`, `Secure` in deployed environments, `SameSite=Lax`, and expire server-side.
- PIN changes require the current PIN.
- A Kingshot lookup must never permit PIN reset or account recovery.

### Kingshot adapter

Implement a provider boundary instead of calling a third-party endpoint throughout the app:

```text
verifyPlayer(memberId) -> {
  found,
  playerId,
  playerName,
  kingdom,
  source,
  checkedAt
}
```

Provide:

- a deterministic mock provider for local/tests;
- timeouts and fail-closed behavior;
- response schema validation;
- no logging of full response bodies;
- no live provider enabled by default;
- graceful login behavior when metadata verification is temporarily unavailable, according to the product decision recorded in the PR.

Do not reverse-engineer a private mobile-game protocol or bypass Century Games controls.

### Rate limiting and audit

At minimum:

- rate limit by member ID and IP;
- progressive cooldown after repeated failures;
- generic client errors;
- redact PINs, cookies, keys, and authorization headers from logs;
- record security events without recording submitted PINs;
- revoke existing sessions after PIN change.

### Database changes

- Add each schema change as a new migration in `supabase/migrations/`.
- Enable RLS on every exposed table.
- Revoke access from `PUBLIC`, `anon`, and `authenticated` unless explicitly required.
- Grant privileged functions only to the server role.
- Avoid `SECURITY DEFINER`; if unavoidable, use a non-exposed schema, fixed `search_path`, explicit identity checks, and explicit execute grants.
- Never edit or delete an already-applied migration.

## Required tests

The PR is not ready until it demonstrates:

- correct PIN succeeds;
- wrong PIN and unknown member return indistinguishable responses;
- malformed and oversized input is rejected;
- brute-force limits work;
- expired/tampered sessions fail;
- PIN change requires the existing PIN and revokes sessions;
- Kingshot mock success, not-found, invalid schema, timeout, and outage;
- Kingshot lookup alone cannot authenticate or reset a PIN;
- browser code contains no service/secret key;
- preview deployment is connected only to development Supabase;
- existing member-only routes still recognize the new session.

Use synthetic fixtures only, for example member ID `710000001`. Never copy production rows into tests.

## Pull-request sequence

1. Push incremental commits to this branch.
2. Open a draft PR to `main`.
3. Confirm the Vercel Preview URL uses the development database.
4. Attach test output and a migration summary.
5. Request review from @zkabeer1997-wq.
6. Owner reviews the Kingshot provider, security behavior, migrations, and preview.
7. Owner applies/merges database changes and deploys production only after approval.

## Merge blockers

Do not merge if:

- any Preview variable points to production;
- real member data appears in fixtures, logs, screenshots, or PR text;
- a privileged Supabase key appears in client code;
- Kingshot lookup is treated as ownership proof;
- live Kingshot behavior depends on an undocumented endpoint without owner approval;
- migrations or rollback instructions are missing;
- security and regression tests fail.

## Existing production findings to account for

Before launch, separately remediate the current Supabase security-advisor findings for the `public.public_submissions` security-definer view and publicly executable security-definer functions. Do not broaden those permissions while implementing login.
