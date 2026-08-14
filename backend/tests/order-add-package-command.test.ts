import { describe, expect, it, vi } from 'vitest';
import { addOrderPackage } from '../src/application/orders/order-add-package-command';

describe('addOrderPackage', () => {
  it('throws before package updates when the order is absent', async () => {
    const persistOrder = vi.fn();

    await expect(addOrderPackage('missing', {}, {
      loadOrder: async () => null,
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: () => [],
      getExistingShippedAt: () => null,
      getNotificationFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      mergeWorkflowMetadata: () => ({}),
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder,
      notify: vi.fn(),
    })).rejects.toThrow('Order not found');

    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('preserves prior shipped-at metadata and uses final-package notification fields after persistence', async () => {
    const events: string[] = [];
    const now = new Date('2026-08-14T00:00:00.000Z');
    const persistOrder = vi.fn(async (_id, input) => {
      events.push('persist');
      return { id: 'order-1', ...input };
    });
    const notify = vi.fn(() => events.push('notify'));

    const result = await addOrderPackage('order-1', {
      tracking_number: 'NEW-TRACK',
      shipping_carrier: 'Delhivery',
      shipping_service: 'surface',
      tracking_link: 'https://tracking.example.com/NEW-TRACK',
      ship_date: '2026-08-13T12:00:00.000Z',
    }, {
      loadOrder: async () => ({
        id: 'order-1',
        email: 'buyer@example.com',
        order_number: 101,
        total: 199900,
        currency_code: 'INR',
        metadata: { workflow_status: 'shipped' },
      }),
      getWorkflowPackages: () => [{ id: 'pkg_1' }],
      upsertWorkflowPackage: (packages, update) => [...packages, { id: 'pkg_2', ...update }],
      getExistingShippedAt: () => '2026-08-12T12:00:00.000Z',
      getNotificationFields: () => ({
        tracking_number: 'NEW-TRACK',
        shipping_carrier: 'Delhivery',
        tracking_link: 'https://tracking.example.com/NEW-TRACK',
      }),
      mergeWorkflowMetadata: (metadata, update) => ({ ...metadata as object, ...update }),
      deriveLegacyTrackingFields: () => ({
        tracking_number: 'PRIMARY-TRACK',
        shipping_carrier: 'BlueDart',
        tracking_link: 'https://tracking.example.com/PRIMARY-TRACK',
      }),
      persistOrder,
      notify,
      now: () => now,
    });

    expect(persistOrder).toHaveBeenCalledWith('order-1', expect.objectContaining({
      tracking_number: 'PRIMARY-TRACK',
      shipping_carrier: 'BlueDart',
      tracking_link: 'https://tracking.example.com/PRIMARY-TRACK',
      metadata: expect.objectContaining({
        workflow_status: 'shipped',
        shipped_at: '2026-08-12T12:00:00.000Z',
        communication_events: [expect.objectContaining({ template: 'shipped', status: 'queued' })],
      }),
      updated_at: now,
    }));
    expect(notify).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      order_number: 101,
      total: 199900,
      currency_code: 'INR',
      status: 'shipped',
      tracking_number: 'NEW-TRACK',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/NEW-TRACK',
    });
    expect(events).toEqual(['persist', 'notify']);
    expect(result).toMatchObject({ id: 'order-1' });
  });

  it('keeps no-tracking package updates local when buyer notification is disabled', async () => {
    const notify = vi.fn();

    await addOrderPackage('order-1', { no_tracking: true, notify_buyer: false }, {
      loadOrder: async () => ({ id: 'order-1', email: 'buyer@example.com', order_number: 101 }),
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: (_packages, update) => [{ id: 'pkg_1', ...update }],
      getExistingShippedAt: () => null,
      getNotificationFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      mergeWorkflowMetadata: (_metadata, update) => update,
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder: async (_id, input) => input,
      notify,
    });

    expect(notify).not.toHaveBeenCalled();
  });
});
