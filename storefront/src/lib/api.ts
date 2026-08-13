/**
 * API Integration Layer - Task 2 Standardization
 * 
 * This file provides centralized API communication with:
 * ✅ Type-safe request/response handling (api-contracts.ts)
 * ✅ Response validation guards (api-guards.ts)
 * ✅ Unified request wrapper (api-fetch.ts)
 * ✅ Adapter patterns for response transformation
 * 
 * Pattern for adding new endpoints:
 * 1. Define types in /types/api-contracts.ts
 * 2. Use adaptProduct/adaptProducts for transformations
 * 3. Add validation guards to ensure type safety
 * 4. Use try/catch with proper error handling
 * 5. Return standardized response format
 */

import { adaptProduct } from './api-adapters';
import { catalogApi } from './api-catalog';
import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';
import { wholesaleApi } from './api-wholesale';
import type { HomepagePayload } from '@/types/homepage';

// Type definitions for API requests/responses
export interface StudioInquiryData {
  product_id?: string;
  product_title: string;
  product_handle?: string;
  product_url?: string;
  inquiry_type: 'question' | 'custom_size' | 'shipping';
  customer_name: string;
  email?: string;
  phone?: string;
  message: string;
  measurements?: {
    height?: string;
    bust?: string;
    waist?: string;
    hips?: string;
    preferredLength?: string;
  };
}

interface OrderCreateData {
  region_id: string;
  currency_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postal_code: string;
    province?: string;
    country_code: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  shipping_method: string;
  discount_code?: string;
  gift_wrapping?: boolean;
  gift_message?: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface CustomerUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface CustomerAddressInput {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  province?: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

interface CustomerAddressRecord extends CustomerAddressInput {
  id: string;
  created_at?: string;
  updated_at?: string;
}

interface ReviewCreateData {
  rating: number;
  title?: string;
  content: string;
  author_name?: string;
  customer_id?: string;
  images?: string[];
}

interface TaxRate {
  country_code: string;
  rate: number;
  name: string;
}

interface StoreSettings {
  free_shipping_threshold?: number;
  currency_code?: string;
  store_name?: string;
  tax_rates?: TaxRate[];
  default_tax_rate?: number;
}

interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  material?: string;
  origin?: string;
  sku?: string;
  description?: string;
}

interface ZodIssue {
  path: string[];
  message: string;
}

export const api = {
  async getHomepage(): Promise<HomepagePayload> {
    const res = await fetchWithTrace(`${API_URL}/homepage`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Homepage API failed with ${res.status}`);
    }
    return res.json();
  },
  async sendCheckoutOtp(email: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },
  async verifyCheckoutOtp(email: string, otp: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    return data;
  },
  // Generic methods for untyped calls (fixes compilation errors and enables tracing)
  async get(endpoint: string) {
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json();
  },

  async post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body: TBody
  ) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      // Try to parse error response
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json() as Promise<TResponse>;
  },

  async put<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body: TBody
  ) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json() as Promise<TResponse>;
  },

  async delete(endpoint: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...csrfHeader,
      },
      credentials: 'include',
    });
    if (res.status === 204) {
      return null;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return res.json();
  },

  async getRegions() {
    try {
      const res = await fetchWithTrace(`${API_URL}/regions`);
      if (!res.ok) throw new Error('Failed to fetch regions');
      return res.json();
    } catch {
      // Return fallback structure found in regions response
      return { regions: [] };
    }
  },

  async getCategories() {
    try {
      // Cache for 1 hour
      const res = await fetchWithTrace(`${API_URL}/categories/tree`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { categories: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { categories: [] };
    }
  },

  async getCategoriesTree() {
    return this.getCategories();
  },

  async getCollections() {
    try {
      const res = await fetchWithTrace(`${API_URL}/collections`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { collections: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { collections: [] };
    }
  },

  async getCollection(handle: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/collections/${encodeURIComponent(handle)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        return { collection: null };
      }
      return res.json();
    } catch {
      return { collection: null };
    }
  },

  async getHomepageSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/homepage`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { settings: {} };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { settings: {} };
    }
  },

  async getStoreSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/settings`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return null;
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return null;
    }
  },

  // Get footer settings for wholesale page
  async getFooterSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/footer`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { settings: {} };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { settings: {} };
    }
  },

  // Get wholesale tiers for public page
  async getWholesaleTiers() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/wholesale-tiers`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { tiers: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { tiers: [] };
    }
  },

  async getPages() {
    try {
      const res = await fetchWithTrace(`${API_URL}/pages/storefront`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { pages: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { pages: [] };
    }
  },

  async getTags() {
    try {
      const res = await fetchWithTrace(`${API_URL}/tags`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { tags: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { tags: [] };
    }
  },

  async getTestimonials() {
    try {
      const res = await fetchWithTrace(`${API_URL}/testimonials/store`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { testimonials: [] };
      }
      return res.json();
    } catch {
      // Silently return fallback when backend not available
      return { testimonials: [] };
    }
  },

  async getFeaturedProducts(ids: string[]) {
    if (!ids || ids.length === 0) return { products: [] };
    try {
      const idsString = ids.join(',');
      const res = await fetchWithTrace(
        `${API_URL}/products/featured?ids=${encodeURIComponent(idsString)}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) {
        // Silently return fallback when backend not available
        return { products: [] };
      }
      const data = await res.json();
      return { products: data.data || [] };
    } catch {
      // Silently return fallback when backend not available
      return { products: [] };
    }
  },

  ...catalogApi,

  createOrder: async (data: OrderCreateData) => {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/checkout/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      const errorMessage =
        typeof error.details === 'string' ? error.details :
        typeof error.error === 'string' ? error.error :
        Array.isArray(error.error?.issues) ? error.error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ') :
        Array.isArray(error.details) ? error.details.map((e: ZodIssue) => e.message).join(', ') :
        'Failed to place order';
      throw new Error(errorMessage);
    }
    return res.json();
  },

  validateCoupon: async (code: string, cartTotal: number) => {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/checkout/validate-coupon`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ code, cart_total: cartTotal }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Invalid coupon');
    }
    return res.json();
  },

  // --- Shipping Options (PHASE 1.3) ---
  async getShippingOptions(
    countryCode: string,
    regionId?: string,
    postalCode?: string
  ) {
    try {
      const params = new URLSearchParams({ country_code: countryCode });
      if (regionId) params.append('region_id', regionId);
      if (postalCode?.trim()) params.append('postal_code', postalCode.trim());

      const res = await fetchWithTrace(
        `${API_URL}/store/checkout/shipping-options?${params}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        // Return default options if endpoint doesn't exist
        return getDefaultShippingOptions(countryCode);
      }
      return res.json();
    } catch {
      // Return default options on error
      return getDefaultShippingOptions(countryCode);
    }
  },

  // --- Tax Calculation (PHASE 1.4) ---
  async calculateTax(
    countryCode: string,
    subtotal: number,
    regionId?: string,
    settings?: StoreSettings
  ) {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/checkout/tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({
          country_code: countryCode,
          subtotal,
          region_id: regionId,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        // Return default tax if endpoint doesn't exist
        return getDefaultTax(countryCode, subtotal, settings);
      }
      return res.json();
    } catch {
      // Return default tax on error
      return getDefaultTax(countryCode, subtotal, settings);
    }
  },

  // --- Auth ---
  async register(data: RegisterData) {
    const url = `${API_URL}/store/auth/register`;
    const res = await fetchWithTrace(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: Request failed`;

      try {
        const errorData = await res.json();

        // Handle Zod validation errors from backend (errorData.errors)
        if (errorData.success === false && errorData.errors) {
          const errors = errorData.errors;
          const firstError = Object.values(errors)[0];
          errorMessage =
            typeof firstError === 'string' ? firstError : 'Validation failed';
        } else if (errorData.success === false && errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // Response body was empty or not JSON, keep the default errorMessage
      }

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const jsonData = await res.json();
    return jsonData;
  },

  // --- Resend Verification Email ---
  async resendVerification(email: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/resend-verification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      let errorMessage = 'Failed to resend verification email';
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        try {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // Keep default error message
        }
      }
      throw new Error(errorMessage);
    }
    return res.json();
  },

  // --- Verify OTP ---
  async verifyOtp(data: { email: string; otp: string }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/verify-otp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      let errorMessage = 'Verification failed';
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // Keep default error message
      }
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async login(data: LoginData) {
    const url = `${API_URL}/store/auth/login`;
    const res = await fetchWithTrace(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw errorData;
    }
    const jsonData = await res.json();
    return jsonData;
  },

  async socialLogin(
    provider: 'google' | 'facebook',
    data: {
      id_token?: string;
      access_token?: string;
      email: string;
      name?: string;
      avatar?: string;
    }
  ) {
    const res = await fetchWithTrace(
      `${API_URL}/store/auth/social/${provider}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomer() {
    const res = await fetchWithTrace(`${API_URL}/store/auth/me`, {
      credentials: 'include', // Cookies are sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateCustomer(data: CustomerUpdateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getCustomerOrders() {
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/orders`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getCustomerAddresses(): Promise<{ addresses: CustomerAddressRecord[] }> {
    const res = await fetchWithTrace(
      `${API_URL}/store/customers/me/addresses`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return res.json();
  },

  async createCustomerAddress(
    data: CustomerAddressInput
  ): Promise<{ address: CustomerAddressRecord }> {
    return api.post('/store/customers/me/addresses', data);
  },

  async updateCustomerAddress(
    id: string,
    data: Partial<CustomerAddressInput>
  ): Promise<{ address: CustomerAddressRecord }> {
    return api.put(`/store/customers/me/addresses/${id}`, data);
  },

  async deleteCustomerAddress(id: string): Promise<{ success: boolean }> {
    return api.delete(`/store/customers/me/addresses/${id}`);
  },

  async getOrder(id: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/customers/me/orders/${id}`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async trackOrder(orderNumber: string, email: string) {
    const query = new URLSearchParams({
      order_number: orderNumber,
      email,
    });
    const res = await fetchWithTrace(
      `${API_URL}/store/orders/track?${query.toString()}`
    );
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || error?.error || 'Failed to track order');
    }
    const payload = await res.json();
    return payload.data;
  },

  // --- Cart Persistence (Cart Abandonment Recovery) ---
  async saveCart(items: CartItem[]) {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/cart/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to save cart');
      return res.json();
    } catch (error) {
      console.error('[API] saveCart error:', error);
      throw error;
    }
  },

  async getSavedCart() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/cart`, {
        credentials: 'include',
      });
      if (!res.ok) {
        // Return empty cart if not found
        return { items: [] };
      }
      return res.json();
    } catch (error) {
      console.error('[API] getSavedCart error:', error);
      return { items: [] };
    }
  },

  async clearSavedCart() {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/cart/clear`, {
        method: 'POST',
        headers: {
          ...csrfHeader,
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to clear saved cart');
      return res.json();
    } catch (error) {
      console.error('[API] clearSavedCart error:', error);
      throw error;
    }
  },

  async getBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/banners`, {
        cache: 'no-store',
      });
      if (!res.ok) return { banners: [] }; // Return empty if fails, don't crash
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getHeroBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/hero-banners`, {
        cache: 'no-store',
      });
      if (!res.ok) return { banners: [] };
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getTrustItems() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trust-items`, {
        cache: 'no-store',
      });
      if (!res.ok) return { items: [] };
      return res.json();
    } catch {
      return { items: [] };
    }
  },

  async getTrendingReels() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels`, {
        cache: 'no-store',
      });
      if (!res.ok) return { reels: [] };
      return res.json();
    } catch {
      return { reels: [] };
    }
  },

  async getReelCollections() {
    try {
      const res = await fetchWithTrace(`${API_URL}/reel-collections`, {
        cache: 'no-store',
      });
      if (!res.ok) return { collections: [] };
      return res.json();
    } catch {
      return { collections: [] };
    }
  },

  async recordTrendingReelView(id: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels/${id}/view`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getHomepageCategories() {
    try {
      const res = await fetchWithTrace(`${API_URL}/homepage-categories`, {
        cache: 'no-store',
      });
      if (!res.ok) return { categories: [] };
      return res.json();
    } catch {
      return { categories: [] };
    }
  },

  async getCategoryCircles() {
    try {
      const res = await fetchWithTrace(`${API_URL}/category-circles`, {
        cache: 'no-store',
      });
      if (!res.ok) return { circles: [] };
      return res.json();
    } catch {
      return { circles: [] };
    }
  },

  async getSpotlightProducts(section = 'spotlight') {
    try {
      const suffix = section ? `?section=${encodeURIComponent(section)}` : '';
      const res = await fetchWithTrace(`${API_URL}/featured-products${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { featuredProducts: [] };
      const json = await res.json();
      type SpotlightApiItem = Record<string, unknown> & {
        product?: Parameters<typeof adaptProduct>[0] | null;
      };

      return {
        featuredProducts: Array.isArray(json.featuredProducts)
          ? json.featuredProducts.map((item: SpotlightApiItem) => ({
              ...item,
              product: item.product ? adaptProduct(item.product) : null,
            }))
          : [],
      };
    } catch {
      return { featuredProducts: [] };
    }
  },

  async getHomepageMerchandising(slot?: string) {
    try {
      const suffix = slot ? `?slot=${encodeURIComponent(slot)}` : '';
      const res = await fetchWithTrace(`${API_URL}/homepage-merchandising${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { slots: [] };
      return res.json();
    } catch {
      return { slots: [] };
    }
  },
  async getPosts() {
    try {
      // Cache for 60 seconds
      const res = await fetchWithTrace(`${API_URL}/posts/storefront`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return { posts: [] };
      return res.json();
    } catch {
      return { posts: [] };
    }
  },

  async getPost(slug: string) {
    // Cache for 60 seconds
    const res = await fetchWithTrace(`${API_URL}/posts/storefront/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Post not found');
    return res.json();
  },

  async getPage(slug: string) {
    // Cache for 60 mins
    const res = await fetchWithTrace(`${API_URL}/pages/storefront/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Page not found');
    return res.json();
  },

  async getReviews(productId: string) {
    const res = await fetchWithTrace(
      `${API_URL}/reviews/store/products/${productId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      throw new Error(`Failed to load reviews (${res.status})`);
    }
    return res.json();
  },

  async createReview(productId: string, data: ReviewCreateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/reviews/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ ...data, product_id: productId }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // --- Back in Stock Notifications ---
  async subscribeBackInStock(data: {
    product_id: string;
    email: string;
    variant_id?: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/back-in-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        product_id: data.product_id,
        variant_id: data.variant_id,
        email: data.email,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async submitStudioInquiry(data: StudioInquiryData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getStudioInquiryConversation(id: string, token: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/studio-inquiries/${id}?token=${encodeURIComponent(token)}`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async sendStudioInquiryMessage(data: {
    id: string;
    token: string;
    customer_name?: string;
    email?: string;
    message: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries/${data.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        token: data.token,
        customer_name: data.customer_name,
        email: data.email,
        message: data.message,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomerStudioInquiries() {
    return api.get('/store/customers/me/studio-inquiries');
  },

  async getCustomerStudioInquiry(id: string) {
    return api.get(`/store/customers/me/studio-inquiries/${id}`);
  },

  async sendCustomerStudioMessage(id: string, message: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/studio-inquiries/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ message }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // --- Returns (Customer-initiated) ---
  async requestReturn(data: {
    order_id: string;
    reason: string;
    items: Array<{ line_item_id: string; quantity: number; restock?: boolean }>;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to submit return request');
    }
    return res.json();
  },

  async getCustomerReturns() {
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch returns');
    return res.json();
  },

  // --- Payments ---
  async createPaymentIntent(orderId: string, checkoutToken: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(
      `${API_URL}/store/payments/create-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({
          order_id: orderId,
          checkout_token: checkoutToken,
        }),
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }
    return res.json();
  },

  async checkPaymentStatus(orderId: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/payments/status/${orderId}`
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to check payment status');
    }
    return res.json();
  },

  ...wholesaleApi,

  // --- Wishlist ---
  async getWishlist() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
        credentials: 'include',
      });
      if (!res.ok) return { wishlist: [] };
      return res.json();
    } catch {
      return { wishlist: [] };
    }
  },

  async addToWishlist(product_id: string, variant_id?: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, variant_id }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add to wishlist');
    }
    return res.json();
  },

  async removeFromWishlist(product_id: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist/${product_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove from wishlist');
    }
    return res.json();
  },

  // --- Campaigns ---
  async getActiveCampaigns() {
    try {
      const res = await fetchWithTrace(`${API_URL}/marketing/campaigns/active`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return { campaigns: [] };
      return res.json();
    } catch {
      return { campaigns: [] };
    }
  },
};


// Default shipping options fallback (PHASE 1.3)
function getDefaultShippingOptions(countryCode: string) {
  const isInternational = countryCode !== 'US';

  const options = [
    {
      id: 'standard',
      name: isInternational
        ? 'Standard International Shipping'
        : 'Standard Shipping',
      description: isInternational ? '7-14 business days' : '5-7 business days',
      price: isInternational ? 2500 : 0, // $25 or free
      estimated_days: isInternational ? '7-14' : '5-7',
      currency_code: 'USD',
    },
    {
      id: 'express',
      name: isInternational
        ? 'Express International Shipping'
        : 'Express Shipping',
      description: isInternational ? '3-5 business days' : '2-3 business days',
      price: isInternational ? 4500 : 1500, // $45 or $15
      estimated_days: isInternational ? '3-5' : '2-3',
      currency_code: 'USD',
    },
  ];

  // Free shipping threshold (mock - should come from backend)
  const freeShippingThreshold = 25000; // $250

  return {
    options,
    free_shipping_threshold: freeShippingThreshold,
    currency_code: 'USD',
  };
}

// Default tax calculation fallback (PHASE 1.4)
function getDefaultTax(
  countryCode: string,
  subtotal: number,
  settings?: StoreSettings
) {
  // Use dynamic tax rates from settings if available, otherwise use hardcoded defaults
  const defaultTaxRates: Record<string, { rate: number; name: string }> = {
    US: { rate: 0.08, name: 'Sales Tax' },
    GB: { rate: 0.2, name: 'VAT' },
    CA: { rate: 0.13, name: 'HST' },
    AU: { rate: 0.1, name: 'GST' },
    DE: { rate: 0.19, name: 'VAT' },
    FR: { rate: 0.2, name: 'VAT' },
    IN: { rate: 0.18, name: 'GST' },
    JP: { rate: 0.1, name: 'Consumption Tax' },
  };

  // Try to get rate from settings first
  let rate: number;
  let taxName: string;

  if (settings?.tax_rates) {
    const settingRate = settings.tax_rates.find(
      (tr) => tr.country_code === countryCode
    );
    if (settingRate) {
      rate = settingRate.rate;
      taxName = settingRate.name;
    } else {
      rate = settings.default_tax_rate ?? 0.1;
      taxName = countryCode === 'US' ? 'Sales Tax' : 'VAT';
    }
  } else {
    // Fall back to hardcoded defaults
    const defaultRate = defaultTaxRates[countryCode] ?? {
      rate: 0.1,
      name: countryCode === 'US' ? 'Sales Tax' : 'VAT',
    };
    rate = defaultRate.rate;
    taxName = defaultRate.name;
  }

  const taxAmount = Math.round(subtotal * rate);

  return {
    tax_amount: taxAmount,
    tax_rate: rate,
    tax_name: taxName,
    currency_code: settings?.currency_code || 'USD',
  };
}
