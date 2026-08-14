import { appendOrderCommunicationEvent } from '../../domain/orders/order-communication-event-policy';

export type OrderPackageUpdateRequest = {
  ship_date?: string | null;
  shipping_carrier?: string | null;
  shipping_service?: string | null;
  tracking_number?: string | null;
  tracking_link?: string | null;
  no_tracking?: boolean;
  no_tracking_reason?: string | null;
  notify_buyer?: boolean;
  label_url?: string | null;
  label_file_name?: string | null;
  label_state?: string;
  label_cost?: number | null;
  label_currency?: string | null;
  package_weight_grams?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  carrier_service?: string | null;
  label_provider?: string | null;
  provider_order_id?: string | null;
  provider_shipment_id?: string | null;
  provider_courier_id?: string | null;
  pickup_reference?: string | null;
  delivered_at?: string | null;
};

export type OrderPackageUpdateTarget = {
  id: string;
  email?: string | null;
  order_number?: string | number | null;
  metadata?: unknown;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  total?: number | null;
  currency_code?: string | null;
};

export type OrderPackageUpdatePersistenceInput = {
  tracking_number: string | null;
  shipping_carrier: string | null;
  tracking_link: string | null;
  status: string | null;
  fulfillment_status: string | null;
  metadata: unknown;
  updated_at: Date;
};

function toMetadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * Updates one normalized workflow package and projects the result back to the
 * legacy order shipment fields without changing notification opt-in behavior.
 */
export async function updateOrderPackage<TPackage, TUpdated>(
  id: string,
  packageId: string,
  data: OrderPackageUpdateRequest,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderPackageUpdateTarget | null>;
    getWorkflowPackages: (order: OrderPackageUpdateTarget) => TPackage[];
    findPackage: (packages: TPackage[], id: string) => TPackage | null;
    getPrimaryPackage: (packages: TPackage[]) => TPackage | null;
    getPackageFields: (pkg: TPackage | null) => {
      ship_date: string | null;
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    upsertWorkflowPackage: (packages: TPackage[], update: Record<string, unknown>) => TPackage[];
    getExistingShippedAt: (metadata: unknown) => string | null | undefined;
    mergeWorkflowMetadata: (metadata: unknown, update: Record<string, unknown>) => unknown;
    deriveLegacyTrackingFields: (packages: TPackage[]) => {
      tracking_number: string | null;
      shipping_carrier: string | null;
      tracking_link: string | null;
    };
    persistOrder: (id: string, input: OrderPackageUpdatePersistenceInput) => Promise<TUpdated>;
    notify: (notification: {
      email: string;
      order_number: string | number;
      total?: number | null;
      currency_code?: string | null;
      status: 'shipped' | 'delivered';
      tracking_number?: string | null;
      shipping_carrier?: string | null;
      tracking_link?: string | null;
    }) => void;
    now?: () => Date;
  },
): Promise<TUpdated> {
  const existingOrder = await dependencies.loadOrder(id);
  if (!existingOrder) throw new Error('Order not found');

  const existingPackages = dependencies.getWorkflowPackages(existingOrder);
  if (!dependencies.findPackage(existingPackages, packageId)) {
    throw new Error('Package not found');
  }

  const hasNotifyBuyer = Object.prototype.hasOwnProperty.call(data, 'notify_buyer');
  const now = dependencies.now || (() => new Date());
  const nextPackages = dependencies.upsertWorkflowPackage(existingPackages, {
    package_id: packageId,
    ship_date: data.ship_date,
    carrier: data.shipping_carrier,
    service: data.shipping_service,
    tracking_number: data.tracking_number,
    tracking_url: data.tracking_link,
    no_tracking: data.no_tracking,
    no_tracking_reason: data.no_tracking_reason,
    notify_buyer: data.notify_buyer,
    notification_sent: hasNotifyBuyer ? data.notify_buyer === true : undefined,
    notification_sent_at: hasNotifyBuyer ? data.notify_buyer === true ? now().toISOString() : null : undefined,
    label_url: data.label_url,
    label_file_name: data.label_file_name,
    label_state: data.label_state,
    label_cost: data.label_cost,
    label_currency: data.label_currency,
    package_weight_grams: data.package_weight_grams,
    package_length_cm: data.package_length_cm,
    package_width_cm: data.package_width_cm,
    package_height_cm: data.package_height_cm,
    carrier_service: data.carrier_service,
    label_provider: data.label_provider,
    provider_order_id: data.provider_order_id,
    provider_shipment_id: data.provider_shipment_id,
    provider_courier_id: data.provider_courier_id,
    pickup_reference: data.pickup_reference,
    delivered_at: data.delivered_at,
  });
  const primaryPackage = dependencies.getPrimaryPackage(nextPackages);
  const updatedPackage = dependencies.findPackage(nextPackages, packageId) || primaryPackage;
  const primaryFields = dependencies.getPackageFields(primaryPackage);
  const updatedFields = dependencies.getPackageFields(updatedPackage);
  const updateStatus = data.delivered_at
    ? 'delivered'
    : updatedFields.ship_date
      ? 'shipped'
      : existingOrder.status ?? '';
  const notificationSubject = updateStatus === 'delivered'
    ? `Your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)} was marked delivered`
    : `Shipping details updated for your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)}`;
  const notificationMessage = updateStatus === 'delivered'
    ? 'Your order has been marked as delivered.'
    : data.no_tracking === true
      ? 'Shipping details were updated for your order. This package does not include tracking.'
      : 'Shipping details were updated for your order, including the latest tracking information.';
  const communicationMetadata = hasNotifyBuyer && data.notify_buyer !== false
    ? appendOrderCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
        template: updateStatus === 'delivered' ? 'order_update' : 'shipped',
        subject: notificationSubject,
        message: notificationMessage,
        status: 'queued',
      })
    : existingOrder.metadata;
  const metadata = dependencies.mergeWorkflowMetadata(communicationMetadata, {
    workflow_status: data.delivered_at ? 'delivered' : undefined,
    shipped_at: dependencies.getExistingShippedAt(existingOrder.metadata) || primaryFields.ship_date || null,
    delivered_at: data.delivered_at,
    packages: nextPackages,
  });
  const trackingFields = dependencies.deriveLegacyTrackingFields(nextPackages);

  const updated = await dependencies.persistOrder(id, {
    tracking_number: trackingFields.tracking_number,
    shipping_carrier: trackingFields.shipping_carrier,
    tracking_link: trackingFields.tracking_link,
    status: data.delivered_at ? 'delivered' : primaryFields.ship_date ? 'shipped' : existingOrder.status ?? null,
    fulfillment_status: data.delivered_at ? 'fulfilled' : primaryFields.ship_date ? 'shipped' : existingOrder.fulfillment_status ?? null,
    metadata,
    updated_at: now(),
  });

  if (existingOrder.email && hasNotifyBuyer && data.notify_buyer !== false) {
    dependencies.notify({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      total: existingOrder.total,
      currency_code: existingOrder.currency_code,
      status: data.delivered_at ? 'delivered' : 'shipped',
      tracking_number: updatedFields.tracking_number || trackingFields.tracking_number,
      shipping_carrier: updatedFields.shipping_carrier || trackingFields.shipping_carrier,
      tracking_link: updatedFields.tracking_link || trackingFields.tracking_link,
    });
  }

  return updated;
}
