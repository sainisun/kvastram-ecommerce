export type ProductSearchSynchronizationEvent = 'created' | 'updated' | 'deleted';

export type ProductSearchSynchronizationDependencies = {
  syncProduct(productId: string): Promise<void>;
  deleteProduct(productId: string): Promise<void>;
  log?: Pick<Console, 'error'>;
};

const failureMessageByEvent: Record<ProductSearchSynchronizationEvent, string> = {
  created: 'Sync after product create failed:',
  updated: 'Sync after product update failed:',
  deleted: 'Deletion from Meilisearch failed:',
};

/**
 * Applies a best-effort Meilisearch update after a committed product mutation.
 * Search failures are logged but never allowed to fail the originating mutation.
 */
export async function synchronizeProductSearch(
  productId: string,
  event: ProductSearchSynchronizationEvent,
  dependencies: ProductSearchSynchronizationDependencies,
): Promise<{ synchronized: boolean }> {
  try {
    if (event === 'deleted') {
      await dependencies.deleteProduct(productId);
    } else {
      await dependencies.syncProduct(productId);
    }

    return { synchronized: true };
  } catch (error: any) {
    (dependencies.log ?? console).error(`[SearchService] ${failureMessageByEvent[event]}`, error.message);
    return { synchronized: false };
  }
}
