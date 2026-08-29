---
name: k710-design-director
description: Directs K710Hub UI redesign work using the Realm/Console design system, existing-stack preservation, rendered visual inspection, and before/after QA.
---

# K710 Design Director

Use this skill for K710Hub page redesigns, visual audits, UI polish, shared-component styling, responsive redesigns and new frontend surfaces.

## 1. Read context first

Read:
- `/DESIGN.md`
- `/CLAUDE.md`
- `/app/tokens.css`
- relevant page/component files
- shared UI primitives

Identify the user goal, page mode (Realm / Console / Bridge), primary hierarchy, reusable patterns and behavior that must remain unchanged.

## 2. Inspect the current render

Before coding, inspect desktop and mobile. For interactive pages, inspect at least one meaningful state.

Audit:
- hierarchy
- typography
- spacing rhythm
- density
- repeated card/border treatment
- contrast
- alignment
- navigation clarity
- responsive behavior
- accessibility failures
- console/network failures

## 3. State one design thesis

Before editing, state one sentence describing the intended improvement. Choose at most three primary structural changes that deliver it.

## 4. Implement within the existing stack

- preserve behavior unless explicitly asked to change it
- reuse existing tokens and primitives
- only add a token when it is genuinely reusable
- avoid page-local magic numbers when the existing scale fits
- keep motion purposeful and honor reduced motion
- implement complete interaction states

Realm: favor narrative composition, editorial hierarchy, meaningful imagery and whitespace. Avoid dashboard-card repetition.

Console: favor scanability, density, grouping and consistent actions. Avoid marketing theatrics.

## 5. Re-open and review

Source code is not proof of visual quality. Inspect the modified page and fix:
- awkward empty zones
- alignment drift
- weak hierarchy
- oversized headings
- excess borders/glow
- low-contrast muted text
- noisy repeated motifs
- mobile clipping
- sticky/fixed overlaps
- incomplete hover/focus states
- excessive animation

## 6. Verify

Run the changed workflow with Playwright where appropriate, check desktop/mobile, inspect console/network errors and run project QA/visual QA scripts.

For a major redesign, perform one final critique and one polish pass before calling it complete.
