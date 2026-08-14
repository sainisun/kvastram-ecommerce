import { describe, expect, it } from 'vitest';
import { calculateOrderStatsOverview } from '../src/domain/orders/order-reporting-policy';

describe('calculateOrderStatsOverview', () => {
  it('counts resolved workflow statuses and includes only delivered revenue', () => {
    const result = calculateOrderStatsOverview(
      [
        { status: 'pending', total: 100 },
        { status: 'delivered', total: '250' },
        { status: 'delivered', total: 150 },
        { status: 'cancelled', total: 900 },
      ],
      (row) => String(row.status)
    );

    expect(result).toEqual({
      total_orders: 4,
      total_revenue: 400,
      pending_orders: 1,
      processing_orders: 0,
      shipped_orders: 0,
      delivered_orders: 2,
      cancelled_orders: 1,
      refunded_orders: 0,
      avg_order_value: 100,
    });
  });

  it('returns zero values for an empty order set', () => {
    expect(calculateOrderStatsOverview([], () => 'delivered')).toEqual({
      total_orders: 0,
      total_revenue: 0,
      pending_orders: 0,
      processing_orders: 0,
      shipped_orders: 0,
      delivered_orders: 0,
      cancelled_orders: 0,
      refunded_orders: 0,
      avg_order_value: 0,
    });
  });
});
