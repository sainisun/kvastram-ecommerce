# Kvastram Storefront Endgame Ecommerce Audit

Audit date: 2026-05-16  
Scope: storefront homepage, products/PLP, collections, mobile chrome, header/nav, implementation signals, design system, motion, accessibility, trust, performance, and conversion psychology.  
Artifacts: `docs/storefront-audit-artifacts/` with desktop/mobile screenshots and `audit-crawl.json`.

## Executive Diagnosis

Kvastram has the start of a restrained premium system: warm parchment surfaces, terracotta accent, fine uppercase labels, generous desktop rails, and craft-led copy. But the live storefront does not currently feel like a finished luxury ecommerce experience because the first shopper journey is almost entirely empty.

The strongest brand damage is not a single color or font. It is the combination of:

- No hero visible on the homepage because `HeroSection` returns `null` when banners are missing.
- No products, no collections, no category circles, no reels, and no PDP reachable in the audited local storefront.
- Empty admin/debug instructions are exposed to shoppers.
- The homepage opens with absence rather than aspiration.
- Header and navigation look styled but not merchandised.
- Motion exists as utilities, but the live page has no meaningful choreography because most product/image modules are empty.
- Backend/API failures create visible empty states and console/server errors.

In short: the storefront has design-system ambition, but the live experience feels like a partially wired prototype.

## Evidence Snapshot

Screenshots captured:

- `docs/storefront-audit-artifacts/home-desktop.png`
- `docs/storefront-audit-artifacts/home-mobile.png`
- `docs/storefront-audit-artifacts/products-desktop.png`
- `docs/storefront-audit-artifacts/products-mobile.png`
- `docs/storefront-audit-artifacts/collections-desktop.png`

Live crawl findings:

- Homepage image count: `0`
- Products page image count: `0`
- Collections page image count: `0`
- Product detail URL discovered from PLP: `null`
- `/products` visible state: `0 Items`
- `/collections` visible state: `No collections found. Check back soon!`
- Console/log issues: CSRF token warning, hydration mismatch, multiple 500 resource failures, LogRocket load failure, exchange-rate network access fallback, backend proxy failures to `localhost:4000`.

Implementation evidence:

- `storefront/src/components/home/HeroSection.tsx:82` returns `null` when no valid hero slides exist.
- `storefront/src/components/home/CircularCategories.tsx:58` renders admin-facing empty copy on the storefront.
- `storefront/src/components/ProductGrid.tsx:162` renders a plain empty state when no products exist.
- `storefront/src/app/products/page.tsx:94` swallows catalog fetch failure into empty fallback.
- `storefront/src/lib/api-base-url.ts:5` and `storefront/next.config.ts:85` default the backend to `http://localhost:4000`.
- Design-system metrics report: 69 native styled buttons, 36 shared Button usages, 56 legacy button class refs, 1919 default palette refs, 55 inline style blocks.

---

# Issues

## 1. Homepage Has No Hero, So The First Impression Starts With Absence

* Severity: Critical
* Impact Area: Branding / CRO / UX / Trust
* Priority: P0
* Impact Level: Very High

### Current Problem

The audited homepage does not show a hero at all. The first meaningful desktop content is `Curated Collections`, followed by `NO COLLECTIONS LIVE`. On mobile, the page begins with an empty category placeholder, then `Curated Collections`, then another empty state.

The cause is direct: `HeroSection` filters out banners without valid Cloudinary URLs and returns `null` when no slides remain (`storefront/src/components/home/HeroSection.tsx:31-39`, `storefront/src/components/home/HeroSection.tsx:82-84`).

### Why This Hurts

Luxury ecommerce needs an immediate sensory proposition: silhouette, material, texture, styling, model, campaign mood, or product detail. Here, the first 3 seconds communicate operational absence. Shoppers subconsciously read this as "unfinished", "unstocked", or "not trustworthy enough to buy from."

Psychologically, premium perception is built through controlled scarcity, not accidental emptiness. A missing hero feels like abandonment, not curation.

### Recommended Fix

Always render a brand-safe fallback hero when admin banners are missing. The fallback should not look like a placeholder. It should be a real editorial campaign section with a craft/product image, a concise value line, and one primary CTA.

### Exact Implementation Direction

In `HeroSection`, replace the `return null` branch with a fallback hero:

- Use a curated static image from `public/` or a CMS fallback field.
- Use a full-bleed image crop with text overlay, not a split card layout.
- H1 or hero statement: `Handmade textiles from Jaipur` or a literal seasonal offer.
- CTA: `Shop New Arrivals`.
- Add a secondary text line only if it strengthens material/craft clarity.
- Keep height around `min(72svh, 680px)` desktop and `calc(100svh - header - bottomnav)` mobile.
- Add priority loading for the hero image.

### Premium Reference Behavior

Luxury fashion storefronts do not let homepage hero availability depend on live campaign data alone. If campaign slots fail, they fall back to evergreen brand art direction.

### Expected Result

The page opens with desire and brand memory instead of operational failure. This is the single highest-leverage brand fix.

---

## 2. Empty Admin Instructions Are Visible To Shoppers

* Severity: Critical
* Impact Area: Trust / Branding / UX
* Priority: P0
* Impact Level: Very High

### Current Problem

The live homepage shows copy such as:

- `Add active category circles in admin to show this discovery row.`
- `Add active collections with storefront handles to show this section.`
- `Publish active reels from the backend to show Watch & Buy previews here.`
- `No seasonal edits live`
- `No live products available`

These are internal CMS/debug instructions, not customer-facing ecommerce states.

Implementation examples:

- `storefront/src/components/home/CircularCategories.tsx:58-60`
- `storefront/src/components/home/CollectionsSection.tsx` from crawl output
- `storefront/src/components/home/PrototypeHomeExtras.tsx:241`, `:283`, `:305`

### Why This Hurts

This destroys trust immediately. A buyer does not need to know admin setup is incomplete. Seeing admin instructions creates the feeling of a test store, which reduces willingness to enter personal details, payment data, or even browse further.

Visual psychology: placeholders collapse the "luxury illusion." A premium storefront should feel intentionally curated even when inventory is thin.

### Recommended Fix

Never render CMS setup instructions on the public storefront. Hide empty sections by default or replace them with customer-safe editorial fallbacks.

### Exact Implementation Direction

Create a single storefront empty-state policy:

- Homepage merchandising sections: if empty, do not render the section.
- Product/collection pages: show shopper-safe empty copy with recovery actions.
- Admin-only setup hints should appear only in admin preview mode or behind `NEXT_PUBLIC_SHOW_STOREFRONT_DEBUG_EMPTY_STATES=true`.

Example customer-safe copy:

- `New pieces are being prepared. Explore the craft story while the next edit arrives.`
- CTA: `View Our Craft` or `Join Launch Alerts`

### Premium Reference Behavior

Premium brands hide operational seams. Empty availability is reframed as upcoming edits, private drops, waitlists, or atelier preparation.

### Expected Result

The site stops feeling broken and starts feeling intentionally restrained.

---

## 3. Product Catalog Is Empty And Has No Recovery Path

* Severity: Critical
* Impact Area: CRO / UX / Trust
* Priority: P0
* Impact Level: Very High

### Current Problem

The `/products` page shows `0 Items` and `No products found in this collection.` There is no fallback collection, no bestsellers, no waitlist, no search suggestion, no shop-by-category links, and no PDP could be reached during the crawl.

Implementation:

- `storefront/src/app/products/page.tsx:48-56` initializes all catalog data as empty.
- `storefront/src/app/products/page.tsx:94-95` catches failure and keeps resilient empty fallbacks.
- `storefront/src/components/ProductGrid.tsx:162-163` renders a minimal empty state.

### Why This Hurts

A PLP with no products is a dead end. It blocks the primary conversion path, prevents product trust building, and makes navigation feel decorative.

Psychologically, "0 Items" in a store implies the business is inactive. Even if the backend is temporarily down, the shopper reads the storefront as empty.

### Recommended Fix

Separate "true empty result from active filters" from "catalog unavailable." Each state needs a different recovery path.

### Exact Implementation Direction

Implement three catalog states:

1. Loading or backend unavailable:
   - Show skeleton grid for a short threshold.
   - If API fails, show curated fallback tiles from static config or cached ISR data.
   - Copy: `We are refreshing the edit. Try again shortly.`

2. Empty filtered result:
   - Show active filters, `Clear filters`, and recommended categories.

3. Empty store configuration:
   - Hide count controls.
   - Show waitlist/newsletter + brand story + contact CTA.

Also log API failure with enough context. Do not silently convert backend failures to "0 products."

### Premium Reference Behavior

High-end ecommerce never leaves a PLP blank. It moves the shopper into other curated paths: latest edit, gifting, craft story, private assistance, or appointment.

### Expected Result

The catalog becomes resilient and conversion-oriented instead of a blank aisle.

---

## 4. Backend Dependency Failure Is Masquerading As Design Failure

* Severity: Critical
* Impact Area: Implementation / Performance / Trust / CRO
* Priority: P0
* Impact Level: Very High

### Current Problem

The storefront defaults to `http://localhost:4000` for API access. During audit, the frontend logged backend proxy failures and returned empty commerce data.

Implementation:

- `storefront/src/lib/api-base-url.ts:1-6`
- `storefront/next.config.ts:79-90`

### Why This Hurts

Design cannot look premium if the data layer leaves every merchandising surface empty. Products, collections, hero images, category circles, search, filters, wishlist, and trust modules depend on data health.

This creates a false design diagnosis: "the site looks bad" when the deeper problem is that the UI is rendering fallback states everywhere.

### Recommended Fix

Make storefront data health visible to developers but invisible to shoppers.

### Exact Implementation Direction

- Add a storefront health banner only in development/admin preview, not public UI.
- Add route-level API health checks for required homepage content: hero, products, collections.
- Use cached fallback JSON for homepage and PLP if backend is down.
- Fail CI or deployment preview if required storefront content count is below threshold.
- Add a `minimum viable storefront content` guard: at least 1 hero, 4 products, 3 categories, 1 collection before public launch.

### Premium Reference Behavior

Premium ecommerce deployments treat content availability as launch-critical, like payments or checkout.

### Expected Result

The store stops shipping empty states as if they were valid design.

---

## 5. Header Looks Styled But Not Luxurious

* Severity: High
* Impact Area: Branding / UX / CRO
* Priority: P1
* Impact Level: High

### Current Problem

Desktop header uses a large pill frame with heavy shadow and three black circular social buttons on the promo bar. It feels more like a stylized prototype shell than a refined luxury navigation system.

Implementation:

- `storefront/src/components/header/HeaderMain.tsx:21`
- `storefront/src/components/header/PromoBar.tsx:74-111`

### Why This Hurts

Luxury navigation should feel quiet, precise, and utility-led. The current header takes too much visual attention relative to the empty page below it. The black circular buttons and pill-on-pill treatment compete with product merchandising.

Psychologically, oversized chrome suggests the site is trying to look designed rather than letting products carry the brand.

### Recommended Fix

Reduce header spectacle and increase navigation clarity.

### Exact Implementation Direction

- Desktop: use a thinner sticky header, lower shadow, flatter surface, and tighter vertical height.
- Promo bar: remove black social button cluster from the first visual impression; move social links to footer or menu.
- Keep one announcement line, not carousel controls unless there are real timed offers.
- Add visible text for account/cart only on desktop if it improves clarity.
- Make mega-menu discovery depend on real categories and images, not empty data.

### Premium Reference Behavior

Luxury headers usually disappear into the page: restrained logo, clear categories, quiet utility icons, subtle sticky behavior, and no decorative button clusters.

### Expected Result

The header becomes a premium service layer instead of the loudest design object.

---

## 6. Homepage Section Order Creates Negative Momentum

* Severity: High
* Impact Area: UX / CRO / Branding
* Priority: P1
* Impact Level: High

### Current Problem

The audited homepage order is:

1. Empty category circles
2. Empty curated collections
3. Empty Watch & Buy
4. Brand story
5. Empty limited editions
6. Empty curated for you
7. Empty craft/material
8. Empty dress for the moment
9. Testimonials
10. Newsletter

### Why This Hurts

The scroll journey repeatedly rewards the shopper with "nothing here." This trains the shopper to stop scrolling. Emotional momentum breaks before product desire starts.

Visual psychology: repetition of dashed empty boxes creates visual fatigue and operational anxiety.

### Recommended Fix

Rebuild homepage hierarchy around available content, not configured modules.

### Exact Implementation Direction

Render homepage sections conditionally:

- If hero exists: hero first.
- If products exist: new arrivals/bestsellers immediately after hero.
- If no products: brand story + waitlist + featured craft editorial.
- Only show Watch & Buy if reels exist.
- Only show collection/occasion/fabric rows if at least 3 cards exist.
- Never show more than one "coming soon" section on a single page.

### Premium Reference Behavior

Premium homepages are editorial sequences: campaign, edit, product desire, craft proof, social proof, service trust.

### Expected Result

Scrolling feels curated instead of repetitive.

---

## 7. Typography Is Restrained But Too Generic For A Craft-Luxury Brand

* Severity: Medium
* Impact Area: Branding / UI
* Priority: P2
* Impact Level: Medium

### Current Problem

The design system uses Montserrat for both display and body typography:

- `storefront/src/styles/tokens.css:9-11`

Headings in the screenshots are readable but not distinctive. Product/category absence makes this worse because type has to carry more brand emotion, and Montserrat alone feels common across template ecommerce.

### Why This Hurts

Luxury craft brands need a typography voice: editorial, textile, archival, or atelier-like. Using one clean geometric sans everywhere can feel too generic and digital for handmade textiles.

Visual psychology: a single utilitarian font system signals efficiency but not depth, craft, or memorability.

### Recommended Fix

Keep Montserrat or a similar sans for UI, but introduce a refined display face for brand storytelling and editorial headings.

### Exact Implementation Direction

- `--ds-font-body`: keep a highly legible sans.
- `--ds-font-display`: use a high-contrast serif or elegant humanist display face.
- Apply display face only to hero, campaign headings, brand story, PDP product title, and collection page H1.
- Keep nav, controls, prices, filters, and forms in the sans.
- Use larger line-height and lower weight for luxury editorial headings.

### Premium Reference Behavior

Luxury fashion uses contrast between functional UI typography and editorial display typography. The contrast creates hierarchy and memory.

### Expected Result

Kvastram gains a more ownable, handcrafted voice without sacrificing commerce clarity.

---

## 8. Color Palette Is Warm But Too One-Note In Practice

* Severity: Medium
* Impact Area: Branding / UI
* Priority: P2
* Impact Level: Medium

### Current Problem

Tokens define warm parchment, terracotta, muted text, and gold:

- `storefront/src/styles/tokens.css:39-78`

But the live page reads mostly as white, cream, black, terracotta, and empty dashed boxes. The absence of real product imagery makes the palette feel flat and template-like.

### Why This Hurts

Premium warmth comes from material contrast: textile color, skin tone, craft detail, off-white surfaces, ink, subdued metallics. Without images or secondary color moments, the palette becomes decorative rather than atmospheric.

### Recommended Fix

Use color as hierarchy, not just accent.

### Exact Implementation Direction

- Reserve terracotta for primary action and tiny editorial labels.
- Add textile-inspired neutral layers: indigo, madder, natural cotton, aged brass, deep charcoal.
- Use product imagery as the dominant color source.
- Reduce dashed empty borders in customer-facing surfaces.
- Avoid gradient placeholder cards unless they represent a real editorial campaign.

### Premium Reference Behavior

High-end brands let imagery create color richness and keep UI colors quiet.

### Expected Result

The storefront feels less like a design token sheet and more like a living brand world.

---

## 9. Motion System Exists But Does Not Create Premium Delight

* Severity: High
* Impact Area: Motion / UX / Branding
* Priority: P1
* Impact Level: High

### Current Problem

The codebase has animation utilities (`pageFadeIn`, `fadeInUp`, `hover-lift`, `image-zoom`) but the live audited page has almost no meaningful product/image motion because there is no hero/product content. Existing animation primitives are broad and generic.

Implementation:

- `storefront/src/styles/animations.css:139-183`
- `storefront/src/components/home/HeroSection.tsx:44-53`
- `storefront/src/components/products/ProductCard.tsx` uses hover opacity/scale for secondary image.

### Why This Hurts

Premium motion should clarify hierarchy and make browsing feel tactile. Generic fade-up and hover-lift motion feels common. If content is absent, motion cannot save the page.

Visual psychology: luxury motion is low-amplitude, smooth, and purposeful. It should feel like fabric, reveal, and touch, not like a web template.

### Recommended Fix

Create a motion choreography system tied to commerce moments.

### Exact Implementation Direction

- Page entry: reduce global `page-transition` to opacity only or very subtle y movement.
- Hero: image crossfade or slow editorial pan only when real images exist.
- Product card: image swap on hover, tiny CTA reveal, wishlist micro-bounce only after action.
- Drawer/search: use `transform + opacity`, 240-320ms, cubic-bezier similar to `0.22, 1, 0.36, 1`.
- PLP filter drawer: bottom sheet on mobile, side sheet desktop, with backdrop fade.
- Respect `prefers-reduced-motion` already defined at `animations.css:186-194`.

### Premium Reference Behavior

Luxury motion is felt more than seen: slow image reveals, quiet state transitions, magnetic but not jumpy CTAs, and no gratuitous bounce.

### Expected Result

Interactions feel intentional and tactile instead of static or generic.

---

## 10. Mobile Experience Is Functional But Cramped And Blocked By Empty States

* Severity: High
* Impact Area: Mobile UX / CRO / Branding
* Priority: P1
* Impact Level: High

### Current Problem

Mobile shows:

- Top promo bar.
- Header.
- Empty category placeholder.
- Empty curated collections.
- Empty Watch & Buy.
- Bottom nav fixed at the bottom.

The bottom nav overlaps the emotional bottom of the viewport, and the floating circular widget competes with the active nav area.

Implementation:

- `storefront/src/components/layout/BottomNav.tsx:52-99`
- `storefront/src/components/home/CircularCategories.tsx:30-63`

### Why This Hurts

Mobile shoppers rely on thumb-friendly, fast visual scanning. The current mobile first view gives them setup copy and competing fixed UI layers instead of a product/craft moment.

### Recommended Fix

Redesign mobile first viewport around one strong image moment and one clear browse path.

### Exact Implementation Direction

- Hide category placeholder if circles are absent.
- Show hero fallback or product edit at the top.
- Reduce promo bar height or make it dismissible without leaving visual noise.
- Bottom nav should not compete with chat/help widget; move floating help above the nav with consistent offset or hide until after first scroll.
- Ensure tap targets are at least 44px; mobile search/cart icons are currently visually around 20px but should have larger hit areas.

### Premium Reference Behavior

Premium mobile commerce feels app-like: quiet top chrome, image-led discovery, stable bottom nav, immediate product paths.

### Expected Result

Mobile becomes a browsing experience rather than a list of missing modules.

---

## 11. PLP Controls Appear Even When There Is Nothing To Control

* Severity: High
* Impact Area: UX / CRO
* Priority: P1
* Impact Level: Medium-High

### Current Problem

On `/products`, filter, grid density, sort selector, and item count appear even when there are zero products.

Implementation:

- `storefront/src/components/products/CatalogClient.tsx:237-311`

### Why This Hurts

Controls imply there is something to manipulate. When the page still says zero products, the interface feels broken. It adds cognitive load at the exact moment the shopper needs recovery guidance.

### Recommended Fix

Use a different layout for zero-product states.

### Exact Implementation Direction

- If `total === 0` and no filters are active, hide grid density and sort controls.
- Replace with a curated recovery panel: `Shop New Arrivals`, `View Collections`, `Contact on WhatsApp`.
- If filters are active, show `Clear all filters` as primary.
- Add a small diagnostic only in development, not production.

### Premium Reference Behavior

Luxury stores do not show empty operational controls. They guide the customer to another curated path.

### Expected Result

PLP stops feeling like an inactive inventory table.

---

## 12. Collections Page Uses A Generic Grey Hero With No Brand Story

* Severity: Medium
* Impact Area: Branding / UX
* Priority: P2
* Impact Level: Medium

### Current Problem

The `/collections` page shows a large grey hero with `CURATED SERIES` and `Collections`, then an empty message. No textile image, no editorial reason to browse, no collection taxonomy, no launch/waitlist path.

### Why This Hurts

Collections should be a premium curation gateway. A grey block feels like a placeholder and wastes prime visual space.

### Recommended Fix

Make collections either image-led or remove the hero when empty.

### Exact Implementation Direction

- Use a real editorial background image or textile detail.
- If no collections exist, replace hero with an "upcoming edits" editorial panel and newsletter/WhatsApp CTA.
- Add links to craft pages: Kantha, block printing, artisans.
- Do not use plain grey hero as a fallback.

### Premium Reference Behavior

Editorial ecommerce uses collection pages as mood boards: campaign imagery, materials, occasions, and product taxonomy.

### Expected Result

Collections feels curated even before collection data is fully populated.

---

## 13. Trust Signals Are Present In Footer/Config But Missing At Decision Points

* Severity: High
* Impact Area: Trust / CRO
* Priority: P1
* Impact Level: High

### Current Problem

Footer contains support details and policy links, but the homepage and PLP do not surface trust at moments of uncertainty. Because there are no products, trust becomes even more important, yet the page mostly shows empty states.

### Why This Hurts

First-time buyers need reassurance before they browse and before they buy: shipping, returns, handmade authenticity, payment security, support availability, and origin proof.

### Recommended Fix

Surface trust as contextual reassurance, not just footer links.

### Exact Implementation Direction

- Homepage after first product/edit: 3 trust tiles: handmade in Jaipur, easy returns, secure checkout.
- PLP empty/unavailable state: WhatsApp assistance + shipping/returns reassurance.
- PDP: keep trust badges near ATC, but validate visually after product data is restored.
- Footer: keep policy links but reduce density if it overwhelms.

### Premium Reference Behavior

Premium stores use trust quietly near action points: "Free returns", "Duties included", "Crafted in...", "Secure checkout".

### Expected Result

Customers feel guided and reassured, not left to infer legitimacy.

---

## 14. Design System Is Not Fully Enforced

* Severity: High
* Impact Area: Implementation / UI Consistency
* Priority: P1
* Impact Level: High

### Current Problem

The design-system audit passes, but metrics reveal fragmentation:

- 69 native styled buttons
- 36 shared Button usages
- 56 legacy button class refs
- 1919 default palette refs
- 55 inline style blocks
- 153 dynamic class compositions
- 0 Card usages
- 0 Badge usages

### Why This Hurts

Visual inconsistency is often created by implementation drift, not intentional design. Different button classes, palette shortcuts, shadows, and radii make the storefront feel patched together.

### Recommended Fix

Enforce a storefront UI contract.

### Exact Implementation Direction

- Create button variants: `primary`, `secondary`, `ghost`, `icon`, `link`.
- Replace native styled commerce buttons gradually in PLP, PDP, header, drawers, forms.
- Add token linting for raw `stone-*`, `shadow-*`, arbitrary gradients, and ad hoc radii.
- Create `EmptyState`, `SectionHeader`, `ProductRail`, `EditorialCard`, and `TrustRow` components.
- Use visual regression screenshots for homepage, PLP, PDP, mobile menu, cart drawer.

### Premium Reference Behavior

World-class storefronts feel consistent because every repeated UI decision comes from a small component system.

### Expected Result

The store stops feeling assembled from several eras of design work.

---

## 15. Accessibility Has Good Foundations But Hidden/Zero-Size Elements Need Cleanup

* Severity: Medium
* Impact Area: Accessibility / UX / Trust
* Priority: P2
* Impact Level: Medium

### Current Problem

The audit DOM found many header controls duplicated with `0x0` dimensions across responsive desktop/mobile versions. Focus styles exist globally, and reduced motion is supported, but inactive responsive elements may still need aria/focus handling validation.

Implementation:

- Responsive duplicate header elements appear in crawl data.
- Focus-visible is defined at `storefront/src/styles/animations.css:197-200`.
- Active outline removal is broad at `storefront/src/styles/animations.css:202-225`.

### Why This Hurts

If hidden controls remain focusable or exposed incorrectly, keyboard/screen-reader users experience ghost controls. Broad outline suppression can also reduce visible feedback in edge states.

### Recommended Fix

Audit responsive hidden elements and focus behavior.

### Exact Implementation Direction

- Confirm elements hidden by CSS use `display:none` at the breakpoint or `aria-hidden` plus `tabIndex={-1}` where needed.
- Do not suppress focus/active outlines globally beyond necessary cases.
- Add keyboard tests for header nav, mega menu, search overlay, cart drawer, filter drawer, and bottom nav.
- Ensure empty states use semantic headings and recovery CTAs.

### Premium Reference Behavior

Accessible luxury feels effortless: every interaction is reachable, visible, and calm.

### Expected Result

The storefront feels more trustworthy and less brittle across input modes.

---

## 16. Performance Is Being Taxed By Third-Party And Client-Side Modules Before Product Value Appears

* Severity: Medium-High
* Impact Area: Performance / UX / CRO
* Priority: P1
* Impact Level: Medium-High

### Current Problem

Audit resources showed LogRocket, Sentry, motion, Lucide chunks, and exchange-rate fetches loading while the page still has no product imagery. The homepage desktop crawl waited around 18.5s due to networkidle waiting on failing/slow resources.

Observed resource issues:

- LogRocket script could not load.
- Exchange-rate route fell back after network access error.
- Multiple API calls failed against backend proxy.

### Why This Hurts

Performance psychology is relative to perceived value. Users tolerate a rich campaign page loading assets; they do not tolerate delays that produce empty boxes.

### Recommended Fix

Defer non-critical observability and currency work until after first meaningful content.

### Exact Implementation Direction

- Load LogRocket only in production and only after consent/session criteria.
- Keep Sentry minimal in initial bundle.
- Cache/fallback exchange rates without blocking initial UI.
- Use server-side cached homepage payload to reduce multiple client fetch failures.
- Add Core Web Vitals measurement for LCP, CLS, INP on real data.
- Reserve image dimensions for all hero/product media to prevent CLS once content is restored.

### Premium Reference Behavior

Premium commerce feels immediate: first image and primary action arrive before analytics or secondary personalization.

### Expected Result

The store feels faster and more reliable, especially on mobile.

---

## 17. PDP Cannot Be Fully Audited Because No Product Is Reachable

* Severity: Critical
* Impact Area: CRO / Trust / Implementation
* Priority: P0
* Impact Level: Very High

### Current Problem

The crawl found no `/products/[handle]` links from the PLP. A full visual PDP audit was blocked by missing products.

Code-level observations:

- PDP has strong ingredients: gallery, reviews, back-in-stock, size guide, trust badges, WhatsApp CTA, sticky ATC, recently viewed (`storefront/src/components/product/ProductView.tsx:28-44`, `:76-179`).
- PDP gallery supports image/video, lightbox, autoplay video, and mobile scroll (`storefront/src/components/product/ProductGallery.tsx:62-190`).
- Product page renders related products and recently viewed (`storefront/src/app/products/[handle]/page.tsx:77-107`).

### Why This Hurts

PDP is the conversion engine. If no product is reachable, all PDP design work is invisible, and the shopper cannot complete the core ecommerce journey.

### Recommended Fix

Restore product data first, then run PDP visual QA.

### Exact Implementation Direction

After products exist, audit:

- First image crop and zoom.
- Title/price/variant hierarchy.
- ATC and Buy Now prominence.
- Sticky ATC behavior.
- Size guide friction.
- Shipping/return trust placement.
- Review visibility.
- Related product quality.
- Mobile gallery thumb ergonomics.

### Premium Reference Behavior

Luxury PDPs create desire through image scale, material detail, restraint, and certainty around buying.

### Expected Result

The team can separate PDP implementation quality from current data availability failure.

---

## 18. SEO Structure Exists But UX Content Is Too Thin

* Severity: Medium
* Impact Area: SEO / UX / Branding
* Priority: P2
* Impact Level: Medium

### Current Problem

Metadata and structured product schema exist, but live content is thin. Homepage lacks H1 in the captured state; product and collection listing pages contain minimal crawlable merchandising content.

### Why This Hurts

SEO and UX need meaningful content: collection introductions, product taxonomy, material explanations, internal links, craft stories. Empty ecommerce pages can be indexed as low-value or inactive.

### Recommended Fix

Pair SEO structure with editorial commerce content.

### Exact Implementation Direction

- Ensure homepage has one meaningful H1, preferably in hero fallback.
- Add crawlable collection/category copy.
- Link craft pages into homepage and collection empty states.
- Do not index empty PLP/collection states unless intended.
- Use structured data only when product data is present and valid.

### Premium Reference Behavior

Editorial ecommerce uses SEO content as brand storytelling, not keyword blocks.

### Expected Result

Search visibility and shopper confidence improve together.

---

# Top 10 Highest Impact Fixes

1. Restore or fallback the homepage hero so the first viewport is image-led.
2. Remove all public admin/setup placeholder copy.
3. Fix backend/API data availability so products, collections, banners, and categories render.
4. Add catalog unavailable vs empty filtered result vs no inventory states.
5. Hide empty homepage modules instead of stacking empty boxes.
6. Rework desktop header to be quieter and less prototype-like.
7. Build a real mobile first viewport with hero/product discovery.
8. Consolidate buttons, empty states, cards, and section headers into shared components.
9. Defer non-critical third-party scripts and exchange-rate fetches.
10. Reaudit PDP visually after at least one product is reachable.

# Luxury Transformation Roadmap

## Phase 1: Make The Store Look Alive

- Connect backend or seed storefront content.
- Require at least 1 hero, 4 products, 3 categories, and 1 collection.
- Hide empty sections.
- Add fallback hero and fallback editorial content.
- Replace admin copy with customer-safe states.

## Phase 2: Make The Store Feel Premium

- Introduce editorial display typography.
- Reduce header visual weight.
- Replace grey/gradient placeholders with image-led campaign treatments.
- Establish product-card and section rhythm.
- Add trust rows near decision points.

## Phase 3: Make The Store Convert

- Rebuild PLP empty/filter/recovery states.
- Improve product card quick-add and quick-view hierarchy.
- Validate PDP image/variant/ATC experience.
- Add social proof, return/shipping clarity, and WhatsApp assistance where buying hesitation occurs.

## Phase 4: Make The Store Feel World-Class

- Build motion choreography for hero, product cards, drawers, search, and cart.
- Add visual regression testing across desktop/mobile.
- Add Core Web Vitals monitoring.
- Enforce token/component usage through lint and metrics thresholds.

# Quick Wins Vs Major Redesigns

## Quick Wins

- Hide empty homepage sections.
- Replace admin copy.
- Hide PLP sort/grid controls when total is zero.
- Add customer-safe catalog recovery CTAs.
- Disable LogRocket in local/dev and load it later in production.
- Make the promo bar simpler.
- Add fallback hero.

## Major Redesigns

- Header/navigation visual system.
- Homepage storytelling order.
- Motion system.
- Product card and PLP merchandising.
- PDP conversion hierarchy after data restore.
- Full component-system consolidation.

# Conversion-Impacting Problems

- No product path exists in audited PLP.
- No hero or product imagery.
- Empty states block browsing.
- Trust signals are too late and too footer-heavy.
- PLP controls remain visible without products.
- PDP cannot be reached.
- API failures silently become empty commerce states.

# Brand-Damaging Problems

- Admin instructions exposed publicly.
- Hero disappears entirely.
- Empty content repeats throughout homepage.
- Header looks more decorative than refined.
- Montserrat-only typography feels generic for craft luxury.
- Grey/gradient placeholders replace textile imagery.

# Mobile-Critical Issues

- First viewport starts with empty content.
- Bottom nav competes with floating widget.
- Category placeholder wastes valuable mobile space.
- No product discovery path above fold.
- Tap targets need focus/size verification.
- Mobile PLP shows controls before recovery guidance.

# Performance-Critical Issues

- Backend proxy failures create slow/empty UX.
- Exchange-rate fetch attempts external network and falls back.
- LogRocket loads early and fails in audited environment.
- Sentry/motion/client chunks load before meaningful commerce content appears.
- No product/hero images means performance cannot be judged against real LCP yet.

# Why This Store Still Feels Generic

The store feels generic because the live experience is defined by system scaffolding instead of brand content. Warm tokens, pill headers, uppercase labels, and subtle shadows are not enough. Luxury is created through product imagery, editorial hierarchy, precise content, confident whitespace, trust, and controlled motion. Right now the page mostly shows empty modules and operational copy, so the design system reads as a template skin.

# What Would Make This Feel World-Class

Kvastram would feel world-class if the first viewport showed a strong textile/product campaign, the homepage behaved like an editorial buying journey, the PLP felt like a curated rack rather than a database table, the PDP told material and craft stories while keeping ATC frictionless, and every empty/unavailable state was reframed as curation, waitlist, or assistance.

# Priority Implementation Order

1. Fix data health and content minimums.
2. Remove public admin placeholders.
3. Add hero fallback.
4. Hide empty homepage modules.
5. Redesign catalog empty/recovery states.
6. Simplify header/promo bar.
7. Add mobile-first hero/product discovery.
8. Consolidate UI components and token enforcement.
9. Rebuild premium motion patterns.
10. Reaudit PDP, checkout confidence, and full funnel once products are live.

# Final Verdict

Kvastram does not currently look weak because the concept is weak. It looks weak because the live storefront is letting missing data and prototype fallback states become the customer experience. The brand direction can become premium, but the next work should not start with more decoration. It should start with content availability, shopper-safe fallbacks, cleaner hierarchy, and a stricter design system.
