import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, createdUpdated } from './shared';
import { products } from './catalog';

export const studio_inquiries = pgTable('studio_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversation_token: text('conversation_token'),
  product_id: uuid('product_id').references(() => products.id),
  product_title: text('product_title').notNull(),
  product_handle: text('product_handle'),
  product_url: text('product_url'),
  inquiry_type: text('inquiry_type').default('question'),
  customer_name: text('customer_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  message: text('message').notNull(),
  measurements: jsonb('measurements').default({}),
  status: text('status').default('new'),
  admin_notes: text('admin_notes'),
  last_message_at: timestamp('last_message_at').defaultNow(),
  unread_by_admin: boolean('unread_by_admin').default(true),
  unread_by_customer: boolean('unread_by_customer').default(false),
  ...createdUpdated,
}, (table) => ({
  statusIdx: index('idx_studio_inquiries_status').on(table.status),
  productIdx: index('idx_studio_inquiries_product_id').on(table.product_id),
  createdAtIdx: index('idx_studio_inquiries_created_at').on(table.created_at),
  tokenIdx: index('idx_studio_inquiries_conversation_token').on(table.conversation_token),
}));

export const studio_inquiry_messages = pgTable('studio_inquiry_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  inquiry_id: uuid('inquiry_id').notNull().references(() => studio_inquiries.id),
  sender_type: text('sender_type').notNull(),
  sender_name: text('sender_name'),
  sender_email: text('sender_email'),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  inquiryIdx: index('idx_studio_inquiry_messages_inquiry_id').on(table.inquiry_id),
  createdAtIdx: index('idx_studio_inquiry_messages_created_at').on(table.created_at),
}));

// --- NEWSLETTER ---
export const newsletter_subscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').default('active'),
  created_at: timestamp('created_at').defaultNow(),
});

// --- RELATIONS ---
