# Products Loading Error - Professional Fix Plan

**Date:** 2026-02-11
**Status:** 🔴 INVESTIGATION NEEDED
**Error:** "Unable to Load Products"

---

## Executive Summary

The storefront shows "Unable to Load Products" error on the products catalog page. This is caused by the error boundary at `src/app/products/error.tsx` catching errors from the products page.

---

## Risk Assessment

### Before Fixing (Current State)
- ✅ Products page shows error message
- ✅ Homepage may show global error
- ✅ Users cannot browse products

### After Fixing (Expected State)
- ✅ Products load successfully
- ✅ Smooth user experience
- ⚠️ Risk: New bugs if changes not tested properly

### Risk Mitigation Strategy
1. **No direct code changes in this plan** - Only diagnostic steps
2. **Test each change individually**
3. **Rollback plan for each fix
4. **Monitor error logs after each change**

---

## Phase 1: Investigation (Day 1)

### Step 1.1: Verify Backend Health
```bash
# Check if backend is running
curl http://localhost:4000/health

# Expected response:
# {"success":true,"message":"Service is healthy"...}

# If fails: Start backend server
cd kvastram-platform/backend
npm run dev
```

**Rollback:** N/A - Just verification

### Step 1.2: Verify Products Endpoint
```bash
# Check products API directly
curl http://localhost:4000/products?limit=1

# Expected: JSON response with products array
# If fails: Check database connection
```

**Rollback:** N/A - Just verification

### Step 1.3: Check Environment Variables

**Files to check:**
- `kvastram-platform/storefront/.env.local`
- `kvastram-platform/backend/.env`

**Required variables:**
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

**Rollback:** N/A - Just verification

---

## Phase 2: Database Verification (Day 1-2)

### Step 2.1: Check Products Table
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM products;
SELECT status, COUNT(*) FROM products GROUP BY status;
```

**Expected:** At least 1 published product

**If empty:**
- Run seed script: `cd backend && npm run seed`

**Rollback:**
```sql
-- Revert seed (if needed)
-- Contact for data recovery
```

### Step 2.2: Check Database Connection
```bash
# Test database connectivity
cd kvastram-platform/backend
npm run ping-db
```

**Rollback:** N/A - Just verification

---

## Phase 3: Code Fixes (Day 2-3)

### Fix 3.1: Add Error Boundary to Homepage

**File:** `kvastram-platform/storefront/src/app/page.tsx`

**Current:** No error boundary
**Problem:** Errors propagate to global error page

**Proposed Change:**
```tsx
// Copy error.tsx from products page and customize for homepage
// Simple copy with different error message
```

**Risk Level:** 🟡 MEDIUM
**Mitigation:**
1. Copy exact error boundary pattern from products page
2. Test on development first
3. Deploy to staging before production

**Rollback Plan:**
- Remove the error boundary file
- Global error page will handle errors again

---

### Fix 3.2: Improve API Error Handling

**File:** `kvastram-platform/storefront/src/lib/api.ts`

**Current (line 78-100):**
```tsx
try {
    const res = await fetch(url.toString(), {...});
    if (!res.ok) {
        console.warn('[API] Products fetch failed:', res.status);
        return { products: [], total: 0 };  // Silent fallback
    }
    // ...
} catch (error) {
    console.warn('[API] Products fetch network error:', error);
    return { products: [], total: 0 };  // Silent fallback
}
```

**Problem:** Silent failures hide real issues

**Proposed Change:**
- Add better error logging
- Add retry logic (1 retry)
- Return more informative error object

**Risk Level:** 🟡 MEDIUM
**Mitigation:**
1. Add console.error instead of console.warn
2. Add retry only for network errors (not 4xx/5xx)
3. Test on development

**Rollback Plan:**
- Revert to original code
- Clear `.next/cache`

---

### Fix 3.3: Add Loading State to ProductGrid

**File:** `kvastram-platform/storefront/src/components/ProductGrid.tsx`

**Current (line 17-22):**
```tsx
export default function ProductGrid({ initialProducts = [], loading: externalLoading }: ProductGridProps) {
    const products = initialProducts;
    const loading = externalLoading || initialProducts.length === 0;
```

**Problem:** No visual loading indicator

**Proposed Change:**
- Add skeleton loading state
- Show "Loading products..." message

**Risk Level:** 🟢 LOW
**Mitigation:**
1. Simple UI addition
2. Test on development

**Rollback Plan:**
- Remove skeleton component
- Revert to simple loading check

---

### Fix 3.4: Fix Null Checks in ProductGrid

**File:** `kvastram-platform/storefront/src/components/ProductGrid.tsx`

**Current (line 29-34):**
```tsx
const prices = variant.prices || [];
const priceObj = prices.find((p: MoneyAmount) => p.currency_code === (currentRegion?.currency_code || 'usd').toLowerCase()) || prices[0];

if (!priceObj) {
    alert('Price unavailable for this region');
    return;
}
```

**Problem:** Alert popup is bad UX

**Proposed Change:**
- Show inline error message
- Don't block entire product display

**Risk Level:** 🟢 LOW
**Mitigation:**
1. Simple UI change
2. Test on development

**Rollback Plan:**
- Revert to alert()
- Clear `.next/cache`

---

## Phase 4: Performance Optimization (Day 3)

### Step 4.1: Clear Next.js Cache
```bash
# Clear build cache
rm -rf kvastram-platform/storefront/.next/cache

# Rebuild
cd kvastram-platform/storefront
npm run build
```

**Risk Level:** 🟢 LOW
**Benefit:** Clears stale cached responses

**Rollback:** N/A - Cache will rebuild automatically

---

## Rollback Strategy Summary

| Fix | Rollback Command |
|-----|------------------|
| Fix 3.1 | Delete `src/app/page/error.tsx` |
| Fix 3.2 | Revert `src/lib/api.ts` + `rm -rf .next/cache` |
| Fix 3.3 | Revert `src/components/ProductGrid.tsx` |
| Fix 3.4 | Revert `src/components/ProductGrid.tsx` |
| Step 4.1 | N/A - cache rebuilds automatically |

---

## Testing Checklist

### Before Any Changes
- [ ] Document current error behavior
- [ ] Take screenshots
- [ ] Note error IDs (if any)

### After Each Fix
- [ ] Test on development server
- [ ] Verify no console errors
- [ ] Check network tab for failed requests
- [ ] Test on staging (if available)
- [ ] Get user feedback

### Final Sign-off
- [ ] All products load within 3 seconds
- [ ] No error pages shown
- [ ] Loading states visible
- [ ] Add to cart works

---

## Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Phase 1: Investigation | 1 day | Dev |
| Phase 2: Database | 1-2 days | Dev + DBA |
| Phase 3: Code Fixes | 2-3 days | Dev |
| Phase 4: Optimization | 1 day | Dev |

**Total Estimated Time:** 5-7 days

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Products page load time | < 2s | ? |
| Error rate | 0% | ? |
| API response time | < 500ms | ? |
| User complaints | 0 | ? |

---

## Notes

1. **No code changes in this plan** - All fixes to be implemented separately
2. **Each fix requires separate testing**
3. **Rollback plans documented for each fix**
4. **Risk mitigation strategy applied**

---

*Plan generated: 2026-02-11*
*Review before implementation*
