@AGENTS.md
@DESIGN.md

# K710Hub Claude Code design rules

For any task that changes layout, CSS, typography, imagery, animation, navigation, components or responsive behavior:

1. Read `DESIGN.md`.
2. Read `app/tokens.css` and the relevant shared primitive/component files.
3. Inspect the current rendered page at desktop and mobile before editing.
4. Classify the surface as Realm, Console or Bridge.
5. Preserve behavior unless the task explicitly requests a behavior change.

## Current-stack rule

This is an existing Next.js application with an established CSS/token architecture.

- Do not migrate the styling stack during a redesign.
- Do not add Tailwind, shadcn, a new icon package or a new animation library by default.
- Before using version-sensitive Next.js/React/Supabase/R3F APIs, consult current docs.
- Reuse existing tokens and primitives before creating near-duplicates.

## Visual-quality rule

Source code is not proof that a page looks good.

After each coherent visual change:
- render it
- inspect it in-browser
- check mobile
- check console/network errors
- inspect focus/keyboard behavior for changed interactions
- fix visible issues before moving on

For large changes, compare before/after screenshots.

## Design hierarchy

`DESIGN.md` is the project design authority.

When guidance conflicts:
1. explicit user instruction wins
2. `DESIGN.md` wins
3. existing shared tokens/primitives win
4. page-local convention wins
5. generic skill preference comes last

## K710 page modes

### Realm
Public identity/story/discovery pages. Warm, editorial, atmospheric, more whitespace.

### Console
Tools/admin/records/forms. Dark, precise, dense, low-friction.

### Bridge
Homepage/entry moments may combine cinematic identity with obvious utilitarian navigation.

## Verification

Prefer Chrome DevTools/browser inspection for rendered visual review, Playwright for deterministic interaction/accessibility checks, and the existing `npm run qa` / `npm run qa:visual` commands for regression coverage.

Do not finish a visual task because tests pass if the screenshot still looks wrong.
