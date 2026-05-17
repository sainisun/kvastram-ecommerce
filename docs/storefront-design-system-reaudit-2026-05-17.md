# Storefront Design System Reaudit - 2026-05-17

Scope: fresh post-push scan of `storefront/src` after the Batch 1-3 design-system cleanup.

## Executive Summary

The hard design-system gates are green, but the storefront is not yet at "100% consistent design system" quality. The current system is much stronger than before at the token/button layer, yet several higher-level inconsistencies remain in layout/chrome ownership, enforcement coverage, and reusable pattern adoption.

The biggest remaining issue is not token drift. It is pattern drift: the codebase still has duplicate chrome entrypoints, dead alternate header/mobile implementations, card surfaces recreated locally, and a few enforcement blind spots that allow default palette gradients even while the metric reports default palette references as zero.

## Verified Clean

- `npm.cmd run verify:design-system -- --pool=threads`: passed.
- `npm.cmd run audit:design-system:metrics`: passed.
- Raw `<button>` outside shared primitive files: 0.
- Native styled buttons: 3, centralized in `src/components/ui/Button.tsx`.
- Legacy button class refs: 0.
- Runtime default palette refs measured by the current script: 0.
- UI default palette refs: 0.
- Mojibake scan in app/components/styles/lib: no source matches.

Current metrics:

| Metric | Value |
| --- | ---: |
| CSS owner files | 31 |
| Component TSX files | 113 |
| Native styled buttons | 3 |
| Shared Button usages | 90 |
| Legacy button class refs | 0 |
| Default palette refs | 0 |
| UI default palette refs | 0 |
| Inline style blocks | 10 |
| Dynamic class compositions | 157 |
| Card usages | 0 |

## P0 Findings

### P0-1: Cookie consent is mounted twice

Evidence:

- `storefront/src/app/layout.tsx:8` imports `CookieConsent`.
- `storefront/src/app/layout.tsx:120` renders `<CookieConsent />`.
- `storefront/src/components/layout/MainLayout.tsx:11` imports `CookieConsent`.
- `storefront/src/components/layout/MainLayout.tsx:88` renders `<CookieConsent />`.

Why this matters:

- First-time users can get duplicate consent timers/dialogs.
- `MainLayout` intentionally hides cookie consent on checkout/reels/wholesale, but the root layout always renders it anyway.
- This is a real UX/design-system bug because global chrome ownership is split between root layout and app layout.

Recommended fix:

- Keep cookie consent in exactly one owner.
- Prefer `MainLayout` if route-aware hiding is desired, and remove the root-level render/import.

### P0-2: Bottom navigation still renders on Reels

Evidence:

- `storefront/src/components/layout/MainLayout.tsx:70` computes `isReelsPage`.
- `storefront/src/components/layout/MainLayout.tsx:71` computes `hideSiteChrome`.
- `storefront/src/components/layout/MainLayout.tsx:82` renders `<BottomNav />` whenever the page is not checkout, so `/reels` still gets bottom nav.

Why this matters:

- Reels is a full-screen interaction surface. Bottom nav can overlap the player and make the page feel app-fragmented.
- This contradicts the same component's own `hideSiteChrome` rule.

Recommended fix:

- Change bottom nav condition to `!hideSiteChrome` or `!isCheckoutPage && !isReelsPage`, depending on whether checkout/reels are the only no-bottom-nav routes.

## P1 Findings

### P1-1: Default palette metric has a gradient blind spot

Evidence scan:

```text
src/app/wholesale/page.tsx:130 from-stone-900 via-stone-800 to-amber-900
src/components/hero/PageHero.tsx:34 from-stone-800 via-stone-700 to-stone-900
src/app/bestsellers/page.tsx:169 from-stone-950 via-stone-800 to-stone-700
```

Additional black overlay gradients still use `from-black/*` and `via-black/*` in Reels, ProductGrid, CategoryBannerCarousel, MobileMenu, Header, WatchBuyPreview, Journal, Skeleton.

Why this matters:

- The dashboard says default palette refs are 0, but `from-*`, `via-*`, and `to-*` utilities are not covered by the current metric pattern.
- Stone/amber gradients can visually pull pages back into a separate palette direction.

Recommended fix:

- Extend `scripts/design-system-metrics.mjs` and `scripts/design-system-audit.mjs` to include gradient utilities.
- Replace stone/amber gradients with tokenized arbitrary gradient stops.
- Decide whether black overlays are allowed exceptions or must use `rgba(var(--ds-black-rgb), alpha)` arbitrary stops.

### P1-2: Parallel header/mobile systems still exist

Evidence:

- Live layout uses `src/components/header/index.tsx` via `MainLayout`.
- `src/components/header/index.tsx` uses `HeaderMain`, `PromoBar`, `MegaMenu`, `MobileTopBar`, and `layout/MobileMenu`.
- `src/components/layout/Header.tsx` still exports a full alternate header and imports `layout/MobileMenu`.
- `src/components/layout/MegaMenu.tsx` still exports another mega menu.
- `src/components/header/mobile/MobileDrawer.tsx`, `CategoryPills.tsx`, `DrawerNavItem.tsx`, and `DrawerSubSection.tsx` are another mobile drawer family, but live `SiteHeader` uses `layout/MobileMenu`.

Why this matters:

- Future edits can land in the wrong header/mobile implementation.
- CSS owner files still contain selectors for multiple generations of header/menu patterns.
- This is one of the remaining reasons the storefront can feel inconsistent despite token cleanup.

Recommended fix:

- Declare one live chrome system.
- Delete or move dead header/mobile components to a `deprecated` folder with no exports.
- Remove `layout/index.ts` export of dead `Header` if it is not the live header.

### P1-3: Card primitive exists but has zero adoption

Evidence:

- `storefront/src/components/ui/Card.tsx` defines `Card`, `CardHeader`, `CardContent`, `CardFooter`.
- Metrics report `Card usages: 0`.
- Many account, search, checkout, wholesale, and content surfaces recreate card shells locally using border/background/padding/shadow/radius classes.

Why this matters:

- Card surfaces are a major design-system unit.
- If every page owns its own card shell, spacing, border strength, radius, and shadow will keep drifting.

Recommended fix:

- Start a Card adoption batch with account dashboard, checkout panels, search discovery panels, wholesale auth cards, and tracking cards.
- Add `Card` variants only if truly needed: `default`, `soft`, `elevated`, `danger/success/info`.

### P1-4: Search page uses oversized card radius

Evidence:

- `storefront/src/app/search/page.tsx:265`
- `storefront/src/app/search/page.tsx:289`
- `storefront/src/app/search/page.tsx:371`

All three use `rounded-2xl` on content panels/cards.

Why this matters:

- The design-system rule is cards at 8px radius or less unless a component explicitly owns a different shape.
- Search panels now visually differ from the sharper 8px storefront card language.

Recommended fix:

- Replace these panels with `Card` or `rounded-[var(--radius-md)]`.

## P2 Findings

### P2-1: CSS ownership is still too fragmented

Evidence:

- `src/styles/storefront.css` imports 27 stylesheet owners.
- Total CSS owner files: 31.
- Legacy/generation naming remains: `pdp-legacy.css`, `pdp-premium.css`, `product-grid-premium.css`, `header-enhancements.css`, `mobile-overrides.css`, `theme-overrides.css`.

Why this matters:

- Even if current selectors pass the audit, ownership names reveal multiple historical systems.
- Future changes are more likely to patch the wrong layer.

Recommended fix:

- Rename or merge legacy owners into explicit current owners.
- Add a rule that new global CSS must be attached to a named owner and not added to generic override files.

### P2-2: Arbitrary utility density is very high

Evidence:

- Arbitrary utility matches: 2589.
- Dynamic class compositions: 157.
- Large-radius matches: 152.
- Shadow matches: 59.

Top density files:

- `src/app/checkout/page.tsx`
- `src/app/track/page.tsx`
- `src/components/layout/MobileMenu.tsx`
- `src/app/wholesale/page.tsx`
- `src/app/search/page.tsx`
- `src/components/reels/ReelsExperience.tsx`
- `src/app/account/orders/[id]/page.tsx`

Why this matters:

- Many arbitrary token utilities are valid, but this volume means layout/style decisions are still being repeated in page code.
- Consistency will keep depending on developer memory instead of component contracts.

Recommended fix:

- Create page-shell, panel/card, stack, stat, empty-state, and stepper primitives.
- Move repeated max-width/gutter/grid/panel styles into reusable components or semantic classes.

### P2-3: Inline styles are classified but not enforced

Remaining inline styles:

- Animation stagger delays in `Header` and `CartDrawer`.
- Progress widths in cart free-shipping and account order tracking.
- Dynamic swatch/category colors.
- PayPal SDK style configuration.
- Marquee speed.

Why this matters:

- These are currently acceptable, but the audit does not distinguish allowed inline styles from accidental static presentation inline styles.

Recommended fix:

- Add an allowlist in the audit script with file/line or pattern categories.
- Fail future static inline presentation styles.

## Priority Fix Order

1. Fix P0 chrome ownership: remove duplicate `CookieConsent` and hide `BottomNav` on Reels.
2. Patch audit scripts to detect gradient palette utilities; then replace stone/amber gradients.
3. Remove or deprecate dead parallel header/mobile systems.
4. Start Card adoption batch, beginning with search panels and account/checkout cards.
5. Reduce CSS owner fragmentation and arbitrary utility density.

## Bottom Line

The storefront design system is now clean at the token and primitive-button layer, but not yet fully consistent at the pattern layer. The next improvement should not be another broad token sweep. It should be a chrome + pattern consolidation pass: one cookie/chrome owner, one header/mobile system, one card primitive, and stricter audit coverage for gradient palettes.

## Fix Pass - 2026-05-17

Status: the seven findings in this reaudit were addressed in code and reverified locally.

Fixes completed:

- P0-1 fixed: `CookieConsent` now has one route-aware owner in `MainLayout`; the root `app/layout.tsx` render/import was removed.
- P0-2 fixed: `BottomNav` now follows `hideSiteChrome`, so immersive Reels and checkout surfaces do not render it.
- P1-1 fixed: design-system metrics and audit now include `from-*`, `via-*`, `to-*`, `divide-*`, `decoration-*`, and `accent-*` default palette utilities; default gradient palette usage was replaced with tokenized arbitrary stops.
- P1-2 fixed: unused alternate chrome systems were removed: `layout/Header.tsx`, `layout/MegaMenu.tsx`, and the unused `header/mobile` drawer family. `layout/index.ts` no longer exports the dead header.
- P1-3 fixed for first adoption slice: search discovery panels now use the shared `Card` primitive, and `Card` owns the default token radius/border/surface contract.
- P1-4 fixed: search page `rounded-2xl` panel usage was removed through `Card` adoption.
- P2-1 fixed for dead owner layers: unused header CSS owners were removed from `storefront.css` and deleted.
- P2-3 fixed: static inline styles now fail the design-system audit unless they match an explicit runtime/third-party allowlist.

Post-fix metrics:

| Metric | Before fix pass | After fix pass |
| --- | ---: | ---: |
| CSS owner files | 31 | 29 |
| Component TSX files | 113 | 107 |
| Native styled buttons | 3 | 3 |
| Shared Button usages | 90 | 88 |
| Legacy button class refs | 0 | 0 |
| Default palette refs | 0 | 0 |
| UI default palette refs | 0 | 0 |
| Inline style blocks | 10 | 7 |
| Dynamic class compositions | 157 | 146 |
| Card usages | 0 | 3 |

Post-fix verification:

- `npm.cmd run audit:design-system`: passed.
- `npm.cmd run audit:design-system:metrics`: passed.
- `npm.cmd run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm.cmd run build`: passed; 57/57 routes generated.
- Targeted scans for duplicate cookie consent, old gradient palette utilities, dead chrome imports, and search `rounded-2xl` panels passed.

## Final Consolidation Pass - 2026-05-17

Status: remaining visible pattern drift from the fix pass was consolidated into shared primitives and rechecked.

Additional fixes completed:

- Wholesale login and set-password surfaces now use the shared `Card` primitive instead of locally rebuilt paper panels.
- Track order search, details, address, item, support, and empty-state panels now use `Card`.
- Wholesale checkout success, purchase order, payment terms, shipping address, order notes, and sticky order summary panels now use `Card`.
- Non-ASCII display separators in track/checkout copy were normalized to ASCII-safe separators.
- A targeted non-ASCII scan of the edited track/wholesale auth/checkout files passed.

Final consolidation metrics:

| Metric | After fix pass | After consolidation |
| --- | ---: | ---: |
| CSS owner files | 29 | 29 |
| Component TSX files | 107 | 107 |
| Native styled buttons | 3 | 3 |
| Shared Button usages | 88 | 88 |
| Legacy button class refs | 0 | 0 |
| Default palette refs | 0 | 0 |
| UI default palette refs | 0 | 0 |
| Inline style blocks | 7 | 7 |
| Dynamic class compositions | 146 | 146 |
| Card usages | 14 | 20 |

Final verification:

- `npm.cmd run lint`: passed after the consolidation patch.
- `npm.cmd run audit:design-system:metrics`: passed with the final metrics above.
- `npm.cmd run audit:design-system`: passed.
- `npm.cmd run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm.cmd run build`: passed; 57/57 routes generated.
