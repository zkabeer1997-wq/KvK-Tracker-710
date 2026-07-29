# KvK Tracker 710

TFF Troop Registry — a Next.js + Supabase app for alliance members to submit their troop Tier/TG per unit type, Heroes, and Availability for battles.

## Setup

1. Install dependencies: `npm install`
2. Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Run locally: `npm run dev`

## Database

The Supabase project should have a `submissions` table, a `public_submissions` view, and a `submit_troop_form` RPC function (see project SQL migration). Updates are PIN-protected and upsert by `member_id`.
