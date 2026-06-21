# Critical Audit Remediation Plan

Date: 2026-06-21
Base: `origin/main` at `a5e33a6806c7467811e88b378e14cf6a77a82482`
Branch: `codex/fix-critical-audit-issues`

## Objectives

1. Make checkout totals and payment currency entirely server-authoritative.
2. Prevent unauthenticated callers from attaching orders to registered accounts.
3. Treat unpaid stock deductions as expiring reservations and release them safely.
4. Validate every returned line item and quantity against the original order.
5. Ensure refund actions call the configured payment provider before recording success.
6. Make webhook retries recover failed events instead of discarding them as duplicates.
7. Remove role-blind authorization from admin-only APIs.
8. Sanitize CMS HTML before public or admin rendering.
9. Add database constraints for price and return integrity.
10. Upgrade production dependencies with known high-severity advisories.

## Implementation

### Checkout and inventory

- Resolve currency from the selected region and reject mismatched client currency.
- Resolve shipping from the server-generated shipping option identifier.
- Include gift wrapping and its message in the persisted order total and metadata.
- Require a matching customer session when checkout uses an existing account email.
- Store an inventory reservation expiry on awaiting-payment orders.
- Release inventory exactly once for failed, cancelled, or expired unpaid orders.
- Add a scheduled cleanup for expired reservations.

### Payments and refunds

- Use the guest checkout payment token for Stripe and PayPal, matching Razorpay.
- Reject payment initialization after reservation expiry.
- Allow webhook rows in `failed` state to be claimed and retried.
- Validate provider amount, currency, and order linkage before marking orders paid.
- Route approved refunds through Stripe, Razorpay, or PayPal before updating local state.

### Returns and content security

- Validate returned line items belong to the selected order.
- Reject duplicate items and quantities greater than the purchased quantity.
- Make return creation transactional and enforce one active return per order.
- Replace role-blind middleware on admin region/tag APIs.
- Sanitize stored page HTML before rendering and sanitize admin previews.

### Database and dependencies

- Add uniqueness for `(variant_id, region_id)` prices.
- Add return/order and return-item constraints required by the service rules.
- Upgrade Next.js, Hono, Drizzle, Nodemailer, Socket.IO, and patched transitive packages.

## Verification

- Backend lint, build, unit tests, integration tests where environment permits.
- Storefront design-system audit, metrics, lint, unit tests, build, and desktop/mobile smoke tests.
- Admin lint and production build.
- Focused regression tests for:
  - currency mismatch;
  - registered-email checkout ownership;
  - inventory release idempotency;
  - guest payment ownership;
  - webhook failed-event retry;
  - return item/quantity validation;
  - CMS HTML sanitization.
- `npm audit --omit=dev` for all three applications.
- Final code re-audit against every objective above.

## Release

- Push only `codex/fix-critical-audit-issues`.
- Open a pull request into `main`.
- Merge only after all required checks pass.
- Do not deploy manually; production deployment remains owned by the protected GitHub workflow.

## Re-Audit Result

Status: **critical and high application findings closed in code**

### Closed

- Region-owned currency, shipping selection, tax, gift wrap, and payment totals are
  server authoritative.
- Registered-account email checkout requires the matching customer session.
- Guest Stripe, Razorpay, and PayPal access is bound to an expiring opaque token.
- Unpaid inventory reservations expire and release exactly once.
- Captures received after inventory release are held in `payment_review` instead
  of completing an order with unavailable stock.
- Failed webhook rows can be atomically reclaimed for retry.
- Return items and quantities are constrained to the original order, and refund
  amounts account for order-level discounts.
- Refund processing is atomically claimed and calls the payment provider before
  restocking or recording local success.
- CMS page HTML uses a maintained allow-list sanitizer.
- Region, tag, product SEO, search analytics, merchant diagnostics, and page
  administration enforce explicit admin/service roles.
- Admin mutations now record old/new audit values.
- Database TLS certificate verification defaults to enabled.
- Database migration adds one-return-per-order, regional-price uniqueness, and
  positive return quantity constraints.

### Verification Evidence

- Backend lint: PASS
- Backend tests: 97 PASS, 33 environment-dependent tests SKIPPED
- Backend production build: PASS
- Storefront design-system audit and metrics: PASS
- Storefront CSS ownership audit: PASS
- Storefront lint: PASS with one pre-existing custom-font warning
- Storefront unit tests with `--pool=threads`: 10 PASS
- Storefront production build: PASS
- Playwright desktop/mobile smoke: 8 PASS
- Admin lint and production build: PASS
- Production dependency audit:
  - Backend: 0 advisories
  - Storefront: 2 moderate Next.js-bundled PostCSS advisories
  - Admin: 2 moderate Next.js-bundled PostCSS advisories
  - High/critical production advisories: 0 across all applications

### Deployment Note

No VPS deployment or manual Compose command was run. The feature branch must
still pass GitHub required checks and merge through the protected PR workflow.
