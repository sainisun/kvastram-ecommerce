import { describe, expect, it } from 'vitest';
import { buildDefaultVariantUpdateInput } from '../src/repositories/product-variant-repository';

describe('buildDefaultVariantUpdateInput', () => {
  it('preserves supplied fields, explicit nulls, and the update timestamp', () => {
    const updatedAt = new Date('2026-08-14T00:00:00.000Z');
    expect(buildDefaultVariantUpdateInput({
      material: 'Cotton',
      inventory_quantity: 12,
      origin_country: null,
    }, updatedAt)).toEqual({
      material: 'Cotton',
      inventory_quantity: 12,
      origin_country: null,
      updated_at: updatedAt,
    });
  });

  it('omits undefined fields while retaining the required timestamp', () => {
    const updatedAt = new Date('2026-08-14T00:00:00.000Z');
    expect(buildDefaultVariantUpdateInput({}, updatedAt)).toEqual({ updated_at: updatedAt });
  });
});
