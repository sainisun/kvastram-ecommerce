import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, createdUpdated } from './shared';
import { users } from './auth';
import { products, product_variants } from './catalog';

// --- WHOLESALE INQUIRIES ---
export const wholesale_inquiries = pgTable('wholesale_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  company_name: text('company_name').notNull(),
  contact_name: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull(),
  business_type: text('business_type').notNull(), // boutique, online, distributor, chain, other
  estimated_order_volume: text('estimated_order_volume'), // 50-100, 100-200, 200-500, 500+
  message: text('message'),
  status: text('status').default('pending'), // pending, approved, rejected
  discount_tier: text('discount_tier'), // starter, growth, enterprise
  admin_notes: text('admin_notes'),
  reviewed_by: uuid('reviewed_by').references(() => users.id),
  reviewed_at: timestamp('reviewed_at'),
  ...createdUpdated,
});

// --- WHOLESALE TIERS ---
export const wholesale_tiers = pgTable('wholesale_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g., "Starter", "Growth", "Enterprise"
  slug: text('slug').notNull().unique(), // e.g., "starter", "growth", "enterprise"
  discount_percent: integer('discount_percent').notNull(), // e.g., 20 for 20%
  min_order_value: integer('min_order_value').default(0), // Minimum order to qualify (in cents)
  min_order_quantity: integer('min_order_quantity').default(0), // Minimum items to qualify
  default_moq: integer('default_moq').default(1), // Default MOQ for products in this tier
  payment_terms: text('payment_terms').default('net_30'), // net_30, net_45, net_60
  description: text('description'),
  color: text('color').default('#3B82F6'), // UI color for the tier
  active: boolean('active').default(true),
  priority: integer('priority').default(0), // For ordering tiers
  ...createdUpdated,
});

// --- BULK DISCOUNTS ---
export const bulk_discounts = pgTable('bulk_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').references(() => products.id),
  variant_id: uuid('variant_id').references(() => product_variants.id),
  min_quantity: integer('min_quantity').notNull(), // Minimum quantity for this discount
  discount_percent: integer('discount_percent').notNull(), // Additional discount % for bulk
  description: text('description'),
  active: boolean('active').default(true),
  ...createdUpdated,
});

// --- CONTACT FORM ---
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// --- PRODUCT STUDIO INQUIRIES ---
