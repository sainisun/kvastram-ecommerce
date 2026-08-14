import { describe, expect, it } from 'vitest';
import {
  buildDefaultVariantInput,
  buildProductImageInputs,
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
});
