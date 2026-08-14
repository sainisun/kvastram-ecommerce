import { describe, expect, it } from 'vitest';
import { assembleProductListDetails } from '../src/domain/products/product-list-assembly-policy';

describe('assembleProductListDetails', () => {
  it('combines product rows with per-product statistics, media, and variants', () => {
    const products = [{
      id: 'product-1',
      title: 'Kantha Jacket',
      handle: 'kantha-jacket',
      description: 'Handwoven jacket',
      collection_id: null,
      size_guide: null,
      care_instructions: 'Dry clean only',
      price_type: null,
      seo_title: null,
      seo_description: null,
      status: 'published',
      thumbnail: null,
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: null,
    }];

    const result = assembleProductListDetails(
      products,
      [{ product_id: 'product-1', variant_count: 2, total_inventory: 7 }],
      [
        { id: 'image-1', product_id: 'product-1' },
        { id: 'image-2', product_id: 'other-product' },
      ],
      {
        'product-1': [{
          id: 'variant-1',
          title: 'Default Variant',
          sku: 'JACKET-1',
          inventory_quantity: 7,
          prices: [{ id: 'price-1', amount: 249900, currency_code: 'inr' }],
        }],
      },
    );

    expect(result).toEqual([{
      ...products[0],
      id: 'product-1',
      price_type: 'fixed',
      variant_count: 2,
      total_inventory: 7,
      images: [{ id: 'image-1', product_id: 'product-1' }],
      variants: [{
        id: 'variant-1',
        title: 'Default Variant',
        sku: 'JACKET-1',
        inventory_quantity: 7,
        prices: [{ id: 'price-1', amount: 249900, currency_code: 'inr' }],
      }],
    }]);
  });

  it('preserves zero defaults for products without related statistics or variants', () => {
    const result = assembleProductListDetails([{
      id: 'product-2',
      title: 'Tote',
      handle: 'tote',
      description: null,
      collection_id: null,
      size_guide: null,
      care_instructions: null,
      price_type: 'on_request',
      seo_title: null,
      seo_description: null,
      status: 'draft',
      thumbnail: null,
      created_at: new Date('2026-02-01T00:00:00Z'),
      updated_at: null,
    }], [], [], {});

    expect(result[0]).toMatchObject({
      id: 'product-2',
      price_type: 'on_request',
      variant_count: 0,
      total_inventory: 0,
      images: [],
      variants: [],
    });
  });
});
