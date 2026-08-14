import { describe, expect, it, vi } from 'vitest';
import { updateOrderStatus } from '../src/application/orders/order-status-update-command';

const order = {
  email: 'buyer@example.com',
  order_number: 101,
  total: 199900,
  currency_code: 'INR',
  status: 'pending',
  payment_status: 'captured',
  fulfillment_status: 'not_fulfilled',
  tracking_number: null,
  metadata: { workflow_status: 'pending' },
};

describe('updateOrderStatus', () => {
  it('throws before persistence when the order is absent', async () => {
    const persistOrder = vi.fn();

    await expect(updateOrderStatus('missing', 'processing', {
      loadOrder: async () => null,
      getCurrentStatus: () => 'pending',
      mergeWorkflowMetadata: () => ({}),
      persistOrder,
      notify: vi.fn(),
    })).rejects.toThrow('Order not found');

    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('validates transitions and persists derived workflow, fulfillment, and payment fields before notifying', async () => {
    const callOrder: string[] = [];
    const persistOrder = vi.fn(async (_id, input) => {
      callOrder.push('persist');
      return { id: 'order-1', ...input };
    });
    const notify = vi.fn(() => callOrder.push('notify'));
    const now = new Date('2026-08-14T00:00:00.000Z');

    const result = await updateOrderStatus('order-1', 'processing', {
      loadOrder: async () => order,
      getCurrentStatus: () => 'pending',
      mergeWorkflowMetadata: (metadata, update) => ({ ...metadata as object, ...update }),
      persistOrder,
      notify,
      now: () => now,
    });

    expect(persistOrder).toHaveBeenCalledWith('order-1', {
      status: 'processing',
      fulfillment_status: 'not_fulfilled',
      payment_status: 'captured',
      metadata: { workflow_status: 'processing' },
      updated_at: now,
    });
    expect(notify).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      order_number: 101,
      total: 199900,
      currency_code: 'INR',
      status: 'processing',
      tracking_number: null,
    });
    expect(callOrder).toEqual(['persist', 'notify']);
    expect(result).toMatchObject({ id: 'order-1', status: 'processing' });
  });

  it('rejects an invalid transition before persistence or notification', async () => {
    const persistOrder = vi.fn();
    const notify = vi.fn();

    await expect(updateOrderStatus('order-1', 'delivered', {
      loadOrder: async () => order,
      getCurrentStatus: () => 'pending',
      mergeWorkflowMetadata: () => ({}),
      persistOrder,
      notify,
    })).rejects.toThrow("Invalid status transition from 'pending' to 'delivered'");

    expect(persistOrder).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
