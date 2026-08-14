import { describe, expect, it } from 'vitest';
import { buildProductBaseUpdateInput } from '../src/repositories/product-base-repository';

describe('buildProductBaseUpdateInput', () => {
  it('preserves supplied fields and the update timestamp while omitting undefined values', () => {
    const updatedAt = new Date('2026-08-14T00:00:00.000Z');
    expect(buildProductBaseUpdateInput({
      title: 'Updated Tote',
      subtitle: undefined,
      collection_id: null,
    }, updatedAt)).toEqual({
      title: 'Updated Tote',
      collection_id: null,
      updated_at: updatedAt,
    });
  });
});
