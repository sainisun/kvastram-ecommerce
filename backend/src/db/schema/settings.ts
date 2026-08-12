import { jsonb, pgTable, text, uuid, createdUpdated } from './shared';

// --- SETTINGS ---
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value'),
  category: text('category').default('general'), // general, notifications, security, email, payment, shipping
  ...createdUpdated,
});

// Alias for checkout.ts which imports store_settings
// (same table as settings — stores shipping rates, tax, etc.)
export const store_settings = settings;

// --- MARKETING CAMPAIGNS ---
