import { describe, expect, it } from 'vitest';
import { selectListedOrders } from '../src/domain/orders/order-listing-policy';

const now = new Date('2026-08-14T12:00:00.000Z');

const orders = [
  {
    id: 'pending', order_number: 3, status: 'pending', created_at: '2026-08-12T10:00:00.000Z',
    workflow: { has_tracking: false }, shipping_city: 'Delhi', shipping_country_code: 'IN', shipping_postal_code: '110001',
  },
  {
    id: 'processing-due', order_number: 2, status: 'processing', created_at: '2026-08-13T10:00:00.000Z',
    workflow: { ship_by_date: '2026-08-14T17:00:00.000Z', has_tracking: false }, shipping_city: 'Mumbai', shipping_country_code: 'IN', shipping_postal_code: '400001',
  },
  {
    id: 'delivered', order_number: 1, status: 'delivered', created_at: '2026-08-14T10:00:00.000Z',
    workflow: { has_tracking: true }, shipping_city: 'Bengaluru', shipping_country_code: 'IN', shipping_postal_code: '560001',
  },
];

describe('selectListedOrders', () => {
  it('preserves queue and workflow-filter semantics before pagination', () => {
    const result = selectListedOrders(orders, { queue: 'open', workflow_filter: 'due_today', page: 1, limit: 20 }, now);
    expect(result.orders.map((order) => order.id)).toEqual(['processing-due']);
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, total_pages: 1 });
  });

  it('sorts, filters status, and paginates the legacy in-memory result set', () => {
    const result = selectListedOrders(orders, { status: 'all', sort_by: 'order_number', sort_order: 'asc', page: 2, limit: 1 }, now);
    expect(result.orders.map((order) => order.id)).toEqual(['processing-due']);
    expect(result.pagination).toEqual({ page: 2, limit: 1, total: 3, total_pages: 3 });
  });

  it('excludes no-tracking-exempt orders from missing tracking workflow filter', () => {
    const result = selectListedOrders(
      [...orders, { id: 'exempt', order_number: 4, status: 'shipped', created_at: '2026-08-14T11:00:00.000Z', workflow: { has_tracking: false, primary_package: { no_tracking: true } } }],
      { workflow_filter: 'missing_tracking' },
      now
    );
    expect(result.orders.map((order) => order.id).sort()).toEqual(['processing-due']);
  });
});
