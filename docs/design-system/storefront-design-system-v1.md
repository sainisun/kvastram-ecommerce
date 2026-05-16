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
- `sienna` is a deprecated compatibility alias.
- `coral` is a deprecated compatibility alias.

## Phase 1 Token Layer

Canonical source:

```text
storefront/src/styles/tokens.css
```

Compatibility bridge:

```text
storefront/src/app/globals.css
```

`globals.css` keeps old public aliases alive so existing UI does not break:

```css
--terracotta: var(--ds-accent-primary);
--terracotta-dark: var(--ds-accent-hover);
--terracotta-light: var(--ds-accent-soft);

--sienna: var(--ds-accent-primary);
--sienna-dark: var(--ds-accent-hover);
--sienna-light: var(--ds-accent-soft);

--kv-coral: var(--ds-accent-primary);
--kv-coral-dark: var(--ds-accent-hover);
```

Tailwind canonical aliases:

```ts
brand: {
  terracotta: 'var(--terracotta)',
  accent: 'var(--terracotta)',
}
```

## Superseded Specs

The following older specs are superseded by this file:

- `storefront/KVASTRAM_HEADER_DESIGN_SYSTEM.md` for coral/header typography and accent rules.
- `storefront/kvastram-typography-system-v2.md` for Cormorant Garamond + DM Sans storefront typography.
- Any instruction that names SIENNA or CORAL as the final accent source of truth.

## New Work Rules

1. Use `--ds-*` tokens for new CSS.
2. Use `terracotta` / `--ds-accent-*` for accent work.
3. Do not introduce new `sienna` or `coral` tokens.
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
| TrustBadge | `TrustBadge.tsx` | Shared trust/policy signal block |

Phase 2 rule:

- New UI should use these primitives before adding local button, form, badge, card, drawer, modal, or section styling.
- Existing pages can migrate gradually; compatibility aliases remain active while migration continues.
- Import primitives directly from their files, for example `@/components/ui/Button`, to avoid broad barrel files.

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

Phase 4 rule:

- Full commerce product tiles should use `ProductCard`.
- Compact preview/read-only product tiles should use `CompactProductCard`.
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
- Dynamic swatch color is the only current inline style exception because it is product-option data.
- PDP trust/policy cards should use `TrustBadge` before adding local trust-card markup.
- PDP CSS is owned by `storefront/src/styles/components/pdp.css`; keep new PDP-only CSS there instead of returning it to `globals.css`.

## Phase 6 Global CSS Split

Phase 6 completed work:

- `storefront/src/app/globals.css` is now 152 lines and contains only Tailwind setup, token import, root compatibility variables, and `@theme` aliases.
- Base reset and baseline typography now live in `storefront/src/styles/base.css`.
- Token, typography, utility, animation/effect, mobile, responsive, and theme override layers now live under `storefront/src/styles/`.
- Feature-owned CSS now lives under `storefront/src/styles/components/`, including header, product cards, catalog, PDP, footer, collections, reels, content pages, newsletter, quick view, and homepage section groups.
- `globals.css` now has 0 `!important` declarations; remaining legacy `!important` rules are isolated in named stylesheets for future cleanup.

Phase 6 rule:

- `globals.css` should keep shrinking into explicit owners: tokens, base, typography, utilities, and component/page stylesheets.
- CSS with a clear feature owner should move to `storefront/src/styles/components/` or another named stylesheet instead of growing `globals.css`.

## Phase 7 Legacy Override Cleanup

Phase 7 first slice completed work:

- Footer color decisions now use `--ds-footer-*` tokens in `storefront/src/styles/tokens.css`.
- Desktop and mobile footer raw color utilities were removed from `storefront/src/components/layout/Footer.tsx`.
- `storefront/src/styles/components/footer.css` now has 0 `!important` declarations.
- The broad monochrome theme override excludes the `.kvastram-footer` subtree so footer contrast can be owned by footer tokens instead of forced overrides.

Phase 7 second slice completed work:

- `storefront/src/styles/components/content-pages.css` now has 0 `!important` declarations.
- Small isolated `!important` rules were removed from `category-sections.css`, `product-grid-premium.css`, `reels.css`, and `header-enhancements.css`.
- Total `!important` declarations in `storefront/src/styles` are down to 170.

Phase 7 rule:

- Clean remaining legacy `!important` rules one owner file at a time.
- Prefer scoping broad overrides away from owned components before removing component-level `!important`.
- Move repeated raw color values into `--ds-*` tokens before editing component markup.

## Migration Notes

Phase 1 is a compatibility phase. Existing UI can keep using old names temporarily because they now resolve to TERRACOTTA. Future cleanup should replace old names gradually:

| Deprecated | Replace With |
| --- | --- |
| `--sienna` | `--terracotta` or `--ds-accent-primary` |
| `--sienna-dark` | `--terracotta-dark` or `--ds-accent-hover` |
| `--sienna-light` | `--terracotta-light` or `--ds-accent-soft` |
| `--kv-coral` | `--terracotta` or `--ds-accent-primary` |
| `--kv-coral-dark` | `--terracotta-dark` or `--ds-accent-hover` |
