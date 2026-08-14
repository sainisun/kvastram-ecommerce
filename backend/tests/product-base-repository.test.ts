import { describe, expect, it } from 'vitest';
import { buildProductBaseUpdateInput, ProductBaseRepository } from '../src/repositories/product-base-repository';

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

  it('returns the persisted row from a base-product creation operation', async () => {
    const repository = new ProductBaseRepository();
    const tx = { insert: () => ({ values: () => ({ returning: () => [{ id: 'product-1', title: 'Tote' }] }) }) };
    await expect(repository.create(tx, { title: 'Tote' })).resolves.toEqual({ id: 'product-1', title: 'Tote' });
  });
});
