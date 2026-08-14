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
import { authAccountApi } from './api-auth-account';
import { catalogApi } from './api-catalog';
import { checkoutPaymentApi } from './api-checkout-payment';
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

interface ReviewCreateData {
  rating: number;
  title?: string;
  content: string;
  author_name?: string;
  customer_id?: string;
  images?: string[];
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
  ...checkoutPaymentApi,
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

  ...authAccountApi,

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
