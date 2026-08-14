import { appendOrderCommunicationEvent } from '../../domain/orders/order-communication-event-policy';

export type OrderCompletionRequest = {
  ship_date?: string | null;
  shipping_carrier?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  tracking_link?: string | null;
  no_tracking?: boolean;
  no_tracking_reason?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
  notify_buyer?: boolean;
  send_admin_copy?: boolean;
};

export type OrderCompletionTarget = {
  id: string;
  email?: string | null;
  order_number?: string | number | null;
  metadata?: unknown;
  total?: number | null;
  currency_code?: string | null;
};

export type OrderCompletionPersistenceInput = {
  tracking_number: string | null;
  shipping_carrier: string | null;
  tracking_link: string | null;
  status: 'shipped';
  fulfillment_status: 'shipped';
  metadata: unknown;
  updated_at: Date;
};

function toMetadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * Preserves manual completion behavior, including tracking validation, default
 * package replacement, communication audit metadata, and non-blocking status
 * notification scheduling.
 */
export async function completeOrder<TPackage, TUpdated>(
  id: string,
  data: OrderCompletionRequest,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderCompletionTarget | null>;
    getWorkflowPackages: (order: OrderCompletionTarget) => TPackage[];
    upsertWorkflowPackage: (packages: TPackage[], update: Record<string, unknown>) => TPackage[];
    mergeWorkflowMetadata: (metadata: unknown, update: Record<string, unknown>) => unknown;
    deriveLegacyTrackingFields: (packages: TPackage[]) => {
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    persistOrder: (id: string, input: OrderCompletionPersistenceInput) => Promise<TUpdated>;
    notify: (notification: {
      email: string;
      order_number: string | number;
      total?: number | null;
      currency_code?: string | null;
      status: 'shipped';
      tracking_number?: string | null;
      shipping_carrier?: string | null;
      tracking_link?: string | null;
      send_admin_copy?: boolean;
    }) => void;
    now?: () => Date;
  },
): Promise<TUpdated> {
  const existingOrder = await dependencies.loadOrder(id);
  if (!existingOrder) throw new Error('Order not found');
  if (data.no_tracking !== true && !data.tracking_number?.trim()) {
    throw new Error('Tracking number is required unless no-tracking is selected');
  }

  const now = dependencies.now || (() => new Date());
  const shipDate = data.ship_date ? new Date(data.ship_date) : now();
  const shippedAt = Number.isNaN(shipDate.getTime()) ? now().toISOString() : shipDate.toISOString();
  const nextPackages = dependencies.upsertWorkflowPackage(
    dependencies.getWorkflowPackages(existingOrder),
    {
      package_id: 'pkg_1',
      ship_date: shippedAt,
      carrier: data.shipping_carrier ?? null,
      service: data.shipping_service ?? null,
      tracking_number: data.no_tracking === true ? null : data.tracking_number?.trim() || null,
      tracking_url: data.no_tracking === true ? null : data.tracking_link ?? null,
      no_tracking: data.no_tracking === true,
      no_tracking_reason: data.no_tracking === true ? data.no_tracking_reason ?? null : null,
      notify_buyer: data.notify_buyer !== false,
      notification_sent: data.notify_buyer !== false,
      notification_sent_at: data.notify_buyer !== false ? now().toISOString() : null,
    },
  );
  const notificationSubject = `Your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)} has shipped`;
  const notificationMessage = data.no_tracking === true
    ? 'Your order is on its way. This shipment does not include a tracking number.'
    : 'Tracking details have been added to your order and your shipment is on its way.';
  const communicationMetadata = data.notify_buyer !== false
    ? appendOrderCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
        template: 'shipped',
        subject: notificationSubject,
        message: notificationMessage,
        status: 'queued',
      })
    : existingOrder.metadata;
  const metadata = dependencies.mergeWorkflowMetadata(communicationMetadata, {
    workflow_status: 'shipped',
    shipped_at: shippedAt,
    customer_note: data.customer_note,
    internal_note: data.internal_note,
    packages: nextPackages,
  });
  const trackingFields = dependencies.deriveLegacyTrackingFields(nextPackages);

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
    dependencies.notify({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      total: existingOrder.total,
      currency_code: existingOrder.currency_code,
      status: 'shipped',
      tracking_number: trackingFields.tracking_number,
      shipping_carrier: trackingFields.shipping_carrier,
      tracking_link: trackingFields.tracking_link,
      send_admin_copy: data.send_admin_copy === true,
    });
  }

  return updated;
}
