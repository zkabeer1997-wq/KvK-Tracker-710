# Kingshot-Verified Member Login — K710

## Goal
Use the governor's Kingshot Player ID as the K710Hub identity, verify that the live game record belongs to Kingdom 710, and remember the Player ID on that browser so the member does not type it every visit.

## Current prototype provider
The branch uses the documented Kingshot Stats API:

`GET https://api.kingshotstats.com/v1/players/{governor_id}?include=base`

The response includes `governor_id`, `nick_name`, `kid`, Town Center level, and alliance information. The server accepts the login only when `player.kid === 710`.

Required Vercel environment variable:
- `KINGSHOT_STATS_API_KEY`
- Existing `MEMBER_SESSION_SECRET`

## Returning-member flow
1. First visit: member enters Kingshot Player ID.
2. Server looks up the player and requires `kid = 710`.
3. Server issues the existing signed K710 member-session cookie using the verified governor ID as `memberId`.
4. Browser stores only the Player ID in `localStorage` under `k710-kingshot-player-id`.
5. On a later visit the browser automatically sends that saved Player ID back to the K710 server for a fresh kingdom check.
6. If the governor transferred away from 710, verification fails and no new member session is issued.

## Important freshness limitation
Kingshot Stats documents player data as potentially up to 60 minutes old. This means a just-transferred player could remain accepted until the upstream player record refreshes. If K710 needs immediate transfer revocation, this provider should be supplemented or replaced by an authoritative Century Games lookup with an acceptable Terms-of-Service and reliability profile.

## Why not depend directly on the gift-code portal
The public Kingshot gift-code player lookup has changed repeatedly. In 2026 the old `/api/player` route was removed and the newer portal has anti-automation controls. A production member gate should not depend on reverse-engineered signing secrets or bypass anti-bot measures. The implementation therefore keeps the K710 session logic separate from the lookup provider so a sanctioned/official API can replace Kingshot Stats later without changing the login UX.

## Privacy
The browser remembers only the public Player ID. No game password, account token, device token, or Kingshot credential is collected or persisted by K710Hub.
