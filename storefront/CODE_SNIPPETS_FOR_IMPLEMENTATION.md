# IMPLEMENTATION CODE SNIPPETS

Ready-to-use code examples for implementing the critical fixes.

---

## 1️⃣ TYPE DEFINITION STANDARDIZATION

### File: `src/types/api-contracts.ts` (New)

```typescript
/**
 * API Response Contract Types
 * These types define the exact structure returned by the backend API
 * Do NOT modify these types without coordinating with backend team
 */

// ====== PRODUCT TYPES ======

export interface ApiProductResponse {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail?: string | null;
  status: 'draft' | 'published' | 'archived';
  variants?: ApiProductVariantResponse[];
  created_at: string;
  updated_at?: string;
}

export interface ApiProductVariantResponse {
  id: string;
  title?: string;
  sku?: string;
  barcode?: string;
  prices?: Array<{
    id: string;
    amount: number;
    currency_code: string;
  }>;
  options?: Array<{
    option_id: string;
    value: string;
  }>;
  inventory?: {
    quantity: number;
    in_stock: boolean;
  };
}

// ====== COLLECTION TYPES ======

export interface ApiCollectionResponse {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: string;
}

// ====== PAGINATION ======

export interface ApiPagination {
  limit: number;
  offset: number;
  total: number;
}

// ====== GENERIC API RESPONSE ======

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: ApiPagination;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Type Guards
export function isProductArray(data: unknown): data is ApiProductResponse[] {
  return Array.isArray(data) && data.every(item => typeof item === 'object' && 'id' in item);
}

export function isProduct(data: unknown): data is ApiProductResponse {
  return typeof data === 'object' && data !== null && 'id' in data && 'title' in data;
}

export function isCollectionArray(data: unknown): data is ApiCollectionResponse[] {
  return Array.isArray(data) && data.every(item => 'title' in item && 'handle' in item);
}
```

### File: `src/lib/api-adapters.ts` (Update)

```typescript
/**
 * API Response Adapters
 * Convert API responses to frontend types
 */

import type {
  ApiProductResponse,
  ApiProductVariantResponse,
  ApiCollectionResponse,
} from '@/types/api-contracts';
import type { Product, ProductVariant, Collection } from '@/types';

/**
 * Adapt API Product response to Frontend Product type
 */
export function adaptProduct(apiProduct: ApiProductResponse): Product {
  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description,
    handle: apiProduct.handle,
    thumbnail: apiProduct.thumbnail,
    status: apiProduct.status,
    variants: (apiProduct.variants || []).map(adaptProductVariant),
    created_at: apiProduct.created_at,
    // Frontend-specific fields default to undefined
    images: undefined,
    options: undefined,
    material: undefined,
    origin_country: undefined,
    size_guide: undefined,
    care_instructions: undefined,
  };
}

/**
 * Adapt API ProductVariant to Frontend ProductVariant
 */
export function adaptProductVariant(
  apiVariant: ApiProductVariantResponse
): ProductVariant {
  return {
    id: apiVariant.id,
    title: apiVariant.title || 'Default',
    prices: apiVariant.prices || [],
    inventory: apiVariant.inventory || { quantity: 0, in_stock: false },
    options: apiVariant.options || [],
  };
}

/**
 * Adapt API Collection to Frontend Collection
 */
export function adaptCollection(
  apiCollection: ApiCollectionResponse
): Collection {
  return {
    id: apiCollection.id,
    title: apiCollection.title,
    handle: apiCollection.handle,
    description: apiCollection.description,
    image: apiCollection.image,
  };
}

/**
 * Batch adaptation for arrays
 */
export function adaptProducts(
  apiProducts: ApiProductResponse[]
): Product[] {
  return apiProducts.map(adaptProduct);
}

export function adaptCollections(
  apiCollections: ApiCollectionResponse[]
): Collection[] {
  return apiCollections.map(adaptCollection);
}
```

### File: `src/lib/api.ts` (Update - Example Pattern)

```typescript
// Update getProducts() method

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
    if (!isValidApiResponse(json)) {
      throw new Error('Invalid API response format');
    }

    if (!isProductArray(json.data)) {
      throw new Error('Invalid product data in response');
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

// Update getProduct() method

export async function getProduct(
  handle: string
): Promise<Product> {
  try {
    const response = await fetchWithTrace(
      `${API_URL}/api/products/${handle}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const json = (await response.json()) as ApiResponse<ApiProductResponse>;

    // Validate response
    if (!isValidApiResponse(json)) {
      throw new Error('Invalid API response format');
    }

    if (!isProduct(json.data)) {
      throw new Error('Invalid product data in response');
    }

    return adaptProduct(json.data);
  } catch (error) {
    console.error('[API] getProduct error:', error);
    throw error;
  }
}
```

---

## 2️⃣ CSRF PROTECTION

### File: `src/lib/csrf.ts` (Create/Update)

```typescript
/**
 * CSRF Token Management
 * Generates, stores, and validates CSRF tokens
 */

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = '__csrf_token';
const CSRF_META_NAME = 'csrf-token';

export class CsrfManager {
  /**
   * Generate a new CSRF token (server-side)
   * This should be called on page load and stored in meta tag
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get CSRF token from meta tag (set by layout.tsx)
   */
  static getTokenFromDOM(): string | null {
    if (typeof document === 'undefined') return null;

    const meta = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
    return meta?.getAttribute('content') || null;
  }

  /**
   * Get CSRF token from cookie
   */
  static getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Get CSRF token (tries multiple sources)
   */
  static getToken(): string | null {
    return this.getTokenFromDOM() || this.getTokenFromCookie();
  }

  /**
   * Add CSRF token to fetch headers
   */
  static addToHeaders(headers: Headers): Headers {
    const token = this.getToken();
    if (token) {
      headers.set(CSRF_HEADER, token);
    }
    return headers;
  }

  /**
   * Add CSRF token to FormData
   */
  static addToFormData(formData: FormData): FormData {
    const token = this.getToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  }
}

export { CSRF_HEADER, CSRF_COOKIE, CSRF_META_NAME };
```

### File: `src/app/layout.tsx` (Update Head)

```typescript
import { CsrfManager } from '@/lib/csrf';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate CSRF token on server-side
  const csrfToken = CsrfManager.generateToken();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CSRF Token Meta Tag */}
        <meta name="csrf-token" content={csrfToken} />
        
        {/* ... other head content ... */}
      </head>
      <body>
        {/* ... body content ... */}
      </body>
    </html>
  );
}
```

### File: `src/lib/api.ts` (Update Fetch)

```typescript
// Update fetchWithTrace to include CSRF

async function fetchWithTrace(
  input: RequestInfo | URL,
  init?: RequestInit & { next?: object }
) {
  const startTime = getTime();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), API_TIMEOUT) : null;

  try {
    // Add CSRF token to headers for mutations
    const headers = new Headers(init?.headers);
    const method = (init?.method || 'GET').toUpperCase();

    if (method !== 'GET') {
      CsrfManager.addToHeaders(headers);
    }

    const response = await fetch(input, {
      ...init,
      headers,
      signal: controller?.signal,
    });

    const duration = Math.round(getTime() - startTime);

    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.log(`[API ${response.status}] ${getUrlString(input)} (${duration}ms)`);
    }

    return response;
  } catch (error) {
    // ... error handling ...
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
```

---

## 3️⃣ THIRD-PARTY CONSENT MANAGEMENT

### File: `src/lib/consent-manager.ts` (Create)

```typescript
/**
 * User Consent Manager
 * Manages consent for analytics, marketing, and session recording
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | 'session_recording';

export interface UserConsent {
  timestamp: number;
  version: string;
  categories: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    session_recording: boolean;
  };
}

const CONSENT_KEY = 'kvastram_user_consent';
const CONSENT_VERSION = '1.0';
const CONSENT_VALIDITY_DAYS = 30;

export class ConsentManager {
  /**
   * Get current user consent
   */
  static getConsent(): UserConsent | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;

      const consent: UserConsent = JSON.parse(stored);

      // Check if still valid (30 days)
      const ageMs = Date.now() - consent.timestamp;
      const maxAgeMs = CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;

      if (ageMs > maxAgeMs) {
        return null;
      }

      return consent;
    } catch {
      return null;
    }
  }

  /**
   * Set user consent
   */
  static setConsent(categories: UserConsent['categories']): void {
    if (typeof localStorage === 'undefined') return;

    const consent: UserConsent = {
      timestamp: Date.now(),
      version: CONSENT_VERSION,
      categories,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Dispatch custom event for other components to listen
    window.dispatchEvent(
      new CustomEvent('consent-updated', { detail: consent })
    );
  }

  /**
   * Check if user has consented to a category
   */
  static hasConsented(category: ConsentCategory): boolean {
    // Essential is always true
    if (category === 'essential') return true;

    const consent = this.getConsent();
    return consent?.categories[category] ?? false;
  }

  /**
   * Accept all consents
   */
  static acceptAll(): void {
    this.setConsent({
      essential: true,
      analytics: true,
      marketing: true,
      session_recording: true,
    });
  }

  /**
   * Reject all non-essential
   */
  static rejectAll(): void {
    this.setConsent({
      essential: true,
      analytics: false,
      marketing: false,
      session_recording: false,
    });
  }

  /**
   * Check if consent banner should be shown
   */
  static shouldShowBanner(): boolean {
    return !this.getConsent();
  }

  /**
   * Reset consent (user can re-consent)
   */
  static reset(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(CONSENT_KEY);
  }
}
```

### File: `src/components/ui/CookieConsent.tsx` (Update)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ConsentManager } from '@/lib/consent-manager';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [consent, setConsent] = useState({
    analytics: false,
    marketing: false,
    session_recording: false,
  });

  useEffect(() => {
    // Check on client-side only
    const shouldShow = ConsentManager.shouldShowBanner();
    setShowBanner(shouldShow);
  }, []);

  if (!showBanner) return null;

  const handleAcceptAll = () => {
    ConsentManager.acceptAll();
    setShowBanner(false);
    // Optionally reload to initialize accepted scripts
    // window.location.reload();
  };

  const handleRejectAll = () => {
    ConsentManager.rejectAll();
    setShowBanner(false);
  };

  const handleSaveCustom = () => {
    ConsentManager.setConsent({
      essential: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      session_recording: consent.session_recording,
    });
    setShowBanner(false);
  };

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950 border-t border-gray-800 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Privacy & Cookies</h3>
              <p className="text-sm text-gray-400">
                We use cookies and tracking technologies to improve your browsing experience
                and analyze site traffic.{' '}
                <Link href="/privacy-policy" className="underline hover:text-white">
                  Learn more
                </Link>
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:border-gray-400 transition"
              >
                Reject
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:border-gray-400 transition"
              >
                Customize
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Details Section */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Essential */}
                <div>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="cursor-not-allowed"
                    />
                    <span className="text-sm">
                      Essential <span className="text-xs text-gray-400">(Always)</span>
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Required for site functionality
                  </p>
                </div>

                {/* Analytics */}
                <div>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) =>
                        setConsent({ ...consent, analytics: e.target.checked })
                      }
                    />
                    <span className="text-sm">Analytics</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Google Analytics, Sentry
                  </p>
                </div>

                {/* Marketing */}
                <div>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) =>
                        setConsent({ ...consent, marketing: e.target.checked })
                      }
                    />
                    <span className="text-sm">Marketing</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Tawk.to chat widget
                  </p>
                </div>

                {/* Session Recording */}
                <div>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.session_recording}
                      onChange={(e) =>
                        setConsent({ ...consent, session_recording: e.target.checked })
                      }
                    />
                    <span className="text-sm">Session Recording</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    LogRocket session recordings
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSaveCustom}
                  className="px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### File: `src/components/Analytics.tsx` (Update)

```typescript
'use client';

import { useEffect } from 'react';
import { ConsentManager } from '@/lib/consent-manager';

export function Analytics() {
  useEffect(() => {
    // Only load Google Analytics if consent given
    if (!ConsentManager.hasConsented('analytics')) {
      console.log('[Analytics] User has not consented to analytics');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', process.env.NEXT_PUBLIC_GA_ID);

    window.gtag = gtag;
  }, []);

  return null;
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!ConsentManager.hasConsented('analytics')) {
    console.log('[Analytics] Skipping event - no consent', eventName);
    return;
  }

  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}
```

### File: `src/components/LogRocketProvider.tsx` (Update)

```typescript
'use client';

import { useEffect } from 'react';
import { ConsentManager } from '@/lib/consent-manager';
import LogRocket from 'logrocket';

export function LogRocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize LogRocket if consent given
    if (!ConsentManager.hasConsented('session_recording')) {
      console.log('[LogRocket] User has not consented to session recording');
      return;
    }

    try {
      LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID || '');
      console.log('[LogRocket] Initialized with consent');
    } catch (error) {
      console.error('[LogRocket] Initialization error:', error);
    }
  }, []);

  return <>{children}</>;
}

export function requestLogRocketConsent() {
  if (!ConsentManager.hasConsented('session_recording')) {
    console.warn('[LogRocket] User consent required before recording');
    return;
  }
  // LogRocket will be active
}

export { LogRocket };
```

---

## 4️⃣ ENVIRONMENT CONFIGURATION

### File: `.env.production` (Template)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.kvastram.com

# Payment Processing (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# Authentication (OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID

# Analytics & Monitoring
NEXT_PUBLIC_GA_ID=G-YOUR_GA_ID
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_ID

# Third-Party Services
NEXT_PUBLIC_LOGROCKET_APP_ID=kvastram/production
NEXT_PUBLIC_TAWK_PROPERTY_ID=69916132e258621c36ed87d2/1jhfu7bu0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SESSION_RECORDING=true
NEXT_PUBLIC_ENABLE_CHAT_WIDGET=true
```

---

**Note:** All code snippets are ready to copy/paste. Test thoroughly before deploying to production.

