# DETAILED EXECUTION PLAN - FIX ALL ISSUES

**Project:** Kvastram Storefront Audit Fixes  
**Start Date:** March 5, 2026  
**Target Completion:** March 27, 2026 (3 weeks)  
**Team:** 2-3 developers minimum

---

## 🎯 MASTER ISSUE list & TRACKING

| Issue | Priority | Days | Status | Owner | Start | End |
|-------|----------|------|--------|-------|-------|-----|
| 1. Type Definition Conflicts | 🔴 CRITICAL | 1.5 | ⏳ Ready | TBD | Mar 5 | Mar 6 |
| 2. API Response Standardization | 🔴 CRITICAL | 2 | ⏳ Ready | TBD | Mar 6 | Mar 8 |
| 3. Production Environment | 🔴 CRITICAL | 0.5 | ⏳ Ready | TBD | Mar 8 | Mar 8 |
| 4. CSRF Protection | 🟠 HIGH | 1.5 | ⏳ Ready | TBD | Mar 9 | Mar 10 |
| 5. Third-Party Consent | 🟠 HIGH | 1.5 | ⏳ Ready | TBD | Mar 9 | Mar 11 |
| 6. Performance Optimization | 🟡 MEDIUM | 2 | ⏳ Later | TBD | Mar 12 | Mar 14 |
| 7. Test Coverage | 🟡 MEDIUM | 3 | ⏳ Later | TBD | Mar 15 | Mar 19 |
| 8. Documentation | 🟢 LOW | 2 | ⏳ Later | TBD | Mar 20 | Mar 22 |
| **TOTAL** | | **15 days** | | | | |

---

## 📋 WEEK 1: CRITICAL FIXES (Mar 5-8)

### ✅ TASK 1: Type Definition Conflicts (1.5 days)

**Goal:** Standardize Product type definitions across codebase

**Subtasks:**

#### 1.1: Create New Type Contract File (30 min)
```bash
# Step 1: Create file
code src/types/api-contracts.ts

# Copy the content from CODE_SNIPPETS_FOR_IMPLEMENTATION.md -> Section 1
# (Already prepared - just copy)
```

**Success:** File exists at `src/types/api-contracts.ts` with all type definitions

#### 1.2: Update API Adapters (1 hour)
```bash
# Step 1: Open existing file
code src/lib/api-adapters.ts

# Copy content from CODE_SNIPPETS_FOR_IMPLEMENTATION.md -> Section 1
# Replace entire file with adapter patterns
```

**Checklist:**
- [ ] `adaptProduct()` function works
- [ ] `adaptProductVariant()` function works
- [ ] `adaptCollection()` function works
- [ ] `adaptProducts()` function works
- [ ] All functions use correct types

#### 1.3: Update API Endpoints - getProducts (30 min)
```typescript
// File: src/lib/api.ts
// Find the getProducts() function and update it

// OLD CODE:
export async function getProducts(): Promise<{
  products: Product[];
  total: number;
  limit?: number;
  offset?: number;
}> {
  const res = await fetch(`${API_URL}/api/products`);
  const json = await res.json();
  if (json.data && Array.isArray(json.data)) {
    return {
      products: json.data,
      total: json.pagination?.total || json.data.length,
      limit: json.pagination?.limit,
      offset: json.pagination?.offset,
    };
  }
  return json;
}

// NEW CODE:
import { adaptProducts } from './api-adapters';
import type { ApiResponse, ApiProductResponse, isProductArray } from '@/types/api-contracts';

export async function getProducts(): Promise<{
  products: Product[];
  total: number;
  limit?: number;
  offset?: number;
}> {
  try {
    const response = await fetchWithTrace(`${API_URL}/api/products`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const json = (await response.json()) as ApiResponse<ApiProductResponse[]>;

    // Validate response structure
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Invalid API response format');
    }

    // Adapt API response to frontend types
    const products = adaptProducts(json.data);

    return {
      products,
      total: json.pagination?.total || products.length,
      limit: json.pagination?.limit,
      offset: json.pagination?.offset,
    };
  } catch (error) {
    console.error('[API] getProducts error:', error);
    throw error;
  }
}
```

#### 1.4: Update API Endpoints - getProduct (30 min)
```typescript
// File: src/lib/api.ts
// Find the getProduct() function and update it

export async function getProduct(handle: string): Promise<Product> {
  try {
    const response = await fetchWithTrace(`${API_URL}/api/products/${handle}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const json = (await response.json()) as ApiResponse<ApiProductResponse>;

    // Validate response
    if (!json.success || !json.data) {
      throw new Error('Invalid API response format');
    }

    return adaptProduct(json.data);
  } catch (error) {
    console.error('[API] getProduct error:', error);
    throw error;
  }
}
```

#### 1.5: Test Type Definitions (15 min)
```bash
# Test 1: Build to check TypeScript errors
npm run build

# Expected output: 0 errors
# If errors, fix them based on TypeScript messages
```

**Success Criteria:**
- ✅ npm run build passes with 0 errors
- ✅ No "Property does not exist on type" errors
- ✅ All imports resolve correctly
- ✅ Products page loads without errors

---

### ✅ TASK 2: API Response Standardization (2 days)

**Goal:** Ensure consistent API response format across all endpoints

**Prerequisites:** Task 1 completed

**Note:** This task requires backend coordination. Frontend can prepare while backend makes changes.

#### 2.1: Document Current API Responses (1 hour)
```bash
# Create audit document
code src/docs/api-contract.md

# Add content:
```markdown
# API Contract Audit

## Current State (Before Standardization)

### GET /api/products
**Current:** { data: Array, pagination: {} }
**Standard:** { success: true, data: Array, pagination: { limit, offset, total } }

### GET /api/products/:id  
**Current:** { data: { product: {} } }
**Standard:** { success: true, data: {}, pagination: undefined }

### GET /api/featured
**Current:** { data: Array }
**Standard:** { success: true, data: Array, pagination: undefined }

### GET /api/search
**Current:** Inconsistent - sometimes { data: {} }, sometimes { data: [] }
**Standard:** { success: true, data: Array, pagination: undefined }

[Document all other endpoints similarly]
```

#### 2.2: Create Response Validation Guards (1 hour)
```bash
code src/lib/api-guards.ts

# Add content from CODE_SNIPPETS_FOR_IMPLEMENTATION.md
# Create type guards to validate all responses
```

#### 2.3: Create Wrapper for All API Calls (1 hour)
```typescript
// File: src/lib/api-fetch.ts (NEW)

import { ApiResponse } from '@/types/api-contracts';
import { CsrfManager } from './csrf';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { next?: object }
): Promise<ApiResponse<T>> {
  const method = (options?.method || 'GET').toUpperCase();
  const url = `${API_URL}${endpoint}`;

  try {
    // Add CSRF token for mutations
    const headers = new Headers(options?.headers);
    if (method !== 'GET') {
      CsrfManager.addToHeaders(headers);
    }

    const response = await fetchWithTrace(url, {
      ...options,
      method,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as ApiResponse<T>;

    // Validate response format
    if (!json.success) {
      throw new Error(json.error?.message || 'API request failed');
    }

    return json;
  } catch (error) {
    console.error(`[API] ${method} ${endpoint} failed:`, error);
    throw error;
  }
}
```

#### 2.4: Update All Endpoints to Use Wrapper (Ongoing through task 2)
```bash
# Pattern for each endpoint:

# Find each function that calls API
grep -n "fetch.*API" src/lib/api.ts

# Convert each to use apiFetch pattern:
# Old: const json = await fetch(url).then(r => r.json());
# New: const response = await apiFetch<ProductType>(endpoint);
```

#### 2.5: Test All API Endpoints (1 hour)
```bash
# Start dev server
npm run dev

# Test each feature:
# 1. Navigate to /products - check console for errors
# 2. Click product - check API response in DevTools
# 3. Search products - verify response format
# 4. View collections
# 5. Check cart operations
# 6. Test checkout (sandbox)

# Expected: No API parsing errors in console
```

**Success Criteria:**
- ✅ All API responses validated with guards
- ✅ No runtime type errors
- ✅ Consistent error handling
- ✅ All endpoints use standardized format
- ✅ DevTools shows correct response structure

---

### ✅ TASK 3: Production Environment Setup (0.5 days)

**Goal:** Configure all production credentials

**Prerequisites:** Credentials from operations team

#### 3.1: Prepare Credentials (30 min - coordination)
```bash
# Step 1: Get from ops team
# REQUEST from operations:
# ├─ Stripe Live Publishable Key (pk_live_...)
# ├─ Google OAuth Client ID
# ├─ Facebook App ID
# ├─ Production API URL
# ├─ Sentry DSN (should already have)
# └─ Other API keys

# Step 2: Create secure file (DO NOT COMMIT)
# Add to .gitignore (should be there)
grep -i "env.production" .gitignore
# Output should show: .env.production
```

#### 3.2: Create .env.production File (15 min)
```bash
# File: .env.production

cat > .env.production << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://api.kvastram.com

# Stripe (Live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx

# OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=123456789xxxxxxx

# Analytics
NEXT_PUBLIC_SENTRY_DSN=https://key@org.ingest.sentry.io/123456
NEXT_PUBLIC_LOGROCKET_APP_ID=kvastram/production

# Chat
NEXT_PUBLIC_TAWK_PROPERTY_ID=69916132e258621c36ed87d2/1jhfu7bu0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SESSION_RECORDING=true
EOF

# DO NOT COMMIT THIS FILE
git status .env.production
# Should show: untracked file (not staged for commit)
```

#### 3.3: Test Production Build (15 min)
```bash
# Build with production environment
NODE_ENV=production npm run build

# Expected output:
# Compiled successfully in X seconds
# No errors
# ✅ Check successful

# Verify build artifacts
ls -la .next/BUILD_ID
echo "Build completed"
```

**Success Criteria:**
- ✅ .env.production file created with real credentials
- ✅ File not in git (in .gitignore)
- ✅ npm run build passes with production config
- ✅ All environment variables resolved
- ✅ No "undefined" values in config

---

## 📋 WEEK 1 CONTINUED: HIGH PRIORITY (Mar 9-11)

### ✅ TASK 4: CSRF Protection (1.5 days)

**Goal:** Implement full CSRF token generation and validation

**Prerequisites:** Task 1 completed (type safety)

#### 4.1: Create CSRF Manager (1 hour)
```bash
# Create new file
code src/lib/csrf.ts

# Copy content from CODE_SNIPPETS_FOR_IMPLEMENTATION.md -> Section 2
# Should include:
# - generateToken()
# - getTokenFromDOM()
# - getTokenFromCookie()
# - getToken()
# - addToHeaders()
# - addToFormData()
```

**Verify:**
```bash
npm run build
# Check for TypeScript errors on CSRF import
```

#### 4.2: Add CSRF Token to Layout (1 hour)
```bash
code src/app/layout.tsx

# Find the <head> section
# Add meta tag with CSRF token (from CODE_SNIPPETS)

# The head should include:
# <meta name="csrf-token" content={csrfToken} />
```

#### 4.3: Update API Fetch to Include CSRF (30 min)
```typescript
// File: src/lib/api.ts (Update fetchWithTrace)

// OLD: No CSRF header
async function fetchWithTrace(input, init) {
  const response = await fetch(input, { ...init });
  return response;
}

// NEW: Add CSRF for mutations
import { CsrfManager } from './csrf';

async function fetchWithTrace(input, init) {
  const headers = new Headers(init?.headers);
  const method = (init?.method || 'GET').toUpperCase();

  // Add CSRF to non-GET requests
  if (method !== 'GET') {
    CsrfManager.addToHeaders(headers);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  return response;
}
```

#### 4.4: Test CSRF on All Forms (30 min)
```bash
npm run dev

# Manual tests:
# 1. Open DevTools -> Network tab
# 2. Fill checkout form and submit
# 3. Check headers - should have "x-csrf-token"
# 4. Check cart operations (add/remove/update)
# 5. All mutations should have CSRF header

# Expected: x-csrf-token present on all POST/PUT/DELETE
```

**Success Criteria:**
- ✅ CSRF token generated on page load
- ✅ Token added to all mutation requests
- ✅ No x-csrf-token errors in console
- ✅ Cart operations work with CSRF
- ✅ Checkout flow works with CSRF

---

### ✅ TASK 5: Third-Party Consent Management (1.5 days)

**Goal:** Implement user consent system for analytics and tracking

**Prerequisites:** Task 4 completed

#### 5.1: Create Consent Manager (1 hour)
```bash
code src/lib/consent-manager.ts

# Copy from CODE_SNIPPETS_FOR_IMPLEMENTATION.md -> Section 3
# Creates ConsentManager class with:
# - getConsent()
# - setConsent()
# - hasConsented()
# - acceptAll()
# - rejectAll()
```

#### 5.2: Update Cookie Consent Banner (30 min)
```bash
code src/components/ui/CookieConsent.tsx

# Replace with content from CODE_SNIPPETS
# Should include:
# - Consent details display
# - Accept/Reject buttons
# - Customize preferences option
# - Integration with ConsentManager
```

#### 5.3: Update Analytics Component (30 min)
```bash
code src/components/Analytics.tsx

# Update to check consent before initializing
# Pattern:
# if (!ConsentManager.hasConsented('analytics')) return;
# // Then initialize GA
```

#### 5.4: Update LogRocket Component (15 min)
```bash
code src/components/LogRocketProvider.tsx

# Similar pattern to Analytics
# Check consent before initializing
```

#### 5.5: Update Tawk.to Widget (15 min)
```bash
code src/components/ui/TawkToWidget.tsx

# Check marketing consent before loading chat
```

#### 5.6: Test Consent Flow (30 min)
```bash
npm run dev

# Test scenarios:
# 1. First visit - consent banner should show
# 2. Click "Accept All" - banner disappears
# 3. localStorage should have consent data
# 4. Reload page - banner should NOT show
# 5. Analytics scripts should be loaded
# 6. Check DevTools -> Application -> localStorage
#    Should see "kvastram_user_consent" entry

# Test Reject:
# 1. Clear localStorage
# 2. Click "Reject All"
# 3. Analytics/LogRocket should NOT load
# 4. Check console - no GA initialization
```

**Success Criteria:**
- ✅ Consent banner appears on first visit
- ✅ UserConsent stored in localStorage
- ✅ Analytics only loads with consent
- ✅ LogRocket only loads with consent
- ✅ User can customize preferences
- ✅ Consent persists across sessions

---

## 📋 WEEK 2: PERFORMANCE & QUALITY (Mar 12-19)

### ✅ TASK 6: Performance Optimization (2 days)

#### 6.1: Split Large Components (1 day)

**Target Files:**
- `src/app/page.tsx` (722 lines) → Split to:
  - `src/app/page.tsx` (main, 100 lines)
  - `src/components/home/HeroSection.tsx` (new)
  - `src/components/home/FeaturedProducts.tsx` (new)
  - `src/components/home/TestimonialsSection.tsx` (new)
  - `src/components/home/Newsletter.tsx` (new)

**Steps:**
```bash
# 1. Create directory
mkdir -p src/components/home

# 2. Create HeroSection component
code src/components/home/HeroSection.tsx
# Extract hero-related code from page.tsx

# 3. Create FeaturedProducts
code src/components/home/FeaturedProducts.tsx
# Extract product carousel code

# 4. Create TestimonialsSection
code src/components/home/TestimonialsSection.tsx
# Extract testimonials carousel code

# 5. Create Newsletter
code src/components/home/Newsletter.tsx
# Extract newsletter form code

# 6. Update page.tsx to import and use these components
code src/app/page.tsx
# Replace inline code with component imports
```

#### 6.2: Add React.memo to List Components (4 hours)

```bash
# Files to update:
# 1. src/components/ProductGrid.tsx
# 2. src/components/ProductCarousel.tsx
# 3. src/components/product/ProductCard.tsx

# Example pattern:
code src/components/ProductGrid.tsx

# Change:
export default function ProductGrid({ items }) {
  return (...)
}

# To:
const ProductCard = React.memo(({ item, onSelect }) => (
  <div>...</div>
));

export default function ProductGrid({ items }) {
  return (
    <div>
      {items.map(item => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

#### 6.3: Optimize Images (4 hours)

```bash
# Audit images
grep -r "<Image" src/components/ --include="*.tsx" | wc -l
# Should show number of Image components

# Update each to include:
# - width and height
# - priority for above-fold images
# - sizes for responsive
# - quality={85}

# Example:
# Was: <Image src={url} alt="product" />
# Now: <Image 
#       src={url} 
#       alt="product"
#       width={400}
#       height={400}
#       quality={85}
#       priority={isHero}
#       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
#     />
```

**Success Criteria:**
- ✅ page.tsx reduced from 722 → ~150 lines
- ✅ All components properly split
- ✅ React.memo applied to list items
- ✅ All images have width/height
- ✅ npm run build completes
- ✅ Website still functions correctly

---

### ✅ TASK 7: Test Coverage Expansion (3 days)

#### 7.1: Setup Jest Configuration (2 hours)

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest ts-jest

# Create jest.config.js
code jest.config.js

# Content:
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/app/**',
  ],
};

# Create jest.setup.js
code jest.setup.js

# Content:
import '@testing-library/jest-dom';

# Update package.json scripts
# Add to "scripts":
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"
```

#### 7.2: Write Component Tests (1.5 days)

**Create test files:**

```bash
# Create test directories
mkdir -p src/components/__tests__
mkdir -p src/lib/__tests__
mkdir -p src/hooks/__tests__

# Test 1: ProductCard
code src/components/__tests__/ProductCard.test.tsx

# Test 2: ProductGrid
code src/components/__tests__/ProductGrid.test.tsx

# Test 3: Cart Operations
code src/context/__tests__/cart-context.test.tsx

# Test 4: Auth Context
code src/context/__tests__/auth-context.test.tsx

# Test 5: API Functions
code src/lib/__tests__/api.test.ts

# Test 6: Utilities
code src/lib/__tests__/utils.test.ts

# Test 7: Hooks
code src/hooks/__tests__/useCart.test.ts
```

**Example test file:**
```typescript
// src/components/__tests__/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

const mockProduct = {
  id: '1',
  title: 'Test Product',
  handle: 'test-product',
  description: 'A test product',
  status: 'published' as const,
  created_at: '2026-03-05T00:00:00Z',
};

describe('ProductCard', () => {
  it('renders product title', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product image', () => {
    render(<ProductCard product={mockProduct} />);
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('links to product detail page', () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/products/${mockProduct.handle}`);
  });
});
```

#### 7.3: Run Tests and Generate Coverage (4 hours)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Target: 70% overall coverage
# Minimum for critical files: 80%

# Expected output:
# PASS src/components/__tests__/ProductCard.test.tsx
# PASS src/components/__tests__/ProductGrid.test.tsx
# PASS src/context/__tests__/cart-context.test.tsx
# ...
# Test Suites: X passed, X total
# Tests: X passed, X total
# Coverage: 70% statements, 65% branches
```

#### 7.4: Expand E2E Tests (4 hours)

```bash
code e2e/storefront.spec.ts

# Add more test scenarios:
# - User registration flow
# - Login flow
# - Product search and filter
# - Add to cart
# - Checkout (sandbox)
# - Wishlist operations
# - Account management
# - Order tracking

# Run E2E tests
npx playwright test

# Check results
npm run test:e2e

# Expected: All tests passing
```

**Success Criteria:**
- ✅ Jest configured and working
- ✅ 20+ unit tests written
- ✅ 10+ E2E tests passing
- ✅ Test coverage > 70%
- ✅ All critical paths covered
- ✅ npm test passes

---

## 📋 WEEK 3: FINAL POLISH (Mar 20-27)

### ✅ TASK 8: Documentation & Cleanup (2 days)

#### 8.1: Create Deployment Guide (4 hours)
```bash
code DEPLOYMENT_GUIDE.md

# Content:
# - Prerequisites
# - Environment setup
# - Database migrations
# - Build process
# - Deployment commands
# - Post-deployment verification
# - Rollback procedure
```

#### 8.2: Document Environment Variables (2 hours)
```bash
code ENV_VARIABLES.md

# List all:
# - Required variables
# - Optional variables
# - Development defaults
# - Production requirements
# - How to generate each
```

#### 8.3: Create Incident Response Guide (2 hours)
```bash
code INCIDENT_GUIDE.md

# - Common issues
# - Troubleshooting steps
# - Escalation process
# - Rollback procedures
```

#### 8.4: Final Testing Checklist (2 hours)
```bash
code PRE_LAUNCH_CHECKLIST.md

# - Build verification
# - Performance testing
# - Security testing
# - User acceptance testing
# - Data verification
```

---

## 🎯 EXECUTION TRACKING

### Daily Standup Template
```
Date: ___________
Person: ___________

✅ Completed Today:
- [ ] Task name - % complete
- [ ] Task name - % complete

🔄 In Progress:
- [ ] Task name - % complete
- [ ] Task name - % complete

❌ Blocked:
- [ ] Issue: ___________
  - Cause: ___________
  - Action: ___________

📊 Overall Progress: _____% (___/28 tasks)
```

### Weekly Review Template
```
Week: Mar 5-9 | Mar 12-16 | Mar 19-23 | Mar 26-30

✅ Completed:
- [ ] Task 1
- [ ] Task 2

⚠️ At Risk:
- [ ] Task X - reason

🎯 Next Week:
- [ ] Task Y
- [ ] Task Z

📊 Overall: _____% complete
```

---

## 🚨 RISK MANAGEMENT

### Risk 1: Backend API Not Standardized Yet
**Probability:** HIGH  
**Impact:** HIGH  
**Mitigation:**
- Start Task 2 early
- Coordinate with backend team immediately
- Frontend creates adapter layer anyway (defensive)
- Use mocking for frontend testing if backend not ready

### Risk 2: Type System Changes Break Existing Code
**Probability:** MEDIUM  
**Impact:** HIGH  
**Mitigation:**
- Do incremental updates (one endpoint at a time)
- Run tests after each change
- Keep backup of original api.ts
- Use git branches for safe rollback

### Risk 3: Performance Optimization Introduces Bugs
**Probability:** MEDIUM  
**Impact:** MEDIUM  
**Mitigation:**
- Test each split component separately
- Run both E2E and unit tests
- Monitor performance metrics
- Can revert if needed

### Risk 4: Test Coverage Takes Longer Than Planned
**Probability:** HIGH  
**Impact:** LOW  
**Mitigation:**
- This is lowest priority
- Target 70% coverage, not 100%
- Can parallelize with other tasks
- Focus on critical paths first

---

## ✅ DEFINITION OF DONE

For Each Task:

- [ ] Code written according to specifications
- [ ] TypeScript compiler: 0 errors
- [ ] ESLint: 0 error, ≤2 warnings
- [ ] All related unit tests pass
- [ ] All related E2E tests pass
- [ ] Code reviewed by peer (if team)
- [ ] Changes committed to git
- [ ] Documentation updated
- [ ] No performance regression
- [ ] No new console errors

---

## 📊 SUCCESS METRICS

**After Completing All Tasks:**

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| TypeScript Errors | 0 | 0 | ✅ 0 |
| Type Coverage | 85% | 95% | ✅ >90% |
| Test Coverage | 5% | 70% | ✅ >70% |
| E2E Tests | 5 | 15+ | ✅ >15 |
| API Consistency | 20% | 100% | ✅ 100% |
| CSRF Protected | 30% | 100% | ✅ 100% |
| Consent Management | 0% | 100% | ✅ 100% |
| Lighthouse Score | ~80 | ~90 | ✅ >85 |
| Build Time | 25s | 24s | ✅ <30s |
| Production Ready | 50% | 100% | ✅ 100% |

---

## 🎓 TEAM GUIDANCE

### For Frontend Developers:
1. Start with Task 1 (Types) - this is blocking everything
2. Do Task 2 immediately after (API)
3. Task 3 is coordination-heavy, do in parallel
4. Tasks 4-5 can be done in parallel
5. Task 6 (performance) - nice to have, can defer if needed

### For Full-Stack Developers:
1. Handle Task 2 coordination with backend
2. Own Task 3 (environment setup)
3. Can pair with frontend on other tasks

### For QA/Test Engineers:
1. Parallel: Help write tests for Task 7
2. Prepare test cases while others code
3. Run E2E tests daily
4. Track blockers

### For DevOps:
1. Prepare Task 3 infrastructure
2. Setup staging environment
3. Prepare deployment pipeline
4. Ready for go-live plan (end of week 3)

---

## 📅 CRITICAL PATH

```
Mar 5-6    →  Task 1 (Type Definitions) ✅ CRITICAL
             ↓
Mar 6-8    →  Task 2 (API Standardization) ✅ CRITICAL
             ↓
Mar 8      →  Task 3 (Environment Setup) ✅ CRITICAL
             ↓
Mar 9-11   →  Task 4 & 5 (Security) [parallel]
             ↓
Mar 12-14  →  Task 6 (Performance) [can shift]
             ↓
Mar 15-19  →  Task 7 (Testing) [can shift]
             ↓
Mar 20-22  →  Task 8 (Docs & Cleanup)
             ↓
Mar 23-24  →  Final Testing & Verification
             ↓
Mar 25-26  →  Go-Live Decision & Prep
             ↓
Mar 27     →  🚀 LAUNCH
```

---

## 💡 COMMAND CHEAT SHEET

```bash
# Development Commands
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm test                       # Run all tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report
npx playwright test           # Run E2E tests

# Code Quality
npm run lint                  # Run ESLint
npm run type-check           # Run TypeScript check (if configured)
npm run format               # Format code (if prettier configured)

# Git Commands
git status                    # Check status
git log --oneline            # View commits
git diff src/lib/api.ts      # See changes
git checkout -- src/         # Revert changes
git revert HEAD              # Undo last commit

# Debugging
NODE_ENV=development npm run dev    # Dev with logging
NODE_ENV=production npm run build   # Prod build
DEBUG=* npm run dev                 # All debug logs

# Verification
npm run build && npm run start      # Test prod build locally
curl http://localhost:3000          # Test if running
```

---

## 📞 COMMUNICATION PLAN

### Daily (9:00 AM)
- Quick standup (15 min)
- What's done, what's next, what's blocked

### Mid-Week (Tue/Thu)
- Detailed sync (30 min)
- Review progress
- Address blockers

### End of Week
- Full review (1 hour)
- Demonstrate progress
- Plan next week
- Risk assessment

---

**Prepared By:** Automated Planning System  
**Date:** March 5, 2026  
**Next Review:** March 6, 2026 (after Task 1)

