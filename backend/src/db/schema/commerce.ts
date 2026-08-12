import { boolean, decimal, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex, uuid, createdUpdated } from './shared';
import { product_variants, regions } from './catalog';
import { campaigns } from './marketing';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    phone: text('phone'),
    has_account: boolean('has_account').default(false),
    password_hash: text('password_hash'), // Nullable for guest checkouts
    // 🔒 FIX-011: Email verification fields
    email_verified: boolean('email_verified').default(false),
    verification_token: text('verification_token'),
    verification_expires_at: timestamp('verification_expires_at'),
    verification_attempts: integer('verification_attempts').default(0),
    // 🔒 Q9: Account lockout fields
    failed_login_attempts: integer('failed_login_attempts').default(0),
    locked_until: timestamp('locked_until'),
    // 🔒 Password reset fields
    reset_token: text('reset_token'),
    reset_token_expires_at: timestamp('reset_token_expires_at'),
    reset_attempts: integer('reset_attempts').default(0),
    // Wholesale / general metadata (discount_tier, wholesale_customer flag, etc.)
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    createdAtIndex: index('idx_customers_created_at').on(table.created_at),
    lockedIdx: index('idx_customers_locked_until').on(table.locked_until),
    resetTokenIdx: index('idx_customers_reset_token').on(table.reset_token),
  })
);

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id').references(() => customers.id),
  first_name: text('first_name'),
  last_name: text('last_name'),
  company: text('company'),
  address_1: text('address_1'),
  address_2: text('address_2'),
  city: text('city'),
  country_code: text('country_code'),
  province: text('province'),
  postal_code: text('postal_code'),
  phone: text('phone'),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    status: text('status').default('pending'), // pending, completed, archived, canceled
    fulfillment_status: text('fulfillment_status').default('not_fulfilled'), // not_fulfilled, fulfilled, partially_fulfilled, shipped
    payment_status: text('payment_status').default('awaiting'), // awaiting, captured, refunded
    display_id: serial('display_id'), // User facing ID like #1001

    // Links
    customer_id: uuid('customer_id').references(() => customers.id),
    region_id: uuid('region_id').references(() => regions.id),
    shipping_address_id: uuid('shipping_address_id').references(
      () => addresses.id
    ),
    billing_address_id: uuid('billing_address_id').references(
      () => addresses.id
    ),

    // Money
    currency_code: text('currency_code').notNull(),
    tax_rate: decimal('tax_rate'),

    // Totals (stored as integers)
    subtotal: integer('subtotal').default(0),
    tax_total: integer('tax_total').default(0),
    shipping_total: integer('shipping_total').default(0),
    discount_total: integer('discount_total').default(0),
    discount_id: uuid('discount_id').references(() => discounts.id),
    total: integer('total').default(0), // Final amount to charge

    email: text('email').notNull(), // Snapshot in case customer changes
    tracking_number: text('tracking_number'),
    shipping_carrier: text('shipping_carrier'),
    tracking_link: text('tracking_link'),
    metadata: jsonb('metadata'),
    idempotency_key: text('idempotency_key'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_orders_status').on(table.status),
    customerIdIdx: index('idx_orders_customer_id').on(table.customer_id),
    regionIdIdx: index('idx_orders_region_id').on(table.region_id),
    discountIdIdx: index('idx_orders_discount_id').on(table.discount_id),
    idempotencyKeyIdx: uniqueIndex('idx_orders_idempotency_key').on(table.idempotency_key),
    createdAtIndex: index('idx_orders_created_at').on(table.created_at),
  })
);

export const line_items = pgTable(
  'line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    order_id: uuid('order_id')
      .references(() => orders.id)
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id),
    title: text('title').notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'),
    quantity: integer('quantity').notNull(),
    unit_price: integer('unit_price').notNull(),
    total_price: integer('total_price').notNull(), // quantity * unit_price
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    orderIdx: index('idx_line_items_order_id').on(table.order_id),
    variantIdx: index('idx_line_items_variant_id').on(table.variant_id),
  })
);

// --- RELATIONS ---

export const discounts = pgTable('discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(), // percentage, fixed_amount, free_shipping
  value: integer('value').notNull(), // percentage (0-100) or amount in cents
  description: text('description'),
  starts_at: timestamp('starts_at'),
  ends_at: timestamp('ends_at'),
  usage_limit: integer('usage_limit'), // null = unlimited
  usage_count: integer('usage_count').default(0),
  min_purchase_amount: integer('min_purchase_amount'), // in cents
  is_active: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  campaign_id: uuid('campaign_id').references(() => campaigns.id),
  ...createdUpdated,
});

// 🔒 FIX-006: Discount usage tracking table (per-customer limits)
export const discount_usage = pgTable(
  'discount_usage',
  {
    discount_id: uuid('discount_id')
      .references(() => discounts.id, { onDelete: 'cascade' })
      .notNull(),
    customer_id: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    order_id: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    used_at: timestamp('used_at').defaultNow().notNull(),
  },
  (table) => ({
    // Composite primary key: one use per customer per discount
    pk: primaryKey({
      columns: [table.discount_id, table.customer_id],
      name: 'pk_discount_customer_usage',
    }),
    customerIdx: index('idx_discount_usage_customer_id').on(table.customer_id),
    discountIdx: index('idx_discount_usage_discount_id').on(table.discount_id),
    orderIdx: index('idx_discount_usage_order_id').on(table.order_id),
  })
);

// 🔒 FIX-007: Stripe webhook events table (idempotency)
export const webhook_events = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: text('event_id').notNull().unique(), // Stripe's event ID
    event_type: text('event_type').notNull(),
    processed_at: timestamp('processed_at'),
    status: text('status').default('pending'), // pending, processed, failed
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    eventIdIdx: index('idx_webhook_events_event_id').on(table.event_id),
    statusIdx: index('idx_webhook_events_status').on(table.status),
  })
);
