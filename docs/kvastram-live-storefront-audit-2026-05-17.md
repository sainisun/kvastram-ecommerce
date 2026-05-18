# Kvastram Live Storefront Audit

Date: 2026-05-17  
Audited URL: https://kvastram.com/  
Live VPS: `ssh root@2.24.193.227`  
Live source of truth: `/root/kvastram-ecommerce`  
Non-live / cleanup candidate: `/root/kvastram-platform`

## Executive Verdict

- Design quality: 4/10
- Conversion readiness: 4/10
- Functionality: 6/10
- Design system consistency: 5/10

The storefront is functional, but it does not yet feel like a premium handcrafted fashion commerce experience. The main problems are weak first-viewport hierarchy, inconsistent commerce data, public placeholder content, fragmented styling, unclear CTAs, and a few conversion-critical functional bugs.

## Report 1: Visual Design Issues

- The hero is visually large but does not provide a clear purchase action such as "Shop New Arrivals" or "Explore Kantha Jackets".
- The first viewport has category circles and a large image, but it does not quickly explain why Kvastram is worth trusting.
- The current palette uses cream, black, and terracotta, but the live execution feels flat because many surfaces are pale and text is thin.
- Typography overuses uppercase, wide tracking, and small labels. This hurts readability on product cards and checkout.
- Product names are too SEO-heavy for browsing. Long titles reduce scan speed and make the grid feel noisy.
- Product cards have weak hierarchy between image, category, title, price, and quick-add.
- Some visible public content looks like admin/prototype data: `Ghj`, duplicate `Bags`, `B Collection`, and `No seasonal edits live`.
- The homepage has too many sections without a disciplined shopping story. It feels assembled rather than curated.

## Report 2: Conversion Issues

- The first viewport does not guide the user into a buying path.
- Social proof is weak or absent. Reviews often show empty states instead of confidence-building evidence.
- Product/category mismatch appears publicly, for example a product titled `Jackets` showing category `Bags`.
- Pricing and currency are inconsistent between listing, cart, and checkout.
- Free-shipping messaging is inconsistent with displayed currency and totals.
- Cart and checkout CTAs need stronger visual contrast and clearer text.
- Checkout is usable, but mobile hierarchy is not ideal. The order summary can visually dominate the form.

## Report 3: Buttons, Links, and Functionality

Working:

- Header search opens.
- Cart drawer opens.
- Add to cart works.
- Checkout route opens.
- Main routes such as `/products`, `/collections`, `/reels`, `/wishlist`, `/account`, `/cart`, and `/checkout` return `200`.

Issues:

- Search overlay says "Press Enter to search", but Enter did not navigate during the audit. The user has to use "View All Results".
- Cart item links can be broken because grid/cart items sometimes store product IDs instead of product handles.
- Live logs showed backend `NotFoundError: Product not found` for ID-based product URLs.
- Some category and collection links redirect because visible links are not canonical.
- Search trending links are hardcoded and can point to non-live collection slugs.

## Report 4: Live Codebase Issues

- Live Docker compose points to `/root/kvastram-ecommerce/deploy/hostinger/docker-compose.yml`.
- `/root/kvastram-platform` exists on the VPS but is not the live storefront source.
- The compose fallback still references old `https://api.vintaaj.com`, which is unsafe brand drift.
- The homepage renders `PrototypeHomeExtras`, which exposes placeholder/empty merchandising states.
- Styling is fragmented across design tokens, Tailwind utilities, product-card CSS, PDP CSS, responsive overrides, and legacy/prototype styles.
- API failures often silently return empty arrays, which hides broken merchandising behind empty UI states.

## Shopify-Se-10x-Better Fix Plan

P0 revenue blockers:

- Always store product handles in cart items from grid, carousel, quick view, and PDP.
- Make listing, cart, checkout, and free-shipping thresholds use the same currency model.
- Make Enter and "View All Results" in search route to the full search results page.
- Fix low-contrast cart and product-card CTAs.
- Remove public placeholder content and empty prototype merchandising states.

P1 premium redesign:

- Rebuild homepage order around a disciplined funnel: hero CTA, category rail, new arrivals, bestsellers, craft proof, social proof, reels, trust, newsletter.
- Use short display titles in product cards and keep SEO titles for metadata/PDP detail only.
- Use contextual CTAs instead of generic "View All".
- Consolidate button styles into one primary, one secondary, and one icon style.
- Add stronger visual contrast with ivory base, charcoal text, terracotta CTA, and a small set of supporting accents.

P2 cleanup:

- Archive `/root/kvastram-platform` after backup and deploy-history confirmation.
- Remove old screenshots/log artifacts from the live repo after preserving useful audit evidence.
- Replace old `vintaaj.com` fallback.
- Drive search/category shortcuts from live admin data.
- Add automated checks for broken product links, empty homepage slots, duplicate collection handles, missing thumbnails, and price mismatches.
