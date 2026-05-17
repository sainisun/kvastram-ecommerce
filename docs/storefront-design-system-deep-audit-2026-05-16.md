# Kvastram Storefront Design System Deep Audit

Date: 2026-05-16

Scope: storefront codebase, current local workspace, design-system research baseline, mobile and desktop expectations, and mismatch diagnosis.

## Executive Summary

Kvastram storefront is now much more consistent at the token level than before, but it can still feel visually inconsistent because the design system is not fully adopted at the component and pattern level.

The core issue is this:

- Tokens exist.
- Some primitives exist.
- But many pages still build UI directly with raw Tailwind utility composition, page-local spacing, page-local buttons, page-local cards, page-local overlays, and feature-specific CSS.

That means the storefront can technically pass token checks while still looking uneven because the same design decisions are being recreated in too many places.

Current codebase signals:

| Signal | Current Finding | Design-System Risk |
| --- | ---: | --- |
| CSS owner files under `src/styles` | 31 | High chance of overlapping ownership |
| TSX files under `src/components` | 111 | Large component surface, needs stricter primitives |
| Native styled `<button>` usages | 63 | Buttons are still not centralized enough |
| Shared `<Button>` usages | 38 | Improving, but primitive adoption is still low |
| Legacy `kv-btn` / `btn-*` references | 56 | Multiple button systems still exist |
| Default palette utility references | 1881 | Tailwind palette bridge helps, but usage still hides intent |
| Inline `style={{ ... }}` blocks | 54 | Layout/color/animation decisions still bypass components |
| Dynamic class compositions | 157 | Higher chance of drift and state inconsistency |
| Runtime `font-serif` / `font-heading` scan | 0 | Fixed in latest hardening pass |
| Mojibake scan | 0 | Fixed in latest hardening pass |
| Design-system audit script | Passing | Good enforcement baseline exists |
| Shared `Input` usages | 75 | Text/search/number field adoption complete for P2 scope |
| Shared `Textarea` usages | 7 | Textarea adoption complete for P2 scope |
| Shared `Select` usages | 6 | Native select adoption complete for P2 scope |
| Shared `Modal` usages | 8 | Overlay ownership is now centralized for active P3 scope |
| Shared `Drawer` usages | 4 | Drawer ownership is now centralized for active P3 scope |
| Shared `Badge` usages | 15 | Product, PDP, and account status labels now use shared badges in the migrated scope |

## Research Baseline: What A Decent Design System Contains

I reviewed mature design-system references from Material Design, Shopify Polaris, IBM Carbon, and Atlassian Design System.

Sources:

- Material Design 3: design tokens and color system: https://m3.material.io/
- Shopify Polaris: unified UI framework and token/component guidance: https://shopify.dev/docs/api/polaris
- Shopify Polaris web components: tone, variant, layout primitives, and component-controlled styling: https://shopify.dev/docs/api/polaris/using-polaris-web-components
- IBM Carbon spacing: https://carbondesignsystem.com/elements/spacing/overview/
- IBM Carbon color: https://carbondesignsystem.com/elements/color/overview/
- IBM Carbon typography: https://carbondesignsystem.com/elements/typography/overview/
- IBM Carbon button style: https://carbondesignsystem.com/components/button/style
- Atlassian foundations: https://atlassian.design/foundations/

Common pattern across strong systems:

1. Foundations define decisions.
2. Tokens encode decisions.
3. Components consume tokens.
4. Patterns compose components.
5. Docs explain usage.
6. Audits enforce rules.

Kvastram has started steps 1, 2, 5, and 6. The weak area is step 3 and step 4: component adoption and page-pattern consistency.

## Complete Design-System Inventory Needed

### 1. Brand Foundations

Required:

- Brand personality: restrained, handmade, premium ethnic commerce.
- Voice/tone: calm, craft-led, not loud discount marketplace.
- Visual principles: soft editorial surfaces, low-noise commerce, clear product hierarchy.
- Accessibility target: WCAG AA contrast, focus-visible everywhere, reduced motion supported.

Current gap:

- Some pages feel premium/editorial.
- Some pages feel SaaS/admin.
- Some pages feel marketplace/discount.
- Reels and wholesale have separate visual systems.

### 2. Typography

Required desktop:

- Display: product/editorial headings, restrained weight, no decorative serif naming.
- Body: product metadata, price, navigation, forms.
- UI labels: uppercase only for labels, nav, badges, and short commands.
- Scale: display-xl, display-lg, display-md, display-sm, body-xl, body-lg, body-md, body-sm, body-xs.
- Line heights: tight for display, normal/relaxed for body.
- Letter spacing: zero for normal text; controlled wider spacing only for labels.

Required mobile:

- No viewport-scaled type.
- Shorter headings.
- Product names should wrap predictably.
- Form labels and helper text must remain readable.
- Hero text must not cover product/media content.

Current status:

- Runtime `font-serif` / `font-heading` usage has been removed in the latest pass.
- Typography tokens exist.
- But many components still compose typography through raw utility strings rather than a small set of text primitives.

Mismatch:

- The naming was previously misleading: `font-serif` mapped to sans/display. That is fixed, but old mental model can still return unless audit blocks it.
- Checkout, account, auth, content, and reels still each define text hierarchy locally.

Rule:

- New code should use `font-display`, `font-body`, `text-display-*`, `text-body-*`, `type-*`, and `tracking-token-*`.
- No new `font-serif` or `font-heading`.

### 3. Color And Theme

Required:

- One canonical accent: TERRACOTTA.
- Surface tokens: page, paper, soft, parchment, warm.
- Text tokens: primary, secondary, muted, disabled, inverse.
- Border tokens: subtle, strong, dark.
- Status tokens: success, danger, warning, info.
- Commerce tokens: sale, price, old price, rating.
- Footer tokens.
- Product swatch tokens separate from UI theme tokens.

Required desktop:

- Large surfaces should be calm and low-contrast.
- Accent should highlight action and selected state, not decorate every section.
- Product grids should keep background, cards, badges, and CTAs from competing.

Required mobile:

- Sticky bars, mobile nav, drawer, mini cart, and filters must use same surface/border/text logic.
- Touch feedback should use tokenized hover/active/focus states.
- Color cannot be the only status indicator.

Current status:

- `--ds-*` tokens exist.
- Tailwind legacy palettes are now bridged to tokens in `tailwind.config.ts`.
- Raw UI hex is restricted by audit.

Mismatch:

- The bridge prevents Tailwind colors from visually leaking, but it does not make code intent clean.
- 1469 default palette utility references remain. Example categories include `bg-white`, `text-stone-*`, `border-stone-*`, `text-white`, `bg-black`, and status color utilities.

Why this still affects visual quality:

- Developers cannot easily tell whether a class is a semantic surface, text role, status, or one-off choice.
- Page-level utility strings keep growing.
- Similar UI may look similar by accident rather than by component contract.

Rule:

- Shared components should use explicit `--ds-*` tokens.
- Legacy Tailwind palette utilities can stay temporarily only because the Tailwind config now maps them to tokens.

### 4. Background And Surfaces

Required:

- Page background: one default.
- Paper/card background: one default.
- Soft section background: controlled alternation.
- Editorial media backgrounds: tokenized.
- Overlay backgrounds: tokenized rgba channels.
- Footer background: separate token family.

Required desktop:

- Full-width bands or unframed layouts for page sections.
- Cards only for repeated items, modals, framed tools, and true cards.
- No nested cards.

Required mobile:

- Section rhythm should compress without becoming cramped.
- Drawers and overlays should use the same layer/elevation system.
- Bottom sticky areas should not fight page backgrounds.

Current mismatch:

- `theme-overrides.css` is now reduced, but old page structures still use mixed surface patterns.
- Some sections use editorial bands, some use cards, some use stark white/black hero treatment.
- Reels intentionally use dark video UI, but it is not isolated as a separate pattern spec.

Why ugly:

- The eye sees different product surfaces as different brands.
- High-contrast black/white modules interrupt the warm commerce palette.

### 5. Spacing And Layout

Research baseline:

- Carbon treats spacing as a tokenized scale used inside components and between components.
- Polaris layout primitives use stack/grid with explicit gap.
- Atlassian lists spacing and grid as foundations.

Required:

- 4px base spacing scale.
- 8px main rhythm.
- Page gutters: mobile, tablet, desktop.
- Section spacing: xs, sm, md, lg, xl.
- Component internal spacing: button, card, input, modal, drawer.
- Grid specs: product grid, collection grid, editorial split, form layout.

Required desktop:

- Product grids should have stable columns, image ratios, and consistent card spacing.
- Header and footer should align to the same page rails.
- PDP should align gallery, purchase panel, accordions, trust content.

Required mobile:

- Touch targets at least 44px.
- Drawer list rows stable height.
- Product cards should not jump when labels/prices vary.
- Sticky CTA and nav should not overlap content.

Current mismatch:

- `src/styles` has 29 CSS owner files.
- Many layout decisions are local Tailwind strings rather than `Section`, `Card`, `Stack`, or `Grid` primitives.
- 59 inline style blocks remain, some legitimate for dynamic data, some still layout/presentation.

Why ugly:

- Spacing density changes from page to page.
- Some surfaces feel cramped; others feel oversized.
- Mobile and desktop do not always feel like two breakpoints of the same system.

### 6. Radius, Borders, Elevation

Required:

- Radius tokens: xs, sm, md, lg, pill.
- Rule: cards 8px or less unless component has a reason.
- Borders: subtle, strong, dark.
- Elevation: one shadow token family.
- Focus ring: accent and consistent offset.

Current mismatch:

- Radius is mixed across `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`, `rounded-[999px]`, custom CSS, and older component CSS.
- Shadow utilities and custom `box-shadow` appear across multiple feature styles.

Why ugly:

- Same type of object can feel different: a card, modal, drawer, and product tile may not belong to the same family.

### 7. Buttons

Required:

- One shared `Button` primitive.
- Variants: primary, secondary/dark, outline, ghost, danger.
- Sizes: sm, md, lg, icon.
- States: hover, active, focus-visible, disabled, loading.
- Icon rules: lucide icons, icon-only buttons with accessible label.
- CTA hierarchy: only one primary per task area.

Required desktop:

- Header actions use icon buttons.
- Product and checkout CTAs use primary/dark button patterns.
- Secondary actions use outline/ghost.

Required mobile:

- Minimum 44px touch target.
- Sticky CTA uses same primary button.
- Drawer actions use same sizes and spacing.

Current mismatch:

- Native `<button>` count: 225.
- Shared `<Button>` usage: 3.
- Legacy `kv-btn` / `btn-*` references: 50.

Why ugly:

- Buttons are one of the most visible brand signals. If every page creates its own button, the storefront never feels unified.
- This is currently the biggest component-adoption gap.

Fix direction:

- Migrate high-traffic pages first: header, PDP, cart, checkout, search, account, auth, mobile drawer.
- Add lint/audit rule for native `<button>` with className unless it is icon-only or inside the shared Button implementation.

### 8. Forms And Inputs

Required:

- Shared `Input`, `Textarea`, `Select`, checkbox, radio, switch, quantity stepper.
- States: default, hover, focus, error, disabled, success/help.
- Label, helper text, error text, required indicator.
- Mobile keyboard and input height rules.

Current status:

- `Input`, `Textarea`, and `Select` primitives exist.

Mismatch:

- Many forms still use page-local border-b inputs or direct Tailwind classes.
- Checkout, auth, wholesale, contact, and country select have their own form styling.

Why ugly:

- Forms feel like separate apps: auth, checkout, wholesale, account, and contact do not share enough interaction grammar.

### 9. Product Cards And Commerce Components

Required:

- ProductCard canonical.
- CompactProductCard canonical.
- Price display primitive.
- Sale badge.
- Stock badge.
- Rating display.
- Wishlist icon button.
- Quick add.
- Product image ratio/fallback.

Current status:

- ProductCard/CompactProductCard exist and were migrated in some surfaces.

Mismatch:

- Legacy product card CSS remains.
- Some areas still use local cards or skeletons.
- Ratings/stars and price typography are not fully centralized.

Why ugly:

- Product browsing is the core storefront experience. Any mismatch in image ratio, price color, badge style, or button placement is immediately visible.

### 10. Navigation, Header, Mobile Menu

Required:

- One shared navigation config.
- Desktop header, mobile top bar, category pills, drawer, mega menu consume same config.
- Active states use TERRACOTTA.
- Search, wishlist, cart, account use consistent icon button patterns.

Current status:

- Shared nav config exists.
- Header and mobile menu have been tokenized.

Mismatch:

- There are still two header families in code: active header modules and older layout/Header/MegaMenu style.
- Mobile drawer has complex local markup and many locally composed states.

Why ugly:

- Header/nav is the first brand signal. If desktop, mobile, old layout header, promo bar, and drawer have slightly different densities/radii/colors, the whole storefront feels patched.

### 11. Modals, Drawers, Overlays

Required:

- Shared Modal and Drawer primitives.
- Overlay color token.
- Close button standard.
- Header/footer areas standard.
- Body scroll lock behavior.
- Motion duration/easing token.

Current status:

- `Modal` and `Drawer` primitives exist.

Mismatch:

- NewsletterModal, QuickViewModal, CartDrawer, MobileDrawer, Reels modal, Share dropdown, CountrySelect dropdown still carry their own overlay/surface rules.

Why ugly:

- Overlays are high-attention moments. If every overlay has its own border, shadow, radius, and close style, users feel the inconsistency.

### 12. Feedback And Status

Required:

- Toast.
- Alert/banner.
- Empty state.
- Error state.
- Loading/skeleton.
- Success/confirmation.
- Order status badge.

Current fixes:

- Notification toast now uses semantic status tokens and accessible close label.

Mismatch:

- `order-status.ts` still returns Tailwind status classes, though Tailwind now bridges them.
- Empty states are still page-local in many places.
- Skeletons use local utility classes instead of DS surface tokens in some places.

Why ugly:

- Status UI often appears during important flows: checkout, account, auth, order tracking. Inconsistency here reduces trust.

### 13. Motion

Required:

- Duration tokens.
- Easing token.
- Enter/exit patterns.
- Hover/press patterns.
- Reduced-motion override.

Current status:

- Reduced-motion block exists and is the only allowed `!important` exception.

Mismatch:

- Motion is scattered across CSS and inline style animation delays.
- Reels, header mega menu, carousel, product hover, reveal animations do not share a full motion spec.

Why ugly:

- Even if colors match, mismatched motion makes the UI feel assembled from different templates.

### 14. Icons And Imagery

Required:

- Lucide for UI commands.
- Product/category imagery should reveal the actual product.
- Icon button labels required.
- Social/payment icons should be standardized.
- Fallback imagery should use tokenized surfaces.

Mismatch:

- Some payment/social/security badges are locally built.
- Some image placeholders and skeletons use page-local styling.

Why ugly:

- Mixed icon sizes, stroke widths, and badge backgrounds create micro-inconsistency.

### 15. Content And Commerce Rules

Required:

- No fake reviews/social proof.
- No exact metrics without real data.
- Product copy hierarchy.
- Shipping/returns/trust text pattern.
- Empty-state copy pattern.
- Error-state tone.

Current status:

- PDP fake social proof was removed earlier.

Mismatch:

- Content pages, account, checkout, auth, and wholesale still use different heading/copy densities.

Why ugly:

- A design system is not only visuals. Inconsistent content hierarchy makes the page feel less premium.

## Mobile And Desktop System Checklist

### Desktop Checklist

| Area | Required Rule |
| --- | --- |
| Page rail | One max width and gutter system |
| Header | Single desktop header family |
| Promo bar | Tokenized surface, no pink/coral drift |
| Mega menu | Same nav config, same typography, same elevation |
| Product grid | Stable columns, ratio, card spacing |
| Product card | Shared ProductCard only |
| PDP | Gallery/purchase/trust/accordion pattern locked |
| Cart drawer | Shared Drawer anatomy |
| Checkout | Shared form/input/button system |
| Footer | Footer tokens, same page rail |
| Modals | Shared Modal primitive |
| Buttons | Shared Button primitive |
| Forms | Shared Input/Textarea/Select/checkbox/radio |

### Mobile Checklist

| Area | Required Rule |
| --- | --- |
| Top bar | 44px+ touch targets |
| Mobile drawer | Same typography, same rows, same icon buttons |
| Category pills | Same nav config and active state |
| Product grid | Stable 2-column rhythm, no text overflow |
| Product card | Image ratio and price hierarchy fixed |
| Sticky CTA | Shared Button variant, no overlap |
| Filters | Drawer/sheet primitive |
| Search | Same input and result card pattern |
| Checkout | Full-width controls, readable labels |
| Account/auth | Same form pattern |
| Toasts | Safe viewport placement |
| Motion | Reduced motion honored |

## Why Storefront Can Still Look Ugly Or Inconsistent

### 1. Token consistency is not the same as component consistency

The audit now ensures colors and legacy names are controlled, but many elements are still hand-built. A page-local button using token colors can still have a different height, padding, radius, icon gap, uppercase treatment, loading state, and focus ring.

### 2. Tailwind palette bridging hides drift, it does not remove it

Mapping `text-stone-900` to `--ds-text-primary` prevents visual color drift, but the source code still communicates the wrong abstraction. Designers and developers cannot tell whether `stone-900` means primary text, heading text, icon text, or button text.

### 3. Buttons are not centralized

225 native `<button>` elements and only 3 shared `<Button>` usages is the clearest reason the UI still feels inconsistent. Buttons define much of the storefront's perceived quality.

### 4. Forms are not centralized enough

Auth, checkout, wholesale, country select, contact, and account forms still use local patterns. Premium storefront trust depends heavily on form consistency.

### 5. Too many overlay systems

Modal, drawer, quick view, newsletter, cart, mobile drawer, reels, search, and share dropdowns do not all share one anatomy.

### 6. Page-level layouts still own too much design

There are 29 CSS files and many local utility-heavy layouts. This makes visual decisions distributed across the codebase.

### 7. Reels and wholesale are separate sub-products

Reels intentionally uses a dark immersive pattern. Wholesale has a business/customer portal flavor. Both need documented sub-system rules so they feel intentionally different, not accidentally different.

### 8. Mobile and desktop are not always variants of the same pattern

Several mobile sections are separate markup/styles rather than responsive versions of a shared component. That creates breakpoint drift.

## Rules Currently Broken Or At Risk

| Rule | Status | Evidence | Impact |
| --- | --- | --- | --- |
| Use shared Button for actions | Broken | 225 native buttons, 3 shared Button usages | CTA inconsistency |
| Use shared form primitives | Partially broken | Multiple page-local input/form styles | Trust and checkout inconsistency |
| Use explicit semantic tokens in shared code | At risk | 1469 bridged Tailwind palette refs | Intent unclear |
| Use shared overlay anatomy | Partially broken | Multiple modal/drawer implementations | Different interaction feel |
| Use one card system | Partially broken | Legacy card CSS and local cards remain | Product/catalog drift |
| Use one motion system | Partially broken | Scattered animations and inline delays | Different feel per feature |
| Keep page CSS ownership narrow | At risk | 29 CSS files | Cascade complexity |
| Mobile/desktop same pattern | Partially broken | Separate mobile/menu/drawer code paths | Breakpoint drift |
| Encoding cleanliness | Fixed | Mojibake scan now clean | UI polish improved |
| Typography naming | Fixed | Legacy font utility scan now clean | Design-language clarity improved |

## Priority Fix Plan

### P0: Lock Enforcement

1. Keep `npm run audit:design-system` mandatory.
2. Add audit rule for new native `<button className=...>` outside approved files.
3. Add audit rule for page-local `bg-white`, `text-stone-*`, etc. in new shared primitives.
4. Add component adoption dashboard: Button, Input, Card, Modal, Drawer, ProductCard usage counts.

P0 implementation status: completed locally.

- Added `storefront/scripts/design-system-baseline.json`.
- Added ratchet checks in `storefront/scripts/design-system-audit.mjs`.
- Added `storefront/scripts/design-system-metrics.mjs`.
- Added `npm run audit:design-system:metrics`.
- Added `npm run verify:design-system`.
- Audit now fails if native styled buttons, default Tailwind palette refs, or default palette refs inside `src/components/ui` increase beyond the P0 baseline.

### P1: Button Migration

1. Migrate auth pages.
2. Migrate cart and checkout.
3. Migrate search controls.
4. Migrate account actions.
5. Migrate mobile drawer and header icon buttons.

Goal: shared `<Button>` usage should outnumber native styled buttons.

P1 current local status:

- Checkout payment CTA, shipping CTA, back action, and promo apply action now use shared `Button`.
- Login email CTA, Facebook CTA, password visibility icon, and resend verification action now use shared `Button`/`IconButton`.
- Account address add/save/cancel/empty-state/edit/delete actions now use shared `Button`/`IconButton`.
- Native styled button count reduced from 92 to 72 in the latest verified pass.
- Shared `Button` usage increased from 10 to 35.
- Remaining P1 work: cart, search, account, mobile drawer/header actions, PDP gallery/action controls, and local feature widgets.

### P2: Form Migration

1. Checkout form to shared Input/Select/Textarea.
2. Auth forms to shared primitives.
3. Account/profile forms to shared primitives.
4. Wholesale forms to shared primitives.

P2 current local status: completed locally and reverified.

- Checkout contact/shipping fields now use shared `Input`.
- Checkout gift message now uses shared `Textarea`.
- Checkout promo-code field now uses shared `Input`.
- `AddressAutocomplete` now renders through shared `Input`, so address entry inherits the same focus, border, label, disabled, and typography rules.
- Login/register/forgot/reset auth pages already use shared `Input`; login action controls were aligned in the latest pass.
- Account address form now uses shared `Input` and `Select`.
- Wholesale application and wholesale checkout fields now use shared `Input`, `Textarea`, and `Button`.
- Product review, back-in-stock, and delivery-planner fields now use shared primitives.
- Track-order, search overlay, header search, mobile menu search, chat input, newsletter forms, cart promo/shipping preview, and order return fields now use shared primitives.
- Shared `Input` usage increased from 23 to 75.
- Shared `Textarea` usage increased from 1 to 7.
- Shared `Select` usage increased from 0 to 6.
- Remaining native form tags are limited to primitive implementation files plus controls without a dedicated primitive yet: checkbox, radio, and file upload.

Latest reverification after completing P2:

- `npm.cmd run audit:design-system` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test:unit -- --run` passed outside sandbox: 2 files, 3 tests.
- `npm.cmd run build` passed with Next.js production build.

### P3: Overlay Migration

1. NewsletterModal to shared Modal.
2. QuickViewModal to shared Modal.
3. CartDrawer to shared Drawer.
4. MobileMenu drawer anatomy to shared Drawer or documented mobile nav pattern.
5. Share dropdown/CountrySelect dropdown styling to shared popover/menu pattern.

P3 current local status: completed locally and reverified.

- `NewsletterModal` now uses the shared `Modal` primitive.
- `QuickViewModal` now uses the shared `Modal` primitive and its unit test passes.
- `ReelsExperience` player now uses shared `Modal` fullscreen/headerless mode.
- `CartDrawer` now uses the shared `Drawer` primitive.
- Catalog mobile filter drawer now uses the shared `Drawer` primitive.
- `ShareButtons` and `CountrySelect` now use shared `PopoverPanel`.
- Active `MobileMenu` now uses the shared `Drawer` primitive for its outer shell while preserving nested submenu/search/wishlist/cart behavior.
- Account return modal, search overlay, size guide, cart recovery modal, mini cart, and product-gallery lightbox now use shared `Modal`/`Drawer` primitives.
- Shared `Modal` usage increased from 0 to 8.
- Shared `Drawer` usage increased from 0 to 4.
- Remaining modal-like scan items are either shared primitives, unreferenced legacy `header/mobile/MobileDrawer.tsx`, or media overlay styling rather than active modal shells.
- Latest P3 reverification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

### P4: Product Commerce Migration

1. Centralize price display.
2. Centralize rating display.
3. Centralize sale/stock badges.
4. Remove legacy product card CSS once no longer used.

P4 current local status: completed for active storefront commerce surfaces and reverified.

- `PriceDisplay` now owns product-card, compact-card, PDP, quick-view, bestseller, spotlight, and shop-the-look price text.
- `RatingDisplay` now owns quick-view, PDP, PDP review summary, and bestseller rating display.
- Product-card status labels, PDP gallery scarcity labels, PDP savings labels, and spotlight labels now render through shared `Badge`.
- Homepage curated product tiles now use `CompactProductCard`, so homepage no longer keeps a separate mini product-card markup path.
- Dead local selectors for old product-card badges, `.price`, `.orig`, and old PDP rating links were removed after migration.
- Latest P4 reverification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

### P5: Page Pattern Cleanup

1. Define standard `PageHeader`, `ContentSection`, `EmptyState`, `StatusBanner`, `AccountShell`.
2. Migrate about, search, wishlist, journal, shipping, returns, auth, account.
3. Keep wholesale and reels as documented sub-systems.

P5 current local status: page-pattern continuation completed locally and reverified.

- `EmptyState` and `StatusBanner` are now shared UI primitives.
- Product grid/product carousel, search empty results, account overview, account orders, account order detail, account messages, and wholesale dashboard now use the shared page-state primitives where migrated.
- Account order and return status labels in the migrated scope now use shared `Badge`.
- Wishlist, returns, login, register, reset-password, and forgot-password now use shared primitives for empty states, feedback banners, success states, commerce price display, and primary actions where migrated.
- Return/account status color classes in the migrated scope now resolve through `--ds-*` status tokens instead of raw Tailwind status palettes.
- Shipping and size guide now use the shared content-page system; gift cards, verify-email, journal empty content, contact success/error states, account profile/address feedback, and checkout success loading/error states now use shared page-state primitives.
- Global error, not-found, checkout error, and products error pages now use shared `EmptyState`; retry actions use shared `Button`.
- Collections, collection-detail, and bestsellers empty states now use shared `EmptyState`.
- Latest P5 metrics: native styled buttons 57, shared `Button` usages 45, shared `Badge` usages 16, default palette refs 1649, UI default palette refs 99.
- Remaining P5 work is lower-priority page-shell/header/content-section migration for any remaining bespoke marketing/help pages outside the migrated scope.
- Latest P5 reverification passed: design-system audit, lint, unit tests with Vitest threads pool, and production build.

P6 continuation started after P5 reverification:

- `globals.css` is 150 lines and remains limited to Tailwind setup, token import, root compatibility variables, and `@theme` aliases.
- `globals.css` mojibake comment artifacts were removed.
- Global CSS scan confirmed deprecated `sienna`/`coral` names are compatibility aliases only, raw hex values are isolated to `tokens.css`, and non-exception `!important` remains limited to the reduced-motion accessibility block.
- `storefront/src/styles/storefront.css` now owns the global stylesheet manifest, preserving the previous cascade order while reducing `app/layout.tsx` to two CSS entrypoints: `globals.css` and `storefront.css`.
- Latest P6 metrics: CSS owner files 32, native styled buttons 57, shared `Button` usages 45, default palette refs 1649, UI default palette refs 99.
- P6 continuation reverification passed with design-system audit, lint, unit tests with Vitest threads pool, metrics, and production build.

Remaining-fix cleanup after P6:

- Removed the broad mobile button/link override from `mobile-overrides.css`; mobile actions now rely on shared primitives or explicit tokenized classes instead of a global forced black-button patch.
- Cleaned the mobile override header comment mojibake.
- Tokenized `CookieConsent`, `WishlistButton`, and `SecurityBadges`; cookie accept/reject/dismiss actions now use shared `Button` / `IconButton`.
- Removed the payment-icon mojibake glyph in favor of ASCII `Pay`.
- Latest remaining-fix metrics: native styled buttons 54, shared `Button` usages 47, default palette refs 1601, UI default palette refs 51.
- Reverification passed with design-system audit, lint, unit tests with Vitest threads pool, metrics, and production build.

Shared UI tokenization cleanup after remaining-fix audit:

- Tokenized `Skeleton`, `Image`, `StarRating`, `CountrySelect`, and `ChatWidget`.
- `ChatWidget` header controls now use shared `IconButton`.
- UI default palette references are now 0.
- Latest metrics after this cleanup: native styled buttons 54, shared `Button` usages 47, default palette refs 1550, UI default palette refs 0.
- Reverification passed with design-system audit, lint, unit tests with Vitest threads pool, metrics, and production build.

PDP and QuickView action cleanup:

- PDP size-guide, add-to-cart, buy-now, quantity stepper, and sticky add-to-cart controls now use shared `Button` / `IconButton`.
- PDP WhatsApp and delivery-planner links now use tokenized PDP link-button classes instead of global `.btn` classes.
- PDP variant pills moved from legacy `option-btn` to PDP-owned `pdp-option-button`.
- QuickView image navigation and add-to-cart now use shared `IconButton` / `Button`.
- QuickView variant pills moved from legacy `option-btn` to `quickview-option-button`; full-details link now uses `quickview-link-button`.
- QuickView legacy mojibake comments and modal raw white/black overlay styles were tokenized.
- Latest metrics after this cleanup: native styled buttons 47, shared `Button` usages 52, legacy button refs 37, default palette refs 1543, UI default palette refs 0, inline style blocks 52, dynamic class compositions 156.
- Reverification passed with design-system audit, lint, unit tests with Vitest threads pool, metrics, and production build.

## Remaining Fix Audit - 2026-05-17

This section supersedes the older raw counts in the top-half diagnostic tables. Those early counts are useful historical context, but the latest verified state is:

| Signal | Current Count | Remaining Risk |
| --- | ---: | --- |
| CSS owner files | 32 | Still too many overlapping legacy owner files, although import ownership is cleaner through `storefront.css` |
| Native styled buttons | 47 | Local styled action controls remain, but shared `Button` now outnumbers them |
| Shared `Button` usages | 52 | Shared action primitive is now the dominant measured button path |
| Legacy button class refs | 37 | `kv-btn`, `.btn`, `.icon-btn`, product quick-view button, and premium button classes still keep legacy button CSS alive |
| Default palette refs | 1543 | Tailwind palette bridge prevents visual color drift, but source intent is still unclear in many page-local utilities |
| UI default palette refs | 0 | Shared UI folder no longer uses default Tailwind palettes in the measured scan |
| Inline style blocks | 52 | Some are legitimate dynamic data, but many are layout/motion/presentation leakage |
| Dynamic class compositions | 156 | State styling remains hard to audit in several complex components |

### P0 Remaining: Make The Report And Gates Match Current Reality

Status: audit needed before more phase claims.

- The report now contains historical counts and latest counts. Future work should treat this `Remaining Fix Audit - 2026-05-17` section as the current baseline.
- Keep `npm.cmd run verify:design-system -- --pool=threads` and `npm.cmd run audit:design-system:metrics` as the minimum gate after each remaining-fix slice.
- The next enforcement improvement should add a stricter allowlist for native styled `<button className=...>` because the current metric catches increases, but it does not identify all remaining action patterns by priority.

### P1 Remaining: Button System Is Still Not Fully Centralized

Status: improved; shared `Button` now outnumbers native styled buttons, but legacy CSS families remain active.

Evidence:

- Native styled buttons are down to 47.
- Shared `Button` usages are up to 52.
- Legacy button class refs are down to 37.
- Important active references still exist in:
  - `storefront/src/components/home/ShopTheLook.tsx`, `BrandStory.tsx`, `ArtisanStrip.tsx`: `kv-btn`.
  - `storefront/src/components/reels/ReelsExperience.tsx`: `kv-btn` and local video controls.
  - `storefront/src/components/layout/Header.tsx`: `icon-btn`.
  - `storefront/src/components/products/ProductCard.tsx`: `quick-view-btn`.
  - `storefront/src/app/products/[handle]/page.tsx`: `kv-btn`.
  - `storefront/src/styles/utilities.css`, `components/button.css`, `components/premium-sections.css`, `components/header.css`, `components/product-card.css`, and `components/pdp-premium.css`: legacy button CSS families.

Why it matters:

- The storefront will still feel inconsistent until header icon actions, Reels actions, homepage CTA links, product-card quick-view triggers, and dead legacy button CSS are consolidated.
- Button color may be tokenized, but button anatomy is still split across several CSS families.

Next fix order:

1. Header `icon-btn` controls.
2. Homepage `kv-btn` CTA links.
3. Product-card `quick-view-btn` trigger.
4. Reels `kv-btn` and video control buttons, documented as a dark sub-system if not migrated.
5. Delete or shrink dead legacy `.btn`, `.kv-btn`, `.btn-primary-prem`, and PDP premium selectors once references are gone.

### P1 Closed: Shared UI Folder Palette Leakage

Status: closed in the latest verified cleanup.

Current UI default palette refs: 0.

Completed:

- `storefront/src/components/ui/ChatWidget.tsx` now uses `--ds-*` tokens for shell, header, message bubbles, suggestion chips, footer, and helper links.
- `storefront/src/components/ui/Skeleton.tsx` now uses `--ds-surface-*` tokens and tokenized translucent overlays.
- `storefront/src/components/ui/Image.tsx` fallback/loading surfaces now use design tokens.
- `storefront/src/components/ui/StarRating.tsx` now uses `--ds-accent-gold` and border tokens.
- `storefront/src/components/ui/CountrySelect.tsx` empty state now uses `--ds-text-muted`.

Why it matters:

- Shared UI is the design-system API. This cleanup makes new primitive usage more likely to copy semantic token usage instead of Tailwind palette names.

### P2 Remaining: Inline Style Blocks Need Classification

Status: partially legitimate, partially design leakage.

Current inline style blocks: 54.

Likely legitimate dynamic-data exceptions:

- `ProductView.tsx`: swatch background from product option value.
- `MobileMenu.tsx`: category icon background data.
- `Header.tsx` and `CartDrawer.tsx`: animation delay values from index.
- `MarqueeStrip.tsx`: animation duration from speed prop.
- `PayPalButton.tsx`: third-party payment iframe/container constraints.
- `ContentPageSystem.tsx`: one-off image object position.

Design leakage that should move into CSS or components:

- `ReelsExperience.tsx`: many text colors, surfaces, and layout values are inline; this should be a documented dark video sub-system with CSS/token classes.
- `QuickViewModal.tsx`: layout and spinner styles should move into quick-view CSS or shared primitives.
- `ProductDeliveryPlanner.tsx`: spacing and grid layout should move to PDP CSS or a small delivery-planner primitive.
- `NewsletterSection.tsx` and `HeroSection.tsx`: inline layout/color styles should become section classes.

Next fix order:

1. Move QuickViewModal layout inline styles to `components/quick-view.css`.
2. Move ProductDeliveryPlanner spacing/layout inline styles to `components/pdp.css`.
3. Move home Hero/Newsletter inline styles to `components/home-sections.css`.
4. Treat Reels separately with a `reels.css` design-subsystem pass.

### P2 Remaining: CSS Ownership Is Cleaner But Still Broad

Status: improved, but still a long-term consistency risk.

Current CSS owner files: 32.

Confirmed cleanups:

- `app/layout.tsx` imports only `globals.css` and `storefront.css`.
- `globals.css` is constrained to Tailwind setup, token import, root compatibility aliases, and theme aliases.
- Broad mobile button/link forced override has been removed.
- Non-exception `!important` remains clean; only reduced-motion accessibility rules remain.

Remaining risk files after the latest continuation:

- `utilities.css`: repeated `kv-btn` definitions are removed; generic helpers still need longer-term pruning.
- `components/button.css`: deleted; legacy `.btn` system is no longer active.
- `components/premium-sections.css`: premium button classes are removed.
- `components/pdp-premium.css` and `components/pdp-legacy.css`: old PDP style families still need consolidation, but old premium button selectors are removed.
- `components/quick-view.css`: `option-btn` has been migrated to scoped QuickView classes.
- `components/header.css`: `icon-btn` has been migrated to shared `IconButton` / tokenized link classes.
- `components/product-card.css`: still owns `quick-view-btn` and related legacy product-card behavior.

Next fix order:

1. Merge or delete `pdp-premium.css` / `pdp-legacy.css` once active selectors are gone.
2. Continue product-card action cleanup, especially `quick-view-btn` and review/upload action styles.
3. Keep `storefront.css` as the manifest; do not add style imports back to `layout.tsx`.

### P3 Remaining: Form Controls Still Need Primitive Completion

Status: low-medium because text/select/textarea migration is strong, but control families are incomplete.

Done:

- Shared `Input`, `Textarea`, and `Select` are broadly adopted.

Remaining:

- Checkbox primitive.
- Radio primitive.
- Switch/toggle primitive.
- Quantity stepper primitive.
- File upload primitive if storefront upload surfaces remain.

Why it matters:

- Checkout, filters, PDP options, account preferences, and wholesale flows still recreate small control states locally.

### P3 Remaining: Page And Sub-System Specs Need Tightening

Status: lower priority, but important for "100% consistency".

Remaining page-pattern risks:

- Wholesale still feels like a separate B2B portal and needs a documented sub-system spec rather than ad hoc page styling.
- Reels intentionally uses dark immersive UI, but the dark video system needs explicit tokens/classes so it reads as intentional, not accidental.
- Some marketing/help pages still use bespoke section composition and local Tailwind density.
- Visual QA screenshots are still required for homepage, catalog, PDP, cart, checkout, account, auth, mobile nav, and search before claiming full design-system consistency.

### Recommended Next Slice

Do not continue by touching every page at once. The highest-return next slice should be:

1. Migrate header `icon-btn` controls and homepage `kv-btn` CTAs to shared/tokenized action primitives.
2. Reverify metrics; target legacy button refs below 20.
3. Remove dead legacy button CSS selectors once no active references remain.
4. Classify and reduce inline style blocks, starting with `QuickViewModal`, `ProductDeliveryPlanner`, and homepage hero/newsletter.
5. Treat Reels as a documented dark video sub-system before deeper migration.

## Definition Of Done For "Actually Consistent"

Storefront should not be considered fully design-system-consistent until:

- Shared Button is used for most styled actions.
- Shared form primitives are used across checkout/auth/account/wholesale.
- Product card, compact card, price, badge, rating, wishlist are canonical.
- Modal/drawer/overlay patterns are centralized.
- Tailwind default palette usage is mostly gone from shared components, not merely bridged.
- Mobile and desktop use the same pattern names and component families.
- Visual QA screenshots pass for homepage, catalog, PDP, cart, checkout, account, auth, mobile nav, and search.

## Final Diagnosis

The storefront still looks inconsistent because Kvastram has a token system but not yet a fully adopted component and pattern system.

The latest hardening made colors, typography naming, and audit enforcement stronger. But the next quality jump will come from replacing page-local UI construction with shared components.

In short:

- Phase 0 to 8 made the design language enforceable.
- The next work must make the design language unavoidable.

## Remaining Fix Continuation - 2026-05-17

Status: completed for the legacy action-class slice.

What changed:

- Header action controls moved from legacy `.icon-btn` to shared `IconButton` for button actions and tokenized `header-icon-link` for account/wishlist links.
- Homepage CTA links moved from global `.kv-btn` classes to scoped `home-link-button` variants.
- Reels empty/load-more actions moved away from `.kv-btn`; load-more now uses shared `Button`.
- PDP related-products link moved away from `.kv-btn` to a scoped tokenized related-products action class.
- Dead `.kv-btn*`, `.btn*`, premium button, and old PDP premium button selectors were removed from the global CSS surface.
- The legacy `components/button.css` import was removed from `storefront.css`, and the dead stylesheet was deleted.

Measured result:

- Legacy button class refs: 37 after PDP/QuickView cleanup -> 31 after header/home migration -> 0 after Reels/PDP/dead-CSS cleanup.
- Shared `Button` usages: 52 -> 53.
- UI default palette refs remain 0.
- CSS owner files: 32 -> 31.

Reverification:

- `npm run lint`: passed.
- `npm run audit:design-system:metrics`: passed with 0 legacy button class refs.
- `npm run verify:design-system -- --pool=threads`: passed after sequential rerun; audit, lint, and 3 unit tests passed.
- `npm run build`: passed after sequential rerun; 57/57 routes generated.

Note:

- A parallel verify/build attempt produced transient sandbox/Turbopack cache errors, but the same commands passed when rerun sequentially from `E:\Kvastram projects\storefront`.

## Product Card And Reviews Continuation - 2026-05-17

Status: completed for the product-card/reviews action slice.

What changed:

- `ProductCard` quick-view now uses shared `Button`; add-to-cart now uses shared `IconButton`.
- Product-card CSS no longer owns `quick-view-btn`, `mini-cart`, or dead `pdp-review-button` selectors.
- The stale responsive `.quick-view-btn` selector was renamed to `product-card-quick-view`, so desktop hover behavior still matches the migrated class.
- Reviews "Write a Review" and "Helpful" actions now use shared `Button`.
- Review upload, review cards, success/error/loading/empty states, borders, and touched hover states now use `--ds-*` tokens instead of default Tailwind status/stone palettes.
- Review mojibake bullet text was replaced with plain ASCII separators.

Measured result:

- Shared `Button` usages: 53 -> 56.
- Native styled buttons: 46 -> 45.
- Default palette refs: 1543 -> 1524.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Catalog Filter Controls Continuation - 2026-05-17

Status: completed for the product filter sidebar controls.

What changed:

- `FilterSidebar` header clear action, category expand controls, mobile tag pills, mobile sticky actions, desktop sticky actions, group toggles, and filter option rows now use shared `Button` / `IconButton`.
- Direct `stone-*` palette classes were removed from `FilterSidebar`; touched backgrounds, borders, text, hover, and active states now resolve through `--ds-*` tokens.
- Mobile and desktop filter option states now share the same token vocabulary for active/inactive/hover states.

Measured result:

- Native styled buttons: 45 -> 37.
- Shared `Button` usages: 56 -> 65.
- Default palette refs: 1524 -> 1486.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- `npm run lint`: passed.
- `npm run audit:design-system:metrics`: passed with the metrics above.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Search Overlay Continuation - 2026-05-17

Status: completed for the search overlay action/palette slice.

What changed:

- Recent-search clear, recent chips, trending tiles, popular chips, suggestion rows, and "View All Results" now use shared `Button`.
- Search overlay headings, empty state, suggestion rows, product title/price overrides, result divider, and keyboard hints now use `--ds-*` tokens instead of default stone palettes.
- Mojibake/emoji artifacts in trending tiles were removed; tiles now use stable text initials.

Measured result:

- Native styled buttons: 37 -> 35.
- Shared `Button` usages: 65 -> 71.
- Default palette refs: 1486 -> 1461.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- SearchOverlay scan: no raw `<button>`, mojibake, emoji, or default stone palette refs remain in the touched component.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Reels Controls Continuation - 2026-05-17

Status: completed for the Reels native-control slice.

What changed:

- Reels grid toggles now use shared `IconButton`.
- Reels card opener now uses shared `Button` while preserving the existing `reel-card` styling hook.
- Desktop reel navigation arrows and close control now use shared `IconButton`.
- Like, share, and save actions now use shared `Button`.
- Reels loading skeletons and touched hover states now use `--ds-*` tokens instead of default stone palettes.
- The swipe hint mojibake/arrow artifact was removed.

Measured result:

- Native styled buttons: 35 -> 31.
- Shared `Button` usages: 71 -> 75.
- Default palette refs: 1461 -> 1449.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- Reels scan: no raw `<button>`, default stone palette refs, or mojibake artifacts remain in `ReelsExperience`.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Header Icon Controls Continuation - 2026-05-17

Status: completed for the split header mobile/right-action controls.

What changed:

- `MobileTopBar` menu, search, and cart actions now use shared `IconButton`.
- `ActionsRight` desktop search and cart actions now use shared `IconButton`.
- Touched header badges/backgrounds now use `--ds-*` tokens instead of default white utilities.

Measured result:

- Native styled buttons: 31 -> 26.
- Default palette refs: 1449 -> 1443.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- Header control scan: no raw `<button>` or default white/stone palette refs remain in the touched files.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## PromoBar Controls Continuation - 2026-05-17

Status: completed for the announcement bar control slice.

What changed:

- PromoBar previous, next, and dismiss controls now use shared `IconButton`.
- Social/control hover backgrounds now avoid default `white/*` utility refs and use explicit token-safe rgba styling.

Measured result:

- Native styled buttons: 26 -> 23.
- Default palette refs: 1443 -> 1440.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- PromoBar scan: no raw `<button>` or default white/stone palette refs remain in the touched component.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Mobile Navigation Continuation - 2026-05-17

Status: completed for the mobile drawer/menu control slice.

What changed:

- `DrawerNavItem` expandable navigation row now uses shared `Button` while preserving normal-case nav text.
- `MobileDrawer` close control now uses shared `IconButton`; drawer surfaces and WhatsApp CTA text now use `--ds-*` tokens.
- `layout/MobileMenu` close/cart/search-clear/category/back/filter controls now use shared `Button` / `IconButton`.
- Touched mobile menu badges, cards, hero text, and panel surfaces now use `--ds-*` tokens instead of default white utilities.

Measured result:

- Native styled buttons: 23 -> 18.
- Shared `Button` usages: 75 -> 79.
- Default palette refs: 1440 -> 1431.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- Mobile nav scan: no raw `<button>`, default white/stone palette refs, or mojibake artifacts remain in the touched mobile nav files.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Carousel Controls Continuation - 2026-05-17

Status: completed for the hero/banner carousel control slice.

What changed:

- `BannerCarousel` previous/next controls now use shared `IconButton`; slide dots now use shared `Button`.
- `HeroCarousel` previous/next controls now use shared `IconButton`.
- Touched carousel CTAs, backgrounds, overlays, and scroll indicator colors now use `--ds-*` tokens or explicit rgba values instead of default stone/white/black utilities.

Measured result:

- Native styled buttons: 18 -> 14.
- Shared `Button` usages: 79 -> 80.
- Default palette refs: 1431 -> 1393.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.

Reverification:

- Carousel scan: no raw `<button>` or default white/black/stone palette refs remain in the touched carousel files.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Batch 1 Native Button Primitive Sweep - 2026-05-17

Status: completed for all actionable native button usage outside shared primitives.

What changed:

- Added shared `UnstyledButton` for custom clickable surfaces, chips, gallery thumbs, menu rows, pagination controls, toast dismissals, and image/media controls that should not inherit CTA styling.
- Migrated all remaining raw `<button>` usages outside approved primitives to `Button`, `IconButton`, or `UnstyledButton`.
- Kept the three real native button implementations centralized in `components/ui/Button.tsx`: `Button`, `IconButton`, and `UnstyledButton`.
- Touched account messages/orders, cart, search, mini cart, error boundary, hero, cart drawer, header, main layout, product gallery/view/quick view, catalog, category carousel, chat widget, country select, share buttons, star rating, and notification toast controls.

Measured result:

- Raw `<button>` outside approved primitive files: 69 -> 0.
- Native styled buttons: 14 -> 3.
- Shared `Button` primitive usages: 80 -> 90.
- Legacy button class refs remain 0.
- UI default palette refs remain 0.
- Default palette refs: 1393 -> 1358.

Reverification:

- Raw button inventory: 0 non-primitive `<button>` usages.
- `npm run lint`: passed.
- `npm run audit:design-system:metrics`: passed and reported native styled buttons at primitive-only count 3.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Batch 2 Default Palette Token Sweep - 2026-05-17

Status: completed for TS/TSX runtime palette usage.

What changed:

- Replaced runtime `text-*`, `bg-*`, `border-*`, `ring-*`, `divide-*`, and `placeholder-*` default Tailwind palette utilities with explicit `--ds-*` token utilities.
- Covered neutral, stone, gray, white, black, success, danger, warning, info, rose, emerald, amber, yellow, red, green, and blue palette usage.
- Left only CSS compatibility selectors containing palette-name text; measured TS/TSX runtime palette references are now zero.

Measured result:

- Default palette refs: 1358 -> 0.
- UI default palette refs remain 0.
- Native styled buttons remain primitive-only at 3.
- Legacy button class refs remain 0.

Reverification:

- `npm run audit:design-system:metrics`: passed and reported default palette refs 0.
- `npm run lint`: passed.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Batch 3 Inline Style Classification Sweep - 2026-05-17

Status: completed for static presentation inline styles.

What changed:

- Removed redundant inline layout/color styles from Reels player controls and overlays.
- Moved Product Delivery Planner spacing/grid styles to Tailwind/token classes.
- Moved Quick View layout styles to class-based rules.
- Moved homepage newsletter background, width, alignment, and inverse text color to token classes.
- Moved hero viewport sizing, snap alignment, content object position, mega-menu grid columns, and mega feature pattern background to classes.
- Simplified cart drawer progress styling so only the runtime progress width remains inline.

Measured result:

- Inline style blocks: 52 -> 10.
- Default palette refs remain 0.
- UI default palette refs remain 0.
- Native styled buttons remain primitive-only at 3.
- Legacy button class refs remain 0.

Remaining classified inline styles:

- Runtime stagger delays in `Header` and `CartDrawer`.
- Runtime progress widths in account order tracking and cart free-shipping progress.
- Dynamic swatch/category colors from product/category data.
- Third-party PayPal SDK button style configuration.
- Dynamic marquee speed.

Reverification:

- `npm run audit:design-system:metrics`: passed and reported inline style blocks 10.
- `npm run lint`: passed.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.

## Final Reaudit - 2026-05-17

Status: passed after Batch 1, Batch 2, and Batch 3.

Final measured state:

- Raw `<button>` outside shared primitive files: 0.
- Native styled buttons: 3, all centralized in `components/ui/Button.tsx`.
- Shared `Button` primitive usages: 90.
- Legacy button class refs: 0.
- Runtime default palette refs in TS/TSX: 0.
- UI default palette refs: 0.
- Inline style blocks: 10, all classified as runtime/data/third-party cases.
- Dynamic class compositions: 157, retained for stateful variants, component primitives, and data-driven views.

Remaining allowed exceptions:

- `sienna` and `coral` names exist only as compatibility aliases in token/global files and docs; TERRACOTTA remains the canonical accent.
- CSS compatibility selectors may contain old palette-name text where they target legacy classes, but runtime TS/TSX palette usage is zero.
- Inline style exceptions are limited to animation delays, progress widths, product/category dynamic colors, PayPal SDK style configuration, and marquee speed.

Final verification:

- Raw native button inventory: passed with total 0 outside approved primitive files.
- Runtime default palette scan: passed with no matches in app/components/context/lib.
- `npm run audit:design-system:metrics`: passed with default palette refs 0 and UI default palette refs 0.
- `npm run verify:design-system -- --pool=threads`: passed; audit, lint, and 3 unit tests passed.
- `npm run build`: passed; 57/57 routes generated.
