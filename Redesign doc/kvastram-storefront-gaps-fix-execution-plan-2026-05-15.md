# Kvastram Storefront Gaps Fix Execution Plan

**Date:** May 15, 2026  
**Source audit:** `kvastram-storefront-pages-platform-gap-report-2026-05-15.md`  
**Execution focus:** Launch-critical trust, policy, and payment-readiness gaps first

---

## Objective

Fix the highest-impact storefront gaps that can hurt:

- Razorpay and checkout completion
- pre-payment trust
- policy clarity
- support discoverability
- bounce and conversion on cart, checkout, and PDP

---

## Phase 1: P1 Launch Blockers

### 1. Standardize trust and policy copy

- Add one shared storefront trust/policy config
- Use it across footer, contact, cart, checkout, PDP, and support pages
- Remove contradictory public-facing promises where operations are not fully standardized

### 2. Improve policy surfacing in buyer-critical moments

- Add dedicated shopper-facing `returns` page
- Add dedicated shopper-facing `payment-help` page
- Surface shipping, refund, privacy, and terms links in cart and checkout
- Replace broken or indirect footer links where possible

### 3. Fix checkout support gaps

- Add payment-help links and support escalation on checkout errors
- Add a policy/help panel on the payment step
- Replace provider-specific messaging that is no longer accurate for multi-provider checkout

### 4. Fix trust consistency gaps

- Align footer contact data with Jaipur-based brand identity
- Align contact page details with the same identity
- Rewrite shipping and FAQ copy so it no longer contradicts checkout/legal flows
- Reduce risky hardcoded claims on PDP trust cards and shipping/returns tabs

---

## Phase 2: P2 Conversion Support

### 5. Add cart and PDP reassurance modules

- Add policy/help links in cart summary
- Add a compact FAQ/help capsule near PDP CTAs
- Improve payment and support reassurance near conversion moments

### 6. Stabilize post-purchase support

- Add payment-help and contact recovery links to failed-payment confirmation state
- Add clearer support next steps on success and support surfaces

### 7. Improve catalog and search discovery

- Add real backend-backed attribute filters for intent-led browsing
- Add shopper-friendly price filtering on catalog and search surfaces
- Surface active filters clearly so users can recover without bouncing
- Strengthen mobile filter handling so discovery works cleanly on phone

### 8. Align utility support surfaces

- Remove stale support/shipping claims from floating support widgets
- Reuse shared trust and support data across checkout-error and chat flows
- Make support recovery paths visible from more failure states

---

## Files Planned

### New files

- `storefront/src/config/storefront-trust.ts`
- `storefront/src/app/returns/page.tsx`
- `storefront/src/app/payment-help/page.tsx`
- `Redesign doc/kvastram-storefront-gaps-fix-execution-plan-2026-05-15.md`

### Existing files to update

- `storefront/src/components/layout/Footer.tsx`
- `storefront/src/app/contact/page.tsx`
- `storefront/src/app/shipping/page.tsx`
- `storefront/src/app/faq/page.tsx`
- `storefront/src/app/cart/page.tsx`
- `storefront/src/app/checkout/page.tsx`
- `storefront/src/app/checkout/error.tsx`
- `storefront/src/app/checkout/success/page.tsx`
- `storefront/src/app/search/page.tsx`
- `storefront/src/components/product/ProductView.tsx`
- `storefront/src/components/products/FilterSidebar.tsx`
- `storefront/src/components/products/CatalogClient.tsx`
- `storefront/src/components/ui/ChatWidget.tsx`

---

## Acceptance Criteria

- Footer, contact, shipping, FAQ, cart, checkout, and PDP no longer make contradictory trust/policy promises
- Checkout and payment failure states provide direct help and recovery links
- Cart no longer claims checkout is only powered by Stripe
- Footer no longer points to a missing cookie policy route
- Storefront has first-class shopper-facing pages for returns guidance and payment help
- Catalog and search use real attribute + price filters instead of thin discovery-only browsing
- Shared support surfaces no longer show outdated shipping timelines or non-Kvastram contact data

---

## Execution Status

- [x] Phase 1 scope defined
- [x] File plan documented
- [x] Implement shared trust config
- [x] Implement new support pages
- [x] Align footer/contact/shipping/FAQ
- [x] Align cart/checkout/PDP/success states
- [x] Verify Phase 1 with lint or targeted checks
- [x] Add backend-backed catalog attribute filters
- [x] Add catalog and search price filtering
- [x] Add active filter chips and mobile filter cleanup
- [x] Add search empty-state recovery links and filter reset path
- [x] Align checkout error recovery surface
- [x] Align chat widget support and shipping copy
- [x] Add PDP delivery-planning preview with country-level shipping methods
- [x] Add collection-page curated discovery and trust rails
- [x] Add non-empty cart cross-sell recommendations
- [x] Add self-serve returns visibility in returns hub and order details
- [x] Add return-status visibility to the account orders list
- [x] Add stronger search and catalog merchandising rails
- [x] Add postal-code-aware serviceability and shipping preview support
- [x] Verify Phase 2 discovery/support changes with lint

---

## Remaining High-Value Execution

- [ ] Browser-verify the new delivery preview and recovery surfaces with a live local run
