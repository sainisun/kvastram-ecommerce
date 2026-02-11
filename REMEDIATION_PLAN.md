# Kvastram Ecommerce - Complete Remediation Plan

**Created:** 2026-02-11
**Based on:** Professional Code Audit
**Last Updated:** 2026-02-11
**Purpose:** Fix ALL issues affecting customers, money, and legal compliance

---

## ⚠️ IMPORTANT DISCLAIMER

This plan prioritizes fixes that affect **REAL CUSTOMERS** and **REAL MONEY** over code quality. Code quality matters, but customers losing money or legal non-compliance matters more.

---

## DAILY SCHEDULE

| Day | Focus | Fixes | Hours |
|-----|-------|-------|-------|
| Day 1 | Inventory & Stock | 001, 002, 003 | 8 |
| Day 2 | Security (CSRF + Secrets) | 004, 009 | 6 |
| Day 3 | Business Logic (Tax + Discounts) | 005, 006 | 6 |
| Day 4 | Payments (Webhook + Logs) | 007, 012 | 5 |
| Day 5 | Authentication | 010, 011 | 6 |
| Day 6 | Legal Pages | 008 | 4 |
| Day 7 | Full Testing | All Phase 1 | 8 |
| Days 8-21 | Phase 2 Code Quality | Q1-Q8 | 50+ |

**Total Phase 1 Time:** ~43 hours

---

## PHASE 1: 🔴 TRULY CRITICAL — Money & Legal

These fixes directly affect customers, revenue, and legal compliance.

---

### FIX-001: Inventory Validation in Checkout
Severity: 🔴 Critical (Money Loss)
Complexity: Medium
Risk: High

**Problem:** No inventory check - customers can buy out-of-stock items

**Files to modify:**
- `backend/src/routes/store/checkout.ts`

**New files:**
- None

**New packages:**
- None

**Database changes:** No

**Depends on:** None (Day 1)

**Test after:**
```bash
# Test flow:
# 1. Add item with inventory_quantity = 1 to cart
# 2. Complete checkout
# 3. Verify order created
# 4. Try to buy same item again - should fail
# 5. Check inventory_quantity decremented in DB
```

**Could break:** Entire checkout flow

**Implementation notes:**
```typescript
// BEFORE order creation:
const insufficientItems = await db.query.variants.findMany({
  where: and(
    inArray(variant.id, itemVariantIds),
    sql`${variant.inventory_quantity} < ${itemQuantities}`
  )
})

if (insufficientItems.length > 0) {
  throw new Error(`Insufficient stock for: ${insufficientItems.map(i => i.title).join(', ')}`)
}

// AFTER successful payment:
await db.transaction(async (tx) => {
  for (const item of cartItems) {
    await tx.update(variants)
      .set({ inventory_quantity: sql`${variant.inventory_quantity} - ${item.quantity}` })
      .where(eq(variant.id, item.variantId))
  }
})
```

---

### FIX-002: Race Condition Prevention
Severity: 🔴 Critical (Overselling)
Complexity: Hard
Risk: High

**Problem:** Two users can buy same last item simultaneously

**Files to modify:**
- `backend/src/routes/store/checkout.ts`
- `backend/src/db/schema.ts` (for constraint)

**New files:**
- None

**New packages:**
- None

**Database changes:** YES

**Depends on:** FIX-001 (Day 1, same day)

**Test after:**
```bash
# Test with curl or Postman:
# 1. Set item inventory to 1
# 2. Run 2 concurrent checkout requests
# 3. Only 1 should succeed
# 4. Check only 1 order created
```

**Could break:** High concurrency scenarios

**Implementation notes:**
```typescript
// Use SELECT FOR UPDATE for pessimistic locking
const variants = await db.transaction(async (tx) => {
  // Lock rows and get current inventory
  const lockedVariants = await tx.select()
    .from(variants)
    .where(inArray(variants.id, itemIds))
    .for('update')  // This is the key - locks rows
  
  // Check inventory on locked rows
  for (const item of cartItems) {
    const v = lockedVariants.find(v => v.id === item.variantId)
    if (!v || v.inventory_quantity < item.quantity) {
      throw new Error('Item out of stock')
    }
  }
  
  // Deduct inventory
  for (const item of cartItems) {
    await tx.update(variants)
      .set({ inventory_quantity: sql`${variant.inventory_quantity} - ${item.quantity}` })
      .where(eq(variant.id, item.variantId))
  }
  
  return lockedVariants
})
```

---

### FIX-003: Database Constraint for Non-Negative Inventory
Severity: 🔴 Critical (Safety Net)
Complexity: Easy
Risk: Low

**Problem:** No DB-level constraint - inventory can go negative

**Files to modify:**
- `backend/src/db/schema.ts`

**New files:**
- None

**New packages:**
- None

**Database changes:** YES (migration required)

**Depends on:** FIX-002 (Day 1, same day)

**Test after:**
```bash
# Try to set inventory to -5 via SQL
# Should fail with constraint violation
```

**Could break:** Nothing - adds protection

**Implementation notes:**
```typescript
// In schema.ts, variants table:
inventory_quantity: integer('inventory_quantity')
  .notNull()
  .default(0)
  .check(sql`inventory_quantity >= 0`),  // Add this constraint
```

---

### FIX-004: CSRF Protection on Checkout & Payment
Severity: 🔴 Critical (Fraud Risk)
Complexity: Medium
Risk: Medium

**Problem:** No CSRF protection - attackers can submit fake orders

**Files to modify:**
- `backend/src/index.ts`
- `backend/src/routes/store/checkout.ts`
- `backend/src/routes/store/payments.ts`
- `admin/src/context/auth-context.tsx` (for CSRF token)

**New files:**
- `backend/src/middleware/csrf.ts`

**New packages:**
- None (Hono has built-in CSRF support)

**Database changes:** No

**Depends on:** None (Day 2)

**Test after:**
```bash
# Try to submit checkout from different origin
# Should fail with 403 Forbidden
```

**Could break:** Cross-origin legitimate requests

**Implementation notes:**
```typescript
// In backend/src/index.ts:
import { csrf } from 'hono/csrf'

// Apply CSRF to routes that modify data
app.use('/store/checkout/*', csrf())
app.use('/store/payments/*', csrf())

// In frontend, include CSRF token in headers
// When logging in, backend sets CSRF cookie
// Frontend reads cookie and includes in X-CSRF-Token header
```

---

### FIX-005: Tax Calculation (GST)
Severity: 🔴 Critical (Legal/Tax Violation)
Complexity: Medium
Risk: Medium

**Problem:** `taxTotal = 0` hardcoded - GST violation

**Files to modify:**
- `backend/src/routes/store/checkout.ts`
- `backend/src/services/order-service.ts`
- `backend/src/db/schema.ts` (for tax rate in regions)

**New files:**
- `backend/src/utils/tax-calculator.ts`

**New packages:**
- None

**Database changes:** YES (add tax_rate to regions)

**Depends on:** None (Day 3)

**Test after:**
```bash
# Place order
# Check order.tax_total is calculated, not 0
# Check GST breakdown is stored
# Verify with different regions have different tax rates
```

**Could break:** Order pricing calculations

**Implementation notes:**
```typescript
// In utils/tax-calculator.ts:
export function calculateGST(
  subtotal: number,
  regionId: string,
  productCategories: string[]
): { taxRate: number; taxAmount: number; breakdown: object } {
  // Get region tax rate
  const region = await db.query.regions.findFirst({
    where: eq(regions.id, regionId)
  })
  
  // Different rates for different product categories
  // Some items may be GST-exempt
  let taxRate = region?.tax_rate || 0
  
  // Example: Luxury items 18%, Essentials 5%, Books 0%
  const categoryRates: Record<string, number> = {
    'luxury': 0.18,
    'clothing': 0.12,
    'books': 0.05,
    'food': 0.05,
    'default': taxRate
  }
  
  // Calculate per-item tax
  const itemsWithTax = items.map(item => {
    const itemTaxRate = categoryRates[item.category] || taxRate
    const itemTax = Math.round(item.price * itemTaxRate)
    return { ...item, tax: itemTax, taxRate: itemTaxRate }
  })
  
  const totalTax = itemsWithTax.reduce((sum, item) => sum + item.tax, 0)
  
  return {
    taxRate,
    taxAmount: totalTax,
    breakdown: itemsWithTax
  }
}
```

---

### FIX-006: Discount Code Per-Customer Usage Limit
Severity: 🔴 Critical (Revenue Loss)
Complexity: Medium
Risk: Medium

**Problem:** Discount codes can be used unlimited times - revenue loss

**Files to modify:**
- `backend/src/db/schema.ts`
- `backend/src/routes/store/checkout.ts`

**New files:**
- `backend/src/db/schema-discounts.ts` (tracking table)

**New packages:**
- None

**Database changes:** YES

**Depends on:** None (Day 3, after FIX-005)

**Test after:**
```bash
# Create discount code with limit: 1 per customer
# Use it once - should work
# Try to use again - should fail
# Check discount_usage table has record
```

**Could break:** Existing discount flow

**Implementation notes:**
```typescript
// New table in schema-discounts.ts:
export const discountUsage = pgTable('discount_usage', {
  id: serial('id').primaryKey(),
  discountCode: text('discount_code').notNull(),
  customerId: text('customer_id').notNull(),
  orderId: text('order_id').notNull(),
  usedAt: timestamp('used_at').defaultNow()
})

// In checkout.ts, before applying discount:
const usageCount = await db.query.discountUsage.findMany({
  where: and(
    eq(discountUsage.discountCode, code),
    eq(discountUsage.customerId, customerId)
  )
})

if (usageCount.length >= 1) {
  throw new Error('Discount already used')
}
```

---

### FIX-007: Stripe Webhook Idempotency
Severity: 🔴 Critical (Double Payment)
Complexity: Hard
Risk: High

**Problem:** No idempotency check - duplicate webhook = double charge

**Files to modify:**
- `backend/src/db/schema.ts`
- `backend/src/routes/store/payments.ts`

**New files:**
- `backend/src/db/schema-events.ts` (webhook events table)

**New packages:**
- None

**Database changes:** YES

**Depends on:** None (Day 4)

**Test after:**
```bash
# Send same Stripe webhook twice
# Only first should process
# Second should be skipped (check logs)
# Verify order not duplicated
```

**Could break:** Payment processing

**Implementation notes:**
```typescript
// New table:
export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').unique().notNull(),  // Stripe's event ID
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at'),
  status: text('status').default('pending') // pending, processed, failed
})

// In webhook handler:
const eventId = stripeEvent.id

// Check if already processed
const existing = await db.query.webhookEvents.findFirst({
  where: eq(webhookEvents.eventId, eventId)
})

if (existing?.processedAt) {
  console.log('Duplicate webhook, skipping')
  return c.json({ received: true })
}

// Process webhook
await db.insert(webhookEvents).values({
  eventId,
  eventType: stripeEvent.type,
  status: 'processed',
  processedAt: new Date()
})
```

---

### FIX-008: Legal Pages
Severity: 🔴 Critical (Legal Non-Compliance)
Complexity: Medium
Risk: Low

**Problem:** No legal pages - ILLEGAL in most jurisdictions

**Files to modify:**
- None

**New files to create:**
- `storefront/src/app/privacy/page.tsx`
- `storefront/src/app/terms/page.tsx`
- `storefront/src/app/refund-policy/page.tsx`
- `storefront/src/app/shipping-policy/page.tsx`
- `storefront/src/components/CookieConsent.tsx`
- `storefront/src/app/layout.tsx` (add footer links + cookie banner)

**New packages:**
- None

**Database changes:** No

**Depends on:** None (Day 6)

**Test after:**
```bash
# Check each page loads
# Check footer has links
# Check cookie banner appears on first visit
# Check Accept/Reject buttons work
```

**Could break:** Nothing

**Implementation notes:**
```typescript
// CookieConsent.tsx - shows on first visit
// Privacy Policy - covers GDPR, data handling
// Terms & Conditions - covers user agreement
// Refund Policy - covers returns
// Shipping Policy - covers delivery
// All pages should have proper legal text (lawyer review recommended)
```

---

### FIX-009: Hardcoded Secrets Removal
Severity: 🔴 Critical (Security)
Complexity: Easy
Risk: High

**Problem:** JWT_SECRET has fallback - insecure fallback

**Files to modify:**
- `backend/src/services/auth-service.ts`
- `backend/src/config/index.ts`

**New files:**
- `backend/.env.example` (already exists, update it)

**New packages:**
- None

**Database changes:** No

**Depends on:** None (Day 2)

**Test after:**
```bash
# Try to start backend without JWT_SECRET
# Should fail immediately with clear error
# Should NOT use fallback
```

**Could break:** Auth if env missing

**Implementation notes:**
```typescript
// In config/index.ts:
import 'dotenv/config'

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Remove fallback in auth-service.ts:
const JWT_SECRET = process.env.JWT_SECRET!
```

---

### FIX-010: JWT from LocalStorage to HttpOnly Cookies
Severity: 🔴 Critical (XSS Vulnerability)
Complexity: Medium
Risk: High

**Problem:** JWT in localStorage - vulnerable to XSS attacks

**Files to modify:**
- `admin/src/context/auth-context.tsx`
- `backend/src/services/auth-service.ts`
- `backend/src/routes/auth.ts`
- `storefront/src/context/auth-context.tsx`

**New files:**
- None

**New packages:**
- None (Hono supports httpOnly cookies)

**Database changes:** No

**Depends on:** FIX-009 (Day 5, after secrets)

**Test after:**
```bash
# Login
# Check JWT is in cookie, NOT in localStorage
# Check console - no JWT visible
# Refresh page - should stay logged in
# Logout - cookie should be cleared
```

**Could break:** Entire auth system

**Implementation notes:**
```typescript
// Backend - set cookie on login:
c.json({
  success: true
}, {
  headers: {
    'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*24*7}`
  }
})

// Frontend - NO NEED to read cookie!
// Backend middleware reads token from Cookie header automatically
// Frontend just needs to include credentials: 'include' in fetch
// Remove all localStorage token storage
```

---

### FIX-011: Email Verification for Customer Accounts
Severity: 🟠 High (Fake Accounts)
Complexity: Medium
Risk: Medium

**Problem:** No email verification - fake accounts allowed

**Files to modify:**
- `backend/src/db/schema.ts`
- `backend/src/services/customer-auth-service.ts`
- `backend/src/routes/store/auth.ts`

**New files:**
- `backend/src/services/email-verification.ts`
- `storefront/src/context/auth-context.tsx` (handle verified state)

**New packages:**
- `npm install nodemailer` (if not installed)

**Database changes:** YES

**Depends on:** FIX-010 (Day 5, after cookie auth)

**Test after:**
```bash
# Register new account
# Should NOT be able to login immediately
# Check email for verification link
# Click link - account verified
# Now login works
```

**Could break:** Registration flow

**Implementation notes:**
```typescript
// Add to customers table:
isEmailVerified: boolean('is_email_verified').default(false),
emailVerificationToken: text('email_verification_token'),
emailVerificationExpires: timestamp('email_verification_expires'),

// On registration:
const verificationToken = crypto.randomBytes(32).toString('hex')
await db.insert(customers).values({
  ...data,
  isEmailVerified: false,
  emailVerificationToken: verificationToken,
  emailVerificationExpires: new Date(Date.now() + 24*60*60*1000) // 24 hours
})

// Send email with link:
// http://localhost:3000/verify-email?token=${verificationToken}
```

---

### FIX-012: Log Sanitization
Severity: 🟠 High (Security/PII Leak)
Complexity: Easy
Risk: Low

**Problem:** Sensitive data in logs - card numbers, tokens

**Files to modify:**
- `backend/src/routes/store/payments.ts`
- `backend/src/routes/auth.ts`
- `backend/src/services/auth-service.ts`
- All files with console.log

**New files:**
- `backend/src/utils/logger.ts`

**New packages:**
- None (use existing logger)

**Database changes:** No

**Depends on:** None (Day 4)

**Test after:**
```bash
# Make payment
# Check logs - no card numbers visible
# Check logs - no full JWT visible
# Check logs - no PII visible
```

**Could break:** Debugging capability

**Implementation notes:**
```typescript
// In logger.ts:
export function sanitizeForLog(data: any): any {
  const sensitiveFields = [
    'card_number', 'cvv', 'password', 'token',
    'jwt', 'authorization', 'secret', 'api_key',
    'email', 'phone', 'address'
  ]
  
  function sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    
    const result: any = Array.isArray(obj) ? [] : {}
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        result[key] = sanitize(obj[key])
      } else {
        result[key] = obj[key]
      }
    }
    return result
  }
  
  return sanitize(data)
}
```

---

## PHASE 2: 🟠 CODE QUALITY — Important but Not Urgent

Move current Phase 1 code quality fixes here.

---

### FIX-Q1: Enable Strict TypeScript
Severity: 🟠 High
Complexity: Easy
Risk: Low

**Files to modify:**
- `backend/tsconfig.json`
- `storefront/tsconfig.json`
- `admin/tsconfig.json`

**New packages:** None

**Database changes:** No

**Depends on:** Phase 1 complete

**Test after:** `npm run build` passes

---

### FIX-Q2: Remove All `any` Types
Severity: 🟠 High
Complexity: Medium
Risk: Medium

**Files to modify:**
- `backend/src/routes/auth.ts` (user: any)
- `admin/src/context/auth-context.tsx` (user, context any)
- `backend/src/db/schema.ts` (multiple any)
- `admin/src/lib/api.ts` (generic types)

**New packages:** None

**Database changes:** No

**Depends on:** FIX-Q1

**Test after:** TypeScript compilation succeeds

---

### FIX-Q3: Create asyncHandler Utility
Severity: 🟠 High
Complexity: Easy
Risk: Low

**Files to modify:**
- `backend/src/middleware/error-handler.ts`

**New packages:** None

**Database changes:** No

**Depends on:** None

**Test after:** Error handling consistent

---

### FIX-Q4: Standardize Error Handling
Severity: 🟠 High
Complexity: Medium
Risk: Medium

**Files to modify:**
- `backend/src/routes/categories.ts`
- `backend/src/routes/regions.ts`
- `backend/src/routes/products.ts`
- All route files

**New packages:** None

**Database changes:** No

**Depends on:** FIX-Q3

**Test after:** All errors return consistent format

---

### FIX-Q5: Standardize Response Format
Severity: 🟠 High
Complexity: Medium
Risk: Medium

**Files to modify:**
- All route files using raw c.json()

**New packages:** None

**Database changes:** No

**Depends on:** FIX-Q4

**Test after:** API responses consistent

---

### FIX-Q6: Add Rate Limiting
Severity: 🟠 High
Complexity: Easy
Risk: Low

**Files to modify:**
- `backend/src/index.ts`

**New packages:**
- `npm install @upstash/ratelimit`
- `npm install @upstash/redis`

**Database changes:** No

**Depends on:** None

**Test after:** Rate limits enforced

---

### FIX-Q7: Fix Empty Catch Blocks
Severity: 🟠 High
Complexity: Easy
Risk: Low

**Files to modify:**
- `admin/src/lib/api.ts`
- All files with empty catch

**New packages:** None

**Database changes:** No

**Depends on:** None

**Test after:** Errors are logged

---

### FIX-Q8: Add Missing Security Headers
Severity: 🟡 Medium
Complexity: Easy
Risk: Low

**Files to modify:**
- `backend/src/index.ts`

**New packages:** None

**Database changes:** No

**Depends on:** None

**Test after:** Headers present in response

---

### FIX-Q9: Account Lockout Mechanism
Severity: 🟠 High (Brute Force Protection)
Complexity: Easy
Risk: Low

**Problem:** No account lockout - attackers can brute force passwords

**Files to modify:**
- `backend/src/services/auth-service.ts`
- `backend/src/db/schema.ts` (add failed_login_attempts, locked_until)

**New files:**
- None

**New packages:** None

**Database changes:** YES (add columns to customers/admin_users)

**Depends on:** Phase 1 complete

**Test after:**
```bash
# Try wrong password 5 times
# Account should be locked
# Wait 15 minutes, try again - should work
```

**Could break:** Legitimate users forgetting passwords

**Implementation notes:**
```typescript
// Add to schema:
failedLoginAttempts: integer('failed_login_attempts').default(0),
lockedUntil: timestamp('locked_until'),

// In auth service, on failed login:
if (failedAttempts >= 5) {
  await db.update(customers)
    .set({
      lockedUntil: new Date(Date.now() + 15*60*1000),
      failedLoginAttempts: failedAttempts + 1
    })
    .where(eq(customers.id, customerId))
}

// On successful login, reset counter:
await db.update(customers)
  .set({
    failedLoginAttempts: 0,
    lockedUntil: null
  })
```

---

### FIX-Q10: Password Policy Enforcement
Severity: 🟠 High (Security Best Practice)
Complexity: Easy
Risk: Low

**Problem:** No password complexity requirements

**Files to modify:**
- `backend/src/services/auth-service.ts`
- `backend/src/services/customer-auth-service.ts`

**New files:**
- `backend/src/utils/password-validator.ts`

**New packages:** None

**Database changes:** No

**Depends on:** None

**Test after:**
```bash
# Try to register with 'password123' - should fail
# Try with 'MyPass123!@#' - should succeed
```

**Could break:** Users with weak passwords

**Implementation notes:**
```typescript
// password-validator.ts:
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 12) errors.push('Minimum 12 characters')
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('At least 1 number')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least 1 special character')
  
  return { valid: errors.length === 0, errors }
}
```

---

## PHASE 3: 🟡 ARCHITECTURE — Do When Stable

| Fix | Description | Files |
|-----|-------------|-------|
| Q11 | Refactor god functions | product-service.ts |
| Q12 | Split schema.ts | db/schema/*.ts |
| Q13 | Repository pattern | routes/*.ts |
| Q14 | Pagination utility | utils/pagination.ts |
| Q15 | API documentation | docs/openapi.yaml |
| Q16 | Custom error classes | errors/*.ts |
| Q17 | Add transactions | service files |

---

## PHASE 4: 🟢 NICE TO HAVE

| Fix | Description |
|-----|-------------|
| Q18 | Factory pattern |
| Q19 | Strategy pattern |
| Q20 | Event system |
| Q21 | Caching layer |
| Q22 | Feature flags |
| Q23 | Performance benchmarks |
| Q24 | E2E tests |

---

## FILE CHANGE MAP

| File Path | Fix IDs | Total Changes |
|-----------|---------|---------------|
| `backend/src/routes/store/checkout.ts` | 001, 002, 005, 006 | 4 |
| `backend/src/routes/store/payments.ts` | 004, 007, 012 | 3 |
| `backend/src/routes/auth.ts` | 004, 010, 012 | 3 |
| `backend/src/services/auth-service.ts` | 009, 010, 012 | 3 |
| `backend/src/services/customer-auth-service.ts` | 011 | 1 |
| `backend/src/db/schema.ts` | 002, 003, 005, 006, 011, Q9 | 6 |
| `backend/src/db/schema-discounts.ts` | 006 | 1 |
| `backend/src/db/schema-events.ts` | 007 | 1 |
| `backend/src/middleware/csrf.ts` | 004 | 1 |
| `backend/src/utils/tax-calculator.ts` | 005 | 1 |
| `backend/src/utils/logger.ts` | 012 | 1 |
| `backend/src/utils/email-verification.ts` | 011 | 1 |
| `admin/src/context/auth-context.tsx` | 004, 010, 011 | 3 |
| `storefront/src/context/auth-context.tsx` | 010, 011 | 2 |
| `storefront/src/app/privacy/page.tsx` | 008 | 1 |
| `storefront/src/app/terms/page.tsx` | 008 | 1 |
| `storefront/src/app/refund-policy/page.tsx` | 008 | 1 |
| `storefront/src/app/shipping-policy/page.tsx` | 008 | 1 |
| `storefront/src/components/CookieConsent.tsx` | 008 | 1 |
| `backend/src/utils/password-validator.ts` | Q10 | 1 |

**Total unique files modified:** 29
**Total new files created:** 12

---

## NEW FILES TO CREATE

| File Path | Purpose | Fix ID |
|-----------|---------|--------|
| `backend/src/db/schema-discounts.ts` | Discount usage tracking | 006 |
| `backend/src/db/schema-events.ts` | Webhook events | 007 |
| `backend/src/middleware/csrf.ts` | CSRF protection | 004 |
| `backend/src/utils/tax-calculator.ts` | GST calculation | 005 |
| `backend/src/utils/logger.ts` | Sanitized logging | 012 |
| `backend/src/utils/email-verification.ts` | Email verify | 011 |
| `storefront/src/app/privacy/page.tsx` | Legal page | 008 |
| `storefront/src/app/terms/page.tsx` | Legal page | 008 |
| `storefront/src/app/refund-policy/page.tsx` | Legal page | 008 |
| `storefront/src/app/shipping-policy/page.tsx` | Legal page | 008 |
| `storefront/src/components/CookieConsent.tsx` | Cookie banner | 008 |
| `backend/src/utils/password-validator.ts` | Password policy | Q10 |

---

## NEW PACKAGES TO INSTALL

| Package | Purpose | Fix ID | Command |
|---------|---------|---------|---------|
| nodemailer | Email sending | 011 | `npm install nodemailer` |
| @upstash/ratelimit | Rate limiting | Q6 | `npm install @upstash/ratelimit` |
| @upstash/redis | Rate limiting backend | Q6 | `npm install @upstash/redis` |

---

## DATABASE CHANGES

| Change | Table | Fix ID | Migration Required |
|--------|-------|--------|-------------------|
| Add FK constraints | variants | 003 | Yes |
| Add CHECK constraint | variants | 003 | Yes |
| Add tax_rate column | regions | 005 | Yes |
| Add discount_usage table | - | 006 | Yes |
| Add webhook_events table | - | 007 | Yes |
| Add email verification columns | customers | 011 | Yes |
| Add failed_login_attempts, locked_until | customers, admin_users | Q9 | Yes |

---

## TESTING CHECKLIST

### After Each Fix:

**Quick (2 min):**
```bash
npm run build
npm run lint
```

**Full (10 min):**
```bash
# Manual tests:
# 1. Register new account
# 2. Login
# 3. Browse products
# 4. Add to cart
# 5. Checkout (with inventory check)
# 6. Verify email (if implemented)
```

### Phase 1 Full Test:

| Test | Expected Result | Fix IDs |
|------|-----------------|---------|
| Buy out-of-stock item | Should fail | 001, 002, 003 |
| Two users buy last item | Only 1 succeeds | 002 |
| Use discount twice | Second should fail | 006 |
| Checkout without CSRF | Should fail 403 | 004 |
| Tax calculated | Not 0 | 005 |
| Duplicate webhook | Only 1 processes | 007 |
| Legal pages exist | 4 pages load | 008 |
| No JWT in localStorage | In httpOnly cookie | 010 |
| Unverified email | Cannot login | 011 |
| No PII in logs | Redacted data | 012 |

---

## ROLLBACK PLAN

### Before Each Fix:

```bash
git add -A
git commit -m "PRE-FIX: [Fix ID]"
git tag fix-[ID]
```

### If Fix Breaks:

**Code fix:** `git checkout fix-[ID]`

**Database fix:** Restore from backup

**Known rollback commands:**
- FIX-010: Revert auth changes for localStorage
- FIX-006: Drop discount_usage table
- FIX-007: Drop webhook_events table
- FIX-011: Drop verification columns
- FIX-Q9: Drop lockout columns

---

## IMPLEMENTATION ORDER

Just tell me:
1. **"Start Phase 1 Day 1"** - Inventory fixes (FIX-001, 002, 003)
2. **"Start [Fix-ID]"** - Any specific fix
3. **"Do all Phase 1"** - All 12 critical fixes
4. **"Do Phase 2"** - Code quality + security fixes (Q1-Q10)

**Phase 1:** 12 fixes (Days 1-7)
**Phase 2:** 10 fixes (Q1-Q10)
**Phase 3:** 7 fixes (Q11-Q17)
**Phase 4:** 6 fixes (Q18-Q24)

I will NOT write code until you ask! 🚀
