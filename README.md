# K710 Hub

Kingdom 710's Kingshot portal and operations hub — Next.js 16 (App Router) +
Supabase.

Public surface: the Gate, kingdom guides, and the transfer registry.
Member access uses a Player ID plus the one-time code delivered inside Kingshot.
Only verified Kingdom 710 accounts receive a persistent website session.
Admins use the same account session; superadmins can assign or remove roles.

## Setup

1. `npm install`
2. Create `.env.local` — see **Environment** below.
3. `npm run dev`

## Environment

**Required.** The app 500s on most data-backed routes without these values.

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | every Supabase client | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabaseClient.js` | Ships in the client bundle; treat as public |
| `SUPABASE_SERVICE_ROLE_KEY` | all server routes | Server only. Never expose |
| `MEMBER_SESSION_SECRET` | login/session routes | Stable private random value, at least 32 bytes |

**Optional.**

| Variable | Used by | Notes |
|---|---|---|
| `KINGSHOT_API_BASE_URL` | `lib/kingshotLogin.js` | Controlled test override for the Kingshot storefront API |
| `KINGSHOT_PLAYER_API_URL` | `lib/kingshotLogin.js` | Controlled test override for MightPulse player details |
| `KINGSHOT_PLAYER_SEARCH_URL` | `lib/kingshotLogin.js` | Controlled test override for MightPulse player search |
| `K710_LIBRETRANSLATE_URLS` | `/api/translate-ui` | Comma-separated mirrors, overrides the defaults |
| `QA_BASE`, `QA_CHROMIUM` | `scripts/qa-routes.js` | Local QA only |

> Keep `K710_ENABLE_LEGACY_ADMIN` and `K710_ENABLE_LEGACY_MEMBER_SESSION`
> unset outside isolated tests. The shared-password and PIN login pages are
> retired and do not authorize normal application traffic.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Extract UI strings, then start the dev server |
| `npm run build` | Extract UI strings, then production build |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (`node --test` over `tests/**/*.test.mjs`) |
| `npm run lint` | `next lint` |
| `npm run analyze` | Production build with the bundle analyzer |
| `npm run qa` | Route-level regression suite — needs a running build, see below |

`npm run build` regenerates `public/ui-strings.json`, the allowlist
`/api/translate-ui` will translate. It is committed so a bare `next build`
resolves the import on a fresh clone, and rewritten on every build so it never
goes stale.

### Route QA

```
npm run build && npm start -- -p 3111
QA_BASE=http://localhost:3111 npm run qa
```

Asserts route status, heading structure, production field counts on every form,
server-side role gating, the member gate, and horizontal overflow at six widths.

## Database

SQL lives in `supabase/`. Ordered schema changes are stored under
`supabase/migrations/` and can also be applied through the Supabase SQL editor.
Apply `20260904170000_kingshot_accounts_sessions_and_roles.sql` before deploying
the direct login code.

`supabase/core_tables.sql` carries `submissions`, `content_blocks`, the
`public_submissions` view, and the `verify_page_pin` RPC. It also documents two
open items: leftover `anon` write grants on the two oldest tables (currently
inert, because RLS has no permissive policy), and the fact that the full member
roster is readable with the anon key. Read it before changing either.

The pattern for every protected table: enable RLS, `revoke all` from `PUBLIC`,
`anon`, and `authenticated`, grant only to `service_role`, and reach it
exclusively through same-origin server routes.

## Documentation

- `docs/PERF-BASELINE.md` — bundle and route weights, and what the three.js
  Gate scene actually costs.
