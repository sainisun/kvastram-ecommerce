# Odhvica E-Commerce Platform — Comprehensive Features Guide

## UI/UX Architecture & Tailwind v4
- **Primitives System:** Core UI components (`Button`, `Badge`, `Input`, etc.) are built using `class-variance-authority` (cva) pattern for strict, type-safe variant mapping.
- **Design Tokens:** The storefront uses native Tailwind v4 CSS variables injected via `globals.css` (e.g., `--color-accent`, `--color-surface-paper`). Raw `var(--ds-*)` usage in `.tsx` is allowed only as a Tailwind arbitrary-value escape hatch when no semantic utility exists. Runtime TSX must not consume `--ink`, `--cream`, or `--line`; use `--ds-*` tokens or semantic utilities like `bg-surface-paper` and `text-accent-hover`.
- **Layout Logic:** Global layout CSS (`.products-grid`, etc.) is deprecated. Layouts MUST be explicitly defined in React components using Tailwind grid utilities (e.g., `grid grid-cols-2`).

## UI/UX & Tailwind Refactoring (v1.0)
* **Technical Flow**: Transitioning legacy custom CSS components (`product-card.css`, `collections.css`, `home-sections.css`) to utility-first Tailwind CSS. 
* **Architecture**: Enforces a strict separation of concerns where global resets reside in `tokens.css` and `base.css`, while all component-level styles are handled via inline Tailwind classes (e.g. `bg-[var(--ds-surface-paper)]`, `text-body-sm`).
* **Dependencies**: Depends on the custom `design-system-audit.mjs` ratcheting scripts. When adding new inline styles, developers must allowlist them in `design-system-audit.mjs` to prevent pipeline failures.
* **Commands**: Run `npm run audit:css-ownership -- --write-baseline` after removing legacy CSS classes to establish a new duplication baseline.

This guide is the definitive registry of all backend features implemented in the Odhvica codebase. It outlines the technical mechanics, configuration keys, user requirements, and operational steps for each system.

---

## 1. Cart Recovery & Marketing Automations

### A. Multi-Stage Abandoned Cart Reminders (Email & SMS)
* **Technical Flow**:
  * An hourly background cron checker compares `updated_at` timestamps of active `saved_carts` database records against specific cutoff points.
  * **Stage 1 (1 hour)**: Sends the first recovery email (Brevo) and SMS (Twilio - if opted-in).
  * **Stage 2 (24 hours)**: Sends the second recovery email and SMS containing a 10% cart discount link.
  * **Stage 3 (72 hours)**: Sends the final urgency recovery email and SMS before marking the cart as expired.
  * Status tracker: Progress is stored inside the database `saved_carts.metadata` as `recovery_stage` (1, 2, or 3) to prevent double sending.
* **What you need to do**:
  * Create corresponding transactional email templates in the Brevo panel. Insert variables `{{ params.CART_URL }}` and `{{ params.FIRST_NAME }}` in the template design.
  * Register template IDs in your production `.env`:
    ```ini
    BREVO_API_KEY=your_brevo_api_key
    BREVO_TEMPLATE_AC_1=1
    BREVO_TEMPLATE_AC_2=2
    BREVO_TEMPLATE_AC_3=3
    ```
  * Set up Twilio keys in `.env` to enable SMS alerts:
    ```ini
    TWILIO_ACCOUNT_SID=your_twilio_sid
    TWILIO_AUTH_TOKEN=your_twilio_token
    TWILIO_PHONE_NUMBER=your_twilio_virtual_number
    ```
* **Edge Cases & DLT Compliance**:
  * SMS only triggers if the customer explicitly consents during checkout (mapped to `metadata.sms_opt_in === true`).
  * For Indian customers, if using local SMS sender names, register SMS templates under DLT (Distributed Ledger Technology) rules in India before live broadcasting.

### B. Back-in-Stock Notifications
* **Technical Flow**:
  * When a product is out of stock, customers subscribe to an notification list (`back_in_stock_subscriptions`).
  * On inventory replenishment in `product-mutation-service.ts`, the database trigger evaluates if quantity > 0. It spawns an async email/SMS job notifying all subscribed users before purging their subscription records.
* **What you need to do**:
  * **Fully Automated**: Requires Brevo templates setup for transactional inventory alerts.

---

## 2. Storefront Search & Core Performance

### A. Real-Time Meilisearch Fuzzy Search & Live Sync
* **Technical Flow**:
  * **Live Sync**: Event hooks inside product mutation actions (`create`, `update`, `delete`) propagate updates to the Meilisearch index instantly.
  * **Fallback Search**: Product query service checks if `MEILISEARCH_HOST` is reachable. If online, queries Meilisearch for matching IDs and hydrates the list from PostgreSQL. If offline, runs fallback database vector search.
* **What you need to do**:
  * Ensure Meilisearch server is running on port `7700` and config credentials in `.env`:
    ```ini
    MEILISEARCH_HOST=http://localhost:7700
    MEILISEARCH_API_KEY=your_search_api_key
    ```
  * For initial indexing, run:
    `npx tsx src/jobs/syncMeilisearch.ts`

### B. 12-Hour Reconciliation Cron Sync
* **Technical Flow**:
  * A scheduled cron runs every 12 hours (`sync_meilisearch`) performing a complete index build to fix any potential sync drifts.
* **What you need to do**:
  * **Fully Automated**: Set up `SEO_CRON_ENABLED=true` in `.env` to start the background scheduler.

---

## 3. Merchant Channels & Feeds

### A. Multi-Language Feed Generator
* **Technical Flow**:
  * Compiles products and variants, formatting them into XML/JSON/CSV structures required by Google Merchant Center, Meta, Pinterest, and TikTok.
  * Accepts `?lang=XX`. The engine reads translations from `product.metadata.translations[lang]` and swaps default descriptions with localized parameters dynamically.
* **What you need to do**:
  * Set up merchant center feeds to pull from:
    `https://api.odhvica.com/merchant/feeds/google/products.xml?lang=de`
  * Add translations JSON to product metadata using the admin panel dashboard.

---

## 4. Checkout, Region Taxation & Payment Core

### A. Razorpay Card & UPI Integration (INR)
* **Technical Flow**:
  * Standard checkout path for Indian shoppers. Generates a secure Razorpay Order ID. 
  * Verifies payments via webhook HMAC signature verification before updating database records.
* **What you need to do**:
  * Set keys in `.env`:
    ```ini
    RAZORPAY_ID=rzp_live_...
    RAZORPAY_SECRET=...
    RAZORPAY_WEBHOOK_SECRET=your_webhook_signature_secret
    ```
  * Set up webhook URL pointing to `https://api.odhvica.com/store/payments/razorpay/webhook` inside the Razorpay Dashboard.

### B. PayPal gateway (USD)
* **Technical Flow**:
  * Processes checkout sessions for international transactions, converting base pricing to USD.
* **What you need to do**:
  * Set credentials in `.env`:
    ```ini
    PAYPAL_CLIENT_ID=...
    PAYPAL_CLIENT_SECRET=...
    ```

---

## 5. Security & Accounts Management

### A. Account Lockout Security Guard
* **Technical Flow**:
  * Intercepts login attempts. If failed attempts count reaches 5, locks account for 15 minutes (`locked_until` field in `customers` table).
* **What you need to do**:
  * **Fully Automated**: Customize timeout values in code configuration if needed.

### B. Admin Password Reset CLI
* **Technical Flow**:
  * Utility scripts to override admin parameters and clear locks in case of admin lockout.
* **What you need to do**:
  * Run: `npx tsx src/scripts/reset-admin.ts`

---

## 6. UI/UX Design System Enhancements (v1.1)

### A. Accessibility & Layout Polish
* **Technical Flow**:
  * **Typography Integration**: The layout natively bridges Next.js `next/font/google` variables (`--font-cardo`, `--font-amiri`) directly to internal CSS tokens (`--ds-font-body`, `--ds-font-display`) removing render-blocking external stylesheets.
  * **Motion Accessiblity**: Animations are wrapped in an `(prefers-reduced-motion: reduce)` media query across the application. When a user enables reduced motion on their OS, animations and smooth scrolling are stripped globally by resetting `animation-duration` to `0.01ms`.
  * **Interactive Focus Trap**: Navigational elements like `Drawer.tsx` capture focus via a custom `useEffect` trap keeping keyboard navigation (Tab & Shift-Tab) strictly bound to internal interactable elements when the drawer is open.
* **What you need to do**:
  * Ensure the design system audits (`npm run verify:design-system`) pass without warnings.
  * Use the tokens `var(--font-cardo)` mapped internally when expanding any future layout elements.

### B. Storefront Architecture Recovery (v1.2)
* **Technical Flow**:
  * **Runtime-First Contract**: `storefront/src/styles/tokens.css` is the single source of truth for typography and homepage layout. Active values are `Amiri` for `--ds-font-display`, `Cardo` for `--ds-font-body`, homepage gutters `15px / 28px / 30px`, and homepage section rhythm `56px / 108px`.
  * **Homepage Primitives**: Homepage layout ownership is centralized in `src/components/ui/HomepageSection.tsx` through `HomepageContainer`, `HomepageSection`, and `HomepageSectionHeader`. Homepage sections must use these primitives instead of repeating `w-[min(calc(...))]` formulas or malformed utility fragments.
  * **Chrome Modes**: `MainLayout` now resolves explicit `store`, `checkout`, and `wholesale` chrome modes. Checkout routes render without consumer site chrome, while wholesale routes keep their own dedicated header and footer.
  * **Touch Targets**: Shared button tokens now enforce `44px` minimum small controls and `48px` default controls. Header actions, product-card wishlist/cart actions, cookie controls, and checkout/cart inline actions were normalized to this contract.
  * **Audit Hardening**: `scripts/design-system-audit.mjs` now validates live token declarations, homepage spacing contract, malformed utility fragments, legacy alias usage, and known touch-target regressions instead of relying on comment-only matches.
* **What you need to do**:
  * Keep homepage sections on `HomepageContainer`/`HomepageSection` primitives when adding or editing merchandising blocks.
  * Treat compatibility aliases in `globals.css` as CSS bridge-only; do not introduce new runtime TSX consumers of `--ink`, `--cream`, `--line`, `--soft`, or `--muted`.
  * Run the full storefront verification chain after touching homepage layout, checkout shell, or shared primitives:
    `npm.cmd run audit:design-system`
    `npm.cmd run audit:design-system:metrics`
    `npm.cmd run lint`
    `npm.cmd run verify:design-system -- --pool=threads`
    `npm.cmd run build`

### C. Storefront Consistency Closure (v1.3)
* **Technical Flow**:
  * **Shared Interaction Closure**: Remaining runtime chip and pagination patterns now close over shared button primitives instead of route-local legacy classes. This applies to bestsellers size chips, search attribute chips, search overlay chips, mobile filter chips, listing/catalog pagination, and account order pagination.
  * **Dead Selector Reduction**: After migrating those runtime consumers, the unused selector contracts for `kv-text-chip`, `catalog-page-button`, `filter-tag-button`, and `account-page-button` are removed from the live storefront typography layer to reduce duplicate ownership and drift.
  * **Claim Discipline**: “100% consistency” can only be claimed for the verified storefront runtime scope after audits, lint, design-system verification, and build are all green. It must not be used as a blanket claim for untouched historical code.
* **What you need to do**:
  * Add future chip-like filters and pagination controls through shared button variants instead of introducing new page-local classes.
  * Keep consistency claims scoped to the audited storefront runtime.
  * Re-run the storefront verification chain before treating any closure pass as complete:
    `npm.cmd run audit:design-system`
    `npm.cmd run audit:design-system:metrics`
    `npm.cmd run lint`
    `npm.cmd run verify:design-system -- --pool=threads`
    `npm.cmd run build`

### D. CSS Ownership Closure (v1.4)
* **Technical Flow**:
  * **Single Owner Cleanup**: Duplicate selector ownership across utility, typography, responsive, mobile override, animation, and component CSS layers was collapsed into single-owner files. Responsive and mobile variants were folded back into their component owner files instead of being split across unrelated override files.
  * **Audit Hardening**: `scripts/css-ownership-audit.mjs` now strips CSS comments and string literals before selector collection and ignores generic state modifiers like `active` and `visible`, preventing false positives from comments, import paths, and generic state tokens.
  * **Zero Duplicate Baseline**: The active storefront CSS ownership audit now passes at `0` duplicate selectors, so future drift is blocked immediately instead of being tolerated through a large baseline.
* **What you need to do**:
  * When adding responsive or mobile rules, place them in the same component or utility owner file instead of creating a second selector owner elsewhere.
  * Treat CSS ownership drift as a regression, not as acceptable cleanup debt.
  * Run `npm.cmd run audit:css-ownership` alongside the standard storefront verification chain whenever shared CSS or layout primitives change.

### E. Checkout & Interaction Consistency Closure (v1.5)
* **Technical Flow**:
  * **Checkout Semantic Cleanup**: `storefront/src/app/checkout/page.tsx` no longer relies on legacy compatibility text classes in runtime JSX. Progress steps, shipping/payment copy, policy links, order summary, and trust panels now use semantic utilities like `text-primary`, `text-muted`, and `text-accent`.
  * **44px Control Enforcement**: Remaining undersized runtime controls were normalized to the shared control contract, including search overlay clear actions, filter sidebar toggles, auth password visibility toggles, wishlist remove actions, carousel dots, and the global scroll-to-top control.
  * **Touch Discoverability**: Cart drawer removal affordances now remain visible on touch/smaller breakpoints instead of depending only on hover, preserving parity between desktop and mobile interaction models.
  * **Dead Local Alias Reduction**: Product detail page local semantic alias variables that duplicated the storefront token contract were removed from `storefront/src/components/product/pdp.module.css`, keeping the page on the shared design token layer.
* **What you need to do**:
  * Use shared button or icon-button primitives for future dismiss, toggle, carousel, and remove actions instead of applying `h-8`, `w-8`, or other route-local shrink overrides.
  * Keep checkout and trust surfaces on semantic text utilities; do not reintroduce `color-ink`, `color-muted`, or `color-accent` into runtime TSX.
  * Re-run the full storefront verification chain after changing checkout, auth, search overlay, filters, wishlist, cart drawer, or carousel controls:
    `npm.cmd run audit:design-system`
    `npm.cmd run audit:design-system:metrics`
    `npm.cmd run lint`
    `npm.cmd run verify:design-system -- --pool=threads`
    `npm.cmd run build`

### F. Local Runtime Warning Closure (v1.6)
* **Technical Flow**:
  * **Exchange Rate Fallback Discipline**: `storefront/src/app/api/exchange-rates/route.ts` now prefers local fallback rates during production build generation and local mock-API test environments instead of repeatedly attempting an unnecessary live TLS fetch. Live provider fallback remains intact for real runtime failures, but dev logging is reduced to a single warning instead of repeated noisy stack traces.
  * **Responsive OAuth Width Contract**: `storefront/src/app/login/page.tsx` now measures the Google sign-in container and passes a valid pixel width to the Google Identity button, preserving the feature while avoiding invalid `100%` width configuration.
  * **Above-the-Fold Image Stability**: Homepage circle images now eagerly load the first visible set, and the hero image stack uses explicit positioned containers for mobile and desktop assets so above-the-fold loading and fill sizing stay stable under local smoke tests.
* **What you need to do**:
  * Do not hardcode percentage strings into third-party auth button width props when the provider expects pixel values; measure the container and pass a bounded number instead.
  * Keep local mock and smoke-test environments off unnecessary live external fetches when a built-in fallback already exists.
  * When adjusting homepage hero or category media, preserve explicit above-the-fold loading intent and positioned fill containers to avoid LCP or zero-height image regressions.
