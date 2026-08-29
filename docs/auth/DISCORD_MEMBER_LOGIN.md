# Discord Member Login — K710

## Goal
Replace repeated Member ID + PIN entry with Discord OAuth while still preserving the existing Kingshot Member ID as the canonical identity inside K710Hub.

## Trust model
1. K710Hub sends the visitor to Discord OAuth with `identify guilds` scopes.
2. Discord returns the user identity and the list of guilds the user currently belongs to.
3. Login succeeds only when `DISCORD_GUILD_ID` is present in that verified guild list.
4. On first successful Discord verification only, the member links Discord to their existing K710 Member ID by using the current Member ID + PIN flow once.
5. The server stores only the Discord user ID -> K710 Member ID mapping in `member_auth_identities`.
6. Future Discord logins issue the existing signed K710 member-session cookie directly, so no PIN is requested.

## Required Vercel environment variables
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID` — the Kingdom 710 Discord server ID
- `DISCORD_REDIRECT_URI` — e.g. `https://k710hub.vercel.app/api/member-auth/discord/callback`
- Existing `MEMBER_SESSION_SECRET`
- Existing Supabase service-role configuration

## Discord application setup
Create an application in the Discord Developer Portal and add the production callback URL plus the branch preview callback URL while testing. No bot token is required for the basic guild-membership check because OAuth scope `guilds` exposes the authenticated user's current guild list.

## Optional hardening
For stronger membership policy, add a K710 Discord bot and verify `/guilds/{guild.id}/members/{user.id}` server-side with a bot token. That also permits required-role checks such as `K710 Member`, `RED`, `SKY`, or leadership roles.

## Database
Apply `supabase/migrations/20260829_member_auth_identities.sql` before enabling the feature.

## Privacy
Store Discord user ID, display label, last verification time, and the linked K710 Member ID. Do not store Discord access tokens or refresh tokens. The OAuth token is used only during the callback and discarded.
