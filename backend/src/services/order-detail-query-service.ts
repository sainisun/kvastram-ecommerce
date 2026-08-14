import { eq } from 'drizzle-orm';
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

const shippingAddress = alias(addresses, 'shipping_address');
const billingAddress = alias(addresses, 'billing_address');

export function buildOrderDetailResult<TOrder, TItem>(order: TOrder | undefined, items: TItem[]) {
  return order ? { order, items } : null;
}

export class OrderDetailQueryService {
  async getOrderDetail(id: string) {
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
        shipping_address: shippingAddress,
        billing_address: billingAddress,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(shippingAddress, eq(orders.shipping_address_id, shippingAddress.id))
      .leftJoin(billingAddress, eq(orders.billing_address_id, billingAddress.id))
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
      .leftJoin(product_variants, eq(line_items.variant_id, product_variants.id))
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return buildOrderDetailResult(order, items);
  }
}

export const orderDetailQueryService = new OrderDetailQueryService();
