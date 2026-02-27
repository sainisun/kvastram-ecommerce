# Kvastram Platform - Issue Fix Roadmap

**Document Version:** 1.0  
**Created:** February 25, 2026  
**Purpose:** Systematic fix implementation guide for all identified issues

---

## Issue Priority Summary

| Priority    | Count | Issues              |
| ----------- | ----- | ------------------- |
| 🔴 CRITICAL | 2     | WS-001, WS-002      |
| 🟠 HIGH     | 0     | -                   |
| 🟡 MEDIUM   | 2     | AUTH-001, BROWS-001 |
| 🟢 LOW      | 1     | CART-001            |

---

## Phase 1: Critical Issues (Week 1)

### Issue WS-001: Footer PDF Links Broken

**Priority:** CRITICAL  
**Category:** Wholesale  
**Files to Modify:**

- `storefront/src/components/layout/WholesaleFooter.tsx`

**Current Problem:** All PDF links use `href="#"` placeholder

**Required Code Changes:**

```tsx
// In WholesaleFooter.tsx, replace:
// OLD (Line ~103):
<a href="#" className="hover:text-white...">
  <Download size={14} />
  Product Catalog (PDF)
</a>

// NEW:
<a href="/documents/kvastram-product-catalog-2024.pdf" className="hover:text-white..." target="_blank" rel="noopener noreferrer">
  <Download size={14} />
  Product Catalog (PDF)
</a>
```

**Complete Link Updates Required:**

| Current                      | Should Be                                      | Purpose           |
| ---------------------------- | ---------------------------------------------- | ----------------- |
| `href="#"` - Product Catalog | `/documents/kvastram-product-catalog-2024.pdf` | Product catalog   |
| `href="#"` - Price List      | `/documents/kvastram-price-list-2024.pdf`      | Wholesale pricing |
| `href="#"` - Terms of Trade  | `/pages/terms-of-trade`                        | Trade terms       |
| `href="#"` - Shipping Policy | `/pages/shipping-policy`                       | Delivery info     |
| `href="#"` - Return Policy   | `/pages/return-policy`                         | Returns           |

**Testing Strategy:**

1. Navigate to wholesale page footer
2. Click each PDF link
3. Verify downloads work or pages load
4. Check all links open in new tab

---

### Issue WS-002: Pricing Tiers Hardcoded

**Priority:** CRITICAL  
**Category:** Wholesale  
**Files to Modify:**

- `backend/src/routes/store/wholesale-tiers.ts` (new file)
- `storefront/src/lib/api.ts`
- `storefront/src/app/wholesale/page.tsx`

**Current Problem:** Discount percentages (20%, 30%, 40%) are hardcoded in frontend

**Required Code Changes:**

#### Step 1: Create Backend API Endpoint

Create new file `backend/src/routes/store/wholesale-tiers.ts`:

```typescript
import { Hono } from 'hono';
import { db } from '../../db/client';
import { wholesaleTiers } from '../../db/schema';

const wholesaleTiersRouter = new Hono();

// GET /wholesale/tiers - Public endpoint for marketing page
wholesaleTiersRouter.get('/tiers', async (c) => {
  try {
    const tiers = await db
      .select({
        id: wholesaleTiers.id,
        name: wholesaleTiers.name,
        discountPercent: wholesaleTiers.discountPercent,
        minOrderValue: wholesaleTiers.minOrderValue,
      })
      .from(wholesaleTiers)
      .where(eq(wholesaleTiers.isActive, true))
      .orderBy(asc(wholesaleTiers.discountPercent));

    return c.json({ tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return c.json({ error: 'Failed to fetch tiers' }, 500);
  }
});

export default wholesaleTiersRouter;
```

#### Step 2: Register Route in backend/src/index.ts

```typescript
import wholesaleTiersRouter from './routes/store/wholesale-tiers';

// Add after store routes:
app.route('/store/wholesale', wholesaleTiersRouter);
```

#### Step 3: Add API Function in Storefront

In `storefront/src/lib/api.ts`, add:

```typescript
async function getWholesaleTiers() {
  const res = await fetchWithTrace(`${API_URL}/store/wholesale/tiers`);
  return res.json();
}

// Export in the api object:
export const api = {
  // ... existing functions
  getWholesaleTiers,
};
```

#### Step 4: Update Wholesale Page

In `storefront/src/app/wholesale/page.tsx`:

```tsx
// Add state for tiers:
const [tiers, setTiers] = useState<WholesaleTier[]>([]);

// Fetch tiers on mount:
useEffect(() => {
  api
    .getWholesaleTiers()
    .then((data) => setTiers(data.tiers || []))
    .catch((err) => console.error('Failed to load tiers:', err));
}, []);

// Replace hardcoded values:
{
  tiers.length > 0 ? (
    tiers.map((tier) => (
      <div key={tier.id} className="text-3xl font-bold text-stone-900">
        {tier.discountPercent}% OFF
      </div>
    ))
  ) : (
    // Fallback to default values
    <>
      <div className="text-3xl font-bold text-stone-900">20% OFF</div>
      <div className="text-3xl font-bold text-stone-900">30% OFF</div>
      <div className="text-3xl font-bold text-stone-900">40% OFF</div>
    </>
  );
}
```

**Testing Strategy:**

1. Create tier data in admin panel
2. Visit wholesale page
3. Verify tiers load dynamically
4. Modify tier in admin, refresh page - should reflect changes

---

## Phase 2: Medium Priority Issues (Week 2)

### Issue AUTH-001: Social Login Not Configured

**Priority:** MEDIUM  
**Category:** Authentication  
**Files to Modify:**

- `storefront/src/app/login/page.tsx`
- `storefront/src/app/register/page.tsx`
- `.env.example` (documentation)

**Current Problem:** OAuth buttons show warning messages instead of working

**Two Options:**

#### Option A: Configure OAuth (Recommended if using social login)

**Step 1:** Set Environment Variables

```env
# .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Backend (for token validation)
GOOGLE_CLIENT_SECRET=your-google-secret
FACEBOOK_APP_SECRET=your-facebook-secret
```

**Step 2:** Verify Backend Endpoints Exist

Check `backend/src/services/customer-auth-service.ts` for social login handlers.

#### Option B: Remove OAuth Buttons (If not planning to use)

**Code Changes in login/page.tsx:**

```tsx
// Remove GoogleOAuthWrapper and FacebookOAuthWrapper components
// Remove OAuth section from JSX (lines ~45-95)

// Keep only email login form
```

**Code Changes in register/page.tsx:**

```tsx
// Remove social login buttons (lines ~195-240)
```

**Testing Strategy:**

1. Visit login page
2. Verify OAuth buttons work (Option A) or are removed (Option B)
3. Test complete login flow with each method

---

### Issue BROWS-001: Search Page Missing Filters

**Priority:** MEDIUM  
**Category:** Product Browsing  
**Files to Modify:**

- `storefront/src/app/search/page.tsx`
- `storefront/src/components/products/CatalogClient.tsx` (reuse filter component)

**Current Problem:** Search results don't show filter sidebar

**Required Code Changes:**

```tsx
// In search/page.tsx, import FilterSidebar:
import FilterSidebar from '@/components/products/FilterSidebar';

// Add filter section to the page layout:
// Replace current single-column layout with two-column:

<div className="max-w-7xl mx-auto px-4 py-8">
  <div className="flex gap-8">
    {/* Left Sidebar - Filters */}
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <FilterSidebar categories={categories} tags={tags} onFilterChange={handleFilterChange} />
    </aside>

    {/* Right Content - Search Results */}
    <main className="flex-1">{/* Existing search results grid */}</main>
  </div>
</div>;
```

**Testing Strategy:**

1. Perform a search
2. Verify filter sidebar appears
3. Apply filters and verify results update
4. Test mobile responsiveness

---

## Phase 3: Low Priority Enhancements (Week 3)

### Issue CART-001: Cart Save API Error Handling

**Priority:** LOW  
**Category:** Cart/Checkout  
**Files to Modify:**

- `storefront/src/context/cart-context.tsx`

**Current Problem:** API errors in console for guest users

**Required Code Changes:**

```tsx
// In cart-context.tsx, modify the save effect:

useEffect(() => {
  if (!customer || !isLoaded || items.length === 0) return;

  const timeout = setTimeout(async () => {
    try {
      // Check if we have a valid auth token
      const token = getCookie('auth_token');
      if (!token) {
        console.log('Guest user - skipping cart save to backend');
        return;
      }

      await api.saveCart(items);
    } catch (error) {
      // Graceful error handling - don't log to console in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Cart save failed:', error);
      }
    }
  }, 1000);

  return () => clearTimeout(timeout);
}, [items, customer, isLoaded]);
```

**Testing Strategy:**

1. Add items to cart as guest
2. Check console for errors
3. Login and verify cart syncs to backend
4. Logout and verify cart persists locally

---

## Implementation Checklist

| Phase | Issue     | Status | Completed Date | Notes |
| ----- | --------- | ------ | -------------- | ----- |
| 1     | WS-001    | ☐      |                |       |
| 1     | WS-002    | ☐      |                |       |
| 2     | AUTH-001  | ☐      |                |       |
| 2     | BROWS-001 | ☐      |                |       |
| 3     | CART-001  | ☐      |                |       |

---

## Notes

- All critical issues should be fixed before deployment
- Medium priority issues improve user experience significantly
- Low priority can be addressed in future sprints
- Test each fix thoroughly before moving to next issue
