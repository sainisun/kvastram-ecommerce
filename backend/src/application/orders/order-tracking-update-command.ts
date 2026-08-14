export type OrderTrackingUpdateRequest = {
  tracking_number: string;
  shipping_carrier?: string;
  tracking_link?: string;
  ship_date?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
  notify_buyer?: boolean;
};

export type OrderTrackingUpdateTarget = {
  id: string;
  email?: string | null;
  order_number?: string | number | null;
  metadata?: unknown;
};

export type OrderTrackingPersistenceInput = {
  tracking_number: string | null;
  shipping_carrier: string | null;
  tracking_link: string | null;
  status: 'shipped';
  fulfillment_status: 'shipped';
  metadata: unknown;
  updated_at: Date;
};

/**
 * Preserves legacy manual tracking behavior: update the default workflow
 * package, project legacy tracking fields, persist shipment state, then queue
 * an optional buyer notification without waiting for delivery.
 */
export async function updateOrderTracking<TPackage, TUpdated>(
  id: string,
  data: OrderTrackingUpdateRequest,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderTrackingUpdateTarget | null>;
    getWorkflowPackages: (order: OrderTrackingUpdateTarget) => TPackage[];
    upsertWorkflowPackage: (packages: TPackage[], update: Record<string, unknown>) => TPackage[];
    mergeWorkflowMetadata: (metadata: unknown, update: Record<string, unknown>) => unknown;
    deriveLegacyTrackingFields: (packages: TPackage[]) => {
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    persistOrder: (id: string, input: OrderTrackingPersistenceInput) => Promise<TUpdated>;
    scheduleBuyerNotification: (notification: {
      email: string;
      order_number: string | number;
      tracking_number: string;
      shipping_carrier?: string;
      tracking_link?: string;
    }) => void;
    now?: () => Date;
  },
): Promise<TUpdated> {
  const existingOrder = await dependencies.loadOrder(id);
  if (!existingOrder) throw new Error('Order not found');

  const now = dependencies.now || (() => new Date());
  const shipDate = data.ship_date ? new Date(data.ship_date) : now();
  const shippedAt = Number.isNaN(shipDate.getTime()) ? now().toISOString() : shipDate.toISOString();
  const nextPackages = dependencies.upsertWorkflowPackage(
    dependencies.getWorkflowPackages(existingOrder),
    {
      package_id: 'pkg_1',
      ship_date: shippedAt,
      carrier: data.shipping_carrier ?? null,
      tracking_number: data.tracking_number,
      tracking_url: data.tracking_link ?? null,
      no_tracking: false,
      no_tracking_reason: null,
      notify_buyer: data.notify_buyer !== false,
      notification_sent: data.notify_buyer !== false,
      notification_sent_at: data.notify_buyer !== false ? now().toISOString() : null,
    },
  );
  const trackingFields = dependencies.deriveLegacyTrackingFields(nextPackages);
  const metadata = dependencies.mergeWorkflowMetadata(existingOrder.metadata, {
    workflow_status: 'shipped',
    shipped_at: shippedAt,
    customer_note: data.customer_note,
    internal_note: data.internal_note,
    packages: nextPackages,
  });

  const updated = await dependencies.persistOrder(id, {
    tracking_number: trackingFields.tracking_number,
    shipping_carrier: trackingFields.shipping_carrier,
    tracking_link: trackingFields.tracking_link,
    status: 'shipped',
    fulfillment_status: 'shipped',
    metadata,
    updated_at: now(),
  });

  if (existingOrder.email && data.notify_buyer !== false) {
    dependencies.scheduleBuyerNotification({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      tracking_number: data.tracking_number,
      shipping_carrier: data.shipping_carrier,
      tracking_link: data.tracking_link,
    });
  }

  return updated;
}
