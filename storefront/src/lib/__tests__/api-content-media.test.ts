import { afterEach, describe, expect, it, vi } from 'vitest';
import { contentMediaApi } from '../api-content-media';

describe('contentMediaApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves empty banner fallback behavior when media is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(contentMediaApi.getBanners()).resolves.toEqual({ banners: [] });
  });

  it('preserves a null response for failed reel-view recording', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(contentMediaApi.recordTrendingReelView('reel-1')).resolves.toBeNull();
  });

  it('preserves post not found errors for editorial pages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(contentMediaApi.getPost('missing-post')).rejects.toThrow('Post not found');
  });

  it('uses the selected merchandising slot in the request URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ slots: [{ id: 'hero' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(contentMediaApi.getHomepageMerchandising('hero banner')).resolves.toEqual({
      slots: [{ id: 'hero' }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/homepage-merchandising?slot=hero%20banner'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });
});
