import { describe, expect, it } from 'vitest';
import {
  buildProductPriceRows,
  resolveProductPriceRegionId,
} from '../src/repositories/product-pricing-repository';

describe('product pricing repository helpers', () => {
  it('uses the supplied INR region when an INR price omits a region id', () => {
    expect(resolveProductPriceRegionId({ currency_code: 'inr', amount: 1299 }, 'region-inr')).toBe('region-inr');
    expect(buildProductPriceRows('variant-1', [{ currency_code: 'inr', amount: 1299 }], 'region-inr')).toEqual([{
      variant_id: 'variant-1',
      region_id: 'region-inr',
      currency_code: 'inr',
      amount: 1299,
      min_quantity: 1,
    }]);
  });

  it('preserves the explicit failure when the fallback INR region is absent', () => {
    expect(() => resolveProductPriceRegionId({ currency_code: 'inr', amount: 1299 }, null)).toThrow(
      'INR Region missing in database. Cannot assign price without region_id.'
    );
  });

  it('preserves explicit regions and nullable non-INR region values', () => {
    expect(resolveProductPriceRegionId({ currency_code: 'usd', amount: 25, region_id: 'region-us' })).toBe('region-us');
    expect(resolveProductPriceRegionId({ currency_code: 'usd', amount: 25 })).toBeNull();
  });
});
