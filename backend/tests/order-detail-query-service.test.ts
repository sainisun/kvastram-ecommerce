import { describe, expect, it } from 'vitest';
import { buildOrderDetailResult } from '../src/services/order-detail-query-service';

describe('buildOrderDetailResult', () => {
  it('preserves the null response for an absent order', () => {
    expect(buildOrderDetailResult(undefined, [])).toBeNull();
  });

  it('preserves the legacy order and items response envelope', () => {
    const order = { id: 'order-1', email: 'buyer@example.com' };
    const items = [{ id: 'line-1', quantity: 2 }];
    expect(buildOrderDetailResult(order, items)).toEqual({ order, items });
  });
});
