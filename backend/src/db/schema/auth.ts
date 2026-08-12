import { boolean, index, integer, pgTable, text, timestamp, uuid, createdUpdated } from './shared';

// --- AUTH & USERS (Admins) ---
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    role: text('role').default('admin'),
    two_factor_secret: text('two_factor_secret'),
    two_factor_enabled: boolean('two_factor_enabled').default(false),
    // 🔒 Q9: Account lockout fields
    failed_login_attempts: integer('failed_login_attempts').default(0),
    locked_until: timestamp('locked_until'),
    ...createdUpdated,
  },
  (table) => ({
    // Index for lockout lookup
    lockedIdx: index('idx_users_locked_until').on(table.locked_until),
  })
);
