import { describe, expect, it, vi } from 'vitest';
import { updateProductCommand } from '../src/application/products/product-update-command';

describe('updateProductCommand', () => {
  it('short-circuits before update persistence when catalog references are invalid', async () => {
    const updateBase = vi.fn();

    await expect(updateProductCommand(
      { category_ids: ['missing-category'] },
      {
        validateReferences: vi.fn().mockResolvedValue([{ field: 'category_ids', message: 'Category not found' }]),
        updateBase,
        updateDefaultVariant: vi.fn(),
        replacePrices: vi.fn(),
        replaceImages: vi.fn(),
        replaceCategories: vi.fn(),
        replaceTags: vi.fn(),
        replaceCollection: vi.fn(),
      },
    )).resolves.toEqual({
      kind: 'invalid_catalog_references',
      errors: [{ field: 'category_ids', message: 'Category not found' }],
    });

    expect(updateBase).not.toHaveBeenCalled();
  });

  it('preserves conditional update persistence order', async () => {
    const calls: string[] = [];

    await expect(updateProductCommand(
      {
        prices: [{ amount: 249900 }],
        images: [{ url: 'https://example.com/jacket.jpg' }],
        category_ids: ['category-1'],
        tag_ids: ['tag-1'],
        collection_id: 'collection-1',
      },
      {
        validateReferences: async () => { calls.push('validate'); return []; },
        updateBase: async () => { calls.push('base'); return { id: 'product-1' }; },
        updateDefaultVariant: async () => { calls.push('variant'); return 'variant-1'; },
        replacePrices: async () => { calls.push('prices'); },
        replaceImages: async () => { calls.push('images'); },
        replaceCategories: async () => { calls.push('categories'); },
        replaceTags: async () => { calls.push('tags'); },
        replaceCollection: async () => { calls.push('collection'); },
      },
    )).resolves.toEqual({ kind: 'updated', product: { id: 'product-1' } });

    expect(calls).toEqual(['validate', 'base', 'variant', 'prices', 'images', 'categories', 'tags', 'collection']);
  });

  it('preserves optional updates and the product-not-found outcome', async () => {
    const replacePrices = vi.fn();
    const replaceImages = vi.fn();
    const replaceCategories = vi.fn();
    const replaceTags = vi.fn();
    const replaceCollection = vi.fn();

    await expect(updateProductCommand(
      {},
      {
        validateReferences: async () => [],
        updateBase: async () => null,
        updateDefaultVariant: vi.fn(),
        replacePrices,
        replaceImages,
        replaceCategories,
        replaceTags,
        replaceCollection,
      },
    )).resolves.toEqual({ kind: 'product_not_found' });

    expect(replacePrices).not.toHaveBeenCalled();
    expect(replaceImages).not.toHaveBeenCalled();
    expect(replaceCategories).not.toHaveBeenCalled();
    expect(replaceTags).not.toHaveBeenCalled();
    expect(replaceCollection).not.toHaveBeenCalled();
  });
});
