import { describe, expect, it, vi } from 'vitest';
import { synchronizeProductSearch } from '../src/application/products/product-search-synchronization-command';

describe('synchronizeProductSearch', () => {
  it('indexes created and updated products through the synchronization port', async () => {
    const syncProduct = vi.fn().mockResolvedValue(undefined);
    const deleteProduct = vi.fn().mockResolvedValue(undefined);

    await expect(
      synchronizeProductSearch('product-1', 'created', { syncProduct, deleteProduct }),
    ).resolves.toEqual({ synchronized: true });
    await expect(
      synchronizeProductSearch('product-1', 'updated', { syncProduct, deleteProduct }),
    ).resolves.toEqual({ synchronized: true });

    expect(syncProduct).toHaveBeenNthCalledWith(1, 'product-1');
    expect(syncProduct).toHaveBeenNthCalledWith(2, 'product-1');
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it('removes deleted products through the deletion port', async () => {
    const syncProduct = vi.fn().mockResolvedValue(undefined);
    const deleteProduct = vi.fn().mockResolvedValue(undefined);

    await expect(
      synchronizeProductSearch('product-2', 'deleted', { syncProduct, deleteProduct }),
    ).resolves.toEqual({ synchronized: true });

    expect(deleteProduct).toHaveBeenCalledWith('product-2');
    expect(syncProduct).not.toHaveBeenCalled();
  });

  it('logs and isolates search failures so the originating mutation remains successful', async () => {
    const error = new Error('Meilisearch unavailable');
    const log = { error: vi.fn() };

    await expect(
      synchronizeProductSearch('product-3', 'updated', {
        syncProduct: vi.fn().mockRejectedValue(error),
        deleteProduct: vi.fn(),
        log,
      }),
    ).resolves.toEqual({ synchronized: false });

    expect(log.error).toHaveBeenCalledWith(
      '[SearchService] Sync after product update failed:',
      'Meilisearch unavailable',
    );
  });
});
