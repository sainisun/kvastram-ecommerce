# Kvastram Storefront Design System v1

Status: Active
Date: 2026-05-17

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

Kvastram storefront typography follows a Mulmul-inspired restrained sans commerce direction:

- `--ds-font-display` and `--ds-font-body` use the same Montserrat-compatible sans stack.
- Hierarchy comes from weight, case, tracking, spacing, and imagery.
- New storefront UI should use `font-display`, `font-body`, `type-*`, and `tracking-token-*` utilities.
- Decorative serif typography is outside the active storefront system.

## Accent

The final accent is TERRACOTTA.

Use:

```text
--ds-accent-primary
--ds-accent-hover
--ds-accent-soft
--ds-accent-rgb
```

Public terracotta bridges are available only where a non-`--ds-*` bridge is unavoidable:

```text
--terracotta
--terracotta-dark
--terracotta-light
--terracotta-rgb
```

Do not add alternate accent token names or raw accent hex values outside `tokens.css`.

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
