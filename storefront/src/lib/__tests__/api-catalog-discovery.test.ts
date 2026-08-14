import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogApi } from '../api-catalog';

describe('catalogApi discovery methods', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves the empty regions fallback when discovery is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(catalogApi.getRegions()).resolves.toEqual({ regions: [] });
  });

  it('uses the category tree endpoint and keeps its one-hour cache contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ categories: [{ id: 'cat-1' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(catalogApi.getCategoriesTree()).resolves.toEqual({
      categories: [{ id: 'cat-1' }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/categories/tree'),
      expect.objectContaining({ next: { revalidate: 3600 } })
    );
  });

  it('encodes collection handles and preserves the no-store cache policy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ collection: { id: 'collection-1' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(catalogApi.getCollection('summer / silk')).resolves.toEqual({
      collection: { id: 'collection-1' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/collections/summer%20%2F%20silk'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('preserves null and empty fallbacks for unavailable collection and tag discovery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(catalogApi.getCollection('missing')).resolves.toEqual({ collection: null });
    await expect(catalogApi.getTags()).resolves.toEqual({ tags: [] });
  });
});
