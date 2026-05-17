# Kvastram Storefront Design System v1

Status: Active
Date: 2026-05-15
Implemented phases: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, and Phase 7 in progress

## Phase 0 Decision Record

### Typography Direction

Kvastram storefront typography is now **Mulmul-inspired restrained sans commerce**.

Observed Mulmul reference patterns from `https://shopmulmul.com/`:

- uppercase navigation and category labels
- compact product names and prices
- low-decoration fashion retail hierarchy
- imagery carries emotion; typography stays quiet and scannable
- headings are clear but not overly ornamental

Canonical Kvastram rule:

- `--ds-font-display` and `--ds-font-body` both map to Montserrat-compatible sans stacks.
- Decorative serif direction is superseded for storefront system work.
- Use weight, case, tracking, spacing, and image composition for hierarchy.

### Final Accent Token

Final accent token is **TERRACOTTA**.

Canonical token:

```css
--ds-accent-primary: #c4613a;
--ds-accent-hover: #9f4528;
--ds-accent-soft: #f0e0d6;
--ds-accent-rgb: 196, 97, 58;
```

Naming rule:

- Use `terracotta` or `--ds-accent-*` in new work.
- Superseded accent names have been removed from runtime tokens and Tailwind config.

## Phase 1 Token Layer

Canonical source:

```text
storefront/src/styles/tokens.css
```

Compatibility bridge:

```text
storefront/src/app/globals.css
```

`globals.css` keeps the active public terracotta aliases aligned with `--ds-*`:

```css
--terracotta: var(--ds-accent-primary);
--terracotta-dark: var(--ds-accent-hover);
--terracotta-light: var(--ds-accent-soft);
```

Tailwind canonical aliases:

```ts
brand: {
  terracotta: 'var(--ds-accent-primary)',
  accent: 'var(--ds-accent-primary)',
  hover: 'var(--ds-accent-hover)',
  soft: 'var(--ds-accent-soft)',
}
```

## Superseded Specs

The following older specs are superseded by this file:

- `storefront/KVASTRAM_HEADER_DESIGN_SYSTEM.md` for older header typography and accent rules.
- `storefront/kvastram-typography-system-v2.md` for Cormorant Garamond + DM Sans storefront typography.
- Any instruction that names SIENNA or CORAL as the final accent source of truth.

## New Work Rules

1. Use `--ds-*` tokens for new CSS.
2. Use `terracotta` / `--ds-accent-*` for accent work.
3. Do not introduce superseded accent token names.
4. Do not add raw accent hex values in TSX.
5. Do not add serif storefront typography unless a future design decision reopens typography.
6. Keep product, catalog, header, PDP, account, and support typography within the sans-led system.

## Phase 2 Primitive Layer

Canonical primitives now exist under:

```text
storefront/src/components/ui/
```

Implemented primitives:

| Primitive | File | Purpose |
| --- | --- | --- |
| Button | `Button.tsx` | Primary, secondary, outline, ghost, and danger actions |
| IconButton | `Button.tsx` | Square icon-only actions with shared focus/hover rules |
| Badge | `Badge.tsx` | Neutral, accent, success, danger, and outline badges |
| Card | `Card.tsx` | Shared card shell with header/content/footer slots |
| Section | `Section.tsx` | Shared storefront section spacing and container width |
| SectionHeader | `Section.tsx` | Shared eyebrow/heading/description/action layout |
| Input | `Input.tsx` | Tokenized text input with label, required mark, error state, suffix |
| Textarea | `Textarea.tsx` | Tokenized textarea with label, required mark, error state |
| Select | `Select.tsx` | Tokenized select with label, helper text, and error state |
| Modal | `Modal.tsx` | Shared modal shell with overlay, Escape close, and scroll lock |
| Drawer | `Drawer.tsx` | Shared drawer shell with overlay, Escape close, and scroll lock |
| EmptyState | `EmptyState.tsx` | Shared empty/error page state with icon, title, description, and actions |
| StatusBanner | `StatusBanner.tsx` | Shared info, success, warning, and danger feedback banner |
| PriceDisplay | `PriceDisplay.tsx` | Shared commerce price, compare-at price, and wholesale prefix rendering |
| RatingDisplay | `RatingDisplay.tsx` | Shared display-only rating stars and review-count text |
| TrustBadge | `TrustBadge.tsx` | Shared trust/policy signal block |

Phase 2 rule:

- New UI should use these primitives before adding local button, form, badge, card, drawer, modal, or section styling.
- Existing pages can migrate gradually; compatibility aliases remain active while migration continues.
- Import primitives directly from their files, for example `@/components/ui/Button`, to avoid broad barrel files.

Latest Phase 2 migration status:

- Checkout contact, shipping, address, gift message, and promo-code text fields now use shared `Input`/`Textarea`.
- `AddressAutocomplete` renders through shared `Input`, so Google Places address entry inherits the canonical field shell.
- Checkout payment/shipping/promo actions now use shared `Button`.
- Login primary/social/resend/password visibility actions now use shared `Button`/`IconButton`.
- Account address forms now use shared `Input` and `Select`; address actions now use shared `Button`/`IconButton`.
- Wholesale application/checkout, product review/back-in-stock/delivery planner, track-order, search, mobile menu search, chat, newsletter, cart promo/shipping preview, and order-return fields now use shared form primitives.
- Latest measured adoption after reverification: shared `Input` 75, shared `Textarea` 7, shared `Select` 6, shared `Button` 35, native styled buttons 72.
- P2 remaining native controls are intentional until dedicated primitives exist: checkbox, radio, and file upload.
- P2 reverification passed: design-system audit, lint, unit tests, and production build.

## Phase 3 Navigation Ownership

Active storefront chrome owner:

```text
storefront/src/components/layout/MainLayout.tsx
storefront/src/components/header/index.tsx
```

Canonical navigation data source:

```text
storefront/src/config/storefront-navigation.ts
```

Phase 3 changes:

- Desktop navigation now consumes `STOREFRONT_NAV_ITEMS` from the canonical config.
- Active mega-menu fallback groups now consume `MEGA_FALLBACK_*` groups from the canonical config.
- Mobile category quick links now consume `CATEGORY_QUICK_LINKS` from the canonical config.
- Header navigation color states were moved from raw hex values to `--ds-*` tokens.

Latest Phase 3 overlay/pattern start:

- `NewsletterModal` now uses shared `Modal` for overlay, dialog shell, close behavior, Escape handling, and scroll lock.
- `QuickViewModal` now uses shared `Modal`; its existing image navigation and add-to-cart flow remain intact and its unit test passes.
- `ReelsExperience` player now uses shared `Modal` in fullscreen/headerless mode while keeping vertical swipe and keyboard navigation.
- `CartDrawer` now uses shared `Drawer` for overlay, Escape handling, scroll lock, header close behavior, and drawer shell.
- Catalog mobile filter drawer now uses shared `Drawer`.
- `ShareButtons` and `CountrySelect` dropdowns now use shared `PopoverPanel` for surface, border, shadow, and tokenized color behavior.
- Active `MobileMenu` now uses shared `Drawer` for the outer navigation shell while preserving its nested submenu/search/wishlist/cart behavior.
- Account return modal, search overlay, size guide, cart recovery modal, mini cart, and product-gallery lightbox now use shared `Modal`/`Drawer` primitives.
- Latest measured adoption after P3 completion pass: shared `Modal` 8, shared `Drawer` 4, shared `Button` 38.
- P3 verification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

Legacy and compatibility components:

```text
storefront/src/components/layout/Header.tsx
storefront/src/components/layout/MegaMenu.tsx
storefront/src/components/header/mobile/MobileDrawer.tsx
```

These are not the active app chrome path today. They should not receive new design-system behavior unless they are reconnected intentionally. `storefront/src/components/layout/MegaMenu.tsx` has pending workspace edits, so it was left in place instead of being deleted or moved.

Next navigation migration target:

- `storefront/src/components/layout/MobileMenu.tsx` is the active mobile drawer and still has a larger hardcoded menu model. It should be migrated to shared category, collection, and nav config in the next pass.

## Phase 4 Product Card Unification

Canonical product card source:

```text
storefront/src/components/products/ProductCard.tsx
```

Phase 4 first slice:

- `storefront/src/components/ProductGrid.tsx` now renders product tiles through `ProductCard`.
- `storefront/src/components/ProductCarousel.tsx` now renders product tiles through `ProductCard`.
- `storefront/src/app/search/page.tsx` now uses `ProductGrid` for search results instead of maintaining a separate search-only product card.
- Product loading shells in the migrated files now use `--ds-*` surface tokens instead of inline background styles.
- Main product card title, image, badge, wishlist, price, compare-at price, quick-view, and mini-cart placement now have one React owner.

Phase 4 completion slice:

- `ProductCard.tsx` now also exports `CompactProductCard` for preview/read-only product cards.
- `storefront/src/components/search/SearchOverlay.tsx` now uses `CompactProductCard` for instant search product previews.
- `storefront/src/components/product/RecentlyViewed.tsx` now uses `CompactProductCard`.
- `storefront/src/components/product/RecentlyViewedRow.tsx` now uses `CompactProductCard`.

Phase 4 commerce display slice:

- `PriceDisplay` is now the canonical owner for product-card, compact-card, PDP, quick-view, bestseller, spotlight, and shop-the-look price text.
- `RatingDisplay` is now the canonical display-only owner for quick-view, PDP, review summary, and bestseller rating text.
- Product-card sale/new/low-stock labels now use shared `Badge` instead of local badge spans.
- PDP gallery scarcity labels, PDP savings labels, and spotlight labels now use shared `Badge`.
- Homepage curated product tiles now use `CompactProductCard` instead of a separate local tile anatomy.
- Dead legacy selectors for local product-card badges, local `.price` / `.orig`, and old PDP star-link display were removed after migration.
- Latest measured adoption after this slice: shared `Badge` 7, `ProductCard` 2, `CompactProductCard` 4, native styled buttons 63, default palette references 1880, inline style blocks 54.
- P4 commerce display reverification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

Phase 4 rule:

- Full commerce product tiles should use `ProductCard`.
- Compact preview/read-only product tiles should use `CompactProductCard`.
- Product price, compare-at price, wholesale price, and product rating display should use `PriceDisplay` and `RatingDisplay`.
- New product card variants should be added to `storefront/src/components/products/ProductCard.tsx` instead of creating page-local card markup.

## Phase 5 PDP Harmonization

Phase 5 completed work:

- `storefront/src/components/product/ProductView.tsx` no longer fabricates review rating/count fallbacks.
- PDP review/rating UI now renders review numbers only when `avg_rating` and `review_count` exist on the product.
- Hardcoded conversion claims such as exact viewers, recent buyers, sold counts, and fake testimonial copy were removed.
- PDP urgency messaging now uses real inventory state only.
- PDP add-to-cart and sticky-bar states moved from inline style objects to CSS state classes.
- PDP local font overrides now resolve through `--ds-*` typography tokens.
- PDP status colors now resolve through `--ds-success-*`, `--ds-warning-*`, `--ds-info-*`, and `--ds-whatsapp-*` tokens.
- PDP trust cards now use the shared `TrustBadge` primitive.

Phase 5 rule:

- Do not show exact social proof metrics unless they come from product, review, order, or analytics data.
- Do not add fake testimonial/review copy as PDP fallback content.
- PDP CTA states should use classes such as `is-added`, `is-disabled`, and `is-visible`, not inline color/style objects.
- Dynamic swatch color may be applied inline because it is product-option data, but values must resolve to `--ds-swatch-*` or `--ds-*` tokens.
- PDP trust/policy cards should use `TrustBadge` before adding local trust-card markup.
- PDP CSS is owned by `storefront/src/styles/components/pdp.css`; keep new PDP-only CSS there instead of returning it to `globals.css`.

Phase 5 page-pattern continuation:

- `EmptyState` and `StatusBanner` now exist as shared page-pattern primitives.
- Product grid and carousel empty states now use `EmptyState`.
- Search empty results now use `EmptyState` and shared `Button` for filter removal.
- Account overview, account orders, account order detail, account messages, and wholesale dashboard empty/status surfaces now use `EmptyState`, `StatusBanner`, and/or `Badge`.
- Wishlist empty state, wishlist price display, wishlist actions, returns self-serve states, login/register/reset/forgot-password feedback banners, and auth success screens now use shared primitives.
- Return/account status color classes in the migrated scope now resolve through `--ds-*` status tokens instead of raw Tailwind status palettes.
- Shipping now uses the shared content-page system instead of a local page shell.
- Gift cards and verify-email success/error states now use shared `EmptyState`.
- Size guide now uses the shared content-page system instead of a bespoke page shell.
- Account profile and address feedback states now use shared `StatusBanner`.
- Checkout success loading/error states now use shared `EmptyState`.
- Global error, not-found, checkout error, and products error pages now use shared `EmptyState`; retry buttons use shared `Button`.
- Collections, collection-detail, and bestsellers empty product/content states now use shared `EmptyState`.
- Journal empty content, contact success state, and contact error feedback now use shared `EmptyState` / `StatusBanner`.
- Latest measured adoption after this slice: shared `Badge` 16, shared `Button` 45, native styled buttons 57, default palette references 1649, UI default palette references 99.
- P5 page-pattern reverification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

## Phase 6 Global CSS Split

Phase 6 completed work:

- `storefront/src/app/globals.css` is now 150 lines and contains only Tailwind setup, token import, root compatibility variables, and `@theme` aliases.
- Base reset and baseline typography now live in `storefront/src/styles/base.css`.
- Token, typography, utility, animation/effect, mobile, responsive, and theme override layers now live under `storefront/src/styles/`.
- Feature-owned CSS now lives under `storefront/src/styles/components/`, including header, product cards, catalog, PDP, footer, collections, reels, content pages, newsletter, quick view, and homepage section groups.
- `globals.css` now has 0 `!important` declarations; remaining legacy `!important` rules are isolated in named stylesheets for future cleanup.
- P6 continuation after P5 confirmed: `globals.css` has no mojibake artifacts, deprecated accent names remain compatibility aliases only, raw hex values are isolated to `tokens.css`, and non-exception `!important` remains limited to the reduced-motion accessibility block.
- `storefront/src/styles/storefront.css` now owns the global stylesheet manifest, preserving the previous cascade order while reducing `app/layout.tsx` to two CSS entrypoints: `globals.css` and `storefront.css`.
- Latest P6 reverification passed: design-system audit, lint, unit tests with Vitest threads pool, metrics, and production build.

Phase 6 rule:

- `globals.css` should keep shrinking into explicit owners: tokens, base, typography, utilities, and component/page stylesheets.
- `app/layout.tsx` should import only CSS entrypoints; add new global owner files to `storefront.css` instead of adding another layout import.
- CSS with a clear feature owner should move to `storefront/src/styles/components/` or another named stylesheet instead of growing `globals.css`.

## Phase 7 Legacy Override Cleanup

Phase 7 completed work:

- Footer color decisions now use `--ds-footer-*` tokens in `storefront/src/styles/tokens.css`.
- Desktop and mobile footer raw color utilities were removed from `storefront/src/components/layout/Footer.tsx`.
- `storefront/src/styles/components/footer.css` now has 0 `!important` declarations.
- The broad monochrome theme override was replaced by a small token bridge in `storefront/src/styles/theme-overrides.css`.
- `storefront/src/styles/components/content-pages.css` now has 0 `!important` declarations.
- Small isolated `!important` rules were removed from `category-sections.css`, `product-grid-premium.css`, `reels.css`, and `header-enhancements.css`.
- `storefront/src/styles/utilities.css`, `mobile-overrides.css`, and `theme-overrides.css` now avoid forced theme patching.
- Runtime superseded accent usage has been removed; old accent aliases were removed from `globals.css`.
- Raw UI hex values now live in `tokens.css`; ProductView swatches resolve through `--ds-swatch-*` tokens.
- Total `!important` declarations in `storefront/src/styles` are down to 4, all inside the reduced-motion accessibility block in `animations.css`.
- The broad mobile button override in `mobile-overrides.css` was removed so shared `Button`, `IconButton`, and tokenized action styles are not force-restyled on mobile.
- `CookieConsent`, `WishlistButton`, and `SecurityBadges` now use design tokens instead of default Tailwind palettes; cookie accept/reject actions use shared `Button` / `IconButton`.
- Latest measured adoption after remaining-fix cleanup: native styled buttons 54, shared `Button` 47, default palette references 1601, UI default palette references 51.
- Shared UI palette cleanup is complete in the measured scan: `Skeleton`, `Image`, `StarRating`, `CountrySelect`, and `ChatWidget` now use `--ds-*` tokens; UI default palette references are 0.
- PDP and QuickView action cleanup moved PDP/QuickView CTAs, quantity buttons, image navigation, and option controls away from legacy `.btn`, `kv-btn`, and `option-btn` classes.
- Latest measured adoption after PDP/QuickView cleanup: native styled buttons 47, shared `Button` 52, legacy button references 37, default palette references 1543, UI default palette references 0.
- Header icon actions, homepage CTAs, Reels actions, and PDP related-product links now use shared `IconButton`, shared `Button`, or scoped tokenized action classes instead of `.icon-btn` / `.kv-btn`.
- Dead global legacy button CSS was removed: `.kv-btn*`, `.btn*`, premium button selectors, old PDP premium button selectors, and `components/button.css`.
- Latest measured adoption after legacy action-class cleanup: native styled buttons 46, shared `Button` 53, legacy button references 0, default palette references 1543, UI default palette references 0.
- Product card quick-view/add-to-cart and Reviews write/helpful actions now use shared `Button` / `IconButton`; touched review states now use `--ds-*` tokens instead of default status/stone palettes.
- Latest measured adoption after product-card/reviews action cleanup: native styled buttons 45, shared `Button` 56, legacy button references 0, default palette references 1524, UI default palette references 0.
- Catalog filter sidebar controls now use shared `Button` / `IconButton`; touched filter active/inactive/hover states now use `--ds-*` tokens instead of default stone palettes.
- Latest measured adoption after filter control cleanup: native styled buttons 37, shared `Button` 65, legacy button references 0, default palette references 1486, UI default palette references 0.
- Search overlay recent/search/trending/suggestion/view-all actions now use shared `Button`; touched overlay palettes and keyboard hints now use `--ds-*` tokens, and mojibake trending emoji artifacts were removed.
- Latest measured adoption after search overlay cleanup: native styled buttons 35, shared `Button` 71, legacy button references 0, default palette references 1461, UI default palette references 0.
- Reels grid toggles, card opener, desktop arrows, close, like/share/save actions now use shared `Button` / `IconButton`; touched skeletons and hover states now use `--ds-*` tokens.
- Latest measured adoption after Reels controls cleanup: native styled buttons 31, shared `Button` 75, legacy button references 0, default palette references 1449, UI default palette references 0.
- Split header mobile and right-action controls now use shared `IconButton`; touched header badges/backgrounds now use `--ds-*` tokens.
- Latest measured adoption after header icon-control cleanup: native styled buttons 26, shared `Button` 75, legacy button references 0, default palette references 1443, UI default palette references 0.
- PromoBar previous/next/dismiss controls now use shared `IconButton`; touched hover backgrounds avoid default palette utilities.
- Latest measured adoption after PromoBar control cleanup: native styled buttons 23, shared `Button` 75, legacy button references 0, default palette references 1440, UI default palette references 0.
- Mobile drawer/menu controls now use shared `Button` / `IconButton`; touched mobile navigation surfaces and badges now use `--ds-*` tokens while preserving normal-case navigation labels.
- Latest measured adoption after mobile navigation cleanup: native styled buttons 18, shared `Button` 79, legacy button references 0, default palette references 1431, UI default palette references 0.
- Hero/banner carousel previous/next/dot controls now use shared `IconButton` / `Button`; touched carousel CTAs, overlays, and indicator colors now avoid default palette utilities.
- Latest measured adoption after carousel control cleanup: native styled buttons 14, shared `Button` 80, legacy button references 0, default palette references 1393, UI default palette references 0.
- Batch 1 native button sweep added `UnstyledButton` for custom clickable surfaces and moved every remaining raw native button outside shared primitive files onto `Button`, `IconButton`, or `UnstyledButton`.
- Latest measured adoption after Batch 1: raw `<button>` outside primitives 0, native styled buttons 3, shared `Button` primitive usages 90, legacy button references 0, default palette references 1358, UI default palette references 0.
- Batch 2 default palette sweep replaced runtime TS/TSX default Tailwind palette utilities with explicit `--ds-*` token utilities across neutral, status, info, white, and black usage.
- Latest measured adoption after Batch 2: native styled buttons 3, shared `Button` primitive usages 90, legacy button references 0, default palette references 0, UI default palette references 0.
- Batch 3 inline-style sweep removed static presentation inline styles and classified the remaining runtime-bound cases: animation stagger delays, progress widths, product/category swatch colors, PayPal SDK style config, and marquee speed.
- Latest measured adoption after Batch 3: native styled buttons 3, shared `Button` primitive usages 90, legacy button references 0, default palette references 0, UI default palette references 0, inline style blocks 10.
- `npm run audit:design-system` is the repeatable gate for raw hex, deprecated accent names, token self-references, and non-exception `!important`.

Phase 7 rule:

- Raw UI hex should be added to `tokens.css` first, then consumed as `--ds-*`.
- Runtime styling must use TERRACOTTA via `--ds-accent-*`.
- `!important` is allowed only for documented accessibility resets.
- Run `npm run audit:design-system` with build/lint/unit tests before marking storefront design-system work complete.

## Phase 8 Enforcement Hardening

Phase 8 completed work:

- Runtime typography now uses `font-display` and `font-body`; `font-serif` and `font-heading` are treated as legacy naming.
- `tailwind.config.ts` maps legacy/default Tailwind palettes to `--ds-*` tokens so older `text-stone-*`, `bg-white`, status, and neutral utilities resolve to the storefront system.
- Notification toast colors now use semantic design tokens instead of raw Tailwind status colors.
- The design-system audit script now fails on raw hex outside tokens, deprecated accent names, token self-references, non-exception `!important`, legacy font utility names, and mojibake artifacts.

Phase 8 rule:

- New UI should use `font-display` or `font-body`.
- Tailwind color shortcuts are tolerated only because they are bridged to `--ds-*`; new shared primitives should prefer explicit `--ds-*` classes.
- Encoding artifacts such as mojibake are treated as UI bugs.

## Migration Notes

The storefront no longer carries compatibility aliases for superseded accent names. Use `--ds-accent-primary`, `--ds-accent-hover`, `--ds-accent-soft`, or the public `--terracotta*` bridge only when a non-`--ds-*` compatibility name is unavoidable.
