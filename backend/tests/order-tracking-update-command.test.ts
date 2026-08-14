import { describe, expect, it, vi } from 'vitest';
import { updateOrderTracking } from '../src/application/orders/order-tracking-update-command';

describe('updateOrderTracking', () => {
  it('throws before persistence when the order is absent', async () => {
    const persistOrder = vi.fn();

    await expect(updateOrderTracking('missing', { tracking_number: 'TRACK-1' }, {
      loadOrder: async () => null,
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: () => [],
      mergeWorkflowMetadata: () => ({}),
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder,
      scheduleBuyerNotification: vi.fn(),
    })).rejects.toThrow('Order not found');

    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('persists workflow shipment state and schedules a buyer notification after persistence', async () => {
    const events: string[] = [];
    const now = new Date('2026-08-14T00:00:00.000Z');
    const persistOrder = vi.fn(async (_id, input) => {
      events.push('persist');
      return { id: 'order-1', ...input };
    });
    const scheduleBuyerNotification = vi.fn(() => events.push('notify'));

    const result = await updateOrderTracking('order-1', {
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
      ship_date: '2026-08-13T12:00:00.000Z',
    }, {
      loadOrder: async () => ({
        id: 'order-1',
        email: 'buyer@example.com',
        order_number: 101,
        metadata: { workflow_status: 'processing' },
      }),
      getWorkflowPackages: () => [{ id: 'pkg-existing' }],
      upsertWorkflowPackage: (packages, update) => [...packages, { id: 'pkg_1', ...update }],
      mergeWorkflowMetadata: (metadata, update) => ({ ...metadata as object, ...update }),
      deriveLegacyTrackingFields: () => ({
        tracking_number: 'TRACK-1',
        shipping_carrier: 'Delhivery',
        tracking_link: 'https://tracking.example.com/TRACK-1',
      }),
      persistOrder,
      scheduleBuyerNotification,
      now: () => now,
    });

    expect(persistOrder).toHaveBeenCalledWith('order-1', {
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
      status: 'shipped',
      fulfillment_status: 'shipped',
      metadata: expect.objectContaining({
        workflow_status: 'shipped',
        shipped_at: '2026-08-13T12:00:00.000Z',
      }),
      updated_at: now,
    });
    expect(scheduleBuyerNotification).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      order_number: 101,
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
    });
    expect(events).toEqual(['persist', 'notify']);
    expect(result).toMatchObject({ id: 'order-1', status: 'shipped' });
  });

  it('does not schedule a buyer notification when explicitly opted out', async () => {
    const scheduleBuyerNotification = vi.fn();

    await updateOrderTracking('order-1', {
      tracking_number: 'TRACK-1',
      notify_buyer: false,
    }, {
      loadOrder: async () => ({ id: 'order-1', email: 'buyer@example.com', order_number: 101 }),
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: () => [],
      mergeWorkflowMetadata: (_metadata, update) => update,
      deriveLegacyTrackingFields: () => ({ tracking_number: 'TRACK-1', shipping_carrier: null, tracking_link: null }),
      persistOrder: async (_id, input) => input,
      scheduleBuyerNotification,
    });

    expect(scheduleBuyerNotification).not.toHaveBeenCalled();
  });
});
