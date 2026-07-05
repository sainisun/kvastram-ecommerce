# Odhvica Storefront Design System v1

Status: Active
Date: 2026-06-20

## Source Of Truth

Runtime tokens:

```text
storefront/src/styles/tokens.css
```

Global and Tailwind bridges:

```text
storefront/src/app/globals.css
storefront/tailwind.config.ts
```

Repeatable gate:

```text
npm.cmd run audit:design-system
```

## Typography

Odhvica storefront typography uses an editorial serif display face with a restrained grotesk body:

- `--ds-font-display` uses `Amiri`, with `Cardo` and system serif fallbacks.
- `--ds-font-body` and UI roles use `Cardo`, with system serif fallbacks.
- Hierarchy comes from the display/body contrast plus weight, spacing, scale, and imagery.
- New storefront UI should use `font-display`, `font-body`, `type-*`, and `tracking-token-*` utilities.
- Components must consume typography roles instead of declaring page-local font families.

## Color

The storefront color contract is a warm editorial palette grounded in Jaipur craft materials:

- Primary text uses warm ink (`#1C1410`) via `--ds-text-primary`.
- Primary page background uses parchment (`#FDFAF6`) via `--ds-surface-page`.
- Primary CTA/button background uses terracotta (`#C4603A`) via `--ds-accent-primary`.
- Primary CTA/button text uses parchment via `--ds-text-inverse`.
- Supporting surfaces use parchment, paper, gold, and warm ink tokens for borders, muted states, and hierarchy.

Use:

```text
--ds-text-primary
--ds-surface-page
--ds-surface-paper
--ds-accent-primary
--ds-accent-hover
--ds-accent-soft
--ds-accent-rgb
```

Public accent bridges are available only where a non-`--ds-*` bridge is unavoidable:

```text
--terracotta
--terracotta-dark
--terracotta-light
--terracotta-rgb
```

Do not add alternate accent token names or raw accent hex values outside `tokens.css`.

## CMS Visual Contract

- Hero desktop and mobile media must be previewed before activation.
- Active hero banners require a title, subtitle, CTA label, and valid local or HTTPS destination.
- Do not bake headlines, brand names, subtitles, prices, or CTA labels into hero artwork when HTML copy is enabled.
- Empty homepage collections render nothing; public pages must never show admin instructions or configuration placeholders.
- A content-only hero image is preferred because HTML copy remains accessible, responsive, searchable, and editable.

## Primitives

Shared UI primitives live under:

```text
storefront/src/components/ui/
```

Use these before adding page-local UI systems:

| Primitive | File | Use |
| --- | --- | --- |
| Button, ButtonLink, ButtonAnchor, IconButton, UnstyledButton | `Button.tsx` | Actions and clickable controls |
| Badge | `Badge.tsx` | Labels and status chips |
| Card | `Card.tsx` | Framed content surfaces |
| Drawer | `Drawer.tsx` | Slide-in panels |
| EmptyState | `EmptyState.tsx` | Empty and error states |
| Input | `Input.tsx` | Text fields |
| Modal | `Modal.tsx` | Dialogs and overlays |
| PopoverPanel | `Popover.tsx` | Floating panels |
| PriceDisplay | `PriceDisplay.tsx` | Commerce pricing |
| RatingDisplay | `RatingDisplay.tsx` | Review stars and counts |
| Section, SectionHeader | `Section.tsx` | Page sections |
| Select | `Select.tsx` | Select fields |
| StatusBanner | `StatusBanner.tsx` | Feedback banners |
| Textarea | `Textarea.tsx` | Multiline fields |
| TrustBadge | `TrustBadge.tsx` | Trust and policy signals |

## Active Rules

- Use `--ds-*` tokens for new CSS.
- Use shared primitives before creating page-local buttons, cards, forms, badges, modals, drawers, sections, or empty states.
- Keep default Tailwind palette utilities out of runtime TSX.
- Keep raw UI hex values inside `tokens.css`.
- Use `--ds-*-rgb` channels for transparent overlays and shadows.
- Do not add named surface/text color declarations; use tokens.
- Do not add old-prefixed CSS selectors.
- Keep page-local CTA class systems out of TSX.
- Keep priority overrides limited to documented accessibility resets.
- Keep inline styles limited to runtime data, measured dimensions, stagger timing, third-party SDK config, or product swatches.

## Homepage Layout Contract

- Homepage content width: `--ds-home-content-width` (`1520px`).
- Homepage gutters: `48px` desktop, `32px` tablet, and `20px` mobile through the `--ds-home-gutter-*` tokens.
- Homepage section rhythm: `80px` desktop and `48px` mobile through the `--ds-home-section-space-*` tokens.
- Hero is full bleed. Other homepage content uses the shared `HomepageContainer` / `HomepageSection` primitives.
- Horizontal homepage rails use the shared `homepageScrollRailClassName`, which owns both `display: flex` and horizontal overflow behavior.
- Homepage media containers must declare an intrinsic aspect ratio or explicit dimensions.

## Runtime Consumption Rules

- Prefer semantic Tailwind utilities bridged from `globals.css`.
- Raw `var(--ds-*)` usage in TSX is allowed only as a Tailwind arbitrary-value escape hatch when no semantic utility exists.
- `--ink`, `--cream`, and `--line` remain compatibility-only aliases and must not be consumed by runtime TSX.

## Current Metrics

Latest verified metrics:

| Metric | Value |
| --- | ---: |
| CSS owner files | 27 |
| Component TSX files | 107 |
| Native styled buttons | 3 |
| Shared Button usages | 88 |
| Shared ButtonLink usages | 33 |
| Shared ButtonAnchor usages | 1 |
| Legacy button class refs | 0 |
| Default palette refs | 0 |
| UI default palette refs | 0 |
| Inline style blocks | 7 |
| Card usages | 40 |
| Modal usages | 8 |
| Drawer usages | 4 |
| Badge usages | 16 |

## Verification

Before marking design-system work complete, run:

```text
npm.cmd run audit:design-system
npm.cmd run audit:design-system:metrics
npm.cmd run lint
npm.cmd run verify:design-system -- --pool=threads
npm.cmd run build
```
