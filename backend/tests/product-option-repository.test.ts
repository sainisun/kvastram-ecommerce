import { describe, expect, it } from 'vitest';
import { buildProductOptionRows } from '../src/repositories/product-option-repository';

describe('buildProductOptionRows', () => {
  it('builds the legacy option persistence shape', () => {
    expect(buildProductOptionRows('product-1', [{ title: 'Size' }, { title: 'Color' }])).toEqual([
      { product_id: 'product-1', title: 'Size', metadata: null },
      { product_id: 'product-1', title: 'Color', metadata: null },
    ]);
  });

  it('returns no rows when no options were supplied', () => {
    expect(buildProductOptionRows('product-1', undefined)).toEqual([]);
    expect(buildProductOptionRows('product-1', [])).toEqual([]);
  });
});
