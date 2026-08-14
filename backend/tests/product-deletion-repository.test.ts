import { describe, expect, it } from 'vitest';
import {
  money_amounts,
  product_categories,
  product_embeddings,
  product_images,
  product_option_values,
  product_options,
  product_tags,
  product_variants,
  products,
} from '../src/db/schema';
import { ProductDeletionRepository } from '../src/repositories/product-deletion-repository';

function createTransaction(variants: Array<{ id: string }>) {
  const deletedTables: unknown[] = [];

  return {
    deletedTables,
    select: () => ({
      from: () => ({
        where: async () => variants,
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        deletedTables.push(table);
      },
    }),
  };
}

describe('ProductDeletionRepository', () => {
  it('preserves the legacy complete deletion order when variants exist', async () => {
    const tx = createTransaction([{ id: 'variant-1' }]);

    await expect(new ProductDeletionRepository().delete(tx, 'product-1')).resolves.toEqual({
      id: 'product-1',
      deleted: true,
    });

    expect(tx.deletedTables).toEqual([
      product_option_values,
      product_options,
      money_amounts,
      product_variants,
      product_images,
      product_categories,
      product_tags,
      products,
      product_embeddings,
    ]);
  });

  it('preserves the legacy optional deletions when a product has no variants', async () => {
    const tx = createTransaction([]);

    await new ProductDeletionRepository().delete(tx, 'product-2');

    expect(tx.deletedTables).toEqual([
      product_variants,
      product_images,
      product_categories,
      product_tags,
      products,
      product_embeddings,
    ]);
  });
});
