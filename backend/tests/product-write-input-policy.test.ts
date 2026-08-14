import { describe, expect, it } from 'vitest';
import {
  buildDefaultVariantInput,
  buildProductImageInputs,
  buildProductBaseUpdateInput,
  compactUndefined,
} from '../src/domain/products/product-write-input-policy';

describe('product write-input policy', () => {
  it('preserves default variant SKU and inventory fallback behavior', () => {
    expect(buildDefaultVariantInput('product-1', { handle: 'cotton-tote' })).toMatchObject({
      product_id: 'product-1',
      title: 'Default Variant',
      sku: 'cotton-tote-default',
      inventory_quantity: 0,
      manage_inventory: true,
    });
  });

  it('preserves explicit default variant values', () => {
    expect(buildDefaultVariantInput('product-1', { handle: 'tote', sku: 'SKU-001', inventory_quantity: 8, material: 'Cotton' })).toMatchObject({
      sku: 'SKU-001',
      inventory_quantity: 8,
      material: 'Cotton',
    });
  });

  it('normalizes valid image inputs and removes undefined update fields', () => {
    expect(buildProductImageInputs('product-1', [
      { url: 'https://cdn.example/image.jpg', position: 2 },
      { alt_text: 'ignored missing url' },
    ])).toEqual([{
      product_id: 'product-1',
      url: 'https://cdn.example/image.jpg',
      alt_text: undefined,
      position: 2,
      is_thumbnail: false,
      metadata: null,
    }]);
    expect(compactUndefined({ title: 'Updated', subtitle: undefined, price: null })).toEqual({ title: 'Updated', price: null });
  });

  it('excludes relationship, variant, price, and media fields from base product persistence', () => {
    expect(buildProductBaseUpdateInput({
      title: 'Updated Jacket',
      description: 'Updated description',
      status: 'published',
      category_ids: ['category-1'],
      tag_ids: ['tag-1'],
      collection_id: 'collection-1',
      options: [{ title: 'Size' }],
      prices: [{ amount: 249900 }],
      images: [{ url: 'https://example.com/jacket.jpg' }],
      inventory_quantity: 3,
      sku: 'JACKET-1',
    })).toEqual({
      title: 'Updated Jacket',
      description: 'Updated description',
      status: 'published',
    });
  });
});
