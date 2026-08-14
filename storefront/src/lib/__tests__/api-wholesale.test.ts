import { afterEach, describe, expect, it, vi } from 'vitest';
import { wholesaleApi } from '../api-wholesale';

describe('wholesaleApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the public wholesale tier fallback when configuration is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(wholesaleApi.getWholesaleTiers()).resolves.toEqual({ tiers: [] });
  });

  it('returns the access fallback when wholesale pricing is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(wholesaleApi.getWholesalePricing()).resolves.toEqual({
      hasWholesaleAccess: false,
      tier: null,
    });
  });

  it('posts bulk price requests with the legacy payload and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ prices: [{ variantId: 'v1', price: 100 }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(wholesaleApi.getWholesalePrices(['v1'])).resolves.toEqual({
      prices: [{ variantId: 'v1', price: 100 }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/store/wholesale/prices/bulk'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ variantIds: ['v1'] }),
      })
    );
  });

  it('preserves wholesale order errors from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Order rejected' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(
      wholesaleApi.createWholesaleOrder({
        items: [{ variant_id: 'v1', quantity: 10 }],
        shipping_address: { city: 'Jaipur' },
        email: 'buyer@example.com',
      })
    ).rejects.toThrow('Order rejected');
  });
});
