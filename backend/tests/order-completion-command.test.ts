import { describe, expect, it, vi } from 'vitest';
import { completeOrder } from '../src/application/orders/order-completion-command';

describe('completeOrder', () => {
  it('rejects missing tracking before package or persistence work unless no-tracking is selected', async () => {
    const upsertWorkflowPackage = vi.fn();
    const persistOrder = vi.fn();

    await expect(completeOrder('order-1', {}, {
      loadOrder: async () => ({ id: 'order-1' }),
      getWorkflowPackages: () => [],
      upsertWorkflowPackage,
      mergeWorkflowMetadata: () => ({}),
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder,
      notify: vi.fn(),
    })).rejects.toThrow('Tracking number is required unless no-tracking is selected');

    expect(upsertWorkflowPackage).not.toHaveBeenCalled();
    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('persists completion package state and queues audited shipment notification after persistence', async () => {
    const events: string[] = [];
    const now = new Date('2026-08-14T00:00:00.000Z');
    const persistOrder = vi.fn(async (_id, input) => {
      events.push('persist');
      return { id: 'order-1', ...input };
    });
    const notify = vi.fn(() => events.push('notify'));

    const result = await completeOrder('order-1', {
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      shipping_service: 'surface',
      tracking_link: 'https://tracking.example.com/TRACK-1',
      ship_date: '2026-08-13T12:00:00.000Z',
      send_admin_copy: true,
    }, {
      loadOrder: async () => ({
        id: 'order-1',
        email: 'buyer@example.com',
        order_number: 101,
        total: 199900,
        currency_code: 'INR',
        metadata: { workflow_status: 'processing' },
      }),
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: (_packages, update) => [{ id: 'pkg_1', ...update }],
      mergeWorkflowMetadata: (metadata, update) => ({ ...metadata as object, ...update }),
      deriveLegacyTrackingFields: () => ({
        tracking_number: 'TRACK-1',
        shipping_carrier: 'Delhivery',
        tracking_link: 'https://tracking.example.com/TRACK-1',
      }),
      persistOrder,
      notify,
      now: () => now,
    });

    expect(persistOrder).toHaveBeenCalledWith('order-1', expect.objectContaining({
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
      status: 'shipped',
      fulfillment_status: 'shipped',
      metadata: expect.objectContaining({
        workflow_status: 'shipped',
        shipped_at: '2026-08-13T12:00:00.000Z',
        communication_events: [expect.objectContaining({
          template: 'shipped',
          subject: 'Your Odhvica order #101 has shipped',
          status: 'queued',
        })],
      }),
      updated_at: now,
    }));
    expect(notify).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      order_number: 101,
      total: 199900,
      currency_code: 'INR',
      status: 'shipped',
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
      send_admin_copy: true,
    });
    expect(events).toEqual(['persist', 'notify']);
    expect(result).toMatchObject({ id: 'order-1', status: 'shipped' });
  });

  it('allows no-tracking completion without notification when the buyer is opted out', async () => {
    const notify = vi.fn();

    await completeOrder('order-1', {
      no_tracking: true,
      no_tracking_reason: 'local pickup',
      notify_buyer: false,
    }, {
      loadOrder: async () => ({ id: 'order-1', email: 'buyer@example.com', order_number: 101 }),
      getWorkflowPackages: () => [],
      upsertWorkflowPackage: (_packages, update) => [{ id: 'pkg_1', ...update }],
      mergeWorkflowMetadata: (_metadata, update) => update,
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder: async (_id, input) => input,
      notify,
    });

    expect(notify).not.toHaveBeenCalled();
  });
});
