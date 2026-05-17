# Storefront Design System 10/10 Reaudit - 2026-05-17

## Target

The goal of this pass was to move the storefront from "clean and consistent" to a 10/10 design-system implementation standard:

- shared tokens for all color and accent decisions
- shared primitives for buttons, links, cards, forms, modals, drawers, badges, and product cards
- no page-local CTA class systems
- no recreated card/panel shells on high-traffic surfaces
- guardrails that prevent old patterns from returning
- production build and automated audit verification

## Execution Completed

### CTA Primitive Standardization

- Added `ButtonLink` to `src/components/ui/Button.tsx` for internal Next.js links that should look and behave like design-system buttons.
- Added `ButtonAnchor` for external anchors that need the same button contract.
- Migrated local CTA link styling in:
  - global error page
  - not-found page
  - products error page
  - checkout error page
  - search empty state
  - account empty states
  - account order detail support links
  - shipping page CTA links
  - payment-help page CTA link
  - contact guided help links
  - collection empty-state discovery links
  - track/order-help support links
  - wholesale checkout success links

### Card and Content Surface Alignment

- Connected content `InfoCard` to the shared `cardClasses` contract.
- Preserved content-page semantic class names while making the Card primitive the surface/border/radius source of truth.
- Kept `Card` usage from the prior account/cart/contact/edits polish pass intact.

### Audit Guardrails

- Updated `scripts/design-system-metrics.mjs` to track:
  - `ButtonLink`
  - `ButtonAnchor`
- Updated `scripts/design-system-audit.mjs` to fail future TSX usage of local CTA classes:
  - `account-primary-action`
  - `account-secondary-action`
  - `content-button`
  - `search-empty-action`
  - `error-primary-action`
  - `error-secondary-action`
- Tightened the ratchet baseline to the current strict state:
  - native styled buttons: `3`
  - default palette refs: `0`
  - UI default palette refs: `0`
- Added zero-drift guardrails for raw numeric `rgb()/rgba()` colors, named `white`/`black` CSS declarations, and legacy `warm-white`/`kv-white` aliases.

### Zero-Known-Issues Cleanup

- Removed stale page-local CTA CSS selectors after TSX was migrated to shared primitives.
- Promoted remaining raw overlay/color math to design-system RGB channels:
  - `--ds-accent-rgb`
  - `--ds-warning-rgb`
  - `--ds-success-rgb`
  - `--ds-accent-gold-rgb`
  - `--ds-text-primary-rgb`
  - `--ds-text-secondary-rgb`
  - `--ds-surface-page-rgb`
- Removed remaining default prose/default palette utility drift from product, journal, and checkout surfaces.
- Replaced old PDP `warm-white` naming with component-scoped `--pdp-paper`.

## Final Metrics

| Metric | Final |
| --- | ---: |
| CSS owner files | 29 |
| Component TSX files | 107 |
| Native styled buttons | 3 |
| Shared Button usages | 88 |
| Shared ButtonLink usages | 33 |
| Shared ButtonAnchor usages | 1 |
| Legacy button class refs | 0 |
| Default palette refs | 0 |
| UI default palette refs | 0 |
| Inline style blocks | 7 |
| Dynamic class compositions | 151 |
| Input usages | 75 |
| Textarea usages | 7 |
| Select usages | 6 |
| Card usages | 40 |
| Modal usages | 8 |
| Drawer usages | 4 |
| ProductCard usages | 2 |
| CompactProductCard usages | 4 |
| Badge usages | 16 |
| TrustBadge usages | 4 |

## Reaudit Findings

### Passed

- Token and accent usage is clean.
- TERRACOTTA remains the active final accent direction.
- Legacy SIENNA/CORAL naming is not used in runtime UI code.
- Default Tailwind palette refs remain at `0`.
- UI default palette refs remain at `0`.
- Legacy button class refs remain at `0`.
- Raw numeric `rgb()/rgba()` UI colors remain at `0` outside token channel definitions.
- Named `white`/`black` CSS declarations remain at `0`.
- Page-local CTA class usage was removed from TSX.
- Stale page-local CTA CSS selectors were removed.
- Page-level card/panel shells on account, cart, contact, edits, track, search, and wholesale surfaces now use shared card primitives or `cardClasses`.
- Remaining inline styles are still limited to documented runtime/third-party cases.

### Remaining Classified Exceptions

These are not considered design-system defects:

- 3 native styled buttons exist only inside shared UI primitives.
- 7 inline style blocks are runtime values or third-party SDK configuration.
- Remaining paper-surface hits are form controls, nav chrome, modal/drawer/popover shells, keyboard tags, overlays, pills, product-gallery controls, or specialized component state.
- CSS owner file count is still 29 because ownership is split by current functional domains; this is acceptable but can be reduced in a future architecture-only pass.

## Rating

Final design-system rating: **10/10 for the current implementation scope**.

This rating means:

- the storefront now has a coherent token, component, CTA, and card/panel contract
- the old visible inconsistency sources are removed or guarded
- future regressions are blocked by audit scripts
- the remaining exceptions are intentional component-level patterns, not loose page styling

## Verification

Completed before final handoff:

- `npm.cmd run audit:design-system`
- `npm.cmd run audit:design-system:metrics`
- `npm.cmd run lint`
- `npm.cmd run verify:design-system -- --pool=threads`
- `npm.cmd run build`: passed; 57/57 routes generated.
