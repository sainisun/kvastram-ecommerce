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

import { authAccountApi } from './api-auth-account';
import { catalogApi } from './api-catalog';
import { checkoutPaymentApi } from './api-checkout-payment';
import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';
import { contentMediaApi } from './api-content-media';
import { engagementApi } from './api-engagement';
import { wholesaleApi } from './api-wholesale';
import type { HomepagePayload } from '@/types/homepage';

export type { StudioInquiryData } from './api-engagement';

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

  ...contentMediaApi,

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

  ...wholesaleApi,

  ...engagementApi,

};
