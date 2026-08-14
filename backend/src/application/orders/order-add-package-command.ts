import { appendOrderCommunicationEvent } from '../../domain/orders/order-communication-event-policy';

export type OrderAddPackageRequest = {
  ship_date?: string | null;
  shipping_carrier?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  tracking_link?: string | null;
  no_tracking?: boolean;
  no_tracking_reason?: string | null;
  notify_buyer?: boolean;
};

export type OrderAddPackageTarget = {
  id: string;
  email?: string | null;
  order_number?: string | number | null;
  metadata?: unknown;
  total?: number | null;
  currency_code?: string | null;
};

export type OrderAddPackagePersistenceInput = {
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
 * Preserves the existing add-package workflow, including its package helper
 * delegation and notification fallback to the final normalized package.
 */
export async function addOrderPackage<TPackage, TUpdated>(
  id: string,
  data: OrderAddPackageRequest,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderAddPackageTarget | null>;
    getWorkflowPackages: (order: OrderAddPackageTarget) => TPackage[];
    upsertWorkflowPackage: (packages: TPackage[], update: Record<string, unknown>) => TPackage[];
    getExistingShippedAt: (metadata: unknown) => string | null | undefined;
    getNotificationFields: (pkg: TPackage | null) => {
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    mergeWorkflowMetadata: (metadata: unknown, update: Record<string, unknown>) => unknown;
    deriveLegacyTrackingFields: (packages: TPackage[]) => {
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    persistOrder: (id: string, input: OrderAddPackagePersistenceInput) => Promise<TUpdated>;
    notify: (notification: {
      email: string;
      order_number: string | number;
      total?: number | null;
      currency_code?: string | null;
      status: 'shipped';
      tracking_number?: string | null;
      shipping_carrier?: string | null;
      tracking_link?: string | null;
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
  const notificationSubject = `Package update for your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)}`;
  const notificationMessage = data.no_tracking === true
    ? 'A new package has been added to your shipment without a tracking number.'
    : 'A new package has been added to your order with updated shipping details.';
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
    shipped_at: dependencies.getExistingShippedAt(existingOrder.metadata) || shippedAt,
    packages: nextPackages,
  });
  const trackingFields = dependencies.deriveLegacyTrackingFields(nextPackages);
  const notificationFields = dependencies.getNotificationFields(nextPackages[nextPackages.length - 1] || null);

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
      tracking_number: notificationFields.tracking_number || trackingFields.tracking_number,
      shipping_carrier: notificationFields.shipping_carrier || trackingFields.shipping_carrier,
      tracking_link: notificationFields.tracking_link || trackingFields.tracking_link,
    });
  }

  return updated;
}
