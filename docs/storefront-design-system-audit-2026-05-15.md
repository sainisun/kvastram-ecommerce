# Kvastram Storefront Design System Audit

Date: 2026-05-15
Scope: `storefront` codebase design-system audit, not a visual redesign implementation
Audit type: Code-level design-system consistency, UI architecture, tokens, typography, colors, spacing, components, and brand coherence

Update: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6 are complete, and Phase 7 is in progress in `docs/design-system/storefront-design-system-v1.md`. PDP review/social-proof fallbacks no longer fabricate exact numbers, PDP CTA/sticky states now use CSS state classes, PDP status colors resolve through `--ds-*` tokens, PDP trust cards use the shared `TrustBadge` primitive, global CSS has been split into named stylesheet owners, footer colors now resolve through footer tokens, and legacy `!important` usage is being reduced owner by owner.

## Executive Summary

Kvastram storefront inconsistent isliye lag raha hai kyunki codebase me ek single design system nahi chal raha. Multiple design directions ek saath active hain:

1. "Premium legacy" global CSS system: sienna, cream, ink, product grid, `kv-*`, `*-prem`.
2. New header/nav system: `kv-ink`, `kv-coral`, parchment, pill-shaped header.
3. Mulmul-like typography direction: Montserrat mapped to both display and body.
4. Older Cormorant Garamond + DM Sans docs and references.
5. PDP conversion redesign: separate warm-white, terracotta, gold, green, blue, teal palette.
6. Page-level Tailwind utilities: `stone`, `gray`, `blue`, `amber`, `red`, etc.
7. Unused legacy layout/header components still present with their own design language.

Result: storefront ka visual voice ek brand jaisa feel nahi karta. Header fashion-boutique/pill based lagta hai, homepage premium artisan + generic ecommerce mix lagta hai, PDP conversion-heavy marketplace style lagta hai, wholesale/auth/account pages SaaS/dashboard-ish feel dete hain, aur mobile menu ek alag app-style experience ban gaya hai.

Current design-system health score: **4/10**

The issue is not that components are individually ugly. Main issue hai **governance failure**: tokens exist, but components bypass tokens; docs exist, but docs contradict code; global CSS is too large and layered; and there is no enforced component API for buttons, cards, forms, sections, product tiles, navigation, or typography.

## What A Consistent Design System Looks Like

Ek consistent ecommerce design system usually ye cheezein enforce karta hai:

1. **One brand foundation**
   - 1 primary palette
   - 1 neutral palette
   - 1 accent palette
   - semantic tokens: `surface`, `text`, `border`, `accent`, `success`, `danger`, `sale`
   - raw hex codes almost never appear inside components

2. **Strict typography roles**
   - display font only for brand/editorial moments
   - body/UI font for nav, buttons, price, forms, filters
   - fixed heading scale with named text styles
   - no random `text-[13px]`, `text-[21px]`, `font-serif`, `font-[family-name:...]` scattered everywhere

3. **Spacing rhythm**
   - 4px or 8px base scale
   - section padding patterns such as mobile 48px, tablet 64px, desktop 96px
   - consistent container max widths
   - product grids use predictable horizontal and vertical gaps

4. **Component primitives**
   - one `Button`
   - one `Input`
   - one `Card`
   - one `SectionHeader`
   - one `ProductCard`
   - one `Drawer`
   - one `Modal`
   - variants are named: `primary`, `secondary`, `ghost`, `danger`, `icon`

5. **Clear page templates**
   - homepage editorial sections follow same spacing and heading style
   - catalog pages use same toolbar, filters, chips, product cards
   - PDP may be more conversion-focused, but still shares tokens, buttons, trust cards, badges
   - account/checkout/support pages do not suddenly become another product aesthetic

6. **Design docs match code**
   - tokens in docs match `globals.css` and `tailwind.config.ts`
   - old design docs are archived or marked superseded
   - no two docs say different fonts/colors for same brand

## Audit Evidence And Metrics

Measured from `storefront/src`:

| Signal | Count | Why It Matters |
| --- | ---: | --- |
| `globals.css` lines | 152 | `globals.css` is now a foundation file; feature-owned CSS has moved into named stylesheets under `src/styles`. |
| Hardcoded hex color matches | 425 | Tokens exist, but raw colors still dominate many components. |
| Tailwind color utility matches (`stone`, `gray`, `blue`, etc.) | 1743 | Many pages bypass brand tokens and use default Tailwind palettes. |
| Inline `style={{ ... }}` matches | 71 | Style decisions happen inside JSX, so tokens/components cannot govern them. |
| Rounded utility matches | 246 | Radius language varies between sharp luxury, rounded cards, pills, and app UI. |
| Shadow utility matches | 84 | Some areas are flat editorial, others are heavily shadowed. |
| Font/style family matches | 477 | Typography is being controlled in many places instead of one source. |
| `!important` in `globals.css` | 0 | The remaining legacy `!important` rules are isolated in named stylesheet owners for future cleanup. |
| `!important` in `src/styles` | 170 | Phase 7 has started owner-by-owner cleanup; footer and content-page owners are now at 0 `!important`. |

## Most Important Findings

### 1. Typography source of truth is contradictory

Current code:

- `storefront/src/app/globals.css:10-11` maps both `--font-display` and `--font-body` to Montserrat.
- `storefront/tailwind.config.ts:53-57` maps `heading`, `display`, `serif`, `sans`, and `body` to those variables.
- `storefront/src/app/layout.tsx:83` uses `font-body`, but there is no active `next/font` setup in this layout file.
- PDP CSS now lives in `storefront/src/styles/components/pdp.css`, and its typography maps to `--font-body` and `--font-display`.
- `storefront/KVASTRAM_HEADER_DESIGN_SYSTEM.md` says the header system should use Cormorant Garamond + DM Sans.
- `storefront/MULMUL_TYPOGRAPHY_AUDIT.md` says the system was moved to a Mulmul-like single sans approach via Montserrat.

Why it feels ugly:

Typography is the strongest brand signal in fashion ecommerce. Kvastram currently sends three signals at once:

- luxury serif artisan
- clean Mulmul-like sans retail
- generic Tailwind/SaaS sans pages

This creates the feeling that different pages belong to different stores.

Recommended direction:

Pick one:

- **Option A: Artisan editorial**: Cormorant Garamond for logo/editorial only, DM Sans for UI/body.
- **Option B: Mulmul-like modern retail**: Montserrat or similar sans for everything, with hierarchy from weight/spacing.

Do not keep both. If Kvastram wants handcrafted Jaipur premium, Option A has stronger brand differentiation. If it wants clean mass-retail conversion, Option B is safer and simpler.

### 2. Color system has too many competing palettes

Token groups currently active:

- `--color-text-*` at `storefront/src/app/globals.css:34-44`
- header `--kv-*` tokens at `storefront/src/app/globals.css:79-95`
- compatibility brand tokens `--sienna`, `--cream`, `--paper`, `--ink`, etc. at `storefront/src/app/globals.css:98-129`
- PDP compatibility palette at `storefront/src/styles/components/pdp.css:2-19`, now mapped through canonical `--ds-*` tokens.
- Tailwind default palettes across pages: `stone`, `gray`, `blue`, `amber`, `red`, `green`, `pink`, `sky`

Examples:

- Header uses `#fbf2df`, `#eadfce`, `#f3b6c8`, `#5d2636`, `#c94e2a`.
- Product/card system uses `--sienna`, `--cream`, `--ink`.
- PDP uses `--terracotta`, `--gold`, `--green`, `--blue`, `--teal`.
- Auth/wholesale pages use `blue-600`, `gray-300`, `amber-500`.
- Footer uses hardcoded dark brown/cream values with global override patches.

Why it feels ugly:

Color inconsistency immediately breaks perceived quality. A premium store can use multiple colors, but only if every color has a role. Here colors are not semantic; they are local decisions.

Recommended brand palette:

```css
:root {
  --ds-surface-page: #f9f7f4;
  --ds-surface-card: #ffffff;
  --ds-surface-soft: #f1ede7;
  --ds-text-primary: #1a1714;
  --ds-text-secondary: #5c5750;
  --ds-text-muted: #8a837b;
  --ds-border-subtle: #e8e3db;
  --ds-accent-primary: #a85d3a;
  --ds-accent-hover: #7d3f25;
  --ds-accent-coral: #c94e2a;
  --ds-sale: #c0392b;
  --ds-success: #3e8a5f;
}
```

Then deprecate `--kv-*`, `--sienna-*`, PDP-local color tokens, and raw hex usage gradually.

### 3. Header has diverged from its own design document

Docs say header should be flat, white, no shadows, no gradients, 3-column classic fashion layout.

Current code:

- `storefront/src/components/header/HeaderMain.tsx:21` creates a rounded pill header with `rounded-[999px]`, `bg-[#fbf2df]`, custom grid columns, and heavy shadow.
- `storefront/src/components/header/PromoBar.tsx:74` changes desktop promo bar to pink pill with shadow.
- `storefront/src/components/header/PromoBar.tsx:111` changes text colors to pink/brown values.

Why it feels ugly:

Header should anchor the brand. Instead it fights the rest of the storefront:

- pill radius suggests playful/app-like
- shadow suggests modern SaaS/card UI
- parchment/pink promo bar suggests campaign/banner
- product pages and catalog are flatter and more ecommerce-like

Recommendation:

Choose one header style:

- **Luxury/editorial**: flat white, thin border, no shadow, 68px, centered logo.
- **Soft boutique**: pill header, parchment background, shadow, but then make rest of site use same rounded/pill language.

Do not mix flat premium product sections with a floating pill header unless this is intentionally repeated across cards, inputs, drawers, and CTAs.

### 4. Mobile navigation has become a separate product

Current `storefront/src/components/layout/MobileMenu.tsx` is feature-rich but visually disconnected:

- hardcoded Unsplash image pool at lines 82-88
- hardcoded menu taxonomy at lines 91-283
- many local hex colors around lines 470-870
- `font-serif` logo at line 480 while global system is Montserrat
- search placeholder references "quilts, jackets, bags" at line 532, which may not match main nav/category strategy
- "Shop by mood" appears at line 663 as a separate browse model

Why it feels ugly:

Mobile menu feels like a different app because it has:

- its own images
- its own category strategy
- its own colors
- its own card radius
- its own data model

Recommendation:

Mobile menu should consume same nav source as desktop:

- same `categories`
- same `collections`
- same featured card logic
- same accent tokens
- same typography roles

If "Shop by mood" is a real discovery model, desktop nav/homepage/catalog should also expose it.

### 5. Product card and product listing system is split

There are multiple product-card languages:

- `ProductGrid.tsx` uses global `.product-card`, `.product-media`, `.mini-cart`, `.quick-view-btn`.
- `ProductCarousel.tsx` also uses `.product-card`.
- Search page has its own product cards and quick add.
- PDP related rows and recently viewed rows use separate classes.
- Original audit found old `.legacy-product-*`, new `.product-*`, and multiple override blocks mixed together in `globals.css`; Phase 6 has moved the main product-card layers into named stylesheets.

Key global CSS points:

- `.products-grid` and `.product-card` now live in `storefront/src/styles/components/product-card.css`.
- premium legacy product-grid styles now live in `storefront/src/styles/components/product-grid-premium.css`.
- older `.legacy-product-card` styles are isolated in `storefront/src/styles/utilities.css` for future deletion/migration.

Why it feels ugly:

Product cards are the ecommerce storefront's "repeatable unit". If product cards vary across homepage, catalog, carousel, search, and recently viewed, the site feels unfinished.

Recommendation:

Create one `ProductCard` contract:

- image aspect ratio: `4/5`
- radius: one decision, likely 0 or 4px for premium fashion
- badge location: top-left
- wishlist: top-right
- quick action: bottom overlay or icon button, but same everywhere
- title: 2-line clamp
- price: same font weight and size
- metadata order: collection/brand, title, price, action

### 6. PDP is conversion-rich but brand-disconnected

Original audit evidence:

- ProductView hardcoded review rating and review-count fallbacks.
- ProductView hardcoded exact social-proof claims for viewers, recent buyers, and sold counts.
- PDP used several inline state styles for CTA and sticky-bar behavior.
- PDP CSS previously created a separate palette and font pair inside `globals.css`; it now lives in `storefront/src/styles/components/pdp.css` and maps through `--ds-*` typography/color tokens.

Phase 5 status:

- Fixed: fabricated review/social-proof fallback numbers were removed.
- Fixed: PDP review counts render only from real `avg_rating` and `review_count` data.
- Fixed: PDP CTA and sticky-bar state styling moved to classes.
- Fixed: PDP status colors and fonts now resolve through `--ds-*` tokens.
- Fixed: PDP trust cards now use the shared `TrustBadge` primitive.
- Fixed in Phase 6: PDP CSS was split out of `globals.css` into `storefront/src/styles/components/pdp.css`.

Why it feels ugly:

PDP feels like a conversion landing page from a different store. It has urgency bars, review meters, badges, social proof, sticky bars, multiple color states, and separate fonts. These can improve conversion, but only if they are visually integrated.

Important trust issue:

Hardcoded social proof numbers can damage trust if customers notice unrealistic or repeated claims. Use real analytics/order/review data or remove the exact numbers.

Recommendation:

Keep conversion features, but convert them into design-system components:

- `TrustStrip`
- `UrgencyNotice`
- `ReviewSummary`
- `VariantSelector`
- `StickyAddToCart`
- `PdpActionGroup`

All should use shared tokens and shared buttons.

### 7. Global CSS is acting as a dumping ground

Original audit evidence: `storefront/src/app/globals.css` had 6401 lines and contained:

- reset/base styles
- multiple token systems
- section utilities
- premium prototype styles
- product grids
- catalog styles
- account styles
- footer overrides
- PDP redesign
- responsive patches
- many `!important` rules

Phase 6 status: `globals.css` is now 152 lines, has 0 `!important` declarations, and keeps only Tailwind setup, token import, root compatibility variables, and `@theme` aliases.

Why it feels ugly:

Large global CSS made it easy to accidentally inherit old styles. Phase 6 reduced this risk by isolating feature CSS into named files; the remaining legacy `!important` rules are no longer in `globals.css`.

Recommended structure:

```text
src/styles/
  tokens.css
  base.css
  typography.css
  utilities.css
  components/
    button.css
    form.css
    product-card.css
    section.css
    drawer.css
    modal.css
    footer.css
    pdp.css
```

Then `globals.css` should only import these layers.

### 8. There are unused legacy components with separate styling

Evidence:

- `storefront/src/components/layout/Header.tsx` exists but current layout uses `SiteHeader` from `storefront/src/components/header/index.tsx`.
- `storefront/src/components/layout/MegaMenu.tsx` exists but current header uses `storefront/src/components/header/MegaMenu`.
- `storefront/src/components/header/mobile/MobileDrawer.tsx` and `CategoryPills.tsx` exist, but `SiteHeader` imports `MobileMenu` from `components/layout/MobileMenu`.

Why it matters:

Unused components are not only dead code. They also confuse future design work because engineers see multiple "correct" versions of header/menu/mobile drawer.

Recommendation:

After verifying no imports, archive/delete the unused header/menu generation or move it to `deprecated/` with a note. One navigation system must own storefront chrome.

### 9. Forms and inputs are not fully tokenized

Current `Input.tsx` and `Textarea.tsx` use inline styles for height, padding, border, radius, colors, focus state, and errors.

Why it feels inconsistent:

Forms inside auth, wholesale, checkout, account, and contact pages then use many local Tailwind versions too. So customers see different input radius, error colors, focus rings, and spacing.

Recommendation:

Create form primitives:

- `Field`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `RadioCard`
- `ErrorText`
- `HelperText`

All focus states should use one focus token, likely `--ds-focus-ring: #c94e2a`.

### 10. Docs exist, but they are not governed

Relevant docs:

- `docs/design-system/spacing.md`
- `storefront/kvastram-typography-system-v2.md`
- `storefront/MULMUL_TYPOGRAPHY_AUDIT.md`
- `storefront/KVASTRAM_HEADER_DESIGN_SYSTEM.md`

Problem:

These docs are useful individually, but together they contradict each other. One says use Cormorant + DM Sans. Another says use Montserrat single-sans. Header docs say no shadow and flat white. Header code uses pill, pink/paper surface, and shadow.

Recommendation:

Create one canonical file:

```text
docs/design-system/storefront-design-system-v1.md
```

Mark older docs as:

```md
> Status: Superseded by docs/design-system/storefront-design-system-v1.md
```

## Why Kvastram Storefront Looks Inconsistent And Ugly

In simple Hinglish:

1. **Brand voice fixed nahi hai.** Kabhi handmade luxury, kabhi Mulmul clean retail, kabhi marketplace conversion, kabhi SaaS form UI.
2. **Fonts ka decision locked nahi hai.** Docs Cormorant/DM Sans bolte hain, code Montserrat bolta hai, PDP raw Cormorant/DM Sans bolta hai.
3. **Colors semantic nahi hain.** Same accent role ke liye sienna, coral, terracotta, amber, blue, green, stone, gray sab use ho rahe hain.
4. **Header alag brand bol raha hai.** Pill + pink + shadow vs rest of storefront ka flatter artisan/ecommerce feel.
5. **Mobile menu apna separate app hai.** Hardcoded images, hardcoded categories, local color system.
6. **Product cards ka ek hi canonical system nahi hai.** Homepage/catalog/search/recently-viewed cards alag behavior/visuals le sakte hain.
7. **Global CSS too heavy tha.** Phase 6 ne `globals.css` ko 152 lines aur 0 `!important` tak reduce kar diya, but legacy override cleanup abhi named stylesheets me continue hoga.
8. **Code me design decisions scattered hain.** JSX me inline styles, Tailwind arbitrary values, global classes, local CSS, and docs all mixed.
9. **Legacy code clean nahi hua.** Multiple headers/menus exist, which makes system direction unclear.
10. **Trust/commerce content also visually noisy hai.** PDP fake-looking fallback social proof numbers and conversion badges make premium handmade brand less authentic.

## Recommended Canonical Design Direction

For Kvastram, recommended design direction:

**Premium artisan commerce, not generic marketplace.**

Design principles:

1. Warm, handcrafted, quiet.
2. High-quality product imagery leads.
3. UI stays restrained and predictable.
4. Accent color is used sparingly.
5. Typography feels editorial, but product browsing remains scannable.
6. Trust signals feel honest, not exaggerated.

Recommended foundations:

| Area | Recommendation |
| --- | --- |
| Display font | Cormorant Garamond, only for logo, page heroes, editorial section titles |
| UI/body font | DM Sans or Montserrat, but choose one |
| Primary accent | Sienna/terracotta family, one canonical value |
| Background | Warm cream |
| Cards | White/paper surface |
| Radius | 0-4px for product cards and editorial cards, 999px only for chips/icons |
| Shadows | Avoid on main surfaces; use very subtle only for overlays/drawers |
| Buttons | One primary dark/accent CTA, one outline, one ghost |
| Product card | Minimal, image-led, consistent metadata |
| PDP | Conversion features allowed, but quieter and tokenized |

## Priority Action Plan

### Phase 0: Freeze and choose direction

1. Decide final typography direction: Cormorant + DM Sans OR Montserrat-only.
2. Decide final header direction: flat editorial OR floating pill.
3. Decide final accent token: sienna OR coral OR terracotta.
4. Mark contradictory docs as superseded.

### Phase 1: Token cleanup

1. Create canonical `src/styles/tokens.css`.
2. Rename tokens to `--ds-*` so old aliases can be deprecated clearly.
3. Map old variables to new variables temporarily:

```css
--sienna: var(--ds-accent-primary);
--kv-coral: var(--ds-accent-primary);
--terracotta: var(--ds-accent-primary);
```

4. Remove raw hex from header, footer, mobile menu, PDP, and product cards first.

### Phase 2: Component primitives

Build or normalize:

1. `Button`
2. `IconButton`
3. `Input`
4. `Select`
5. `Badge`
6. `Section`
7. `SectionHeader`
8. `ProductCard`
9. `Drawer`
10. `Modal`
11. `TrustBadge`

Then ban new one-off styling for these primitives.

### Phase 3: Navigation unification

1. Keep only one active header system.
2. Desktop and mobile nav should share data and style tokens.
3. Remove or archive unused:
   - `components/layout/Header.tsx`
   - `components/layout/MegaMenu.tsx`
   - unused `components/header/mobile/MobileDrawer.tsx` if not used
   - unused `CategoryPills.tsx` if not used
4. Replace hardcoded Unsplash mobile images with real category/collection images or no image.

### Phase 4: Product-card unification

1. Convert all product cards to one `ProductCard`.
2. Use same card in:
   - homepage
   - catalog
   - search
   - wishlist
   - recently viewed
   - related products
   - carousels
3. Remove `.legacy-product-*` after migration.

### Phase 5: PDP harmonization

1. Remove hardcoded social proof numbers unless real data exists.
2. Move PDP local palette into canonical tokens.
3. Convert inline styles into variant classes.
4. Use shared `Button`, `Badge`, `TrustBadge`, `ProductCard`.

### Phase 6: Global CSS split

Phase 6 status:

- Completed: PDP CSS moved from `src/app/globals.css` to `src/styles/components/pdp.css`.
- Completed: root layout imports the PDP stylesheet after `globals.css` to keep PDP overrides after base global rules.
- Completed: base, typography, utilities, effects, animations, mobile overrides, responsive overrides, theme overrides, and major feature CSS were split out of `globals.css`.
- Completed: `globals.css` is under the 200-line target at 152 lines.
- Completed: `globals.css` has 0 `!important` declarations.

Split `globals.css` into layered files:

```text
src/styles/tokens.css
src/styles/base.css
src/styles/typography.css
src/styles/utilities.css
src/styles/effects.css
src/styles/animations.css
src/styles/mobile-overrides.css
src/styles/responsive.css
src/styles/theme-overrides.css
src/styles/components/button.css
src/styles/components/header.css
src/styles/components/product-card.css
src/styles/components/catalog.css
src/styles/components/pdp.css
src/styles/components/footer.css
```

Target:

- `globals.css` under 200 lines: completed at 152 lines.
- `!important` count under 20 in `globals.css`: completed at 0.
- raw hex in `src/components` under 20 initially, then under 5

### Phase 7: Legacy override cleanup

Phase 7 first slice status:

- Completed: footer color tokens added as `--ds-footer-*`.
- Completed: desktop and mobile footer raw color utilities removed from `Footer.tsx`.
- Completed: `src/styles/components/footer.css` reduced to 0 `!important`.
- Completed: broad monochrome theme overrides no longer force colors inside `.kvastram-footer`.

Phase 7 second slice status:

- Completed: `src/styles/components/content-pages.css` reduced to 0 `!important`.
- Completed: isolated `!important` rules removed from category sections, product-grid premium, reels, and header enhancements.
- Completed: total `src/styles` `!important` count reduced from 186 to 170.

Remaining Phase 7 work:

- Continue reducing `!important` in `utilities.css`, `mobile-overrides.css`, `animations.css`, and `theme-overrides.css`.
- Tokenize repeated raw colors in extracted component stylesheets before removing override rules.

## Design-System Quality Gate

For every future storefront PR, enforce:

1. No raw hex in TSX unless adding a token migration TODO.
2. No `style={{ color/background/border/fontSize }}` in JSX.
3. No new `text-[13px]`, `tracking-[...]`, `rounded-[...]` unless tokenized.
4. No Tailwind default colors for brand UI: avoid `stone`, `gray`, `blue`, `amber`, `red`, etc. except semantic status utilities.
5. Use shared primitives for buttons, inputs, badges, cards, modals, drawers.
6. New page must use shared `Section` and `SectionHeader`.
7. Product cards must use canonical `ProductCard`.
8. Header/nav changes must update one canonical design-system doc.

## File-Level Notes

### `storefront/src/app/globals.css`

Status: Phase 6 foundation file.

Problems:

- originally 6401 lines before Phase 6
- now 152 lines
- now 0 `!important`
- product/card/catalog/PDP/account/footer CSS moved into named stylesheets
- compatibility aliases still exist intentionally while older classes migrate

Action:

- keep `globals.css` foundation-only
- keep reducing legacy overrides inside the extracted named stylesheets
- remove old prototype and legacy blocks after migration

### `storefront/src/components/header/*`

Status: active header system but not aligned with docs.

Problems:

- many raw hex values
- pill/shadow/pink treatment contradicts header design doc
- desktop and mobile have different interaction language

Action:

- decide header style
- token-only colors
- same data model desktop/mobile

### `storefront/src/components/layout/MobileMenu.tsx`

Status: active mobile menu, high inconsistency risk.

Problems:

- hardcoded external images
- hardcoded categories/moods
- local hex palette
- independent discovery model

Action:

- feed from API/categories/collections
- tokenized styling
- align with desktop nav and homepage discovery

### `storefront/src/components/ProductGrid.tsx`

Status: important ecommerce primitive but not abstracted enough.

Problems:

- tightly coupled cart/wishlist/quick view logic
- global class dependencies
- spotlight insertion only mobile
- one card implementation shared partially, but not treated as canonical design-system component

Action:

- extract `ProductCard`
- keep `ProductGrid` only for layout/data arrangement

### `storefront/src/components/product/ProductView.tsx`

Status: conversion-heavy PDP, visually strongest but least aligned.

Problems:

- hardcoded fallback review/social proof numbers
- inline styles
- separate palette
- separate typography references

Action:

- tokenized PDP components
- real data or no exact social proof
- use shared components

### `storefront/src/components/layout/Footer.tsx`

Status: Phase 7 first slice tokenized.

Problems:

- footer was previously using hardcoded desktop and mobile color utilities
- footer contrast patching was previously dependent on `!important`
- mobile and desktop footer still have different layout systems, but now share footer/design tokens

Action:

- continue reducing footer layout drift after higher-risk override cleanup
- keep footer colors in `--ds-footer-*` tokens

## Final Diagnosis

Kvastram ka storefront inconsistent isliye hai kyunki design system **documented zyada hai, enforced kam hai**. Tokens exist karte hain, but components unhe bypass karte hain. Multiple redesign attempts ek saath merge ho gaye: premium prototype, Mulmul typography, header redesign, PDP CVR redesign, wholesale/auth defaults. Isliye har page individually "worked on" lagta hai, but whole storefront ek single premium brand nahi lagta.

Best fix ek aur visual patch nahi hai. Best fix is:

1. canonical design direction choose karo,
2. tokens lock karo,
3. primitives banao,
4. old global CSS aur unused components retire karo,
5. page-by-page migration karo with quality gates.

Expected result after cleanup:

- header, homepage, catalog, PDP, footer ek hi brand family me lagenge
- product browsing more premium and scannable hoga
- mobile menu less disconnected lagega
- code maintain karna easier hoga
- future redesign work one-off patches ke bajay system-level improvements banega
