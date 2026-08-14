import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db';
import {
  addresses,
  customers,
  line_items,
  orders,
  products,
  product_variants,
} from '../db/schema';

const billingAddress = alias(addresses, 'billing_address');

export type OrderExportFilters = { search?: string; status?: string };

/** Escapes SQL LIKE wildcards exactly as the legacy order export query did. */
export function escapeOrderExportSearch(input: string): string {
  return input.replace(/[%_]/g, '\\$&');
}

export class OrderReportingService {
  async getInvoiceData(id: string) {
    const [order] = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        email: orders.email,
        currency_code: orders.currency_code,
        total: orders.total,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        metadata: orders.metadata,
        created_at: orders.created_at,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        billing_address: billingAddress,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(billingAddress, eq(orders.billing_address_id, billingAddress.id))
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
      .leftJoin(product_variants, eq(line_items.variant_id, product_variants.id))
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return { order, items };
  }

  async getChartData(days: number) {
    const result = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(total), 0)::int AS revenue
      FROM orders
      WHERE created_at >= NOW() - (${days} || ' days')::interval
        AND status IN ('completed', 'delivered')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);
    return Array.from(result);
  }

  async getExportData(filters: OrderExportFilters) {
    const conditions = [];
    if (filters.search) {
      const search = escapeOrderExportSearch(filters.search);
      conditions.push(
        sql`(CAST(${orders.display_id} AS TEXT) LIKE ${`%${search}%`} OR ${orders.email} LIKE ${`%${search}%`})`
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
      .limit(10000);
  }
}

export const orderReportingService = new OrderReportingService();
