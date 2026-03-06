# FILE MODIFICATION & CREATION GUIDE

Complete list of all files to create or modify, with exact changes needed.

**Total Files:** 35  
**New Files:** 8  
**Modified Files:** 27

---

## 📁 NEW FILES TO CREATE (8 Total)

### 1. `src/types/api-contracts.ts` ✨ NEW
**Status:** Critical | **Priority:** 🔴 Task 1

**Purpose:** Define exact API response types

**Action:** CREATE new file with content from:
→ CODE_SNIPPETS_FOR_IMPLEMENTATION.md → Section 1

**Key Content:**
- `ApiProductResponse` interface
- `ApiProductVariantResponse` interface
- `ApiCollectionResponse` interface
- `ApiResponse<T>` generic type
- Type guard functions: `isProductArray()`, `isProduct()`

**Size:** ~250 lines  
**Dependencies:** None (new file)

---

### 2. `src/lib/csrf.ts` ✨ NEW
**Status:** Critical | **Priority:** 🟠 Task 4

**Purpose:** CSRF token generation and management

**Action:** CREATE new file with content from:
→ CODE_SNIPPETS_FOR_IMPLEMENTATION.md → Section 2

**Key Content:**
- `CsrfManager` class with 6 methods
- `generateToken()` - creates random token
- `getToken()` - retrieves from DOM or cookie
- `addToHeaders()` - adds to fetch headers
- `addToFormData()` - adds to form submissions

**Size:** ~150 lines  
**Dependencies:** None

---

### 3. `src/lib/consent-manager.ts` ✨ NEW
**Status:** Critical | **Priority:** 🟠 Task 5

**Purpose:** User consent tracking for analytics/marketing

**Action:** CREATE new file with content from:
→ CODE_SNIPPETS_FOR_IMPLEMENTATION.md → Section 3

**Key Content:**
- `ConsentManager` class
- Methods: `getConsent()`, `setConsent()`, `hasConsented()`
- `acceptAll()`, `rejectAll()`, `reset()`
- localStorage management
- Custom event dispatch

**Size:** ~180 lines  
**Dependencies:** None

---

### 4. `src/lib/api-fetch.ts` ✨ NEW
**Status:** Important | **Priority:** 🔴 Task 2

**Purpose:** Unified API fetch wrapper with CSRF support

**Action:** CREATE new file

```typescript
import { ApiResponse } from '@/types/api-contracts';
import { CsrfManager } from './csrf';
import { fetchWithTrace } from './api';

const API_URL = globalThis.window === undefined
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  : '/api';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { next?: object }
): Promise<ApiResponse<T>> {
  const method = (options?.method || 'GET').toUpperCase();
  const url = `${API_URL}${endpoint}`;

  try {
    const headers = new Headers(options?.headers);
    
    // Add CSRF for mutations
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

**Size:** ~50 lines  
**Dependencies:** api.ts, api-contracts.ts, csrf.ts

---

### 5. `src/lib/api-guards.ts` ✨ NEW
**Status:** Important | **Priority:** 🔴 Task 2

**Purpose:** Type guards for API response validation

**Action:** CREATE new file

```typescript
import type {
  ApiProductResponse,
  ApiCollectionResponse,
} from '@/types/api-contracts';

export function isProductArray(data: unknown): data is ApiProductResponse[] {
  return (
    Array.isArray(data) &&
    data.every(item => typeof item === 'object' && item !== null && 'id' in item)
  );
}

export function isProduct(data: unknown): data is ApiProductResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'handle' in data
  );
}

export function isCollectionArray(data: unknown): data is ApiCollectionResponse[] {
  return (
    Array.isArray(data) &&
    data.every(item => 'title' in item && 'handle' in item)
  );
}

export function isValidApiResponse<T>(response: unknown): boolean {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response
  );
}
```

**Size:** ~60 lines  
**Dependencies:** api-contracts.ts

---

### 6. `src/components/home/HeroSection.tsx` ✨ NEW
**Status:** Nice-to-have | **Priority:** 🟡 Task 6

**Purpose:** Split home page hero section

**Action:** CREATE new file by extracting hero code from `src/app/page.tsx`

**Extract from page.tsx lines:** (varies)
```typescript
export default function HeroSection() {
  // Code from page.tsx related to hero
  // ...
}
```

**Size:** ~100 lines  
**Dependencies:** components used in hero

---

### 7. `src/components/home/FeaturedProducts.tsx` ✨ NEW
**Status:** Nice-to-have | **Priority:** 🟡 Task 6

**Purpose:** Featured products section component

**Action:** CREATE new file by extracting from `src/app/page.tsx`

**Size:** ~80 lines

---

### 8. `src/components/home/Newsletter.tsx` ✨ NEW
**Status:** Nice-to-have | **Priority:** 🟡 Task 6

**Purpose:** Newsletter signup section

**Action:** CREATE new file, move NewsletterForm component

**Size:** ~50 lines

---

## ✏️ MODIFIED FILES (27 TOTAL)

### HIGH PRIORITY MODIFICATIONS

#### 1. `src/lib/api.ts` ⚡ CRITICAL
**Status:** Critical | **Priority:** 🔴 Task 1 & 2

**Changes Required:**

**Change 1.1:** Add imports at top
```typescript
// ADD after existing imports:
import { adaptProduct, adaptProducts } from './api-adapters';
import type {
  ApiResponse,
  ApiProductResponse,
  ApiCollectionResponse,
} from '@/types/api-contracts';
import { isProduct, isProductArray, isCollectionArray } from './api-guards';
import { CsrfManager } from './csrf';
```

**Change 1.2:** Update `fetchWithTrace()` function
**Location:** Lines ~50-70
```typescript
// ADD CSRF header support
async function fetchWithTrace(
  input: RequestInfo | URL,
  init?: RequestInit & { next?: object }
) {
  const startTime = getTime();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), API_TIMEOUT) : null;

  try {
    // GET CSRF TOKEN (if not GET request)
    const headers = new Headers(init?.headers);
    const method = (init?.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      CsrfManager.addToHeaders(headers);
    }

    const response = await fetch(input, { 
      ...init, 
      headers,  // ADD THIS
      signal: controller?.signal 
    });

    const duration = Math.round(getTime() - startTime);
    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.log(`[API ${response.status}] ${getUrlString(input)} (${duration}ms)`);
    }
    return response;
  } catch (error) {
    // ... existing error handling ...
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
```

**Change 1.3:** Update `getProducts()` function
**Location:** Lines ~446-460
```typescript
// OLD:
export async function getProducts(): Promise<{...}> {
  const res = await fetchWithTrace(`${API_URL}/api/products`);
  const json = await res.json();
  if (json.data && Array.isArray(json.data)) {
    return { ... };
  }
  return json;
}

// NEW:
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

    if (!json.success || !isProductArray(json.data)) {
      throw new Error('Invalid product response');
    }

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

**Change 1.4:** Update `getProduct()` function
**Location:** Lines ~482-500
```typescript
// Similar pattern to above
// Replace entire function with type-safe version
```

**Change 1.5:** Update `getFeaturedProducts()`, `getCollections()`, `searchProducts()`
- Apply same pattern to each endpoint
- Add type guards
- Use adapters

**Change 1.6:** Update `getCategories()`, `getBanners()`
- Add error handling
- Use type guards

**Changes:** ~10 large functions need updates  
**Estimated Lines Changed:** 200-300 lines  
**Testing:** Run `npm run build` after each change

---

#### 2. `src/app/layout.tsx` ⚡ CRITICAL
**Status:** Critical | **Priority:** 🟠 Task 4 & 5

**Change 2.1:** Add CSRF imports
```typescript
// ADD to imports:
import { CsrfManager } from '@/lib/csrf';
```

**Change 2.2:** Generate CSRF token in component
```typescript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ADD THIS:
  const csrfToken = CsrfManager.generateToken();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ADD CSRF META TAG: */}
        <meta name="csrf-token" content={csrfToken} />
        
        {/* Existing preconnect, dns-prefetch, etc... */}
```

**Changes:** 2 additions  
**Testing:** Verify meta tag in browser page source

---

#### 3. `src/lib/api-adapters.ts` ⚡ CRITICAL
**Status:** Critical | **Priority:** 🔴 Task 1

**Current State:** File likely exists but needs updating  
**Action:** Replace entire file with content from CODE_SNIPPETS_FOR_IMPLEMENTATION.md Section 1

**Functions to Include:**
- `adaptProduct()`
- `adaptProductVariant()`
- `adaptCollection()`
- `adaptProducts()`
- `adaptCollections()`

**Changes:** Replace entire file  
**Testing:** `npm run build` - should have 0 errors

---

### MEDIUM PRIORITY MODIFICATIONS

#### 4. `src/components/ui/CookieConsent.tsx` ⚡ HIGH
**Status:** High | **Priority:** 🟠 Task 5

**Action:** Replace entire component with content from CODE_SNIPPETS

**Key Updates:**
- Import `ConsentManager`
- Show/hide banner based on consent
- Add accept/reject/customize buttons
- Show consent categories (analytics, marketing, etc)
- Save preferences to localStorage

**Changes:** Full component replacement  
**Size:** ~180 lines  
**Testing:** `npm run dev` → clear localStorage → reload → should see banner

---

#### 5. `src/components/Analytics.tsx` ⚡ HIGH
**Status:** High | **Priority:** 🟠 Task 5

**Change:** Add consent check at start of useEffect

```typescript
import { ConsentManager } from '@/lib/consent-manager';

export function Analytics() {
  useEffect(() => {
    // ADD THIS CHECK:
    if (!ConsentManager.hasConsented('analytics')) {
      console.log('[Analytics] Skipping - no consent');
      return;
    }

    // ... existing analytics initialization ...
  }, []);

  return null;
}
```

**Changes:** 1 major change - add consent guard  
**Testing:** Check console - should skip if no consent

---

#### 6. `src/components/LogRocketProvider.tsx` ⚡ HIGH
**Status:** High | **Priority:** 🟠 Task 5

**Change:** Add consent check

```typescript
import { ConsentManager } from '@/lib/consent-manager';

export function LogRocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ADD THIS CHECK:
    if (!ConsentManager.hasConsented('session_recording')) {
      console.log('[LogRocket] Skipping - no consent');
      return;
    }

    // ... existing LogRocket init ...
  }, []);

  return <>{children}</>;
}
```

**Changes:** 1 consent guard  
**Testing:** Check console when LogRocket skipped

---

#### 7. `src/components/ui/TawkToWidget.tsx` ⚡ HIGH
**Status:** High | **Priority:** 🟠 Task 5

**Change:** Add consent check

```typescript
export function TawkToWidget({ propertyId }: TawkToProps) {
  useEffect(() => {
    // ADD THIS CHECK:
    if (!ConsentManager.hasConsented('marketing')) {
      console.log('[Tawk.to] Skipping - no consent');
      return;
    }

    // ... existing Tawk init ...
  }, []);

  return null;
}
```

**Changes:** 1 consent guard

---

### COMPONENT SPLITTING MODIFICATIONS (Task 6)

#### 8. `src/app/page.tsx` 🟡 MEDIUM
**Status:** Medium | **Priority:** 🟡 Task 6

**Current Size:** 722 lines  
**Target Size:** ~150 lines  
**Action:** Extract into sub-components and import

**Extract to New Files:**
1. Hero section → `src/components/home/HeroSection.tsx`
2. Featured products → `src/components/home/FeaturedProducts.tsx`
3. Testimonials → reuse existing `TestimonialsCarousel.tsx`
4. Newsletter → `src/components/home/Newsletter.tsx`

**Remaining in page.tsx:**
- Imports
- Metadata
- Dynamic flag
- getData() call if exists
- Return statement with components

**Example new structure:**
```typescript
import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Newsletter from '@/components/home/Newsletter';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { ... };

export default async function Home() {
  const data = await fetchData();
  
  return (
    <main>
      <HeroSection banners={data.banners} />
      <FeaturedProducts products={data.products} />
      <TestimonialsCarousel />
      <Newsletter />
    </main>
  );
}
```

**Changes:** Major refactoring - remove ~570 lines, add imports  
**Testing:** `npm run dev` → Homepage loads, all sections visible

---

#### 9. `src/components/ProductGrid.tsx` 🟡 MEDIUM
**Status:** Medium | **Priority:** 🟡 Task 6

**Change:** Wrap ProductCard with React.memo

```typescript
import React from 'react';

// Extract ProductCard outside or memoize
const ProductCard = React.memo(({ product, onSelect }) => {
  return (
    <div className="product-card">
      {/* ... */}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default function ProductGrid({ products, onSelectProduct }) {
  return (
    <div className="grid">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
}
```

**Changes:** Wrap 1 component with React.memo  
**Testing:** `npm run dev` → ProductGrid renders, no console errors

---

### IMAGE OPTIMIZATION MODIFICATIONS (Task 6)

#### 10-30. Image Tags Updates 🟡 MEDIUM
**Status:** Medium | **Priority:** 🟡 Task 6

**Files Affected:** ~20 component files with `<Image>` tags  
**Target:** Add width, height, quality, priority, sizes

**Pattern to Apply Everywhere:**
```typescript
// BEFORE:
<Image src={url} alt="Product" />

// AFTER:
<Image 
  src={url}
  alt="Product"
  width={400}
  height={400}
  quality={85}
  priority={isAboveFold}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Files to Update:**
- `src/components/ProductCard.tsx` - Add image dimensions
- `src/components/ProductGrid.tsx` - Add image dimensions
- `src/components/ProductCarousel.tsx` - Add image dimensions
- `src/components/hero/HeroCarousel.tsx` - Mark as priority
- `src/components/product/ProductGallery.tsx` - Add dimensions
- `src/components/product/ProductView.tsx` - Add dimensions
- `src/components/layout/Header.tsx` - Add logo dimensions
- `src/components/layout/Footer.tsx` - Add image dimensions
- And ~12 more files...

**Changes per file:** 1-5 Image tags  
**Testing:** `npm run dev` → pages load → no layout shift

---

### TEST FILE MODIFICATIONS

#### 31. `package.json` ⚡ TESTING
**Status:** Testing | **Priority:** 🟡 Task 7

**Change:** Add test scripts

```json
{
  "scripts": {
    // ... existing scripts ...
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

**Changes:** 3 new scripts  
**Testing:** `npm test` should work

---

### ENVIRONMENT FILE

#### 32. `.env.production` 📝 SETUP
**Status:** Setup | **Priority:** 🔴 Task 3

**Action:** CREATE (not commit, but document)

```bash
NEXT_PUBLIC_API_URL=https://api.kvastram.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_LOGROCKET_APP_ID=kvastram/production
NEXT_PUBLIC_TAWK_PROPERTY_ID=69916132e258621c36ed87d2/1jhfu7bu0
```

**Note:** File should NOT be committed  
**Verification:** Should be in .gitignore

---

### JEST CONFIGURATION FILES

#### 33. `jest.config.js` (NEW for testing)
#### 34. `jest.setup.js` (NEW for testing)

**Status:** Testing | **Priority:** 🟡 Task 7  
**Action:** Create configuration files  

---

## 📊 SUMMARY TABLE

| File | Status | Type | Lines | Task | Priority |
|------|--------|------|-------|------|----------|
| api-contracts.ts | NEW | 250 | Create | 1 | 🔴 |
| csrf.ts | NEW | 150 | Create | 4 | 🟠 |
| consent-manager.ts | NEW | 180 | Create | 5 | 🟠 |
| api-fetch.ts | NEW | 50 | Create | 2 | 🔴 |
| api-guards.ts | NEW | 60 | Create | 2 | 🔴 |
| HeroSection.tsx | NEW | 100 | Create | 6 | 🟡 |
| FeaturedProducts.tsx | NEW | 80 | Create | 6 | 🟡 |
| Newsletter.tsx | NEW | 50 | Create | 6 | 🟡 |
| **api.ts** | MODIFY | ~1000 | Update 10 functions | 1,2 | 🔴 |
| **layout.tsx** | MODIFY | ~160 | 2 changes | 4,5 | 🟠 |
| **api-adapters.ts** | MODIFY | ~150 | Replace all | 1 | 🔴 |
| **CookieConsent.tsx** | MODIFY | ~180 | Replace all | 5 | 🟠 |
| **Analytics.tsx** | MODIFY | ~100 | +1 guard | 5 | 🟠 |
| **LogRocketProvider.tsx** | MODIFY | ~100 | +1 guard | 5 | 🟠 |
| **TawkToWidget.tsx** | MODIFY | ~100 | +1 guard | 5 | 🟠 |
| **page.tsx** | MODIFY | 722 | Extract 570 | 6 | 🟡 |
| **ProductGrid.tsx** | MODIFY | ~200 | +React.memo | 6 | 🟡 |
| Image tags (20 files) | MODIFY | Various | +attributes | 6 | 🟡 |
| package.json | MODIFY | ~60 | +3 scripts | 7 | 🟡 |
| .env.production | NEW | N/A | Credentials | 3 | 🔴 |
| jest.config.js | NEW | ~30 | Create | 7 | 🟡 |
| jest.setup.js | NEW | ~10 | Create | 7 | 🟡 |
| **TOTAL** | | **~4500** | **35 files** | | |

---

## ✅ MODIFICATION CHECKLIST

Use this to track your progress:

### Week 1: Critical Files
- [ ] `src/types/api-contracts.ts` (NEW) ✨
- [ ] `src/lib/api-adapters.ts` (UPDATE)
- [ ] `src/lib/api.ts` (UPDATE - 10 functions)
- [ ] `src/lib/csrf.ts` (NEW) ✨
- [ ] `src/app/layout.tsx` (UPDATE - CSRF)
- [ ] `src/lib/consent-manager.ts` (NEW) ✨
- [ ] `src/components/ui/CookieConsent.tsx` (UPDATE)
- [ ] `.env.production` (NEW - credentials)

### Week 2: Quality Files
- [ ] `src/components/home/HeroSection.tsx` (NEW) ✨
- [ ] `src/components/home/FeaturedProducts.tsx` (NEW) ✨
- [ ] `src/components/home/Newsletter.tsx` (NEW) ✨
- [ ] `src/app/page.tsx` (UPDATE - split)
- [ ] `src/components/ProductGrid.tsx` (UPDATE - memo)
- [ ] Image tags (20 files) (UPDATE - dimensions)
- [ ] `jest.config.js` (NEW) ✨
- [ ] `jest.setup.js` (NEW) ✨
- [ ] `package.json` (UPDATE - test scripts)

### Week 3: Consent & Analytics
- [ ] `src/components/Analytics.tsx` (UPDATE - consent guard)
- [ ] `src/components/LogRocketProvider.tsx` (UPDATE - consent guard)
- [ ] `src/components/ui/TawkToWidget.tsx` (UPDATE - consent guard)

---

**Keep this guide open while making changes!**

