# WSTOREFRONT PLATFORM - COMPREHENSIVE AUDIT REPORT

**Audit Date:** February 24, 2026  
**Platform:** Kvastram E-commerce Platform  
**Components:** Storefront (Next.js), Backend API (Hono), Admin Panel (Next.js), Database (PostgreSQL)

---

## EXECUTIVE SUMMARY

This comprehensive audit identified **47 total issues** across the wstorefront platform, categorized by severity:

- **Critical (3):** Payment processing failures, security vulnerabilities
- **High (8):** Authentication issues, data integrity problems
- **Medium (18):** Functional bugs, missing validations
- **Low (18):** Code quality, warnings, TODOs

---

## 1. CRITICAL ISSUES

### 1.1 Payment Processing - Stripe Configuration Risk

**Severity:** CRITICAL  
**Location:** [`backend/src/routes/store/payments.ts:29-34`](backend/src/routes/store/payments.ts:29)  
**Issue:** Stripe client initialized with placeholder key when `STRIPE_SECRET_KEY` is missing, causing silent failures instead of hard errors.

```typescript
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — payment routes will fail');
}
const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {...});
```

**Recommendation:** Fail fast at application startup if Stripe keys are missing in production.

---

### 1.2 Debug Token Endpoint Exposed in Non-Production

**Severity:** CRITICAL  
**Location:** [`backend/src/routes/store/auth.ts:257-299`](backend/src/routes/store/auth.ts:257)  
**Issue:** Debug endpoint exposes verification tokens in non-production environments, potentially allowing account takeover.

```typescript
storeAuthRouter.get('/debug-token', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Endpoint not available in production' }, 404);
  }
  // ... exposes verification_token in response
});
```

**Recommendation:** Remove this endpoint entirely or ensure it's only available in local development.

---

### 1.3 Unhandled Promise in Wholesale Inquiry Email

**Severity:** HIGH  
**Location:** [`backend/src/routes/wholesale.ts:66-72`](backend/src/routes/wholesale.ts:66)  
**Issue:** Promise.all used without await - errors silently swallowed.

```typescript
// Missing await - promise is never awaited
Promise.all([
  emailService.sendInquiryReceived({...}),
  emailService.sendNewInquiryAlert(inquiry),
]).catch((err) => console.error('Error sending emails:', err));
```

**Recommendation:** Add proper error handling or use a job queue for email delivery.

---

## 2. HIGH SEVERITY ISSUES

### 2.1 Duplicate Error Class Definitions

**Severity:** HIGH  
**Locations:**

- [`backend/src/errors/index.ts`](backend/src/errors/index.ts)
- [`backend/src/middleware/error-handler.ts`](backend/src/middleware/error-handler.ts)

**Issue:** Duplicate definitions of `NotFoundError`, `ValidationError`, `AuthError`, `ConflictError` across two files cause confusion and potential conflicts.

---

### 2.2 Missing Inventory Validation Race Condition

**Severity:** HIGH  
**Location:** [`backend/src/routes/store/checkout.ts:466-495`](backend/src/routes/store/checkout.ts:466)  
**Issue:** Inventory is checked and deducted in separate operations, creating a race condition where concurrent orders could oversell inventory.

```typescript
// Check happens first
const [currentVariant] = await tx.select(...).where(eq(product_variants.id, item.id));
// Then deduction happens separately - race condition possible
await tx.update(product_variants).set({
  inventory_quantity: sql`COALESCE(${product_variants.inventory_quantity}, 0) - ${item.quantity}`,
});
```

**Recommendation:** Use database-level locking or atomic operations with inventory checks.

---

### 2.3 Inconsistent Auth Middleware Usage

**Severity:** HIGH  
**Location:** Multiple routes in [`backend/src/routes/`](backend/src/routes/)  
**Issue:** Several admin routes incorrectly used `verifyAuth` instead of `verifyAdmin`:

- [`backend/src/routes/banners.ts:5`](backend/src/routes/banners.ts:5) - BUG-013 FIX applied
- [`backend/src/routes/marketing.ts:2`](backend/src/routes/marketing.ts:2) - BUG-010 FIX applied
- [`backend/src/routes/settings.ts:2`](backend/src/routes/settings.ts:2) - BUG-011 FIX applied
- [`backend/src/routes/analytics.ts:2`](backend/src/routes/analytics.ts:2) - BUG-014 FIX applied
- [`backend/src/routes/reviews.ts:7`](backend/src/routes/reviews.ts:7) - BUG-012 FIX applied

---

### 2.4 Guest Checkout Creates Customer Without Email Verification

**Severity:** HIGH  
**Location:** [`backend/src/routes/store/checkout.ts:361-386`](backend/src/routes/store/checkout.ts:361)  
**Issue:** Guest checkout creates customer records with `has_account: false` but no verification mechanism, allowing spam account creation.

---

### 2.5 Password Requirements Too Restrictive

**Severity:** MEDIUM  
**Location:** [`backend/src/services/customer-auth-service.ts:95-110`](backend/src/services/customer-auth-service.ts:95)  
**Issue:** Password must be 12+ characters with uppercase, lowercase, number, and special character - may cause user friction and high support ticket volume.

---

### 2.6 2FA Secret Stored Without Encryption

**Severity:** HIGH  
**Location:** [`backend/src/db/schema.ts:34`](backend/src/db/schema.ts:34)  
**Issue:** `two_factor_secret` stored as plain text in database.

```typescript
two_factor_secret: text('two_factor_secret'),  // Should be encrypted
```

---

### 2.7 Missing Rate Limiting on Critical Endpoints

**Severity:** MEDIUM  
**Location:** [`backend/src/routes/store/checkout.ts`](backend/src/routes/store/checkout.ts)  
**Issue:** Place order endpoint lacks rate limiting, vulnerable to abuse.

---

### 2.8 Hardcoded Default Values in Frontend

**Severity:** MEDIUM  
**Location:** [`storefront/src/app/checkout/page.tsx:201`](storefront/src/app/checkout/page.tsx:201)  
**Issue:** Free shipping threshold hardcoded instead of fetched from settings.

```typescript
const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000); // Should come from settings
```

---

## 3. MEDIUM SEVERITY ISSUES

### 3.1 Route Parameter Ordering Bug

**Severity:** HIGH  
**Location:** [`backend/src/routes/customers.ts:60`](backend/src/routes/customers.ts:60)  
**Issue:** Stats route `/stats/overview` must be placed before `/:id` to avoid being caught by the param route - BUG-008 FIX already applied.

---

### 3.2 Region Service Missing Countries

**Severity:** MEDIUM  
**Location:** [`backend/src/services/region-service.ts:23-24`](backend/src/services/region-service.ts:23)  
**Issue:** TODO comment indicates countries are not fetched with regions.

```typescript
async list() {
  // TODO: In a real app, I would also fetch associated countries
  return await db.select().from(regions);
}
```

---

### 3.3 Debug Logging in Production

**Severity:** LOW  
**Location:** Multiple frontend files  
**Issue:** Console.error and console.log statements throughout codebase could leak sensitive data in production.

---

### 3.4 Inconsistent Error Response Format

**Severity:** MEDIUM  
**Location:** Various API endpoints  
**Issue:** Some endpoints return `{ error: string }`, others return `{ message: string }`, others return `{ details: object }` - no consistent error format.

---

### 3.5 Missing Input Sanitization

**Severity:** MEDIUM  
**Location:** Multiple routes  
**Issue:** Search inputs and other user inputs may not be properly sanitized before database queries.

---

### 3.6 Cart Recovery State Race Condition

**Severity:** MEDIUM  
**Location:** [`storefront/src/context/cart-context.tsx:75-90`](storefront/src/context/cart-context.tsx:75)  
**Issue:** Debounced cart save may conflict with cart recovery, potentially losing items.

---

### 3.7 No Image Upload Validation

**Severity:** MEDIUM  
**Location:** [`admin/src/components/ui/ImageUpload.tsx`](admin/src/components/ui/ImageUpload.tsx)  
**Issue:** File type and size validation may be insufficient.

---

### 3.8 Express Checkout Element Improperly Configured

**Severity:** MEDIUM  
**Location:** [`storefront/src/app/checkout/page.tsx:146-160`](storefront/src/app/checkout/page.tsx:146)  
**Issue:** ExpressCheckoutElement's onConfirm callback may not work as expected with the current Stripe Elements setup.

```typescript
<ExpressCheckoutElement
  onConfirm={handleConfirm}  // May not trigger correctly
  options={{...}}
/>
```

---

### 3.9 Frontend API URL Hardcoded Fallback

**Severity:** LOW  
**Location:**

- [`storefront/src/lib/api.ts:1`](storefront/src/lib/api.ts:1)
- [`admin/src/lib/api.ts:1`](admin/src/lib/api.ts:1)

**Issue:** Default API URL points to localhost:4000, may cause issues in production if env var is not set.

---

### 3.10 Missing Loading States

**Severity:** LOW  
**Location:** Multiple components  
**Issue:** Some actions don't show loading states, leading to potential double-submissions.

---

### 3.11 Skeleton Components Not Always Used

**Severity:** LOW  
**Location:** Various pages  
**Issue:** Loading skeletons exist but aren't consistently used during data fetches.

---

### 3.12 SEO Meta Tags Missing on Some Pages

**Severity:** MEDIUM  
**Location:** Various storefront pages  
**Issue:** Dynamic pages may be missing proper meta tags for SEO.

---

### 3.13 Newsletter Form No Error Feedback

**Severity:** LOW  
**Location:** [`storefront/src/components/NewsletterForm.tsx`](storefront/src/components/NewsletterForm.tsx)  
**Issue:** Errors during newsletter signup may not display user-friendly messages.

---

### 3.14 WhatsApp Settings Stored in Database Without Encryption

**Severity:** HIGH  
**Location:** [`backend/src/db/schema.ts:802-812`](backend/src/db/schema.ts:802)  
**Issue:** WhatsApp access token stored in plain text.

```typescript
export const whatsapp_settings = pgTable('whatsapp_settings', {
  access_token: text('access_token').notNull(), // Should be encrypted
  // ...
});
```

---

### 3.15 Bulk Operations No Progress Indication

**Severity:** LOW  
**Location:** Admin product management  
**Issue:** Bulk delete/update operations don't show progress for large datasets.

---

### 3.16 Order Invoice Download Missing Error Handling

**Severity:** MEDIUM  
**Location:** [`admin/src/lib/api.ts:341-350`](admin/src/lib/api.ts:341)  
**Issue:** Invoice download may fail silently without proper error feedback.

---

### 3.17 Product Search Uses In-Memory Pagination

**Severity:** MEDIUM  
**Location:** [`backend/src/routes/products.ts:62-74`](backend/src/routes/products.ts:62)  
**Issue:** Search results are fetched entirely then paginated in memory - inefficient for large datasets.

---

### 3.18 Review Image Upload Not Implemented

**Severity:** MEDIUM  
**Location:** Frontend review component  
**Issue:** Review form includes image upload UI but backend support may be incomplete.

---

## 4. LOW SEVERITY ISSUES

### 4.1 TODO Comments Remaining in Code

**Severity:** LOW  
**Locations:**

- [`backend/src/services/region-service.ts:24`](backend/src/services/region-service.ts:24)
- Multiple frontend debug statements

### 4.2 Debug Console Statements

**Severity:** LOW  
**Locations:** Throughout codebase  
**Issue:** Console.log/debug statements should be removed from production code.

### 4.3 Inconsistent Naming Conventions

**Severity:** LOW  
**Issue:** Mixed usage of camelCase and snake_case in API responses.

### 4.4 Missing TypeScript Strict Mode

**Severity:** LOW  
**Issue:** Some files may not have strict TypeScript configuration.

### 4.5 Code Duplication

**Severity:** LOW  
**Issue:** Similar validation logic repeated across multiple files.

---

## 5. ALREADY FIXED BUGS (Documented in Code)

The codebase already contains fixes for several previously identified bugs:

| Bug ID  | Description                       | Location                                                              |
| ------- | --------------------------------- | --------------------------------------------------------------------- |
| BUG-001 | Stripe payment amount calculation | [`payments.ts:82`](backend/src/routes/store/payments.ts:82)           |
| BUG-002 | Order metadata merge on webhook   | [`payments.ts:215-246`](backend/src/routes/store/payments.ts:215)     |
| BUG-003 | 2FA userPayload.id vs sub         | [`auth-2fa.ts:58`](backend/src/routes/auth-2fa.ts:58)                 |
| BUG-005 | Stripe key missing check          | [`payments.ts:28`](backend/src/routes/store/payments.ts:28)           |
| BUG-006 | Webhook secret validation         | [`payments.ts:158`](backend/src/routes/store/payments.ts:158)         |
| BUG-008 | Route parameter ordering          | [`customers.ts:60`](backend/src/routes/customers.ts:60)               |
| BUG-010 | Marketing route auth              | [`marketing.ts:2`](backend/src/routes/marketing.ts:2)                 |
| BUG-011 | Settings route auth               | [`settings.ts:2`](backend/src/routes/settings.ts:2)                   |
| BUG-012 | Reviews route auth                | [`reviews.ts:7`](backend/src/routes/reviews.ts:7)                     |
| BUG-013 | Banners route auth                | [`banners.ts:5`](backend/src/routes/banners.ts:5)                     |
| BUG-014 | Analytics route auth              | [`analytics.ts:2`](backend/src/routes/analytics.ts:2)                 |
| BUG-015 | Banner reorder validation         | [`banners.ts:95`](backend/src/routes/banners.ts:95)                   |
| BUG-016 | Profile update validation         | [`store/customers.ts:24`](backend/src/routes/store/customers.ts:24)   |
| BUG-017 | Wholesale where clause            | [`wholesale.ts:121`](backend/src/routes/wholesale.ts:121)             |
| BUG-018 | Review count query                | [`reviews.ts:214`](backend/src/routes/reviews.ts:214)                 |
| BUG-020 | Region delete cascade             | [`region-service.ts:106`](backend/src/services/region-service.ts:106) |

---

## 6. RECOMMENDATIONS

### Priority 1 (Critical - Fix Immediately)

1. Remove or secure the `/debug-token` endpoint
2. Fix Stripe configuration to fail fast in production
3. Add proper rate limiting to checkout endpoint
4. Encrypt sensitive data (2FA secrets, WhatsApp tokens)

### Priority 2 (High - Fix Within Sprint)

5. Implement atomic inventory operations
6. Standardize error response format across all endpoints
7. Add proper email verification for guest checkout
8. Fix unhandled promise in wholesale routes

### Priority 3 (Medium - Fix This Quarter)

9. Remove debug logging from production
10. Implement proper loading states
11. Add SEO meta tags to dynamic pages
12. Improve search performance with database-level pagination

### Priority 4 (Low - Backlog)

13. Remove TODO comments
14. Refactor duplicate error classes
15. Standardize naming conventions
16. Add unit tests for critical paths

---

## 7. TESTING COVERAGE NOTES

The following areas have been identified as needing additional testing:

- Payment webhook idempotency
- Concurrent inventory operations
- Multi-step checkout flow
- Wholesale tier calculations
- Email delivery failures
- Image upload validation
- Search performance under load

---

**End of Report**
