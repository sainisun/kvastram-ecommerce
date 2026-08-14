import { afterEach, describe, expect, it, vi } from 'vitest';
import { engagementApi } from '../api-engagement';

describe('engagementApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the product id to review requests and preserves session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ review: { id: 'review-1' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      engagementApi.createReview('product-1', { rating: 5, content: 'Beautiful work' })
    ).resolves.toEqual({ review: { id: 'review-1' } });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/reviews/store'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ rating: 5, content: 'Beautiful work', product_id: 'product-1' }),
      })
    );
  });

  it('preserves generic account inquiry errors with status and backend data', async () => {
    const backendError = { error: 'Inquiry not found', request_id: 'request-1' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(backendError), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(engagementApi.getCustomerStudioInquiry('missing')).rejects.toMatchObject({
      message: 'Inquiry not found',
      status: 404,
      data: backendError,
    });
  });

  it('preserves return submission errors from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Return window has expired' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(
      engagementApi.requestReturn({
        order_id: 'order-1',
        reason: 'Damaged',
        items: [{ line_item_id: 'line-1', quantity: 1 }],
      })
    ).rejects.toThrow('Return window has expired');
  });

  it('returns the empty wishlist fallback when the session request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));

    await expect(engagementApi.getWishlist()).resolves.toEqual({ wishlist: [] });
  });

  it('returns empty active campaigns when the endpoint is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(engagementApi.getActiveCampaigns()).resolves.toEqual({ campaigns: [] });
  });
});
