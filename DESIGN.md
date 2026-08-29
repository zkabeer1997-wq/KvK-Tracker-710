# K710Hub Design System

## Design thesis

K710Hub is a **Cinematic War Chronicle × Command Console**. It has two coordinated modes that must feel related without being visually identical.

### Realm
Public identity, story, discovery, recruitment, About, Timeline, Events and other kingdom-facing content.

- warm, editorial, atmospheric, tactile
- generous whitespace
- strong visual hierarchy
- parchment, brass, stone, firelight and map-inspired materials
- imagery and texture should create depth before borders do
- asymmetric editorial composition is preferred over repeated card grids

### Console
Admin, tools, records, forms, KvK operations and other task-heavy areas.

- dark, precise, compact and fast
- dense but readable
- clear grouping and action hierarchy
- tables/lists where data belongs in tables/lists
- restrained ornament
- K710 identity appears through shell, typography and accent—not medieval props on every control

### Bridge
The homepage and entry experiences may combine cinematic atmosphere with obvious, utilitarian navigation. The existing forge/shield identity moment is a signature element and should be preserved.

## Existing token authority

Use `app/tokens.css` as the implementation source of truth. Do not introduce a second competing palette or spacing system.

Core material cues already present:
- obsidian / stone / steel
- brass / aged gold
- parchment
- fire / ember
- warm Realm cream and umber

Gold is emphasis, not wallpaper. Do not border every surface in gold.

## Typography

Use the font system already wired through `next/font`.

- Realm display: Fraunces
- Console identity/display: Cinzel, sparingly
- Body/UI: Inter
- Narrative/lore: Cormorant Garamond, selectively
- Data/coordinates/timestamps: JetBrains Mono

Rules:
- body copy should remain highly readable
- Cinzel should not dominate dense UI
- use type scale and weight to create hierarchy before adding decorative boxes
- large headings should use tighter tracking and balanced wrapping
- numeric interfaces should use tabular figures where useful

## Layout

### Global
- one dominant visual idea per screen
- avoid default three-equal-card rows
- avoid wrapping every paragraph in a card
- use existing spacing tokens
- maintain consistent page max-widths
- make mobile a deliberate composition, not a scaled desktop

### Realm
Prefer:
- editorial hero + offset supporting narrative
- image/scene depth with constrained reading columns
- map/timeline ribbons
- large chapter markers
- layered transitions between sections

Avoid:
- endless rounded cards
- centered heading + paragraph + three cards repeated down the page
- decorative HUD treatment for normal reading

### Console
Prefer:
- compact toolbars
- collapsible navigation
- dense tables
- sticky actions when forms are long
- drawers/inspectors for secondary detail
- summary bands for a few actionable metrics

Avoid:
- cinematic hero sections
- excessive empty space
- data represented as ornamental card grids

## Shapes and surfaces

K710 should feel crafted rather than bubbly.

- compact controls: small/medium radius
- standard panels: medium radius
- major editorial surfaces: larger radius only when composition calls for it
- pills only for true tags, filters, statuses or segmented controls

Do not make every rectangle a large rounded card.

Depth should come from hierarchy, contrast, texture and controlled shadow—not constant glow or nested glass.

## Components

### Navigation
Public navigation should be spacious and identity-led. Operational navigation should be compact, collapsible where useful and show a clear active state.

### Buttons
- strong solid primary
- lower-contrast secondary
- text/tertiary action for low-priority operations
- destructive actions never use the primary gold treatment
- complete hover, pressed, focus and disabled states

### Panels
Panels exist to group related information or establish a meaningful layer. Avoid nested borders and decorative containers with no hierarchy purpose.

### Tables
- compact readable rows
- clear header hierarchy
- consistent action placement
- clear hover/selected/disabled states
- monospace/tabular figures where scanning benefits
- deliberate mobile fallback

### Forms
- group by task, not database schema
- persistent labels
- inline validation
- description text only when it adds decision support
- section anchors/sticky actions for long forms

### Status
Use a small semantic vocabulary. Status must not rely on color alone.

## Forge / shield identity

Preserve the existing forge/shield loading motif.

- it should feel like an identity transition
- it must load quickly
- respect reduced motion
- do not reuse cinematic loading for small async actions inside tools

## Three-dimensional scenes

Three.js / React Three Fiber is appropriate for gateway/entry scenes and special event storytelling. Do not use WebGL to decorate forms, admin tables or routine tools.

## Motion

- 160–260ms for ordinary UI response
- heavier scene transitions only for cinematic moments
- prefer transform + opacity
- restrained stagger
- clear pressed feedback
- no perpetual floating cards
- no animation whose only purpose is spectacle
- honor `prefers-reduced-motion`

## Accessibility

Design includes:
- visible keyboard focus
- semantic landmarks
- meaningful alt text
- logical heading hierarchy
- adequate contrast
- reduced-motion support
- non-color-only status
- practical tap targets
- programmatically associated form errors

## Anti-patterns

Do not:
- turn K710Hub into a Linear clone
- turn it into a medieval WordPress theme
- use generic purple/blue AI gradients
- use glass-on-glass nesting
- use random glow
- default to three-card SaaS layouts
- put icons in rounded-square tiles above every heading
- use massive radii everywhere
- introduce a new frontend framework during a visual task
- redesign admin like a marketing page
- make public pages as dense as admin
- remove the forge/shield identity moment without explicit instruction
- declare a visual task complete without rendering and inspecting it
