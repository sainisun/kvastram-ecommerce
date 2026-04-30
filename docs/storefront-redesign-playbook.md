# Kvastram Storefront Redesign Playbook

Date: 2026-04-30

Primary visual reference:

- `E:/WindowsFolders/Downloads/kvastram-storefront_2.html`
- Inspiration audit: Mulmul, Suta, Saundh homepages

Working prototype:

- `docs/storefront-redesign-prototype.html`

## 2026-04-30 Full Prototype Parity Audit

User target: production storefront should visually match the final prototype as closely as possible, while using existing real catalog/content data first. If exact prototype behavior needs API, admin, or database changes, implement those rather than leaving old storefront design in place.

### Current Gap Summary

The current production storefront is not yet 100% prototype-matched. A few prototype-inspired pieces were added, but many pages still use the older black/white "premium luxury" design system and centered editorial layouts.

Major mismatches found:

- Global design tokens still come from the old system in `storefront/src/app/globals.css`: Amiri/Cardo, white/black palette, `product-grid-prem`, `prod-card-prem`, `nav-logo-premium`, and old button/card utilities.
- Prototype uses Playfair Display + Lato, cream background, sienna/sage accents, 4/8/12px radii, compact mobile-first sections, and card/panel UI.
- Header still uses old premium desktop/nav styling in `storefront/src/components/layout/Header.tsx`; prototype header is compact, sticky, sienna announcement bar, mobile-first drawer, centered logo, and simple icon actions.
- Homepage order is close, but visual treatment is not exact: section heads, spacing, buttons, cards, collections, reels, product cards, and extra rails still differ from the prototype.
- `/products` still uses old `PageHero`, large editorial copy, and old product grid styling. Prototype expects breadcrumb/title bar, compact hero band, category chips, mobile filter sheet, sticky desktop filters, and prototype product cards.
- `ProductGrid` still uses old `prod-card-prem` classes and "Quick Add" behavior. Prototype product card needs rounded card, badge, wishlist bubble, image block, visible plus mini-cart, and hover/focus Quick View.
- `/collections`, `/collections/[handle]`, `/reels`, `/sale`, `/track`, product detail, checkout, account/cart/wishlist/search overlays are only partially aligned or still old-style.
- Prototype dummy arrays exist only inside the prototype file; production should not copy those arrays as commerce truth. Production placeholders are allowed where the user requested placeholders for missing data, but they must be visibly placeholder UI and not fake product inventory.

### Prototype Source Of Truth

The prototype defines the target shell and components:

- Announcement bar, sticky header, mobile drawer, search overlay, cart/wishlist side panels.
- Homepage: circle categories above clean visual-only hero, new arrivals, collections, reels, bestsellers, brand story, seasonal edits, pieces we love, fabric rail, shop-the-look, occasion finder, testimonials/UGC, newsletter.
- Product card: rounded card, image/placeholder art, badge, wishlist button, quick-view button, product category, title, price/compare price, mini cart button.
- Catalog: breadcrumb/title, horizontal chips, real filter sheet, sort, count, grid/compact toggle, pagination.
- Product detail: gallery, title/price/reviews, real variants/options, size guide, share, accordions/tabs, reviews, related products, sticky mobile buy bar.
- Reels: grid, chips, viewer/modal, view tracking, linked product CTA.
- Checkout/order tracking/account/cart/wishlist/search: keep existing logic, restyle to prototype shell.

### Existing Real Data Support

Already supported and should be reused:

- Products/catalog: `api.getProducts()` -> backend `/products`; supports `status`, `search`, `sort`, `category_id`, `tag_id`, `collection_id`, plus search-time min/max price.
- Categories/tags/collections: `api.getCategories()`, `api.getTags()`, `api.getCollections()`.
- Homepage hero: `api.getHeroBanners()` backed by `hero_banners`.
- Circle categories: `api.getCategoryCircles()` backed by `category_circles`.
- Homepage curation: `api.getSpotlightProducts(section)` backed by `featured_products`.
- Reels: `api.getTrendingReels()` backed by `trending_reels`, with view tracking via `recordTrendingReelView`.
- Testimonials: `api.getTestimonials()` backed by `testimonials`.
- Trust items exist in backend/admin via `trust_items`.
- Newsletter, reviews, cart, wishlist, checkout, account, order tracking, WhatsApp settings, and footer/store settings already have existing routes or contexts.

### Backend/Admin Gaps Blocking Exact Prototype Behavior

These should be fixed before or during UI parity work:

- `featured_products.section_key` is restricted to `spotlight`, `new_arrivals`, and `bestsellers`. Prototype needs curated sections for `seasonal_edits`, `pieces_we_love`, `shop_the_look`, `fabric_edits`, `occasion_edits`, and potentially `sale_edit`.
- Reels have no category/tag field. Current chips can only infer from product name/link text. Add reel category/label fields so "Styling", "Occasion", "New Drops", "Craft", "Gifting" are admin-managed.
- Hero banners have desktop image only. For mobile-first parity, add optional `mobile_image_url` so hero crops match mobile screens.
- Category circles require `image_url`; if admin has categories with images but no circle records, production currently falls back. Add easier admin seeding/sync or allow category-derived circles.
- Collection cards do not expose product counts directly. Current pages make per-collection product calls. Add optional collection count endpoint or include counts in `/collections`.
- Fabric/occasion rails need a real source. Either use tags/collections heuristically or create generic merchandising slots with type/link/image/title/copy/sort.
- Product quick view can use loaded product summaries, but exact size buttons require real variants/options. No fake sizes.
- Size guide is global/static today; exact prototype should be backed by category/product settings if accurate sizing is required.
- Coupon UI in checkout should only be shown when discount/promo API exists and works.

## 100% Prototype Parity Implementation Plan

### Phase 1 - Lock The Design System

Replace the old storefront visual foundation with prototype tokens:

- Fonts: switch storefront layout from Amiri/Cardo to Playfair Display + Lato.
- Tokens: add `--sienna`, `--sienna-dark`, `--sage`, `--cream`, `--paper`, `--ink`, `--muted`, `--line`, `--soft`, `--danger`, `--success`, `--shadow`, and prototype radii.
- Body: `background: var(--cream)`, `font-family: Lato`, headings via `.serif` or heading utility using Playfair Display.
- Add shared classes/utilities matching prototype: `.kv-container`, `.kv-section`, `.kv-section-head`, `.kv-tag`, `.kv-title`, `.kv-btn`, `.kv-chip`, `.kv-card`, `.kv-panel`, `.kv-product-card`, `.kv-reel-card`, `.kv-collection-card`.
- Keep Tailwind available, but stop using old `*-prem` classes in redesigned storefront pages.

Deliverable: one visual language across homepage, catalog, cards, panels, and utility pages.

### Phase 2 - Header, Drawer, Search, Cart, Wishlist Shell

Rebuild `Header`, `MobileMenu`, `SearchOverlay`, `CartDrawer`, and wishlist access to prototype shell while keeping existing contexts:

- Sienna announcement bar from `getHomepageSettings()`.
- Sticky white header with mobile hamburger, centered Kvastram logo, search/wishlist/cart icons.
- Desktop nav uses admin `nav_links`, but visually matches prototype.
- Mobile drawer links match prototype and use real routes.
- Cart drawer uses `useCart`; wishlist drawer/page uses existing wishlist data.
- Search overlay uses existing product search behavior.

Deliverable: first viewport chrome should match prototype before page content is considered.

### Phase 3 - Backend/Admin Data Model Extensions

Add exact support for prototype merchandising without dummy commerce:

- Migration: widen `featured_products.section_key` or add `homepage_merchandising_slots`.
- Recommended: create `homepage_merchandising_slots`:
  - `id`, `slot_key`, `title`, `eyebrow`, `copy`, `image_url`, `mobile_image_url`, `link_url`, `linked_product_id`, `linked_collection_id`, `linked_category_id`, `linked_tag_id`, `is_active`, `sort_order`, timestamps.
- Admin page: generic merchandising manager for `seasonal_edits`, `fabric_edits`, `occasion_edits`, `shop_the_look`, `pieces_we_love`.
- API: public endpoint `GET /homepage/merchandising?slot=...`.
- Reels migration: add `category`, `caption`, optional `product_id` to `trending_reels`; admin form should select product and auto-fill title/price/link.
- Hero migration: add `mobile_image_url` to `hero_banners`; admin upload support.
- Collections endpoint: include product count or expose counts in one batched endpoint.

Deliverable: all prototype home sections can be backed by real admin data, with placeholders only when not configured.

### Phase 4 - Homepage 1:1 Parity

Rebuild homepage sections in prototype order and style:

1. `CircularCategories`: same circle row styling, above hero, using `category_circles`; placeholder circles only if no records.
2. `HeroSection`: clean image-only slider, mobile image support, dots only, no overlay text/buttons.
3. `NewArrivals`: prototype section head, 2-up mobile product cards, view-all outline button.
4. `CollectionsSection`: prototype "Shop the occasion" cards; real collections and counts where available, placeholders if missing.
5. `WatchBuyPreview`: prototype reel cards, two-column mobile, viewer link.
6. `BestSellers`: same prototype card grid from curated `bestsellers`, fallback to real product source.
7. `BrandStory`: sienna/cream story block from homepage settings/trust items.
8. `Seasonal edits`: real merchandising slots first, placeholders second.
9. `Pieces we love`: real curated tabs using `new_arrivals`, `bestsellers`, sale products.
10. `Shop by fabric`: real tags/merch slots; placeholders if not configured.
11. `Shop the look`: real `shop_the_look` slot/products.
12. `Occasion finder`: real collections/tags/slots; placeholders if not configured.
13. `Testimonials`: real testimonials with prototype card styling.
14. `Newsletter`: existing newsletter API, prototype sienna section.

Deliverable: homepage visually matches prototype structure, spacing, typography, cards, colors, mobile sliders.

### Phase 5 - Product Card And Quick View

Replace `ProductGrid` card rendering with exact prototype card:

- Rounded white card with border/shadow.
- Media block with real thumbnail/hover image or placeholder art.
- Badge: New/Sale/Low stock from real product/variant data.
- Wishlist bubble using `WishlistButton`.
- Quick View button using existing `QuickViewModal`.
- Category/collection eyebrow from real collection/category.
- Price/compare-at price from real variant prices.
- Mini cart `+` button wired to `useCart`.
- Compact mode matches prototype horizontal card.

Deliverable: all product grids across home, products, collections, bestsellers, sale, related products share the same prototype card.

### Phase 6 - Catalog `/products`

Restyle `CatalogClient` to prototype:

- Breadcrumb/title bar: "Home > Shop All", "Complete artisan catalog".
- Category chips horizontally scroll on mobile.
- Filter button opens full-screen/side sheet on mobile.
- Desktop sticky filter sidebar.
- Real filters only: category, tag, collection, sort. No fake counts.
- Count: "Showing X products".
- Sort dropdown prototype style.
- Grid/compact toggle visible and stable.
- Pagination prototype buttons.

Backend changes only if exposing price/range/sale filters as real filters.

Deliverable: `/products` no longer looks like old premium UI.

### Phase 7 - Collections, Bestsellers, Sale

Collections:

- `/collections`: prototype page hero/breadcrumb/chips/cards, real collection data/counts.
- `/collections/[handle]`: prototype compact hero, collection chips/subcategories, real product grid.

Bestsellers:

- Use `featured_products.section_key='bestsellers'`; fallback to real products only.
- Prototype page hero and product grid.

Sale:

- Use real compare-at discount products only.
- Prototype sale hero/countdown visual can be shown only as campaign UI; products must remain real.
- Add backend `sale=true` or discount filter later if needed.

Deliverable: no old large editorial collection/sale page remains.

### Phase 8 - Reels

Rebuild `/reels` and `/trending-now` with prototype behavior:

- Page title/header matching prototype.
- Chips backed by new `trending_reels.category`.
- Grid cards: 2-up mobile, 3/4-up desktop.
- Modal/viewer styled like prototype.
- Preserve `recordTrendingReelView`.
- Product CTA uses real `product_id` or safe `link_url`.

Deliverable: reels page is no longer old social-grid style; it matches Watch & Buy prototype.

### Phase 9 - Product Detail

Restyle `ProductView` without breaking logic:

- Prototype two-column desktop/single mobile layout.
- Gallery from real product media.
- Title, category, rating, reviews, price, compare-at price.
- Real variants/options only; no fake size buttons.
- Size guide only where accurate source exists.
- Add-to-cart, wishlist, share, back-in-stock, inquiry/chat remain wired.
- Accordions/tabs match prototype.
- Sticky mobile buy bar matches prototype and uses selected variant.
- Reviews section keeps existing review API.

Deliverable: product page looks like prototype while preserving all advanced real logic.

### Phase 10 - Utility/Commerce Pages

Restyle only, keep logic:

- Checkout: prototype progress/order summary shell; retain Stripe/Razorpay/PayPal/order APIs.
- Cart page/drawer: prototype side-panel/card UI, existing cart context.
- Wishlist: prototype panel/page grid, existing wishlist source.
- Search: prototype overlay and results, existing search API.
- Account/auth/orders: prototype soft cards and compact grid, existing auth/order APIs.
- Track order: prototype form/timeline, existing order tracking API only.
- Contact/About/Footer/Newsletter/Cookie/WhatsApp: use existing settings/routes.

Deliverable: no obvious old visual islands remain in primary storefront routes.

### Phase 11 - Verification And Deployment

Required checks after implementation:

- Code search: no redesigned route should depend on `product-grid-prem`, `prod-card-prem`, `nav-logo-premium`, old white/black-only tokens, or prototype dummy arrays.
- `cd storefront && npm run lint`
- `cd storefront && npm run build`
- Mobile visual check around 390px:
  - `/`, `/products`, `/collections`, one `/collections/[handle]`, `/reels`, `/bestsellers`, `/sale`, product detail, cart/wishlist/search/checkout/track/account.
- Desktop visual check:
  - same pages, ensuring filter sidebar, hero, cards, and layouts match prototype.
- Data check:
  - empty hero/category/reel/collection/featured/testimonial states show placeholders or real empty states without fake purchasable products.
- Deploy:
  - Commit scoped changes.
  - Push `main`.
  - Confirm `Deploy to Hostinger VPS` GitHub Action is green.

### Implementation Order Recommendation

Do this in order, because later pages depend on earlier shared pieces:

1. Design tokens and shared prototype UI primitives.
2. Header/drawer/search/cart/wishlist shell.
3. Product card + quick view exact parity.
4. Homepage sections exact parity.
5. Backend/admin merchandising/reel/hero extensions.
6. Products/catalog exact parity.
7. Collections/bestsellers/sale exact parity.
8. Reels exact parity.
9. Product detail exact parity.
10. Checkout/account/track/search/footer polish.
11. Final audit, build, push, VPS deploy verification.

## Direction

The storefront redesign should be inspired by the richer `kvastram-storefront_2.html` reference, not by a stripped-down design summary.

Keep the same core mood:

- warm sienna and sage craft palette
- Playfair Display headings with clean Lato/body UI
- announcement bar, sticky header, mobile drawer, search overlay
- cart and wishlist side panels
- artisan storytelling plus strong commerce actions
- product cards with badges, wishlist, quick add, price, category
- full storefront coverage, not homepage-only

But production implementation must be mobile-first and real-data-backed.

## Homepage Inspiration Audit

Use these references as directional inspiration, not as layouts to copy.

| Brand | Useful observed pattern | Kvastram decision |
| --- | --- | --- |
| Mulmul | Category carousel, New This Season, As Seen On, Shop the Looks, customer-love/UGC blocks, quick view products | Keep circle categories; add mobile campaign sliders, shop-the-look, UGC/social proof, and product quick view. |
| Suta | Strong category menu, new launch product rails, size availability on cards, gifting, home/living and store/account utility links | Add craft/fabric discovery, launch tabs, gifting under price bands, size/variant cues where data exists. |
| Saundh | Announcement codes, Pieces We Love tabs, Wardrobe Essentials, wedding/occasion navigation, recently viewed, rich brand/story SEO | Add Pieces We Love tabs, occasion finder, wardrobe/fabric edits, recently viewed, and stronger story/support blocks. |

Recommended Kvastram homepage order:

1. Announcement bar and sticky mobile-first header
2. Existing circle categories, preserving Kvastram's current category-circle behavior
3. Clean visual hero slider with no text/buttons overlay
4. Existing New Arrivals
5. Existing Curated Collections
6. Existing Watch & Buy reels
7. Existing Bestsellers
8. Existing artisan story and trust
9. Extra section: seasonal/campaign slider
10. Extra section: optional Pieces We Love tabs
11. Extra section: shop by fabric/craft
12. Extra section: Shop the Look
13. Extra section: occasion finder
14. Extra section: customer love/UGC
15. Newsletter and footer

Important: inspiration sections should be additive. Do not replace or reorder already-approved Kvastram homepage sections unless the user explicitly approves a new IA/order.

Mobile behavior:

- Campaigns, fabric/craft edits, occasion finder, and UGC should be horizontal sliders.
- Circle categories should remain circular, horizontally scrollable, and thumb-friendly.
- The main hero should be a clean image/visual slider only. Keep text, CTAs, and offers outside the hero.
- Product rails should remain 2-up mobile unless cards need richer option controls.
- Do not overload mobile hero. Keep the next section visible quickly after the first viewport.

## Mobile-First Rules

- Write base CSS for mobile first, then use `min-width` breakpoints for tablet and desktop.
- Mobile grids default to:
  - products: 2 columns
  - reels: 2 columns
  - collections: 1 column
  - checkout/contact/product detail: single column
- Desktop enhancements:
  - products: 3 to 4 columns
  - reels: 3 to 4 columns
  - collections: 2 to 3 columns with one featured tile
  - shop filters become sticky sidebar
- Header must prioritize:
  - hamburger drawer
  - logo
  - search, wishlist, cart
- Desktop nav appears only from tablet/desktop breakpoint.
- Mobile filter sidebar should open as a full-screen sheet.
- Cart and wishlist side panels must fit full mobile width.
- Text must not rely on viewport-width font scaling.

## Production Non-Negotiables

- Use `storefront/src/lib/api.ts` for storefront data access.
- Use existing backend/admin-managed models first.
- Do not add mock product, collection, reel, cart, wishlist, account, or checkout data to production routes.
- Do not create duplicate commerce systems.
- Use existing `Product` types from `storefront/src/types`.
- Product grids should reuse existing product cards, `ProductGrid`, or a thin wrapper.
- Cart actions must use the existing `useCart` flow.
- Wishlist actions must use the existing wishlist flow.
- SEO metadata and canonical route handling should stay server-side where possible.
- Every page must have a good empty state.

## Page Coverage Target

The redesign is not just a homepage. The production storefront should account for:

| Prototype page/feature | Production route target | Notes |
| --- | --- | --- |
| Home | `/` | Reuse homepage settings, banners, categories, featured products, reels. |
| Shop all | `/products` | Canonical catalog route. Restyle existing catalog, do not fork it. |
| Product detail | existing product detail route | Preserve cart, wishlist, variants, reviews, metadata. |
| Collections hub | `/collections` | Collection grid plus real category/tag chips. |
| Collection detail | `/collections/[handle]` | Keep current resolver. |
| Bestsellers | `/bestsellers` or `/collections/bestsellers` | Thin route backed by curated tag/collection first. |
| Reels | `/reels` | Must be a full page, not only a homepage section. |
| Trending compatibility | `/trending-now` | Redirect or alias after `/reels` is stable. |
| Sale | existing sale/tag/collection route if available | Only show if backed by real discount/sale data. |
| About | `/about` if present/planned | Admin/settings-managed brand content where possible. |
| Contact | `/contact` if present/planned | Support form shell and business info. |
| Account | existing account/auth surface | Do not redesign auth logic without checking current implementation. |
| Cart drawer | existing cart context | Keep current cart source of truth. |
| Wishlist drawer | existing wishlist source | Keep current wishlist source of truth. |
| Checkout | existing checkout flow | Prototype visuals only; do not invent payment/order logic. |
| Order tracking | existing order tracking flow if present | Keep API-backed status. |

## Reference Feature Audit

These features exist in `kvastram-storefront_2.html` and should be considered during implementation. Do not blindly copy prototype logic; map each feature to real app state, API support, or hide it until support exists.

| Reference feature | Keep in redesign? | Production mapping |
| --- | --- | --- |
| Announcement bar | Yes | Admin/global settings. |
| Sticky header | Yes | Existing layout header. |
| Currency selector | Yes, if supported | Existing currency/localization support or hide until real. |
| Mobile nav drawer | Yes | Layout component. |
| Search overlay | Yes | Existing product search/query route. |
| Cart sidebar | Yes | Existing `useCart` state. |
| Wishlist sidebar | Yes | Existing wishlist state. |
| Product quick view modal | Yes | Product card action using real product summary data. |
| Shop grid/list toggle | Yes | Client-only visual preference is okay. Must not change product source. |
| Mobile filter full-screen sheet | Yes | Existing catalog filters. |
| Desktop sticky filter sidebar | Yes | Existing catalog filters. |
| Active filter chips | Yes | Real filters only. No fake counts. |
| Product detail gallery | Yes | Existing product media. |
| Size guide modal | Yes if data exists | Category/product size chart. Hide if unavailable. |
| Product variants | Yes if data exists | Existing variants/options. Do not invent sizes/colors. |
| Product tabs | Yes | Description/specs/shipping/returns/reviews from real fields/settings. |
| Reviews summary/form | Conditional | Existing review system or future real review source. |
| Share product | Yes | Native share/copy URL. |
| Related products | Yes | Existing related/category products. |
| Sticky mobile buy bar | Yes | Product detail page only, wired to cart. |
| Recently viewed bar | Optional | Client local state/localStorage. No backend needed. |
| Back-to-top button | Optional | Pure UI. |
| WhatsApp floating CTA | Conditional | Only if brand wants/supports WhatsApp. |
| Newsletter section | Yes | Existing email provider/admin setting. |
| Newsletter popup | Conditional | Needs consent/frequency handling. |
| Cookie banner | Yes if tracking cookies used | Must link real privacy/cookie policy. |
| Coupon input | Yes if backend supports coupons | Checkout discount API. Do not fake totals. |
| Checkout progress | Yes | Existing checkout flow states. |
| Order success page | Yes | Real order confirmation. |
| Order tracking timeline | Yes if API exists | Real order shipment/status API. |
| Account dashboard | Yes | Existing auth/account pages. |
| Plus-size page | Conditional | Only if real size/variant inventory supports it. |
| Compare bar | Optional/later | Not required for first redesign unless product comparison exists. |
| Skeleton loaders | Yes | Loading states for product grids and route transitions. |

## Existing Sources To Reuse

- `api.getProducts()`
- `api.getCollections()`
- `api.getCategories()`
- `api.getTags()`
- `api.getHomepageCategories()`
- `api.getCategoryCircles()`
- `api.getFeaturedProducts()`
- `api.getSpotlightProducts()`
- `api.getHeroBanners()`
- `api.getTrendingReels()`
- `api.recordTrendingReelView(id)`
- `api.getHomepageSettings()`

## Route-Specific Plan

### Home

Match the reference structure:

- announcement/header/search/cart/wishlist
- immersive sienna hero
- shop by category pills
- new arrivals grid
- curated collections
- watch and buy reels preview
- bestsellers preview
- artisan story/trust/newsletter/footer

Production rules:

- Hero content from homepage settings/banners.
- Category pills from real categories/tags/homepage categories.
- Product sections from real products/featured products.
- Reels preview from `trending_reels`.

### Shop

Target:

- breadcrumb/title area
- horizontal category chips
- mobile filter sheet
- desktop sticky filter sidebar
- sort dropdown
- product count
- grid/compact view toggle
- shared product grid
- pagination/load more
- quick view per product card

Important:

- Hide visual-only filters until backend supports them.
- Do not show fake counts.
- Confirm backend support before exposing price sorting.
- Quick view must use the same product summary object as product cards.

### Collections

Target:

- hero/title area
- real taxonomy chips
- featured collection tile
- collection grid

Important:

- Use admin-managed collection titles, images, handles.
- Keep `/collections/[handle]` resolver.

### Bestsellers

Target:

- dedicated route shell
- social proof stats
- curated product grid
- mobile-first filters/chips

Source priority:

1. Admin-managed bestseller tag
2. Admin-managed bestseller collection
3. Existing featured-products curation

Do not hardcode bestseller product lists in production.

### Reels

Target:

- canonical `/reels`
- mobile 2-up grid
- desktop 4-up grid
- chips only if backed by real taxonomy/status
- viewer/modal
- product link or buy action
- preserve view tracking

Important:

- Keep `trending_reels` as the source.
- Keep `/trending-now` working as alias/redirect.
- Do not create a duplicate reels model.

### Product Detail

Target:

- mobile single-column gallery/details
- desktop two-column gallery/details
- variants, quantity, cart, wishlist
- trust row
- tabs/accordions for description, specs, shipping, returns, reviews
- related products
- size guide modal when size data exists
- share/copy link action
- sticky mobile buy bar

Important:

- Use existing product detail route/data.
- Do not invent variant data. Hide controls if unavailable.
- Review UI requires a real reviews source or should remain read-only/hidden.

### Cart, Wishlist, Search

Target:

- mobile-safe side panels
- empty states
- quick return to shop
- cart subtotal
- wishlist product cards
- search overlay with product results
- recently viewed strip as optional client-only enhancement
- newsletter/cookie/floating support CTAs only if business rules allow

Important:

- Use existing contexts and APIs.
- Search should use existing search/product query behavior.

## Implementation Order

1. Baseline check: `git status --short`, storefront lint/build.
2. Shared mobile-first tokens and layout primitives.
3. Header, drawer, search, cart/wishlist panel polish.
4. Homepage sections.
5. Shop/catalog page.
6. Collections page.
7. Reels canonical page.
8. Bestsellers route.
9. Product detail, sale, about/contact/account/checkout polish only where routes already exist or are approved.
10. SEO, sitemap, redirects, empty states, smoke tests.

## Verification Gates

Run after storefront changes:

```bash
cd storefront
npm run lint
npm run build
```

Browser smoke targets:

- `/`
- `/products`
- `/collections`
- one `/collections/[handle]`
- `/reels`
- `/trending-now`
- bestsellers route
- product detail
- cart/wishlist/search interactions
- mobile viewport at 390px width

## Known Risks

- The visual reference uses prototype arrays and client-only interactions. Production must replace those with real APIs.
- Some filters in the reference are visual-only. They should not ship unless backed by backend query support.
- Reels in the current app have existing admin/data ownership. Keep that system.
- Bestsellers are not sales-ranked yet. Use admin curation first.
- Checkout/order/account pages may have business logic outside storefront UI. Treat redesign as visual-only until existing flows are confirmed.

## Definition Of Done

- The storefront feels like the richer reference design.
- The implementation is mobile-first, not desktop squeezed down.
- Reels and bestsellers are first-class pages.
- Commerce flows still use existing app state and APIs.
- Empty states are polished.
- Lint/build pass.
- Mobile and desktop smoke checks pass.
