import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';

export interface WholesaleOrderData {
  items: Array<{ variant_id: string; quantity: number }>;
  shipping_address: Record<string, unknown>;
  email: string;
}

export const wholesaleApi = {
  async getWholesaleTiers() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/wholesale-tiers`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { tiers: [] };
      return res.json();
    } catch {
      return { tiers: [] };
    }
  },

  async getWholesalePricing() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wholesale/prices`, {
        credentials: 'include',
      });
      if (!res.ok) return { hasWholesaleAccess: false, tier: null };
      return res.json();
    } catch {
      return { hasWholesaleAccess: false, tier: null };
    }
  },

  async getWholesalePrices(variantIds: string[]) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/prices/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds }),
          credentials: 'include',
        }
      );
      if (!res.ok) return { prices: [] };
      return res.json();
    } catch {
      return { prices: [] };
    }
  },

  async getWholesaleMOQ(variantId: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/moq/${variantId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) return { moq: 1 };
      return res.json();
    } catch {
      return { moq: 1 };
    }
  },

  async getWholesaleBulkDiscounts(variantId: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/store/wholesale/bulk-discounts/${variantId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) return { discounts: [] };
      return res.json();
    } catch {
      return { discounts: [] };
    }
  },

  async calculateWholesalePrice(variantId: string, quantity: number) {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wholesale/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
        credentials: 'include',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async createWholesaleOrder(data: WholesaleOrderData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/wholesale/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to create wholesale order' }));
      throw new Error(error.message || 'Failed to create wholesale order');
    }
    return res.json();
  },
};
