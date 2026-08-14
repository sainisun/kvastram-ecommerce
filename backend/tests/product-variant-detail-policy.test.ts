import { describe, expect, it } from 'vitest';
import { groupProductVariantDetails } from '../src/domain/products/product-variant-detail-policy';

describe('groupProductVariantDetails', () => {
  it('groups variants by product while preserving source order and prices', () => {
    expect(groupProductVariantDetails([
      {
        id: 'variant-1',
        product_id: 'product-1',
        title: 'Small',
        sku: 'SMALL-1',
        inventory_quantity: 4,
        prices: [{ id: 'price-1', amount: 10000, currency_code: 'inr' }],
      },
      {
        id: 'variant-2',
        product_id: 'product-2',
        title: 'Default Variant',
        sku: null,
        inventory_quantity: 2,
        prices: [],
      },
      {
        id: 'variant-3',
        product_id: 'product-1',
        title: 'Large',
        sku: 'LARGE-1',
        inventory_quantity: 1,
        prices: [{ id: 'price-2', amount: 12000, currency_code: 'inr' }],
      },
    ])).toEqual({
      'product-1': [
        {
          id: 'variant-1',
          title: 'Small',
          sku: 'SMALL-1',
          inventory_quantity: 4,
          prices: [{ id: 'price-1', amount: 10000, currency_code: 'inr' }],
        },
        {
          id: 'variant-3',
          title: 'Large',
          sku: 'LARGE-1',
          inventory_quantity: 1,
          prices: [{ id: 'price-2', amount: 12000, currency_code: 'inr' }],
        },
      ],
      'product-2': [{
        id: 'variant-2',
        title: 'Default Variant',
        sku: null,
        inventory_quantity: 2,
        prices: [],
      }],
    });
  });

  it('normalizes null inventory to zero', () => {
    expect(groupProductVariantDetails([{
      id: 'variant-1',
      product_id: 'product-1',
      title: 'Default Variant',
      sku: null,
      inventory_quantity: null,
      prices: [],
    }])['product-1'][0].inventory_quantity).toBe(0);
  });
});
