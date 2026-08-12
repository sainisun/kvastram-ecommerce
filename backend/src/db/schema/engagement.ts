import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid, createdUpdated } from './shared';
import { products, product_variants } from './catalog';
import { customers, line_items, orders } from './commerce';

export const product_reviews = pgTable('product_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  customer_id: uuid('customer_id').references(() => customers.id), // Optional for guest reviews if we allow them, or require auth
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
    status: text('status').default('pending'), // pending, approved, rejected
    author_name: text('author_name').notNull(), // Fallback if no customer_id
    verified_purchase: boolean('verified_purchase').default(false),
    images: jsonb('images').default([]),
    ...createdUpdated,
  });

// --- WHATSAPP SETTINGS ---
export const whatsapp_settings = pgTable('whatsapp_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone_number_id: text('phone_number_id').notNull(),
  access_token: text('access_token').notNull(),
  business_account_id: text('business_account_id'),
  admin_phone: text('admin_phone').notNull(), // Where to send admin notifications
  notify_on_order: boolean('notify_on_order').default(true),
  notify_on_new_customer: boolean('notify_on_new_customer').default(false),
  is_active: boolean('is_active').default(false),
  ...createdUpdated,
});

// --- CART PERSISTENCE (Cart Abandonment Recovery) ---
export const saved_carts = pgTable(
  'saved_carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    session_id: text('session_id'), // Guest carts ke liye
    items: jsonb('items').notNull().default('[]'), // CartItem[] JSON array
    metadata: jsonb('metadata'), // To track reminder stages, etc.
    recovery_sent: boolean('recovery_sent').default(false),
    recovery_sent_at: timestamp('recovery_sent_at'),
    ...createdUpdated,
  },
  (table) => ({
    customerIdx: index('idx_saved_carts_customer_id').on(table.customer_id),
    sessionIdx: index('idx_saved_carts_session_id').on(table.session_id),
    recoverySentIdx: index('idx_saved_carts_recovery_sent').on(table.recovery_sent),
    updatedAtIdx: index('idx_saved_carts_updated_at').on(table.updated_at),
  })
);

// --- BACK IN STOCK SUBSCRIPTIONS ---
export const back_in_stock_subscriptions = pgTable(
  'back_in_stock_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id, {
      onDelete: 'cascade',
    }),
    email: text('email').notNull(),
    notified: boolean('notified').default(false),
    notified_at: timestamp('notified_at'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('idx_bis_product_id').on(table.product_id),
    emailIdx: index('idx_bis_email').on(table.email),
    notifiedIdx: index('idx_bis_notified').on(table.notified),
  })
);

// --- WISHLISTS ---
export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customer_id: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id, {
      onDelete: 'set null',
    }),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.customer_id, t.product_id] }),
    customerIdx: index('idx_wishlists_customer_id').on(t.customer_id),
  })
);

// --- RETURNS & REFUNDS ---
export const returns = pgTable(
  'returns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    order_id: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    customer_id: uuid('customer_id').references(() => customers.id),
    reason: text('reason').notNull(),
    // pending → approved → refunded | rejected
    status: text('status').default('pending'),
    refund_amount: integer('refund_amount').default(0), // in cents
    admin_notes: text('admin_notes'),
    ...createdUpdated,
  },
  (table) => ({
    orderIdx: index('idx_returns_order_id').on(table.order_id),
    statusIdx: index('idx_returns_status').on(table.status),
  })
);

export const return_items = pgTable(
  'return_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    return_id: uuid('return_id')
      .references(() => returns.id, { onDelete: 'cascade' })
      .notNull(),
    line_item_id: uuid('line_item_id').references(() => line_items.id),
    quantity: integer('quantity').notNull(),
    restock: boolean('restock').default(true), // auto-restock inventory?
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    returnIdx: index('idx_return_items_return_id').on(table.return_id),
  })
);

export const admin_audit_log = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    user_role: text('user_role'),
    action: text('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: uuid('entity_id'),
    old_value: jsonb('old_value'),
    new_value: jsonb('new_value'),
    ip_address: text('ip_address'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_audit_user').on(table.user_id),
    entityIdx: index('idx_audit_entity').on(table.entity_type, table.entity_id),
    createdIdx: index('idx_audit_created').on(table.created_at),
  })
);

export const security_events = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source').notNull().default('backend'),
    severity: text('severity').notNull(),
    event: text('event').notNull(),
    ip_address: text('ip_address'),
    method: text('method'),
    path: text('path'),
    details: jsonb('details'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    createdIdx: index('idx_security_events_created').on(table.created_at),
    eventIdx: index('idx_security_events_event').on(table.event),
    ipIdx: index('idx_security_events_ip').on(table.ip_address),
  })
);

// --- REDIRECTS (guide Section 11.4) ---
export const redirects = pgTable(
  'redirects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    from_path: text('from_path').notNull().unique(),
    to_path: text('to_path').notNull(),
    status: integer('status').default(301),
    created_by: uuid('created_by'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    fromIdx: index('idx_redirects_from').on(table.from_path),
  })
);

export const order_status_history = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').references(() => orders.id).notNull(),
  from_status: text('from_status').notNull(),
  to_status: text('to_status').notNull(),
  changed_by: text('changed_by').notNull(),
  changed_by_id: text('changed_by_id'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
