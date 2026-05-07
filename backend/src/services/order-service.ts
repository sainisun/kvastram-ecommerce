import { db } from '../db/client';
import {
  orders,
  line_items,
  customers,
  products,
  product_variants,
  addresses,
} from '../db/schema';
import { eq, desc, like, or, sql, and, gte, lte, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { generateInvoice } from '../services/pdf-service';
import { carrierService } from '../services/carrier-service';
import { sanitizeSearchInput } from '../utils/validation';
import {
  buildWorkflowSummary,
  deriveWorkflowStatus,
  getWorkflowMetadata,
  mergeWorkflowMetadata,
} from '../utils/order-workflow';
import type { LabelStatus, WorkflowMetadata } from '../utils/order-workflow';
import type { CarrierProvider } from '../services/carrier-service';

// --- TYPES ---
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// --- CONSTANTS ---
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// Aliases
const shippingAddr = alias(addresses, 'shipping_address');
const billingAddr = alias(addresses, 'billing_address');

function applyWorkflowSummary<T extends Record<string, any>>(order: T) {
  const workflow = buildWorkflowSummary(order);

  return {
    ...order,
    raw_status: order.status,
    status: workflow.status,
    workflow,
  };
}

function sendStatusNotification(data: {
  email?: string | null;
  order_number?: string | number | null;
  total?: number | null;
  currency_code?: string | null;
  status: string;
  tracking_number?: string | null;
}) {
  if (!data.email) return;
  const email = data.email;

  import('./email-service')
    .then(({ emailService }) => {
      if (data.status === 'shipped' && data.tracking_number) {
        return;
      }

      return emailService.sendOrderStatusUpdate(
        {
          order_number: data.order_number ?? '',
          total: data.total || 0,
          currency_code: data.currency_code || 'INR',
          status: data.status,
        },
        email
      );
    })
    .catch((err) =>
      console.error('[OrderService] Failed to load email service:', err)
    );
}

// --- SERVICE CLASS ---
class OrderService {
  async listOrders(filters: OrderFilters) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      date_from = '',
      date_to = '',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      if (sanitizedSearch) {
        conditions.push(
          or(
            sql`CAST(${orders.display_id} AS TEXT) LIKE ${`%${sanitizedSearch}%`}`,
            like(orders.email, `%${sanitizedSearch}%`)
          )
        );
      }
    }

    if (date_from) conditions.push(gte(orders.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(orders.created_at, new Date(date_to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort Column
    let sortCol: any = orders.created_at;
    if (sort_by === 'order_number') sortCol = orders.display_id;
    else if (sort_by === 'total') sortCol = orders.total;
    else if (sort_by === 'status') sortCol = orders.status;
    else if (sort_by === 'email') sortCol = orders.email;

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
        metadata: orders.metadata,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .where(whereClause)
      .orderBy(sort_order === 'asc' ? sortCol : desc(sortCol));

    const normalizedOrders = ordersList.map((order) => applyWorkflowSummary(order));
    const filteredOrders =
      status && status !== 'all'
        ? normalizedOrders.filter((order) => order.status === status)
        : normalizedOrders;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        total_pages: Math.ceil(filteredOrders.length / limit),
      },
    };
  }

  async getOrder(id: string) {
    const [order] = await db
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
        customer_email: customers.email,
        customer_phone: customers.phone,
        shipping_address: shippingAddr,
        billing_address: billingAddr,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(shippingAddr, eq(orders.shipping_address_id, shippingAddr.id))
      .leftJoin(billingAddr, eq(orders.billing_address_id, billingAddr.id))
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select({
        id: line_items.id,
        quantity: line_items.quantity,
        unit_price: line_items.unit_price,
        total: line_items.total_price,
        variant_id: line_items.variant_id,
        product_title: products.title,
        product_thumbnail: products.thumbnail,
        variant_title: product_variants.title,
        title: line_items.title,
        thumbnail: line_items.thumbnail,
      })
      .from(line_items)
      .leftJoin(
        product_variants,
        eq(line_items.variant_id, product_variants.id)
      )
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return { order: applyWorkflowSummary(order), items };
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

    // Validate transition
    if (currentStatus !== newStatus) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from '${currentStatus}' to '${newStatus}'`
        );
      }
    }

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: newStatus as OrderStatus,
    });
    const nextFulfillmentStatus =
      newStatus === 'delivered'
        ? 'fulfilled'
        : newStatus === 'shipped'
          ? 'shipped'
          : newStatus === 'processing'
            ? 'not_fulfilled'
            : existingOrder.fulfillment_status;
    const nextPaymentStatus =
      newStatus === 'refunded' ? 'refunded' : existingOrder.payment_status;

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
      if (currentStatus === newStatus) continue;

      const allowed = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
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
      const nextFulfillmentStatus =
        newStatus === 'delivered'
          ? 'fulfilled'
          : newStatus === 'shipped'
            ? 'shipped'
            : newStatus === 'processing'
              ? 'not_fulfilled'
              : order.fulfillment_status;
      const nextPaymentStatus =
        newStatus === 'refunded' ? 'refunded' : order.payment_status;

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
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: 'shipped',
      shipped_at: shippedAt,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
    });

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: data.tracking_number,
        shipping_carrier: data.shipping_carrier,
        tracking_link: data.tracking_link,
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

  async getCarrierReadiness(id: string) {
    const data = await this.getOrder(id);
    if (!data) return null;

    return carrierService.getReadiness(data.order);
  }

  async getCarrierRates(
    id: string,
    options: { provider?: CarrierProvider | null } = {}
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    return carrierService.getRates(data.order, options);
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
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');
    if (!existingOrder.email) throw new Error('Order email is missing');

    const sentAt = new Date().toISOString();

    const { emailService } = await import('./email-service');
    const sent = await emailService.sendBuyerOrderUpdate({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      subject: data.subject,
      message: data.message,
      tracking_number:
        data.include_tracking === false ? null : existingOrder.tracking_number,
      shipping_carrier:
        data.include_tracking === false ? null : existingOrder.shipping_carrier,
      tracking_link:
        data.include_tracking === false ? null : existingOrder.tracking_link,
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

    const countByStatus: Record<string, number> = {};
    let totalRevenueNum = 0;

    for (const row of orderRows) {
      const workflowStatus = deriveWorkflowStatus(row);
      countByStatus[workflowStatus] = (countByStatus[workflowStatus] || 0) + 1;

      if (workflowStatus !== 'cancelled' && workflowStatus !== 'refunded') {
        totalRevenueNum += Number(row.total || 0);
      }
    }

    const totalOrdersNum = orderRows.length;

    return {
      total_orders: totalOrdersNum,
      total_revenue: totalRevenueNum,
      pending_orders: countByStatus['pending'] || 0,
      processing_orders: countByStatus['processing'] || 0,
      shipped_orders: countByStatus['shipped'] || 0,
      delivered_orders: countByStatus['delivered'] || 0,
      cancelled_orders: countByStatus['cancelled'] || 0,
      refunded_orders: countByStatus['refunded'] || 0,
      avg_order_value: totalOrdersNum > 0 ? Math.round(totalRevenueNum / totalOrdersNum) : 0,
    };
  }

  // Helper for Invoice
  async getInvoiceData(id: string) {
    // Same logic as getOrder but structured for PDF
    const [order] = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        email: orders.email,
        total: orders.total,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        created_at: orders.created_at,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        billing_address: billingAddr,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(billingAddr, eq(orders.billing_address_id, billingAddr.id))
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select({
        quantity: line_items.quantity,
        unit_price: line_items.unit_price,
        total: line_items.total_price,
        product_title: products.title,
        variant_title: product_variants.title,
      })
      .from(line_items)
      .leftJoin(
        product_variants,
        eq(line_items.variant_id, product_variants.id)
      )
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return { order, items };
  }

  // Revenue + Order count chart data (for admin dashboard)
  async getChartData(days: number) {
    const result = await db.execute(
      sql`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::int AS revenue
        FROM orders
        WHERE created_at >= NOW() - (${days} || ' days')::interval
          AND status NOT IN ('cancelled', 'refunded')
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `
    );
    return Array.from(result);
  }

  // Export orders data for CSV
  async getExportData(filters: { search?: string; status?: string }) {
    const conditions = [];
    if (filters.search) {
      const s = filters.search.replace(/[%_]/g, '\\$&');
      conditions.push(
        sql`(CAST(${orders.display_id} AS TEXT) LIKE ${`%${s}%`} OR ${orders.email} LIKE ${`%${s}%`})`
      );
    }
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(orders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select({
        order_number: orders.display_id,
        created_at: orders.created_at,
        status: orders.status,
        email: orders.email,
        currency_code: orders.currency_code,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        total: orders.total,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .where(whereClause)
      .orderBy(desc(orders.created_at))
      .limit(10000); // Safety cap
  }
}

export const orderService = new OrderService();
