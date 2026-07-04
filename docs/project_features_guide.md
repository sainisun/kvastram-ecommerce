# Odhvica E-Commerce Platform — Comprehensive Features Guide

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
