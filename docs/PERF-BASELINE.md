# Performance baseline

Recorded at the start of the portal overtake work (PR 1), so later PRs have
something honest to diff against. Regenerate with `npm run build`, or
`npm run analyze` for the interactive treemap.

Measured on `next@14.2.35`, production build, no CDN compression applied
(the byte counts below are on-disk, so they read larger than what a visitor
actually downloads over Brotli).

## Route weights

| Route | Page | First Load JS |
|---|---|---|
| `/` (the Gate) | 4.48 kB | **106 kB** |
| `/interest` | 5.95 kB | 117 kB |
| `/player-record` | 7.25 kB | 122 kB |
| `/player-record/form` | 28 kB | 115 kB |
| `/tools` | 8.19 kB | 108 kB |
| `/tools/charm-pack-optimizer` | 6.93 kB | 107 kB |
| `/guides` | 152 B | 87.6 kB |
| `/guides/[slug]` | 3.47 kB | 94.4 kB |
| `/chronometer` | 2.5 kB | 98.7 kB |
| Shared by all | — | 87.5 kB |
| Middleware | — | 26.8 kB |

Total `.next/static`: **3.0 MB**

## Largest client chunks

| Size | Chunk | What it is |
|---|---|---|
| 672 KB | `b536a0f1.*` | **three.js / react-three-fiber / drei** |
| 172 KB | `fd9d1056-*` | shared vendor |
| 140 KB | `framework-*` | React + Next runtime |
| 132 KB | `283.*` | three.js companion chunk |
| 124 KB | `117-*` | shared app chunk |
| 112 KB | `polyfills-*` | legacy polyfills |

## The three.js situation — read this before PR 5

`components/kingdom/world/GateExperience.jsx:10` already loads the scene with
`dynamic(() => import('./GateScene'), { ssr: false })`. **The 672 KB three.js
chunk is therefore NOT in the homepage's first-load bundle** and does not block
first paint. `/` is a reasonable 106 kB up front.

This corrects an earlier assumption in the overtake plan. The Gate's problem is
*not* that it blocks LCP. What is actually wrong with it:

1. **The SSR body is empty.** `/` server-renders
   `<div id="main"><div class="k-scene"></div></div>` and nothing else — no
   headings, no copy, no links. Crawlers get nothing and a new visitor gets
   nothing to read.
2. **There is no wayfinding.** Navigation is a single floating crest button.
3. **The 672 KB still lands on mobile**, just after hydration rather than
   before it — so it is a data and CPU cost on a phone, not a first-paint cost.

So PR 5 is justified primarily on **content and discoverability**, and only
secondarily on bytes. Measure it that way: the success metric is a non-empty
SSR body with real `<a href>` navigation, not a first-load JS delta.

## What to watch

- **Budget:** LCP < 2.5s on 4G mobile.
- Keep `/` first-load JS at or under 106 kB as content is added in PR 5.
- The 672 KB scene chunk should become *conditional* in PR 5 (viewport,
  `prefers-reduced-motion`, `saveData`, `deviceMemory`), not merely deferred.
- `polyfills-*` at 112 KB is worth revisiting; it serves browsers this audience
  almost certainly does not use.
