# Kvastram Code Quality Improvement Plan

## 📊 Current State Analysis

Based on code analysis of the backend/src directory:

| Issue Type              | Count | Severity |
| ----------------------- | ----- | -------- |
| `any` type usages       | 144+  | High     |
| Untyped catch blocks    | 83    | High     |
| product-service.ts size | ~25KB | Critical |

---

## 🎯 Priority-Based Improvement Plan

### Priority 1: Product Service Refactoring (SRP Violation)

**File:** `backend/src/services/product-service.ts` (~800+ lines)

**Issues:**

- Single class with 800+ lines handling multiple responsibilities
- Multiple `any` type usages (lines 87-88, 172-176, 601, 791-793)
- `mergeProductData` method doing too much

**Recommended Split:**

```
services/product/
├── product-service.ts        # Main orchestrator (CRUD operations)
├── product-query-service.ts # Search, filtering, listing
├── product-relation-service.ts # Variants, images, options management
└── product-validator.ts     # Input validation schemas
```

---

### Priority 2: Type Safety - Eliminate `any` Types

**Critical Areas (High Impact):**

| File                           | Issue                    | Fix Approach                                 |
| ------------------------------ | ------------------------ | -------------------------------------------- |
| `product-service.ts:87-88`     | Filter conditions array  | Use `PgColumn[]` or Drizzle expression types |
| `product-service.ts:172-176`   | mergeProductData return  | Define `MergedProduct` type                  |
| `customer-service.ts:200`      | update method data param | Use `UpdateCustomerInput` schema             |
| `email-service.ts:96,132,161`  | Order/inquiry params     | Define `OrderData`, `InquiryData` types      |
| `pdf-service.ts:4-9`           | Order/items params       | Import from order-service types              |
| `routes/store/checkout.ts:193` | Sanitize function        | Use proper CheckoutBody type                 |

---

### Priority 3: Type catch Blocks

**Pattern to Replace:**

```typescript
// Before (untyped)
} catch (error) {

// After (typed)
} catch (error: Error) {
```

**Priority Files (by frequency):**

1. `routes/*.ts` - 35+ catch blocks
2. `services/*.ts` - 20+ catch blocks
3. `middleware/*.ts` - 5+ catch blocks

**Helper Utility Recommendation:**

```typescript
// utils/error-handler.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}
```

---

### Priority 4: Route Validation

**Files Missing Zod Validation:**

| Route                      | Status  | Priority |
| -------------------------- | ------- | -------- |
| `routes/customers.ts`      | Partial | Medium   |
| `routes/collections.ts`    | Partial | Medium   |
| `routes/regions.ts`        | Partial | Low      |
| `routes/store/checkout.ts` | Partial | High     |

---

### Priority 5: N+1 Query Prevention

**Product Listing Query Pattern to Check:**

- Currently in `product-service.ts` - need to verify `mergeProductData` uses proper joins
- Check `routes/products.ts` for list endpoint

**Recommended Pattern:**

```typescript
// Use Drizzle's withRelations or proper joins
const productsWithRelations = await db
  .select({
    id: products.id,
    title: products.title,
    // ... explicit column selection
  })
  .from(products)
  .leftJoin(product_variants, eq(products.id, product_variants.product_id));
// ... avoid N+1 by fetching in single query
```

---

## 📋 Execution Order

```
Step 1: Refactor product-service.ts (split into smaller services)
        ↓
Step 2: Add proper types to product-service.ts
        ↓
Step 3: Fix catch blocks in services/ (most critical)
        ↓
Step 4: Fix catch blocks in routes/
        ↓
Step 5: Add missing route validations
        ↓
Step 6: Verify no N+1 queries in product listing
```

---

## ⚠️ Constraints

1. **Breaking Changes:** Avoid - maintain existing API contracts
2. **Logic Changes:** Don't modify business logic, only improve code quality
3. **Testing:** No tests mentioned - proceed carefully
4. **Dependencies:** Don't add new dependencies

---

## 📁 Files to Modify

### Backend Services (Priority 1)

- [ ] `backend/src/services/product-service.ts` - Split & type

### Backend Routes (Priority 2-3)

- [ ] `backend/src/routes/products.ts`
- [ ] `backend/src/routes/customers.ts`
- [ ] `backend/src/routes/collections.ts`
- [ ] `backend/src/routes/orders.ts`
- [ ] `backend/src/routes/store/checkout.ts`

### Utilities (Priority 3)

- [ ] Create `backend/src/utils/error-handler.ts`
- [ ] Update catch blocks across all services

### Type Definitions (Priority 2)

- [ ] Add shared types in `backend/src/types/`
- [ ] Export from `backend/src/db/schema/index.ts`
