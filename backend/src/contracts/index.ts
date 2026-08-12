/**
 * Framework-free contracts for use during incremental refactoring.
 *
 * These types intentionally do not import Hono, Drizzle, provider SDKs, or route
 * modules. They are additive: existing shared types and HTTP DTOs remain stable
 * until a later workstream migrates a consumer deliberately.
 */

export type EntityId = string;
export type IsoDateTime = string;
export type CurrencyCode = string;

export type OrderLifecycleStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface MoneyValue {
  amount: number;
  currencyCode: CurrencyCode;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PageResult<T> {
  items: T[];
  page: PageInfo;
}

export interface CatalogVariantSummary {
  id: EntityId;
  title: string;
  sku: string | null;
  inventoryQuantity: number;
  prices: MoneyValue[];
}

export interface CatalogProductSummary {
  id: EntityId;
  title: string;
  handle: string;
  status: 'draft' | 'published' | 'archived';
  thumbnailUrl: string | null;
  variants: CatalogVariantSummary[];
}

export interface OrderSummary {
  id: EntityId;
  displayId: number;
  email: string;
  total: MoneyValue;
  status: OrderLifecycleStatus;
  createdAt: IsoDateTime;
}

export type DomainErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_STATE_TRANSITION'
  | 'INVENTORY_UNAVAILABLE'
  | 'PAYMENT_VERIFICATION_FAILED'
  | 'INTEGRATION_UNAVAILABLE';

export interface DomainErrorShape {
  code: DomainErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
