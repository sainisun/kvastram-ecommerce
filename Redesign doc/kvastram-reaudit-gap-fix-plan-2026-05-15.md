# Kvastram Re-Audit Gap Fix Plan

**Date:** May 15, 2026  
**Source report:** `kvastram-storefront-pages-platform-gap-report-2026-05-15.md`  
**Goal:** Fix every remaining issue that can be solved through code, UX, structure, and safe storefront cleanup first. Leave business-content-dependent items for the final phase, where the user will provide final content and approvals.

---

## Planning Rule

This plan splits remaining work into two groups:

### Group A: Can be fixed now without waiting

These are issues I can solve through:

- code changes
- UX restructuring
- route cleanup
- metadata / SEO fixes
- placeholder removal
- safer trust presentation
- account and support flow completion

### Group B: Needs user-provided business content or approvals

These should be left for the last phase because they depend on:

- final policy wording
- real retail/store information
- real atelier / appointment process
- real cancellation / exchange rules
- real shipping promise language
- final legal/compliance wording

---

## Remaining Issues from Re-Audit

### High priority technical / structural issues

1. `account/addresses` is still a stub
2. `stores` page contains placeholder / misleading retail data
3. support / utility pages need page-level metadata and crawl-control hygiene
4. legal/trust dynamic pages need storefront-safe publishing checks
5. track / payment-help / returns can still be unified into a stronger support flow
6. discovery still leans more on filters than high-intent landing architecture

### Content-dependent / business-dependent issues

1. final refund / return policy wording
2. final shipping policy wording
3. final privacy / terms wording if edits are needed
4. real store / stockist / atelier data
5. final cancellation and exchange rules
6. real appointment / concierge / store-visit process
7. real shipping SLA promises that should appear publicly

---

## Execution Strategy

Work in this order:

1. Fix structural trust issues first
2. Finish account and support utility flows
3. Improve SEO / noindex / metadata discipline
4. Replace weak placeholder pages with safer temporary versions
5. Build any reusable page systems needed for final business content
6. Ask user only at the final phase for real content that cannot be invented safely

---

## Phase 1: Fix What Is Unsafe or Misleading

### 1. Address book completion

Target:

- turn `/account/addresses` into a real account utility page
- connect it to actual address CRUD if backend support exists
- if backend support is missing, downgrade the page into an honest “managed during checkout” page instead of pretending it is complete

Why first:

- this is the clearest remaining parity gap versus Shopify / WooCommerce
- it directly affects repeat checkout quality

### 2. Store locator correction

Target:

- remove fake global retail claims
- convert `/stores` into a safe truthful format

Safe implementation options:

- temporary “atelier / contact / appointments coming soon” page
- or “where to buy / contact us for availability” page
- or hide the route from navigation if it is not a real public offer yet

Why first:

- placeholder store data damages trust more than having no store locator

### 3. Support flow tightening

Target:

- connect `track`, `payment-help`, `returns`, `contact`, and FAQ more tightly
- add clearer recovery CTAs between them
- reduce dead-end support states

Why first:

- directly helps payment confidence, lowers panic, and improves post-purchase trust

---

## Phase 2: SEO, Trust, and Page Hygiene

### 4. Metadata and robots discipline

Target:

- add page-level metadata where missing
- add `noindex` to low-value utility or transactional pages where appropriate

Likely candidates:

- login
- register
- forgot-password
- reset-password
- verify-email
- account pages
- cart
- checkout
- payment-help
- returns
- track

Why:

- improves crawl quality
- makes storefront feel more production-ready

### 5. Legal/trust route QA

Target:

- verify all policy routes referenced in shared trust config
- add safer fallbacks where possible
- ensure support pages do not depend on broken legal links

Why:

- these routes are heavily linked from footer, checkout, cart, and support surfaces

### 6. Utility-page consistency pass

Target:

- align page headings, trust copy, CTA hierarchy, and support cross-links across:
  - shipping
  - returns
  - payment-help
  - faq
  - track
  - contact

Why:

- improves design-system consistency and buyer confidence

---

## Phase 3: Conversion and Discovery Uplift

### 7. Help-center architecture

Target:

- add a single support landing page or support hub
- route users into payment, returns, shipping, order tracking, and contact flows from one place

Why:

- reduces bounce and support confusion

### 8. Discovery landing system

Target:

- build higher-intent discovery pages rather than relying only on filters

Possible categories:

- gifts
- occasion wear
- artisan edits
- fabric / craft edits
- travel / resort edits

Important note:

- page shells and reusable template structure can be built now
- final merchandising and page copy can be refined later

### 9. Better post-purchase service modules

Target:

- strengthen order details, tracking, return status, and payment-status guidance
- improve support escalation paths after purchase

Why:

- helps retention and reduces payment/support confusion

---

## Phase 4: User-Dependent Content Tasks

These are intentionally left last because they require your business truth, not assumptions.

### You will likely need to provide:

1. Final refund / return policy text
2. Final shipping policy text
3. Final cancellation / exchange rules
4. Real store / atelier / stockist information
5. Real support timings and service commitments if current ones should change
6. Final concierge / appointment workflow details
7. Any legal copy revisions you want on privacy / terms pages

### What I can do once you provide this

- publish the content to the correct storefront routes
- update CTA links and help pages
- wire the pages into footer / checkout / PDP / support flow
- make the final public trust system consistent across the whole storefront

---

## What I Can Execute Without Waiting for You

These are safe to proceed immediately:

- fix `account/addresses` behavior or downgrade it honestly
- replace the current fake `stores` page with a truthful interim page
- add metadata and `noindex` where needed
- improve cross-linking between support pages
- add a support hub if desired
- improve track / returns / payment-help flow structure
- improve reusable discovery page templates

---

## What I Should Not Finalize Without Your Input

These should wait:

- final legal policy content
- real store-location content
- real operational promises like shipping timelines or cancellation windows
- final atelier / appointment / concierge copy

---

## Recommended Next Execution Order

### Immediate batch

1. [x] Fix or honestly downgrade `account/addresses`
2. [x] Replace or neutralize the current `stores` page
3. [x] Add metadata / noindex discipline to utility and account pages
4. [x] Add stronger support cross-linking and possibly a support hub

### Second batch

1. [x] Build reusable discovery landing structure
2. [x] Improve post-purchase and order-help flow
3. [x] QA all trust-route references

### Final batch with your content

1. Publish final policies
2. Publish real store / atelier / appointment content
3. Finalize operational promise copy

---

## Acceptance Criteria

This re-audit plan is complete only when:

- no public storefront page makes misleading retail or support claims
- account utility pages are either truly functional or honestly scoped
- support and post-purchase journeys are tightly connected
- metadata and crawl rules are production-grade
- policy and legal pages are fully published with your final content
- final brand-trust surfaces are consistent across footer, checkout, support, and PDP

---

## Execution Status

- [x] Immediate batch execution started
- [x] `account/addresses` connected to real customer address CRUD endpoints
- [x] `stores` route converted from placeholder retail claims to a truthful interim atelier / enquiry page
- [x] Added noindex metadata layer for auth, account, cart, checkout, tracking, returns, payment-help, and stores surfaces
- [x] Strengthened order-tracking support recovery links
- [x] Added a storefront help-center route and wired it into key support surfaces
- [x] Added a curated discovery `edits` hub and linked it into navigation surfaces
- [x] Added stronger support routing inside account order flows and support pages
- [x] Added context-aware support prefills on contact flow for payment / returns / tracking / visit / order-support journeys
- [x] Added trust/support CTA layer to dynamic CMS policy pages
- [x] Aligned storefront trust routes with existing CMS slugs and added interim legal fallbacks where final content is still pending
- [x] Verified touched files with targeted lint
- [x] Second batch execution
- [x] Trust-route QA and final content-dependent publication prep
- [ ] Final content-dependent publication phase with user-provided policy / retail / operations content
