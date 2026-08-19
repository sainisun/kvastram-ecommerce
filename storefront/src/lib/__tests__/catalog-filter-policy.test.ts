import { describe, expect, it } from 'vitest';

import {
  applyCatalogFilterQuery,
  clearCatalogFilterQuery,
  formatCatalogPriceFilter,
} from '@/lib/catalog-filter-policy';

describe('catalog filter policy', () => {
  it('replaces filter keys while preserving unrelated query state', () => {
    const params = new URLSearchParams('sort=price_asc&category_id=old&page=3');

    applyCatalogFilterQuery(params, {
      category_id: 'new-category',
      min_price: '200000',
      max_price: '500000',
    });

    expect(params.toString()).toBe(
      'sort=price_asc&category_id=new-category&min_price=200000&max_price=500000'
    );
  });

  it('clears all filter keys without removing sort state', () => {
    const params = new URLSearchParams(
      'sort=newest&category_id=cat&tag_id=tag&min_price=100000&page=2'
    );

    clearCatalogFilterQuery(params);

    expect(params.toString()).toBe('sort=newest');
  });

  it('formats Indian price bounds consistently for active chips', () => {
    expect(formatCatalogPriceFilter('200000', '1250000')).toBe('₹2,000+ · up to ₹12,500');
    expect(formatCatalogPriceFilter('', null)).toBeNull();
  });
});
