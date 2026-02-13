// ⚠️  AUTO-GENERATED. DO NOT EDIT.
// Sync from Backend: 2026-02-09T14:50:04.622Z

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

export interface Order {
    id: string;
    display_id: number;
    email: string;
    total: number;
    currency_code: string;
    status: 'pending' | 'completed' | 'canceled';
    payment_status: 'not_paid' | 'paid';
    fulfillment_status: 'not_fulfilled' | 'fulfilled';
    created_at: string;
    metadata?: Record<string, unknown> | null;
}
