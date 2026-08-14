import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionCartApi } from '../api-session-cart';

describe('sessionCartApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves generic authenticated GET error metadata', async () => {
    const backendError = { message: 'Session expired', code: 'SESSION_EXPIRED' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(backendError), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(sessionCartApi.get('/store/private')).rejects.toMatchObject({
      message: 'Session expired',
      status: 401,
      data: backendError,
    });
  });

  it('preserves generic POST payload, content type, and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sessionCartApi.post<{ success: boolean }, { enabled: boolean }>('/store/example', {
        enabled: true,
      })
    ).resolves.toEqual({ success: true });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/store/example'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ enabled: true }),
      })
    );
  });

  it('preserves null for successful 204 generic DELETE responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(sessionCartApi.delete('/store/example')).resolves.toBeNull();
  });

  it('persists cart items with the legacy envelope and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const items = [
      {
        id: 'line-1',
        variantId: 'variant-1',
        quantity: 2,
        title: 'Handloom Kurta',
        price: 12000,
        currency: 'INR',
      },
    ];

    await expect(sessionCartApi.saveCart(items)).resolves.toEqual({ items: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/store/cart/save'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ items }),
      })
    );
  });

  it('returns an empty saved-cart fallback when the cart request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));

    await expect(sessionCartApi.getSavedCart()).resolves.toEqual({ items: [] });
  });

  it('preserves clear-cart failures for callers to handle', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(sessionCartApi.clearSavedCart()).rejects.toThrow('Failed to clear saved cart');
  });
});
