# Kvastram Storefront Re-Audit Report

**Date:** May 15, 2026  
**Scope:** Customer-facing storefront only  
**Business goal:** Make Kvastram stronger than a typical Shopify or WooCommerce store, reduce payment-drop risk for Razorpay, lower bounce rate, and increase conversion rate.

---

## Executive Summary

Kvastram is now a **page-rich storefront**. As of **May 15, 2026**, the codebase contains **51 customer-facing `page.tsx` route files** inside `storefront/src/app`, plus a **dynamic CMS page family** at `/pages/[slug]` that powers legal and support pages such as privacy policy, refund policy, terms of service, and shipping policy.

This means Kvastram already has **more shopper-facing route depth than a default Shopify or WooCommerce installation**. The store is no longer "missing Razorpay"; the technical payment surface exists on both frontend and backend. The real question is now **storefront readiness**, not payment-provider absence.

### Re-audit verdict

- **Kvastram is ahead on page count and storytelling depth**
- **Kvastram is not yet fully stronger than a top-quality Shopify or WooCommerce store operationally**
- **The biggest remaining gaps are not "more random pages"**
- The biggest remaining gaps are:
  - **production-truth accuracy on some existing pages**
  - **unfinished account/support utility surfaces**
  - **missing noindex/metadata discipline on utility and transactional pages**
  - **a few important post-purchase and support journeys still being partial rather than complete**

### Most important residual blockers

1. **Account addresses is still a stub, not a production-grade address book**
   Evidence: [account/addresses/page.tsx](</E:/Kvastram projects/storefront/src/app/account/addresses/page.tsx:42>)

2. **Store locator is not trustworthy right now**
   It contains placeholder/fake global retail data and even one location mismatch.
   Evidence: [stores/page.tsx](</E:/Kvastram projects/storefront/src/app/stores/page.tsx:17>)

3. **Support and utility pages exist, but many still rely on default layout metadata**
   That weakens SEO hygiene, crawl control, and page-specific trust clarity.
   Evidence: [layout.tsx](</E:/Kvastram projects/storefront/src/app/layout.tsx:27>), [payment-help/page.tsx](</E:/Kvastram projects/storefront/src/app/payment-help/page.tsx:1>), [returns/page.tsx](</E:/Kvastram projects/storefront/src/app/returns/page.tsx:1>)

4. **Legal/policy pages are structurally wired, but production publication still needs QA**
   Footer and checkout depend on CMS-backed slugs such as `/pages/refund-policy`, `/pages/privacy-policy`, `/pages/terms-of-service`, and `/pages/shipping-policy`.
   Evidence: [storefront-trust.ts](</E:/Kvastram projects/storefront/src/config/storefront-trust.ts:8>)

### Bottom line

Kvastram is now **closer to a strong launch-ready premium storefront**, but it is **not honest to say "all gaps are fixed."** The remaining issues are fewer than before, but they are still meaningful because they affect **trust, post-purchase quality, repeat-buyer experience, and brand credibility**.

---

## Method

This re-audit combines:

1. **Current route audit of `storefront/src/app`**
2. **Spot checks of trust, checkout, support, account, and post-purchase surfaces**
3. **Comparison against official Shopify and WooCommerce documentation**

### Official reference sources

- [Shopify theme structure](https://help.shopify.com/en/manual/online-store/themes/theme-structure)
- [Shopify templates and default page types](https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates)
- [Shopify storefront search](https://help.shopify.com/en/manual/online-store/storefront-search/index)
- [Shopify customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts)
- [WooCommerce pages](https://woocommerce.com/document/woocommerce-pages/)
- [WooCommerce endpoints](https://developer.woocommerce.com/docs/best-practices/urls-and-routing/woocommerce-endpoints)

---

## Definitions

### Page

A shopper-visible storefront route or route family.

### Page Type

A reusable class such as homepage, collection page, PDP, cart, checkout, policy page, or account page.

### Module

A section or functional block inside a page that materially affects trust, discovery, payment success, or conversion.

### Launch-Critical

Missing or weak enough to create payment, trust, compliance, or checkout-risk issues.

---

## What Shopify and WooCommerce Usually Include

### Shopify

Shopify is more **template-led** than page-count-led. Officially, the storefront is built around default template families for:

- product pages
- collection pages
- collections list
- custom pages
- cart page
- blog pages
- blog post pages
- search page
- gift card page
- password page
- 404 page
- customer accounts
- checkout

In practice, a decent personal-brand Shopify store usually also adds:

- about page
- contact page
- FAQ
- shipping policy
- refund / returns policy
- privacy policy
- terms of service
- track order / support surfaces

### WooCommerce

WooCommerce installs fewer default pages up front, but expands through **account and checkout endpoints** plus WordPress content.

Official defaults and endpoint families include:

- Shop
- Cart
- Checkout
- My Account
- Refund and Returns Policy draft
- Terms and Conditions assignment
- checkout endpoints such as `order-pay` and `order-received`
- account endpoints such as `orders`, `view-order`, `edit-account`, `addresses`, `payment-methods`, `lost-password`

In practice, a decent WooCommerce personal-brand store also adds:

- about
- contact
- FAQ
- privacy
- shipping
- returns
- blog/editorial content
- post-purchase support pages

### Practical comparison

There is **no single fixed "page count"** for Shopify or WooCommerce. A better framing is:

- **Shopify:** about **10 to 13 core template/page families**, then custom support/content pages
- **WooCommerce:** about **5 setup-created core pages**, then **8+ important account/checkout endpoints**, plus archive/content pages
- **A decent personal-brand store:** usually ends up with **18 to 30 meaningful shopper-facing page families** before products, collections, articles, and dynamic policy/content pages multiply the live total

Kvastram is already above that in route depth.

---

## Kvastram Present Pages, Type-Wise

### Current route count

- **51 `page.tsx` route files** in `storefront/src/app`
- Plus **dynamic CMS-backed page family**: `/pages/[slug]`

### Important note on real storefront count

The storefront has **51 coded route families**, but the live shopper-visible page count is effectively **higher** because `/pages/[slug]` can represent multiple support/legal pages. Based on the current trust config, these dynamic pages are expected to include at least:

- `/pages/shipping-policy`
- `/pages/refund-policy`
- `/pages/privacy-policy`
- `/pages/terms-of-service`

---

## Kvastram Inventory Summary

| Family | Route families | Count | Audit reading |
|---|---:|---:|---|
| Home & Discovery | 10 | 10 | Strong |
| Catalog & Product | 4 | 4 | Strong |
| Checkout & Conversion | 6 | 6 | Improved, still uneven |
| Account & Post-Purchase | 13 | 13 | Good breadth, one major unfinished page |
| Brand & Editorial | 8 | 8 | Strong brand depth |
| Support, Trust & Utility | 5 + dynamic page family | 6 | Broad, but not fully production-clean |
| Wholesale / B2B | 5 | 5 | Stronger than typical D2C stores |

### 1. Home & Discovery

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/` | Homepage | Present | Discovery, conversion |
| `/products` | Main catalog | Present | Discovery, conversion |
| `/collections` | Collections index | Present | Discovery |
| `/collections/[handle]` | Collection landing/detail | Present | Discovery, merchandising |
| `/categories/[slug]` | Category landing | Present | Discovery |
| `/search` | Store search results | Present | Discovery, conversion |
| `/sale` | Discount discovery | Present | Conversion |
| `/bestsellers` | Social-proof catalog | Present | Discovery, conversion |
| `/trending-now` | Trend-led discovery | Present | Discovery |
| `/reels` | Social/content discovery | Present | Discovery, brand |

### 2. Catalog & Product

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/products/[handle]` | Product detail page | Present | Conversion |
| `/wishlist` | Saved items | Present | Retention, conversion |
| `/size-guide` | Sizing reassurance | Present | Trust, conversion |
| `/gift-cards` | Gift purchase/store credit style surface | Present | Conversion, gifting |

### 3. Checkout & Conversion

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/cart` | Cart review | Present | Conversion |
| `/checkout` | Checkout | Present | Conversion, payment |
| `/checkout/success` | Order success | Present | Post-purchase reassurance |
| `/payment-help` | Failed-payment recovery | Present | Trust, payment recovery |
| `/returns` | Returns and refund guidance | Present | Trust, post-purchase |
| `/track` | Order tracking | Present | Trust, retention |

### 4. Account & Post-Purchase

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/login` | Customer login | Present | Retention |
| `/register` | Customer registration | Present | Retention |
| `/forgot-password` | Password recovery | Present | Retention |
| `/reset-password` | Password reset | Present | Retention |
| `/verify-email` | Email verification | Present | Retention |
| `/account` | Account overview | Present | Retention |
| `/account/profile` | Profile management | Present | Retention |
| `/account/orders` | Order list | Present | Retention, post-purchase |
| `/account/orders/[id]` | Order detail | Present | Post-purchase |
| `/account/addresses` | Address book | **Present but weak** | Retention |
| `/account/messages` | Customer inbox | Present | Support, retention |
| `/account/messages/[id]` | Message thread | Present | Support, retention |
| `/account/wholesale` | B2B account area | Present | B2B |

### 5. Brand & Editorial

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/about` | Brand story | Present | Brand trust |
| `/about/kantha` | Craft education | Present | Brand trust |
| `/about/our-craft` | Craft/story page | Present | Brand trust |
| `/about/block-printing` | Material/process story | Present | Brand trust |
| `/artisans` | Artisan overview | Present | Brand trust |
| `/artisans/[slug]` | Artisan profile | Present | Brand trust |
| `/journal` | Editorial hub | Present | SEO, brand |
| `/journal/[slug]` | Editorial article | Present | SEO, brand |

### 6. Support, Trust & Utility

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/contact` | Support contact | Present | Trust |
| `/faq` | FAQ | Present | Trust |
| `/shipping` | Shipping overview | Present | Trust |
| `/cookie-settings` | Cookie preferences | Present | Compliance |
| `/stores` | Store locator | **Present but misleading** | Trust |
| `/pages/[slug]` | CMS legal/support pages | Present | Compliance, trust |

### 7. Wholesale / B2B

| Route | Purpose | Current status | Primary role |
|---|---|---|---|
| `/wholesale` | Wholesale landing | Present | B2B acquisition |
| `/wholesale/login` | B2B auth | Present | B2B |
| `/wholesale/checkout` | B2B checkout | Present | B2B conversion |
| `/wholesale/set-password` | B2B account activation | Present | B2B |
| `/account/wholesale` | B2B account hub | Present | B2B retention |

---

## Shopify vs WooCommerce vs Kvastram

| Page family | Shopify | WooCommerce | Kvastram | Re-audit reading |
|---|---|---|---|---|
| Homepage | Standard | Standard via WP page/theme | Present | OK |
| Catalog / shop page | Collections and `/collections/all` pattern | Shop page | Present via `/products` | OK |
| Product page | Standard template | Standard product page | Present | OK |
| Collection / category browsing | Standard collections and search filters | Product category/tag/attribute archives | Present | Strong |
| Cart | Standard | Standard | Present | Improved |
| Checkout | Standard | Standard | Present | Improved |
| Order success / received | Standard checkout flow | `order-received` endpoint | Present | OK |
| Failed payment recovery | Often app/theme assisted | Often gateway/theme assisted | Present via `payment-help` and checkout recovery | Better than baseline |
| Customer accounts | Strong | My Account + endpoints | Present | Good breadth |
| Address management | Supported | Supported via endpoint | **Present but unfinished** | Gap |
| Orders / reorder / returns | Strong | Supported | Present | Good |
| Payment methods in account | Supported in many setups | Explicit endpoint exists | Not present as a dedicated page | Optional gap |
| Search | Standard AI search | Theme/plugin dependent | Present | Good |
| Filters / merchandising | Search & Discovery app | Theme/plugin dependent | Present | Good |
| FAQ / Help | Custom | Custom | Present | Better than default baseline |
| Shipping / returns / privacy / terms | Custom but expected | Recommended and often required | Present structurally | Needs production QA |
| Track order | Custom | Custom | Present | Better than default baseline |
| Store locator | Optional | Optional | Present but unreliable | Gap |
| Editorial / blog | Standard blog/page model | WordPress-native strength | Present | Strong |
| Craft/storytelling pages | Custom | Custom | Present | Stronger than typical default stores |
| Wholesale/B2B pages | App/custom | Plugin/custom | Present | Stronger than typical default stores |

### Comparison conclusion

Kvastram already beats default Shopify and WooCommerce stores on:

- route depth
- editorial/brand storytelling
- B2B storefront breadth
- payment-help and returns-support surfaces
- track-order and post-purchase visibility

Kvastram still trails a truly polished premium store on:

- operational truthfulness of every published page
- completeness of account utilities
- metadata/noindex hygiene
- production QA of legal/support dynamic pages

---

## Remaining Important Pages or Modules

This section includes both **missing pages** and **pages that exist but are not yet good enough to count as solved**.

### A. Launch-Critical for payment readiness

| Item | Current state | Why it matters | Priority |
|---|---|---|---|
| Functional customer address book | Route exists but is stubbed | Repeat checkout trust and account parity with Shopify/Woo | `P1 Launch blocker` |
| Verified legal-page publication QA | Dynamic routes are wired, but production content must be confirmed | Broken legal links near checkout damage trust and can hurt gateway review confidence | `P1 Launch blocker` |
| Explicit noindex on transactional/account pages | Inconsistent | Prevents low-value pages from being indexed and keeps storefront SEO clean | `P1 Launch blocker` |
| Real support/retail truth on store locator | Current page contains placeholder data | False retail presence is a trust risk near purchase | `P1 Launch blocker` |

### B. Bounce-reduction pages and modules

| Item | Current state | Why it matters | Priority |
|---|---|---|---|
| Crawlable discovery landing pages by intent | Partial | Occasion, material, color, and gifting entry points reduce bounce better than raw filters alone | `P2 Important conversion gap` |
| Stronger help-center hub | Partial | Support pages exist, but there is no single support landing page that unifies FAQ, shipping, returns, payment help, and contact | `P2 Important conversion gap` |
| Real store / atelier / appointment page | Partial | A premium brand benefits from a truthful visit/appointment/atelier page, not a placeholder global store list | `P2 Important conversion gap` |

### C. Conversion pages and modules

| Item | Current state | Why it matters | Priority |
|---|---|---|---|
| Self-serve cancellation / order-change intake | Partial | Returns page advises contact, but premium buyers benefit from a structured pre-ship modification path | `P2 Important conversion gap` |
| Dedicated payment-status explainer surface linked from track/order pages | Partial | Buyers need a clean answer when they are unsure whether they paid successfully | `P2 Important conversion gap` |
| Repeat-buyer account settings depth | Partial | Shopify customer accounts set a higher expectation for smooth repeat checkout behavior | `P2 Important conversion gap` |

### D. Brand-advantage pages

| Item | Current state | Why it matters | Priority |
|---|---|---|---|
| Atelier appointment / concierge booking page | Missing | Helps Kvastram feel better than commodity ecommerce | `P3 Brand uplift` |
| Materials / care / craftsmanship hub | Partial across story pages | Better pre-purchase reassurance and richer SEO | `P3 Brand uplift` |
| Gifting / occasion landing system | Partial | Useful for premium discovery and conversion | `P3 Brand uplift` |

---

## Existing Pages Gap Audit

### Highest-value findings

| Current page or module | Issue | Business risk | Priority |
|---|---|---|---|
| [account/addresses/page.tsx](</E:/Kvastram projects/storefront/src/app/account/addresses/page.tsx:42>) | The page explicitly says it is not backed by real API behavior and currently just shows empty-state style logic. It also defaults to `US` rather than a Kvastram-first shipping context. | Weak repeat-checkout experience, poor account credibility, below Shopify/Woo account quality | `P1 Launch blocker` |
| [stores/page.tsx](</E:/Kvastram projects/storefront/src/app/stores/page.tsx:17>) | Uses placeholder global store data. One "Kvastram Mumbai" entry is actually labeled "Kochi, Kerala." The map is also a placeholder. | Trust damage and brand-credibility risk | `P1 Launch blocker` |
| [layout.tsx](</E:/Kvastram projects/storefront/src/app/layout.tsx:27>) + support/account pages | Default global metadata exists, but many utility pages do not define page-specific metadata or explicit robots behavior. | SEO hygiene gap, crawl waste, weak polish | `P1 Launch blocker` |
| [storefront-trust.ts](</E:/Kvastram projects/storefront/src/config/storefront-trust.ts:8>) | Critical trust links rely on dynamic legal slugs. The structure is good, but production must verify these pages are populated and published. | Broken legal links near checkout or footer can hurt user trust and payment-review readiness | `P1 Launch blocker` |
| `/returns` | Good support page, but still not a full self-serve cancellation/exchange center | Post-purchase friction | `P2 Important conversion gap` |
| `/track` | Good order lookup, but it can still be stronger as a help hub when a buyer cannot find an order or is unsure whether payment completed | Support deflection opportunity left on table | `P2 Important conversion gap` |
| `/payment-help` | Good new page, but still not fully embedded as a broader payment-status knowledge center across all post-purchase journeys | Payment-anxiety recovery can still improve | `P2 Important conversion gap` |
| Discovery architecture | Filters are better now, but Kvastram still depends heavily on generic catalog/search flows rather than deeper intent-led landing pages | Bounce and discovery ceiling remains | `P2 Important conversion gap` |

### Payment-readiness audit

**What is now strong**

- Checkout clearly supports Razorpay flow on the storefront
- Cart and checkout now surface policy/help links
- Payment-help and checkout-recovery surfaces now exist
- Shipping preview and postal-code-aware preview support are present
- Returns and post-purchase support surfaces are meaningfully improved

**What still needs attention**

- Account-level address persistence is not production-complete
- Legal page publication must be confirmed in production, not just in code
- Placeholder retail/support claims must be removed or replaced wherever still visible

### Bounce-rate audit

**What is now strong**

- Search exists
- Filters exist
- Catalog merchandising is improved
- Collection and search trust rails now exist
- Brand/editorial depth is much better than a generic store

**What still needs attention**

- More intent-led landing pages are still needed
- Some discovery is still parameter/filter driven instead of page-system driven
- A placeholder stores page can create bounce through distrust

### Conversion-rate audit

**What is now strong**

- PDP trust, shipping, returns, and payment-support visibility improved
- Cart and checkout trust modules improved
- Failed-payment recovery is much better
- Cross-sell and merchandising layers improved

**What still needs attention**

- Account address utility still undercuts repeat-buyer confidence
- Cancellation/order-change flow is still support-led rather than elegantly structured
- Not every support page is yet part of one polished help-center system

### Design-system consistency audit

**What is now strong**

- Shared trust config improved cross-page consistency
- Footer/support/legal routing is more coherent than before
- Support, returns, payment help, FAQ, and shipping pages now form a more consistent trust cluster

**What still needs attention**

- Utility pages still need stronger metadata discipline
- Placeholder pages should not remain public if the rest of the brand looks premium
- Some support/account surfaces still feel more "implemented" than "finished"

---

## What Has Been Fixed Since the Earlier Gap-Execution Work

The re-audit confirms that several previously important issues are now materially improved:

- `returns` page exists
- `payment-help` page exists
- footer support/legal links are aligned
- cart and checkout trust surfacing improved
- checkout failure recovery improved
- PDP trust and shipping/returns support improved
- catalog and search filters are stronger
- returns visibility exists in account order flows
- serviceability/shipping preview is stronger than before

So this is **not** a report saying "nothing changed." A lot has improved. The remaining work is simply more concentrated now.

---

## Prioritized Roadmap From This Re-Audit

### 1. Payments & Checkout Safety

1. Finish the customer address book properly
2. Confirm production publication of refund, privacy, shipping-policy, and terms pages
3. Add explicit noindex/metadata rules for cart, checkout, login, register, account, returns, payment-help, and tracking utilities

### 2. Trust & Legal Completeness

1. Replace or unpublish the current fake store locator until real data exists
2. Ensure every public support page reflects operational truth
3. QA every footer and checkout legal link on production

### 3. Bounce Reduction / Discovery

1. Add intent-led landing pages for occasions, materials, gifting, and signature edits
2. Strengthen internal linking between story pages and corresponding catalog surfaces
3. Turn strong filters into stronger crawlable discovery pages

### 4. Conversion Optimization

1. Add structured order-change / cancellation intake before shipment
2. Expand payment-help into a fuller payment-status resolution flow
3. Improve repeat-buyer account convenience to match or exceed Shopify customer-account expectations

### 5. Brand Differentiation

1. Replace generic store locator concept with a real atelier, stockist, or appointment model
2. Build a tighter craftsmanship, care, and gifting content system
3. Keep premium support pages accurate enough to reinforce brand trust rather than weaken it

---

## Final Verdict

If the question is:

**"Does Kvastram now have enough storefront depth to compete with or beat a typical Shopify or WooCommerce store?"**

The answer is:

**Yes on breadth, mostly yes on trust/payment structure, but not yet fully yes on operational polish.**

If the question is:

**"Are all important issues fully solved?"**

The answer is:

**No.**

### Plain-language conclusion

Kvastram is no longer under-built. It is now **over the minimum bar** on storefront page coverage. The remaining problem is **quality and truthfulness of a few key surfaces**, not lack of routes.

The store can become better than a normal Shopify or WooCommerce store by focusing on:

- truthful support and retail information
- a complete address-book/account utility layer
- clean legal page publication
- stronger noindex/metadata discipline
- more intentional brand-led discovery pages

That is the shortest path from **"many pages"** to **"better store."**
