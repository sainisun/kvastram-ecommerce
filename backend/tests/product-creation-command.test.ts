import { describe, expect, it, vi } from 'vitest';
import { createProductCommand } from '../src/application/products/product-creation-command';

describe('createProductCommand', () => {
  it('short-circuits before persistence when catalog references are invalid', async () => {
    const createBase = vi.fn();

    await expect(createProductCommand(
      { title: 'Kantha Jacket', category_ids: ['missing-category'] },
      {
        validateReferences: vi.fn().mockResolvedValue([{ field: 'category_ids', message: 'Category not found' }]),
        createBase,
        createDefaultVariant: vi.fn(),
        assignPrices: vi.fn(),
        assignOptions: vi.fn(),
        assignImages: vi.fn(),
        assignReferences: vi.fn(),
        persistDiscoveryBaseline: vi.fn(),
      },
    )).resolves.toEqual({
      kind: 'invalid_catalog_references',
      errors: [{ field: 'category_ids', message: 'Category not found' }],
    });

    expect(createBase).not.toHaveBeenCalled();
  });

  it('preserves the base, variant, price, option, media, catalog, and baseline persistence order', async () => {
    const calls: string[] = [];

    await expect(createProductCommand(
      {
        title: 'Kantha Jacket',
        collection_id: 'collection-1',
        category_ids: ['category-1'],
        tag_ids: ['tag-1'],
        prices: [{ amount: 249900 }],
        options: [{ title: 'Size' }],
        images: [{ url: 'https://example.com/jacket.jpg' }],
        inventory_quantity: 4,
        sku: 'JACKET-1',
      },
      {
        validateReferences: async () => {
          calls.push('validate');
          return [];
        },
        createBase: async (productData) => {
          calls.push('base');
          expect(productData).toEqual({ title: 'Kantha Jacket', collection_id: 'collection-1' });
          return { id: 'product-1', title: 'Kantha Jacket' };
        },
        createDefaultVariant: async () => {
          calls.push('variant');
          return { id: 'variant-1' };
        },
        assignPrices: async () => { calls.push('prices'); },
        assignOptions: async () => { calls.push('options'); },
        assignImages: async () => {
          calls.push('images');
          return [{ id: 'image-1' }];
        },
        assignReferences: async () => { calls.push('references'); },
        persistDiscoveryBaseline: async () => { calls.push('baseline'); },
      },
    )).resolves.toEqual({
      kind: 'created',
      product: { id: 'product-1', title: 'Kantha Jacket', default_variant_id: 'variant-1' },
    });

    expect(calls).toEqual(['validate', 'base', 'variant', 'prices', 'options', 'images', 'references', 'baseline']);
  });
});
