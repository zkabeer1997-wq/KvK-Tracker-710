# K710Hub Homepage Redesign Audit

Branch: `design/k710-ui-system-samples`

## Executive finding

The homepage already has a strong signature entry moment: the forge overlay and gate-backed hero give K710 an identity most kingdom utility sites do not have. The visual quality drops after that hero because the rest of the page becomes structurally repetitive and brochure-like.

The redesign should **not replace the forge/gate idea**. It should redesign the transition from spectacle into useful content.

## What is already working

### 1. The forge is a genuine brand asset

`HomeForgeIntro` deliberately uses the existing ForgeSequence as a one-time full-viewport overlay and already respects reduced motion. Preserve this.

### 2. The homepage is real server-rendered content

The current page is no longer an empty scene shell. It has editable server-rendered copy, navigation actions, alliance content and member destinations. Any redesign should preserve this architecture.

### 3. The codebase already supports the right design split

`app/tokens.css` contains the beginning of a `theme-realm` / `theme-console` model, and the global font stack already distinguishes Realm display typography from Console identity/data typography. The redesign should deepen this instead of starting another visual system.

## Highest-value problems

### P0 — The body has one repeated composition

The current homepage repeatedly uses:

`section header → three sibling items/cards → next section header`

This occurs in the doctrine section and alliance section, followed by another three-item member deck. The result is visually predictable even though the underlying content is different.

**Recommendation:** give each content type its own composition.

- Doctrine → editorial statement + numbered ledger
- Alliances → horizontal band/ribbon/schedule structure
- Member tools → compact command deck/list
- Transfer journey → a directional path/timeline, if restored

### P0 — The gate does not have a designed landing transition

The hero is cinematic, but the next section behaves like a conventional content page. There is no strong handoff from “entering the kingdom” to “understanding the kingdom.”

**Recommendation:** create a transition module immediately after the hero: a kingdom signal, campaign ledger, alliance ribbon or field-note treatment that visually belongs to the gate world while becoming easier to scan.

### P1 — The homepage mixes recruitment and member utility without enough orientation

The primary hero CTA is recruitment-oriented, while the body eventually pivots to “Already in 710?” tools. Both audiences are valid, but the switch is abrupt.

**Recommendation:** establish two explicit routes early:

- New / prospective player → understand K710 and transfer process
- Existing member → enter command tools

The Citadel concept in the design lab demonstrates this most clearly.

### P1 — Useful homepage content exists in the content model but is not rendered

`lib/homeContent.js` defines transfer-process fields (`steps-*`) and event content, but the current `app/page.js` does not render those sections. This creates a disconnect between the intended homepage information architecture and the actual page.

**Recommendation:** decide intentionally whether the homepage should include a concise transfer journey and current-events signal. If yes, restore them in a more visual structure. If no, remove or repurpose the unused content fields rather than leaving latent design/content debt.

### P1 — Some member destinations are too implementation-shaped

The member deck is currently a flat trio of links. It does not communicate priority, recency or what a member should do first.

**Recommendation:** turn the member area into an operational launch surface. Group by task, not by page name. Consider current event/war context later, but first improve hierarchy and descriptions.

### P2 — The global navigation is comprehensive but visually/semantically flat

The header exposes Home, About, Timeline, Guides, Events, Tools, Members, Join K710, Admin and Support. This is functional but places public browsing, member operations, recruitment and admin in one long peer set.

**Recommendation:** keep routes, but visually group them:

- Kingdom: About / Timeline / Guides / Events
- Operations: Tools / Members
- Primary CTA: Join K710
- Utility: Admin / Support

This can be achieved without adding dropdown complexity unless mobile/desktop testing shows it is needed.

### P2 — Hero copy is strong but could be more specific to the product promise

“Rebuild the realm. Rule the server.” is atmospheric, but the supporting line contains the more differentiated value proposition: three coordinated alliances, timezone coverage and actual war-room tooling.

**Recommendation:** keep a memorable headline but make the first supporting sentence scannable and concrete. Avoid making the homepage depend on fantasy language to explain what K710 actually offers.

## Recommended direction

Do not choose one of the design-lab concepts wholesale.

### Production blend

**Hero / entry:** Citadel
- preserve forge/shield
- preserve gate atmosphere
- stronger split between “Join K710” and “Member entry”
- optional restrained kingdom-signal rail

**Public body language:** Chronicle
- warm Realm surfaces
- editorial typography
- one large statement per section
- numbered ledgers/ribbons instead of repeated card grids

**Utility modules:** March Table, selectively
- campaign-table visual language for current priorities, events or alliance operating information
- do not make the entire homepage a dashboard

## Proposed production homepage structure

1. Forge/shield intro
2. Gate hero — one strong headline, recruitment CTA, member route
3. Kingdom signal — 3 concise facts that establish what K710 is
4. Doctrine — editorial statement + numbered ledger
5. Three alliances — ribbon/schedule treatment
6. Transfer path — concise 4-step campaign path
7. Member command deck — compact operational links
8. Events/current priority signal
9. Final recruitment CTA

## Samples

Three coded concept studies are available at:

`/design-lab/homepage`

- **01 Chronicle** — strongest public/Realm body direction
- **02 Citadel** — strongest gate-to-usefulness bridge
- **03 March Table** — strongest utility-oriented hybrid

These samples intentionally avoid changing `/` so they can be compared before production implementation.

## Acceptance criteria for the eventual homepage rebuild

- forge/shield remains recognizable
- no repeated three-equal-card layout as the dominant body pattern
- prospective and existing-member pathways are obvious above the fold or immediately after it
- public body uses Realm intentionally
- operational links remain compact and fast
- mobile composition is intentionally redesigned, not only wrapped
- reduced motion is respected
- existing editable homepage content continues to work or is deliberately migrated
- browser inspection and visual QA are completed before merge
