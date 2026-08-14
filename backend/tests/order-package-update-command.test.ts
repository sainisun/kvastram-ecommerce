import { describe, expect, it, vi } from 'vitest';
import { updateOrderPackage } from '../src/application/orders/order-package-update-command';

const baseOrder = {
  id: 'order-1',
  email: 'buyer@example.com',
  order_number: 101,
  metadata: { workflow_status: 'shipped' },
  status: 'shipped',
  payment_status: 'captured',
  fulfillment_status: 'shipped',
  total: 199900,
  currency_code: 'INR',
};

const primaryPackage = {
  id: 'pkg_1',
  ship_date: '2026-08-13T12:00:00.000Z',
  tracking_number: 'TRACK-1',
  carrier: 'Delhivery',
  tracking_url: 'https://tracking.example.com/TRACK-1',
};

describe('updateOrderPackage', () => {
  it('rejects missing package IDs before persistence', async () => {
    const persistOrder = vi.fn();

    await expect(updateOrderPackage('order-1', 'missing', {}, {
      loadOrder: async () => baseOrder,
      getWorkflowPackages: () => [primaryPackage],
      findPackage: (packages, id) => packages.find((pkg) => pkg.id === id) || null,
      getPrimaryPackage: (packages) => packages[0] || null,
      getPackageFields: (pkg) => ({
        ship_date: pkg?.ship_date || null,
        tracking_number: pkg?.tracking_number || null,
        shipping_carrier: pkg?.carrier || null,
        tracking_link: pkg?.tracking_url || null,
      }),
      upsertWorkflowPackage: (packages) => packages,
      getExistingShippedAt: () => null,
      mergeWorkflowMetadata: () => ({}),
      deriveLegacyTrackingFields: () => ({ tracking_number: null, shipping_carrier: null, tracking_link: null }),
      persistOrder,
      notify: vi.fn(),
    })).rejects.toThrow('Package not found');

    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('projects delivered package state, queues communication metadata, persists, then notifies', async () => {
    const events: string[] = [];
    const now = new Date('2026-08-14T00:00:00.000Z');
    const deliveredPackage = {
      ...primaryPackage,
      delivered_at: '2026-08-14T10:00:00.000Z',
    };
    const persistOrder = vi.fn(async (_id, input) => {
      events.push('persist');
      return { id: 'order-1', ...input };
    });
    const notify = vi.fn(() => events.push('notify'));

    const result = await updateOrderPackage('order-1', 'pkg_1', {
      delivered_at: '2026-08-14T10:00:00.000Z',
      notify_buyer: true,
    }, {
      loadOrder: async () => baseOrder,
      getWorkflowPackages: () => [primaryPackage],
      findPackage: (packages, id) => packages.find((pkg) => pkg.id === id) || null,
      getPrimaryPackage: (packages) => packages[0] || null,
      getPackageFields: (pkg) => ({
        ship_date: pkg?.ship_date || null,
        tracking_number: pkg?.tracking_number || null,
        shipping_carrier: pkg?.carrier || null,
        tracking_link: pkg?.tracking_url || null,
      }),
      upsertWorkflowPackage: () => [deliveredPackage],
      getExistingShippedAt: () => '2026-08-13T12:00:00.000Z',
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
      status: 'delivered',
      fulfillment_status: 'fulfilled',
      metadata: expect.objectContaining({
        workflow_status: 'delivered',
        delivered_at: '2026-08-14T10:00:00.000Z',
        communication_events: [expect.objectContaining({ template: 'order_update', status: 'queued' })],
      }),
      updated_at: now,
    }));
    expect(notify).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      order_number: 101,
      total: 199900,
      currency_code: 'INR',
      status: 'delivered',
      tracking_number: 'TRACK-1',
      shipping_carrier: 'Delhivery',
      tracking_link: 'https://tracking.example.com/TRACK-1',
    });
    expect(events).toEqual(['persist', 'notify']);
    expect(result).toMatchObject({ id: 'order-1', status: 'delivered' });
  });

  it('does not notify or append communication metadata without an explicit notify opt-in', async () => {
    const notify = vi.fn();

    const result = await updateOrderPackage('order-1', 'pkg_1', {
      tracking_number: 'TRACK-2',
    }, {
      loadOrder: async () => baseOrder,
      getWorkflowPackages: () => [primaryPackage],
      findPackage: (packages, id) => packages.find((pkg) => pkg.id === id) || null,
      getPrimaryPackage: (packages) => packages[0] || null,
      getPackageFields: (pkg) => ({
        ship_date: pkg?.ship_date || null,
        tracking_number: pkg?.tracking_number || null,
        shipping_carrier: pkg?.carrier || null,
        tracking_link: pkg?.tracking_url || null,
      }),
      upsertWorkflowPackage: () => [primaryPackage],
      getExistingShippedAt: () => null,
      mergeWorkflowMetadata: (metadata, update) => ({ source: metadata, ...update }),
      deriveLegacyTrackingFields: () => ({ tracking_number: 'TRACK-1', shipping_carrier: 'Delhivery', tracking_link: null }),
      persistOrder: async (_id, input) => input,
      notify,
    });

    expect(notify).not.toHaveBeenCalled();
    expect(result.metadata).toMatchObject({ workflow_status: undefined });
    expect((result.metadata as { source: unknown }).source).toEqual(baseOrder.metadata);
  });
});
