import { integer, jsonb, pgTable, text, timestamp, uuid, createdUpdated } from './shared';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('promotion'), // promotion, email, social
  status: text('status').default('draft'), // draft, active, paused, completed
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  budget: integer('budget'), // in cents
  spent: integer('spent').default(0), // in cents
  customers_reached: integer('customers_reached').default(0),
  conversions: integer('conversions').default(0),
  revenue: integer('revenue').default(0), // in cents
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

// --- DISCOUNT CODES ---
