import { describe, expect, it } from 'vitest';
import {
  getProductMinimumSearchPrice,
  selectProductSearchResults,
} from '../src/domain/products/product-search-result-policy';

const products = [
  {
    id: 'product-1',
    created_at: new Date('2026-01-01T00:00:00Z'),
    variants: [{ prices: [{ amount: 30000 }, { amount: 42000 }] }],
  },
  {
    id: 'product-2',
    created_at: new Date('2026-03-01T00:00:00Z'),
    variants: [{ prices: [{ amount: 18000 }] }, { prices: [{ amount: 25000 }] }],
  },
  {
    id: 'product-3',
    created_at: new Date('2026-02-01T00:00:00Z'),
    variants: [],
  },
];

describe('product search result policy', () => {
  it('uses the minimum variant price and preserves zero-price fallback', () => {
    expect(getProductMinimumSearchPrice(products[0])).toBe(30000);
    expect(getProductMinimumSearchPrice(products[2])).toBe(0);
  });

  it('applies inclusive price ranges after calculating minimum variant prices', () => {
    expect(selectProductSearchResults(products, {
      minPrice: 18000,
      maxPrice: 30000,
      sortBy: 'relevance',
    }).map((product) => [product.id, product.price])).toEqual([
      ['product-1', 30000],
      ['product-2', 18000],
    ]);
  });

  it('preserves requested price and newest sort behavior without changing relevance order', () => {
    expect(selectProductSearchResults(products, { sortBy: 'price_asc' }).map((product) => product.id)).toEqual([
      'product-3', 'product-2', 'product-1',
    ]);
    expect(selectProductSearchResults(products, { sortBy: 'price_desc' }).map((product) => product.id)).toEqual([
      'product-1', 'product-2', 'product-3',
    ]);
    expect(selectProductSearchResults(products, { sortBy: 'newest' }).map((product) => product.id)).toEqual([
      'product-2', 'product-3', 'product-1',
    ]);
    expect(selectProductSearchResults(products, { sortBy: 'relevance' }).map((product) => product.id)).toEqual([
      'product-1', 'product-2', 'product-3',
    ]);
  });
});
