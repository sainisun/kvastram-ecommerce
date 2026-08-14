import { db } from '../db/client';
import {
  orders,
  line_items,
  customers,
  products,
  product_variants,
  addresses,
} from '../db/schema';
import {
  eq,
  desc,
  like,
  ilike,
  or,
  sql,
  and,
  gte,
  lte,
  inArray,
  asc,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { generateInvoice } from '../services/pdf-service';
import { carrierService } from '../services/carrier-service';
import { settingService } from '../services/setting-service';
import {
  buildWorkflowSummary,
  deriveWorkflowStatus,
  getWorkflowMetadata,
  getWorkflowPackages,
  mergeWorkflowMetadata,
  deriveLegacyTrackingFields,
  selectPrimaryWorkflowPackage as getPrimaryPackage,
  upsertWorkflowPackage,
} from '../utils/order-workflow';
import type {
  LabelStatus,
  WorkflowMetadata,
  WorkflowPackage,
} from '../utils/order-workflow';
import type { CarrierProvider } from '../services/carrier-service';
import { purchaseCarrierLabelCommand } from '../application/orders/fulfillment-commands';
import { calculateOrderStatsOverview } from '../domain/orders/order-reporting-policy';
import { calculateFulfillmentMetrics } from '../domain/orders/fulfillment-metrics-policy';
import { orderReportingService } from './order-reporting-service';
import { selectListedOrders } from '../domain/orders/order-listing-policy';
import { orderDetailQueryService } from './order-detail-query-service';
import {
  assertOrderStatusTransition,
  canTransitionOrderStatus,
  deriveOrderStatusMutation,
  type OrderStatus,
} from '../domain/orders/order-transition-policy';

export type { OrderStatus } from '../domain/orders/order-transition-policy';

// --- TYPES ---

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  queue?: 'open' | 'completed' | 'issues' | 'all';
  workflow_filter?:
    | 'new'
    | 'processing'
    | 'due_today'
    | 'ready_to_ship'
    | 'missing_tracking'
    | 'all';
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Aliases
const shippingAddr = alias(addresses, 'shipping_address');
const billingAddr = alias(addresses, 'billing_address');

function sanitizeOrderSearchInput(input: string, maxLen = 100): string {
  return String(input)
    .replace(/[%_\\]/g, '')
    .replace(/[;]/g, '')
    .trim()
    .substring(0, maxLen);
}

function toTimestamp(value: string | number | Date | null | undefined) {
  if (!value) return 0;
  return new Date(value).getTime();
}

function toMetadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function applyWorkflowSummary<T extends Record<string, any>>(order: T) {
  const workflow = buildWorkflowSummary(order);

  return {
    ...order,
    raw_status: order.status,
    status: workflow.status,
    workflow,
  };
}

function buildCarrierContext(
  order: Record<string, any>,
  items: Record<string, any>[],
  packageId?: string | null
) {
  const packages = order.workflow?.packages || [];
  const explicitlySelectedPackage = packageId
    ? packages.find((pkg: WorkflowPackage) => pkg.id === packageId) || null
    : null;
  const primaryPackage = order.workflow?.primary_package || packages[0] || null;
  const selectedPackage = packageId ? explicitlySelectedPackage : primaryPackage;
  const workflowLabel = order.workflow?.label || {};
  const useWorkflowLabelFallback =
    !packageId ||
    (!!selectedPackage &&
      (selectedPackage.id === primaryPackage?.id ||
        selectedPackage.sequence === primaryPackage?.sequence));

  return {
    order: {
      ...order,
      shipping_address: {
        ...order.shipping_address,
        phone:
          order.shipping_address?.phone ||
          order.customer_phone ||
          order.customer?.phone ||
          null,
      },
      workflow: {
        ...order.workflow,
        label: {
          ...workflowLabel,
          package_weight_grams:
            selectedPackage?.package_weight_grams ??
            (useWorkflowLabelFallback ? workflowLabel.package_weight_grams : null) ??
            null,
          package_length_cm:
            selectedPackage?.package_length_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_length_cm : null) ??
            null,
          package_width_cm:
            selectedPackage?.package_width_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_width_cm : null) ??
            null,
          package_height_cm:
            selectedPackage?.package_height_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_height_cm : null) ??
            null,
          carrier_service:
            selectedPackage?.carrier_service ??
            (useWorkflowLabelFallback ? workflowLabel.carrier_service : null) ??
            null,
        },
      },
    },
    items,
    package: selectedPackage as WorkflowPackage | null,
  };
}

function sendStatusNotification(data: {
  email?: string | null;
  order_number?: string | number | null;
  total?: number | null;
  currency_code?: string | null;
  status: string;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  tracking_link?: string | null;
  send_admin_copy?: boolean;
}) {
  if (!data.email) return;
  const email = data.email;

  import('./email-service')
    .then(async ({ emailService }) => {
      const sendOrderEmail = async (recipient: string) => {
        if (data.status === 'shipped' && data.tracking_number) {
          return emailService.sendShippingNotification({
            email: recipient,
            order_number: data.order_number ?? '',
            tracking_number: data.tracking_number,
            shipping_carrier: data.shipping_carrier ?? undefined,
            tracking_link: data.tracking_link ?? undefined,
          });
        }

        return emailService.sendOrderStatusUpdate(
          {
            order_number: data.order_number ?? '',
            total: data.total || 0,
            currency_code: data.currency_code || 'INR',
            status: data.status,
          },
          recipient
        );
      };

      await sendOrderEmail(email);

      if (data.send_admin_copy !== true) return;

      const storeEmailSetting = await settingService.getByKey('store_email');
      const adminCopyEmail =
        typeof storeEmailSetting?.value === 'string' && storeEmailSetting.value.includes('@')
          ? storeEmailSetting.value.trim()
          : process.env.ADMIN_EMAIL?.trim() || null;

      if (
        adminCopyEmail &&
        adminCopyEmail.toLowerCase() !== email.toLowerCase()
      ) {
        await sendOrderEmail(adminCopyEmail);
      }
    })
    .catch((err) =>
      console.error('[OrderService] Failed to load email service:', err)
    );
}

function appendCommunicationEvent(
  metadata: Record<string, unknown> | null | undefined,
  event: {
    template: string;
    subject: string;
    message: string;
    channel?: string;
    status?: string;
    sent_at?: string;
  }
) {
  const baseMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {};
  const existingEvents = Array.isArray(baseMetadata.communication_events)
    ? baseMetadata.communication_events
    : [];

  return {
    ...baseMetadata,
    communication_events: [
      ...existingEvents,
      {
        template: event.template,
        subject: event.subject,
        message: event.message,
        sent_at: event.sent_at || new Date().toISOString(),
        channel: event.channel || 'email',
        status: event.status || 'queued',
      },
    ],
  };
}

// --- SERVICE CLASS ---
class OrderService {
  async listOrders(filters: OrderFilters) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      queue = 'all',
      workflow_filter = 'all',
      date_from = '',
      date_to = '',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      const sanitizedSearch = sanitizeOrderSearchInput(search);
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch}%`;
        conditions.push(
          or(
            sql`CAST(${orders.display_id} AS TEXT) LIKE ${pattern}`,
            ilike(orders.email, pattern),
            ilike(customers.first_name, pattern),
            ilike(customers.last_name, pattern),
            sql`coalesce(${shippingAddr.first_name}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.last_name}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.address_1}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.city}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.postal_code}, '') ilike ${pattern}`,
            sql`coalesce(${orders.metadata}->>'customer_note', '') ilike ${pattern}`,
            sql`coalesce(${orders.metadata}->>'internal_note', '') ilike ${pattern}`,
            sql`exists (
              select 1
              from ${line_items}
              where ${line_items.order_id} = ${orders.id}
                and (
                  ${line_items.title} ilike ${pattern}
                  or coalesce(${line_items.description}, '') ilike ${pattern}
                )
            )`
          )
        );
      }
    }

    if (date_from) conditions.push(gte(orders.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(orders.created_at, new Date(date_to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch
    const ordersList = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        email: orders.email,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        total: orders.total,
        currency_code: orders.currency_code,
        customer_id: orders.customer_id,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
        metadata: orders.metadata,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        shipping_first_name: shippingAddr.first_name,
        shipping_last_name: shippingAddr.last_name,
        shipping_city: shippingAddr.city,
        shipping_postal_code: shippingAddr.postal_code,
        shipping_country_code: shippingAddr.country_code,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(shippingAddr, eq(orders.shipping_address_id, shippingAddr.id))
      .where(whereClause)
      .orderBy(sort_order === 'asc' ? asc(orders.created_at) : desc(orders.created_at));

    const normalizedOrders = ordersList.map((order) => applyWorkflowSummary(order));
    return selectListedOrders(normalizedOrders, {
      page,
      limit,
      status,
      queue,
      workflow_filter,
      sort_by,
      sort_order,
    });
  }

  async getOrder(id: string) {
    const detail = await orderDetailQueryService.getOrderDetail(id);
    if (!detail) return null;
    return { order: applyWorkflowSummary(detail.order), items: detail.items };
  }

  async updateStatus(id: string, newStatus: string) {
    const [existingOrder] = await db
      .select({
        email: orders.email,
        order_number: orders.display_id,
        total: orders.total,
        currency_code: orders.currency_code,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));
    if (!existingOrder) throw new Error('Order not found');

    const currentStatus = deriveWorkflowStatus(existingOrder);

    assertOrderStatusTransition(currentStatus, newStatus);

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: newStatus as OrderStatus,
    });
    const { fulfillmentStatus: nextFulfillmentStatus, paymentStatus: nextPaymentStatus } =
      deriveOrderStatusMutation(
        newStatus,
        existingOrder.fulfillment_status ?? '',
        existingOrder.payment_status ?? ''
      );

    const [updated] = await db
      .update(orders)
      .set({
        status: newStatus as any,
        fulfillment_status: nextFulfillmentStatus as any,
        payment_status: nextPaymentStatus as any,
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    sendStatusNotification({
      email: existingOrder.email,
      order_number: existingOrder.order_number,
      total: existingOrder.total,
      currency_code: existingOrder.currency_code,
      status: newStatus,
      tracking_number: existingOrder.tracking_number,
    });

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async bulkUpdateStatus(orderIds: string[], newStatus: string) {
    // Fetch current statuses
    const targets = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        total: orders.total,
        currency_code: orders.currency_code,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (targets.length === 0) throw new Error('No valid orders found');

    const invalidIds: string[] = [];
    for (const order of targets) {
      const currentStatus = deriveWorkflowStatus(order);
      if (!canTransitionOrderStatus(currentStatus, newStatus)) {
        invalidIds.push(order.id);
      }
    }

    if (invalidIds.length > 0) {
      throw new Error(
        `Cannot update ${invalidIds.length} orders. Invalid status transition.`
      );
    }

    for (const order of targets) {
      const nextMetadata = mergeWorkflowMetadata(order.metadata, {
        workflow_status: newStatus as OrderStatus,
      });
      const { fulfillmentStatus: nextFulfillmentStatus, paymentStatus: nextPaymentStatus } =
        deriveOrderStatusMutation(
          newStatus as OrderStatus,
          order.fulfillment_status ?? '',
          order.payment_status ?? ''
        );

      await db
        .update(orders)
        .set({
          status: newStatus as any,
          fulfillment_status: nextFulfillmentStatus as any,
          payment_status: nextPaymentStatus as any,
          metadata: nextMetadata,
          updated_at: new Date(),
        })
        .where(eq(orders.id, order.id));

      sendStatusNotification({
        email: order.email,
        order_number: order.order_number,
        total: order.total,
        currency_code: order.currency_code,
        status: newStatus,
        tracking_number: order.tracking_number,
      });
    }

    return targets.length;
  }

  async addTracking(
    id: string,
    data: {
      tracking_number: string;
      shipping_carrier?: string;
      tracking_link?: string;
      ship_date?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
      notify_buyer?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
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
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: 'shipped',
      shipped_at: shippedAt,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
      packages: nextPackages,
    });
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    // Send shipping notification email (fire-and-forget)
    if (existingOrder.email && data.notify_buyer !== false) {
      import('./email-service').then(({ emailService }) => {
        emailService.sendShippingNotification({
          email: existingOrder.email!,
          order_number: existingOrder.order_number ?? id.slice(0, 8),
          tracking_number: data.tracking_number,
          shipping_carrier: data.shipping_carrier,
          tracking_link: data.tracking_link,
        }).catch(err => console.error('[OrderService] Failed to send shipping notification:', err));
      }).catch(err => console.error('[OrderService] Failed to load email service:', err));
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async completeOrder(
    id: string,
    data: {
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
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    if (data.no_tracking !== true && !data.tracking_number?.trim()) {
      throw new Error('Tracking number is required unless no-tracking is selected');
    }

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
      {
        package_id: 'pkg_1',
        ship_date: shippedAt,
        carrier: data.shipping_carrier ?? null,
        service: data.shipping_service ?? null,
        tracking_number:
          data.no_tracking === true ? null : data.tracking_number?.trim() || null,
        tracking_url:
          data.no_tracking === true ? null : data.tracking_link ?? null,
        no_tracking: data.no_tracking === true,
        no_tracking_reason:
          data.no_tracking === true ? data.no_tracking_reason ?? null : null,
        notify_buyer: data.notify_buyer !== false,
        notification_sent: data.notify_buyer !== false,
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );
    const autoNotificationSubject = `Your Odhvica order #${
      existingOrder.order_number ?? id.slice(0, 8)
    } has shipped`;
    const autoNotificationMessage =
      data.no_tracking === true
        ? 'Your order is on its way. This shipment does not include a tracking number.'
        : 'Tracking details have been added to your order and your shipment is on its way.';
    const nextMetadata = mergeWorkflowMetadata(
      data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: 'shipped',
            subject: autoNotificationSubject,
            message: autoNotificationMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: 'shipped',
      shipped_at: shippedAt,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (existingOrder.email && data.notify_buyer !== false) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: 'shipped',
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        send_admin_copy: (data as { send_admin_copy?: boolean }).send_admin_copy === true,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async addPackage(
    id: string,
    data: {
      ship_date?: string | null;
      shipping_carrier?: string | null;
      shipping_service?: string | null;
      tracking_number?: string | null;
      tracking_link?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      notify_buyer?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
      {
        ship_date: shippedAt,
        carrier: data.shipping_carrier ?? null,
        service: data.shipping_service ?? null,
        tracking_number:
          data.no_tracking === true ? null : data.tracking_number?.trim() || null,
        tracking_url:
          data.no_tracking === true ? null : data.tracking_link ?? null,
        no_tracking: data.no_tracking === true,
        no_tracking_reason:
          data.no_tracking === true ? data.no_tracking_reason ?? null : null,
        notify_buyer: data.notify_buyer !== false,
        notification_sent: data.notify_buyer !== false,
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );
    const addPackageSubject = `Package update for your Odhvica order #${
      existingOrder.order_number ?? id.slice(0, 8)
    }`;
    const addPackageMessage =
      data.no_tracking === true
        ? 'A new package has been added to your shipment without a tracking number.'
        : 'A new package has been added to your order with updated shipping details.';
    const nextMetadata = mergeWorkflowMetadata(
      data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: 'shipped',
            subject: addPackageSubject,
            message: addPackageMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: 'shipped',
      shipped_at: getWorkflowMetadata(existingOrder.metadata).shipped_at || shippedAt,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (existingOrder.email && data.notify_buyer !== false) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: 'shipped',
        tracking_number: addedPackage?.tracking_number || trackingFields.tracking_number,
        shipping_carrier: addedPackage?.carrier || trackingFields.shipping_carrier,
        tracking_link: addedPackage?.tracking_url || trackingFields.tracking_link,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updatePackage(
    id: string,
    packageId: string,
    data: {
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
      label_state?: LabelStatus;
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
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const existingPackages = getWorkflowPackages(existingOrder);
    if (!existingPackages.some((pkg) => pkg.id === packageId)) {
      throw new Error('Package not found');
    }

    const nextPackages = upsertWorkflowPackage(existingPackages, {
      package_id: packageId,
      ship_date: data.ship_date,
      carrier: data.shipping_carrier,
      service: data.shipping_service,
      tracking_number: data.tracking_number,
      tracking_url: data.tracking_link,
      no_tracking: data.no_tracking,
      no_tracking_reason: data.no_tracking_reason,
      notify_buyer: data.notify_buyer,
      notification_sent:
        Object.prototype.hasOwnProperty.call(data, 'notify_buyer')
          ? data.notify_buyer === true
          : undefined,
      notification_sent_at:
        Object.prototype.hasOwnProperty.call(data, 'notify_buyer')
          ? data.notify_buyer === true
            ? new Date().toISOString()
            : null
          : undefined,
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
    const primaryPackage = getPrimaryPackage(nextPackages);
    const updatedPackage =
      nextPackages.find((pkg) => pkg.id === packageId) || primaryPackage;
    const updateStatus = data.delivered_at
      ? 'delivered'
      : updatedPackage?.ship_date
        ? 'shipped'
        : existingOrder.status;
    const updateSubject =
      updateStatus === 'delivered'
        ? `Your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)} was marked delivered`
        : `Shipping details updated for your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)}`;
    const updateMessage =
      updateStatus === 'delivered'
        ? 'Your order has been marked as delivered.'
        : data.no_tracking === true
          ? 'Shipping details were updated for your order. This package does not include tracking.'
          : 'Shipping details were updated for your order, including the latest tracking information.';
    const nextMetadata = mergeWorkflowMetadata(
      Object.prototype.hasOwnProperty.call(data, 'notify_buyer') &&
        data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: updateStatus === 'delivered' ? 'order_update' : 'shipped',
            subject: updateSubject,
            message: updateMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: data.delivered_at ? 'delivered' : undefined,
      shipped_at:
        getWorkflowMetadata(existingOrder.metadata).shipped_at ||
        primaryPackage?.ship_date ||
        null,
      delivered_at: data.delivered_at,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status:
          data.delivered_at
            ? 'delivered'
            : primaryPackage?.ship_date
              ? 'shipped'
              : existingOrder.status,
        fulfillment_status:
          data.delivered_at
            ? 'fulfilled'
            : primaryPackage?.ship_date
              ? 'shipped'
              : existingOrder.fulfillment_status,
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (
      existingOrder.email &&
      Object.prototype.hasOwnProperty.call(data, 'notify_buyer') &&
      data.notify_buyer !== false
    ) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: data.delivered_at ? 'delivered' : 'shipped',
        tracking_number: updatedPackage?.tracking_number || trackingFields.tracking_number,
        shipping_carrier: updatedPackage?.carrier || trackingFields.shipping_carrier,
        tracking_link: updatedPackage?.tracking_url || trackingFields.tracking_link,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updateWorkflow(
    id: string,
    data: {
      ship_by_date?: string | null;
      estimated_delivery_start?: string | null;
      estimated_delivery_end?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, data);

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updateLabel(
    id: string,
    data: {
      label_status?: LabelStatus;
      label_url?: string | null;
      label_file_name?: string | null;
      label_cost?: number | null;
      label_currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const existingMetadata = getWorkflowMetadata(existingOrder.metadata);
    const existingPackages = getWorkflowPackages(existingOrder);
    const primaryPackage = getPrimaryPackage(existingPackages);
    const updates: Partial<WorkflowMetadata> = {};
    const copyNullable = <K extends keyof WorkflowMetadata>(
      sourceKey: keyof typeof data,
      metadataKey: K
    ) => {
      if (Object.prototype.hasOwnProperty.call(data, sourceKey)) {
        updates[metadataKey] = (data[sourceKey] ?? null) as WorkflowMetadata[K];
      }
    };

    copyNullable('label_url', 'label_url');
    copyNullable('label_file_name', 'label_file_name');
    copyNullable('label_cost', 'label_cost');
    copyNullable('package_weight_grams', 'package_weight_grams');
    copyNullable('package_length_cm', 'package_length_cm');
    copyNullable('package_width_cm', 'package_width_cm');
    copyNullable('package_height_cm', 'package_height_cm');
    copyNullable('carrier_service', 'carrier_service');

    if (Object.prototype.hasOwnProperty.call(data, 'label_currency')) {
      updates.label_currency = data.label_currency
        ? data.label_currency.toUpperCase()
        : null;
    }

    const nextStatus =
      data.label_status ||
      existingMetadata.label_status ||
      (data.label_url ? 'created' : 'draft');
    updates.label_status = nextStatus;

    const now = new Date().toISOString();
    const hasCreatedLabel =
      nextStatus === 'created' || nextStatus === 'printed';
    updates.label_created_at = hasCreatedLabel
      ? existingMetadata.label_created_at || now
      : existingMetadata.label_created_at || null;
    updates.label_printed_at =
      nextStatus === 'printed'
        ? existingMetadata.label_printed_at || now
        : existingMetadata.label_printed_at || null;

    updates.packages = upsertWorkflowPackage(existingPackages, {
      package_id: primaryPackage?.id || 'pkg_1',
      label_url:
        Object.prototype.hasOwnProperty.call(data, 'label_url')
          ? data.label_url ?? null
          : undefined,
      label_file_name:
        Object.prototype.hasOwnProperty.call(data, 'label_file_name')
          ? data.label_file_name ?? null
          : undefined,
      label_state: nextStatus,
      label_cost:
        Object.prototype.hasOwnProperty.call(data, 'label_cost')
          ? data.label_cost ?? null
          : undefined,
      label_currency:
        Object.prototype.hasOwnProperty.call(data, 'label_currency')
          ? (data.label_currency ? data.label_currency.toUpperCase() : null)
          : undefined,
      package_weight_grams:
        Object.prototype.hasOwnProperty.call(data, 'package_weight_grams')
          ? data.package_weight_grams ?? null
          : undefined,
      package_length_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_length_cm')
          ? data.package_length_cm ?? null
          : undefined,
      package_width_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_width_cm')
          ? data.package_width_cm ?? null
          : undefined,
      package_height_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_height_cm')
          ? data.package_height_cm ?? null
          : undefined,
      carrier_service:
        Object.prototype.hasOwnProperty.call(data, 'carrier_service')
          ? data.carrier_service ?? null
          : undefined,
    });

    const nextMetadata = mergeWorkflowMetadata(
      existingOrder.metadata,
      updates
    );

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async getCarrierReadiness(
    id: string,
    options: { provider?: CarrierProvider | null; package_id?: string | null } = {}
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    return carrierService.getReadiness(context.order, {
      provider: options.provider,
    });
  }

  async getCarrierRates(
    id: string,
    options: { provider?: CarrierProvider | null; package_id?: string | null } = {}
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    return carrierService.getRates(context.order, {
      provider: options.provider,
    });
  }

  async purchaseCarrierLabel(
    id: string,
    options: {
      provider?: CarrierProvider | null;
      package_id?: string | null;
      courier_id: string | number;
    }
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    return purchaseCarrierLabelCommand(
      {
        context: {
          order: context.order,
          items: context.items || [],
          packageId: context.package?.id || null,
        },
        options: {
          provider: options.provider,
          packageId: options.package_id,
          courierId: options.courier_id,
        },
      },
      {
        carrierLabelProvider: {
          purchaseLabel: (purchaseContext, purchaseOptions) =>
            carrierService.purchaseLabel(
              purchaseContext as any,
              purchaseOptions as any
            ),
        },
        updatePackage: (packageId, packageData) =>
          this.updatePackage(id, packageId, packageData as any),
      }
    );
  }

  async sendBuyerUpdate(
    id: string,
    data: {
      template: string;
      subject: string;
      message: string;
      include_tracking?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');
    if (!existingOrder.email) throw new Error('Order email is missing');

    const primaryPackage = getPrimaryPackage(getWorkflowPackages(existingOrder));
    const sentAt = new Date().toISOString();

    const { emailService } = await import('./email-service');
    const sent = await emailService.sendBuyerOrderUpdate({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      subject: data.subject,
      message: data.message,
      tracking_number:
        data.include_tracking === false
          ? null
          : primaryPackage?.tracking_number || null,
      shipping_carrier:
        data.include_tracking === false ? null : primaryPackage?.carrier || null,
      tracking_link:
        data.include_tracking === false
          ? null
          : primaryPackage?.tracking_url || null,
    });

    const baseMetadata =
      existingOrder.metadata &&
      typeof existingOrder.metadata === 'object' &&
      !Array.isArray(existingOrder.metadata)
        ? (existingOrder.metadata as Record<string, unknown>)
        : {};
    const existingEvents = Array.isArray(baseMetadata.communication_events)
      ? baseMetadata.communication_events
      : [];
    const nextMetadata = {
      ...baseMetadata,
      communication_events: [
        ...existingEvents,
        {
          template: data.template,
          subject: data.subject,
          message: data.message,
          sent_at: sentAt,
          channel: 'email',
          status: sent === false ? 'failed' : 'sent',
        },
      ],
    };

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updatePackagingChecklist(
    id: string,
    data: {
      product_quality_checked?: boolean;
      size_color_verified?: boolean;
      care_card_included?: boolean;
      thank_you_note_included?: boolean;
      gift_wrap_applied?: boolean;
      invoice_included?: boolean;
      checked_by?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const metadata = getWorkflowMetadata(existingOrder.metadata);
    const checklist = {
      product_quality_checked: data.product_quality_checked === true,
      size_color_verified: data.size_color_verified === true,
      care_card_included: data.care_card_included === true,
      thank_you_note_included: data.thank_you_note_included === true,
      gift_wrap_applied: data.gift_wrap_applied === true,
      invoice_included: data.invoice_included === true,
      checked_at: new Date().toISOString(),
      checked_by: data.checked_by || metadata.packaging_checklist?.checked_by || null,
    };
    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      packaging_checklist: checklist,
    });

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async deleteOrder(id: string) {
    // Delete line items
    try {
      await db.delete(line_items).where(eq(line_items.order_id, id));
    } catch (error: unknown) {
      console.warn(
        `[OrderService] Failed to delete line items for ${id}, assuming explicitly deleted.`,
        error
      );
    }
    // Delete order
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getStatsOverview() {
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
        total: orders.total,
      })
      .from(orders);

    return calculateOrderStatsOverview(orderRows, deriveWorkflowStatus);
  }

  async getFulfillmentMetrics() {
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        customer_id: orders.customer_id,
        email: orders.email,
        metadata: orders.metadata,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
      })
      .from(orders);

    return calculateFulfillmentMetrics(orderRows, {
      resolveWorkflowStatus: deriveWorkflowStatus,
      getWorkflowMetadata: (metadata) => getWorkflowMetadata(metadata) as Record<string, any>,
      buildWorkflowSummary,
    });
  }

  // Reporting-query compatibility delegates
  async getInvoiceData(id: string) {
    return orderReportingService.getInvoiceData(id);
  }

  async getChartData(days: number) {
    return orderReportingService.getChartData(days);
  }

  async getExportData(filters: { search?: string; status?: string }) {
    return orderReportingService.getExportData(filters);
  }

}

export const orderService = new OrderService();
