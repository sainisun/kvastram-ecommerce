import { describe, expect, it, vi } from 'vitest';
import { bulkUpdateOrderStatus } from '../src/application/orders/bulk-order-status-update-command';

const targets = [
  {
    id: 'order-1',
    email: 'one@example.com',
    order_number: 101,
    total: 10000,
    currency_code: 'INR',
    status: 'pending',
    payment_status: 'captured',
    fulfillment_status: 'not_fulfilled',
    tracking_number: null,
    metadata: { workflow_status: 'pending' },
  },
  {
    id: 'order-2',
    email: 'two@example.com',
    order_number: 102,
    total: 20000,
    currency_code: 'INR',
    status: 'pending',
    payment_status: 'captured',
    fulfillment_status: 'not_fulfilled',
    tracking_number: null,
    metadata: { workflow_status: 'pending' },
  },
];

describe('bulkUpdateOrderStatus', () => {
  it('rejects when no requested orders are found', async () => {
    await expect(bulkUpdateOrderStatus(['missing'], 'processing', {
      loadOrders: async () => [],
      getCurrentStatus: () => 'pending',
      mergeWorkflowMetadata: () => ({}),
      persistOrder: vi.fn(),
      notify: vi.fn(),
    })).rejects.toThrow('No valid orders found');
  });

  it('validates every target before any persistence occurs', async () => {
    const persistOrder = vi.fn();
    const notify = vi.fn();

    await expect(bulkUpdateOrderStatus(['order-1', 'order-2'], 'delivered', {
      loadOrders: async () => targets,
      getCurrentStatus: (order) => order.id === 'order-1' ? 'pending' : 'shipped',
      mergeWorkflowMetadata: () => ({}),
      persistOrder,
      notify,
    })).rejects.toThrow('Cannot update 1 orders. Invalid status transition.');

    expect(persistOrder).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('updates and notifies each target in source order after validation succeeds', async () => {
    const events: string[] = [];
    const persistOrder = vi.fn(async (id) => events.push(`persist:${id}`));
    const notify = vi.fn((notification) => events.push(`notify:${notification.order_number}`));
    const now = new Date('2026-08-14T00:00:00.000Z');

    await expect(bulkUpdateOrderStatus(['order-1', 'order-2'], 'processing', {
      loadOrders: async () => targets,
      getCurrentStatus: () => 'pending',
      mergeWorkflowMetadata: (metadata, update) => ({ ...metadata as object, ...update }),
      persistOrder,
      notify,
      now: () => now,
    })).resolves.toBe(2);

    expect(persistOrder).toHaveBeenNthCalledWith(1, 'order-1', expect.objectContaining({
      status: 'processing',
      fulfillment_status: 'not_fulfilled',
      payment_status: 'captured',
      metadata: { workflow_status: 'processing' },
      updated_at: now,
    }));
    expect(persistOrder).toHaveBeenNthCalledWith(2, 'order-2', expect.objectContaining({
      status: 'processing',
      updated_at: now,
    }));
    expect(events).toEqual([
      'persist:order-1', 'notify:101', 'persist:order-2', 'notify:102',
    ]);
  });
});
