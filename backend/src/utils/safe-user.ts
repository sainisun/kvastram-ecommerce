/**
 * 🔒 FIX-007: Safe User Serialization Utilities
 * 
 * Ensures sensitive fields are always excluded from API responses
 * Prevents password hash and other sensitive data leakage
 */

import type { InferSelectModel } from "drizzle-orm";
import { users, customers } from "../db/schema";

export type SafeUser = Omit<InferSelectModel<typeof users>, "password_hash" | "two_factor_secret">;
export type SafeCustomer = Omit<InferSelectModel<typeof customers>, "password_hash">;

/**
 * Safely serialize admin user - removes password_hash and two_factor_secret
 * Use this for all /auth/* and /users/* responses
 */
export function serializeUser(user: InferSelectModel<typeof users>): SafeUser {
  const { password_hash, two_factor_secret, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * Safely serialize customer - removes password_hash
 * Use this for all /customers/* and /store/customers/* responses
 */
export function serializeCustomer(customer: InferSelectModel<typeof customers>): SafeCustomer {
  const { password_hash, ...safeCustomer } = customer;
  return safeCustomer as SafeCustomer;
}

/**
 * Safely serialize array of users
 */
export function serializeUsers(users: InferSelectModel<typeof users>[]): SafeUser[] {
  return users.map(serializeUser);
}

/**
 * Safely serialize array of customers
 */
export function serializeCustomers(customers: InferSelectModel<typeof customers>[]): SafeCustomer[] {
  return customers.map(serializeCustomer);
}

/**
 * Generic safe serialization - removes common sensitive fields
 * Use as fallback for any entity
 */
export function sanitizeEntity<T extends Record<string, any>>(entity: T): Omit<T, "password_hash" | "two_factor_secret" | "refresh_token" | "access_token" | "secret" | "api_key"> {
  const sensitiveFields = ["password_hash", "two_factor_secret", "refresh_token", "access_token", "secret", "api_key"];
  const sanitized = { ...entity };
  
  for (const field of sensitiveFields) {
    delete sanitized[field];
  }
  
  return sanitized;
}
