// ⚠️  AUTO-GENERATED. DO NOT EDIT.
// Sync from Backend: 2026-02-09T14:50:04.611Z

// ==========================================
// SHARED TYPES - SOURCE OF TRUTH
// ==========================================
// These types are copied to Admin and Storefront.
// DO NOT EDIT in Admin/Storefront manually.

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail?: string | null;
  status: 'draft' | 'published' | 'archived';
  variants?: ProductVariant[];
  created_at: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  inventory_quantity: number;
  prices?: MoneyAmount[];
}

export interface MoneyAmount {
  id: string;
  currency_code: string;
  amount: number;
  region_id?: string | null;
}

export interface OrderWorkflowTimelineEvent {
  key:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  label: string;
  happened_at: string | null;
  description?: string;
  completed: boolean;
  current: boolean;
}

export interface OrderWorkflow {
  status:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  status_label: string;
  ship_by_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
  has_tracking: boolean;
  needs_attention?: boolean;
  overdue_ship_by?: boolean;
  overdue_tracking?: boolean;
  timeline: OrderWorkflowTimelineEvent[];
}

export interface Order {
  id: string;
  display_id: number;
  email: string;
  total: number;
  currency_code: string;
  status:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'canceled'
    | 'completed'
    | 'refunded';
  raw_status?: string;
  payment_status: 'not_paid' | 'paid' | 'awaiting' | 'captured' | 'failed' | 'refunded';
  fulfillment_status:
    | 'not_fulfilled'
    | 'processing'
    | 'partial'
    | 'fulfilled'
    | 'shipped'
    | 'returned';
  created_at: string;
  metadata?: Record<string, unknown> | null;
  workflow?: OrderWorkflow;
}
