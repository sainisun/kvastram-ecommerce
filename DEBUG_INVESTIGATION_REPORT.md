# Comprehensive Codebase Investigation Report

## Kvastram Platform - Backend & Frontend Analysis

**Date:** March 1, 2026  
**Analysis Scope:** Product Variants & Order Line Items Investigation

---

## Executive Summary

This report documents the findings from investigating the codebase to identify errors, bugs, and issues related to:

1. Order Line Items not displaying in Admin Panel
2. Product Variants functionality
3. Order statistics display issues (NaN, missing counts)

**Overall Assessment:** The codebase contains one critical bug (Order Line Items) and several medium-severity issues that should be addressed before production deployment.

---

## Part 1: Order Line Items Investigation

### Bug Description

Admin cannot see which products were ordered in the order detail page - only Subtotal/Shipping/Total are shown, but NO LINE ITEMS.

### Technical Analysis

#### Backend API (✅ Functioning)

**File:** `backend/src/services/order-service.ts`

The backend `getOrder()` method correctly fetches and returns line items:

```typescript
// Lines 133-187
async getOrder(id: string) {
  const [order] = await db.select({...}).from(orders)...

  // Line items query
  const items = await db
    .select({
      id: line_items.id,
      quantity: line_items.quantity,
      unit_price: line_items.unit_price,
      total: line_items.total_price,
      variant_id: line_items.variant_id,
      product_title: products.title,
      product_thumbnail: products.thumbnail,
      variant_title: product_variants.title,
      title: line_items.title,
      thumbnail: line_items.thumbnail,
    })
    .from(line_items)
    .leftJoin(product_variants, eq(line_items.variant_id, product_variants.id))
    .leftJoin(products, eq(product_variants.product_id, products.id))
    .where(eq(line_items.order_id, id));

  return { order, items };  // Line 187
}
```

#### Frontend API Layer (⚠️ Potential Issue)

**File:** `admin/src/lib/api.ts` (Lines 486-492)

```typescript
getOrder: async (id: string) => {
  const res = await fetchWithTimeout(`${API_BASE_URL}/admin/orders/${id}`, {});
  if (!res.ok) throw new Error('Failed to fetch order details');
  return res.json();  // Returns raw JSON
},
```

#### Frontend Order Detail Page

**File:** `admin/src/app/dashboard/orders/[id]/page.tsx` (Lines 28-38)

```typescript
useEffect(() => {
  api.getOrder(id).then((data) => {
    const orderData = data?.order || data;
    setOrder(orderData);
    setItems(data?.items || orderData?.items || []);  // Line 34
  })...
}, [id]);
```

### Root Cause Analysis

**Most Likely Source:** The backend route wraps the response using `successResponse()`:

**File:** `backend/src/routes/orders.ts` (Lines 55-61)

```typescript
ordersRouter.get(
  '/stats/overview',
  asyncHandler(async (c) => {
    const stats = await orderService.getStatsOverview();
    return successResponse(c, stats, 'Order statistics retrieved successfully');
  })
);
```

The response structure is:

```json
{
  "success": true,
  "message": "...",
  "data": { "order": {...}, "items": [...] },
  "timestamp": "..."
}
```

The frontend accesses `data?.items` which would be looking at the top-level `data.items`, but the actual structure has `data.data.items` (since `data` is the wrapper, `data.data` contains the actual order/items).

### Verification Steps Needed

1. Check actual API response in browser dev tools
2. Verify line_items table has records for existing orders
3. Confirm frontend is accessing correct response path

---

## Part 2: Order Statistics Bugs

### Bug 2.1: Average Order Value Shows $NaN

**Location:** `admin/src/app/dashboard/orders/page.tsx` (Lines 280-287)

#### Frontend Code

```typescript
<p className="text-xl font-bold text-gray-900">
  {formatCurrency(
    Number.isNaN(stats.avg_order_value)
      ? 0
      : stats.avg_order_value || 0
  )}
</p>
```

#### Backend Calculation (`backend/src/services/order-service.ts`, Line 324)

```typescript
avg_order_value: totalOrdersNum > 0 ? Math.round(totalRevenueNum / totalOrdersNum) : 0,
```

#### Analysis

The NaN might appear because:

1. Stats object is undefined/null during initial render
2. The `formatCurrency()` function might receive undefined values
3. Division by zero could occur if `totalOrdersNum` is 0 (but handled)

### Bug 2.2: Order # Missing in Detail Header

**Location:** `admin/src/app/dashboard/orders/[id]/page.tsx` (Lines 96-101)

```typescript
<h1 className="text-2xl font-bold text-gray-800">
  Order #
  {order.order_number ||
    order.display_id ||
    (order.id ? order.id.split('-')[0] : 'Unknown')}
</h1>
```

**Root Cause:** If both `order_number` and `display_id` are NULL in the database, and the fallback `id.split('-')[0]` produces an incomplete value, the display would show "Order #" without a number.

### Bug 2.3: Pending/Processing Count Cards Empty

**Backend Code:** `backend/src/services/order-service.ts` (Lines 319-320)

```typescript
pending_orders: countByStatus['pending'] || 0,
processing_orders: countByStatus['processing'] || 0,
```

**Root Cause:** The status grouping might not be matching exact string values. Need to verify:

1. What status values exist in the database
2. Whether 'pending' and 'processing' are stored exactly as strings

---

## Part 3: Product Variants Investigation

### Finding: Variants ARE Implemented ✅

After investigation, Product Variants are fully implemented across the stack:

#### Backend Schema

**File:** `backend/src/db/schema.ts` (Lines 85-133)

```typescript
export const product_variants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').references(() => products.id),
  title: text('title').notNull(),
  sku: text('sku'),
  inventory_quantity: integer('inventory_quantity'),
  // ... pricing and other fields
});
```

#### Storefront Display

**File:** `storefront/src/components/product/ProductView.tsx` (Lines 430-445)

```typescript
{!hasStructuredOptions &&
  product.variants &&
  product.variants.length > 1 && (
    <div className="mb-8 border-b border-stone-100 pb-8 space-y-4">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        Select Size
      </label>
      <div className="flex flex-wrap gap-3">
        {product.variants.map((v: ProductVariant) => {
          const isSelected = selectedVariant?.id === v.id;
          // ... variant button rendering
        })}
      </div>
    </div>
)}
```

#### Admin Management

**File:** `admin/src/app/dashboard/products/[id]/page.tsx`

- Variant state management (Line 72)
- Fetch variants (Lines 177-183)
- Add variant (Lines 237-241)
- Delete variant (Lines 246-254)
- Update inventory (Lines 257-267)
- PRESET_SIZES for quick creation (Line 615)

### Conclusion

The documentation reports "Missing" for Product Variants, but the feature IS implemented. The issue is likely:

1. No variants have been created for existing products
2. Users/admins don't know how to use the feature
3. UI is not prominent enough

---

## Part 4: Complete Bug List

| #   | Bug                             | Severity       | Location                     | Root Cause                    |
| --- | ------------------------------- | -------------- | ---------------------------- | ----------------------------- |
| 1   | Order Line Items Not Showing    | 🔴 Critical    | `admin/orders/[id]/page.tsx` | API response path mismatch    |
| 2   | Avg Order Value = $NaN          | 🟡 Medium      | `admin/orders/page.tsx`      | Undefined stats during render |
| 3   | Order # Missing                 | 🟡 Medium      | `admin/orders/[id]/page.tsx` | NULL display_id in DB         |
| 4   | Pending/Processing Counts Empty | 🟡 Medium      | `admin/orders/page.tsx`      | Status value mismatch         |
| 5   | Product Variants Not Created    | 🟢 Feature Gap | N/A - Implementation exists  | User education needed         |

---

## Recommendations

### Immediate Actions

1. **Fix Order Line Items** - Most critical for order fulfillment
2. **Verify Order Status Values** - Check exact strings in database

### Testing Required

1. Create test orders with line items
2. Verify API response structure
3. Check database status enum values

### Documentation Updates

1. Update admin walkthrough to explain variant creation
2. Add tooltips/guides for variant management

---

## Files Analyzed

### Backend

- `backend/src/services/order-service.ts`
- `backend/src/services/analytics-service.ts`
- `backend/src/routes/orders.ts`
- `backend/src/db/schema.ts`
- `backend/src/utils/api-response.ts`

### Frontend (Admin)

- `admin/src/lib/api.ts`
- `admin/src/app/dashboard/orders/page.tsx`
- `admin/src/app/dashboard/orders/[id]/page.tsx`
- `admin/src/app/dashboard/products/[id]/page.tsx`

### Frontend (Storefront)

- `storefront/src/app/products/[handle]/page.tsx`
- `storefront/src/components/product/ProductView.tsx`

---

_Report generated: March 1, 2026_
