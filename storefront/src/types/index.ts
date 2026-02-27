// ==========================================
// FRONTEND TYPES
// ==========================================

// Re-export backend types
export * from './backend';

// Additional Frontend-Specific Types

export interface ProductOption {
  id?: string;
  title: string;
  values: { id?: string; value: string }[];
}

// Re-define Product and ProductVariant for extension
export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail?: string | null;
  subtitle?: string;
  status: 'draft' | 'published' | 'archived';
  variants?: ProductVariant[];
  options?: ProductOption[];
  images?: ProductImage[];
  videos?: ProductVideo[]; // PHASE 2.3: Video support
  material?: string;
  origin_country?: string;
  size_guide?: SizeGuide; // Product-specific size guide
  created_at: string;
  collection?: {
    id: string;
    title: string;
  };
  categories?: ProductCategory[];
}

export interface SizeGuide {
  type: 'clothing' | 'shoes' | 'accessories';
  measurements: SizeMeasurement[];
}

export interface SizeMeasurement {
  size: string;
  chest?: string;
  waist?: string;
  hips?: string;
  length?: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail?: string;
  position?: number;
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

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  options?: ProductOption[];
  images?: ProductImage[];
  categories?: ProductCategory[];
  reviews?: Review[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  position?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description?: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  customer_name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
}

export interface Address {
  id?: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
}

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string;
  variant_title?: string;
  metadata?: Record<string, unknown>;
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

export interface OrderWithDetails extends Order {
  items: LineItem[];
  shipping_address?: Address;
  billing_address?: Address;
}

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate?: number;
  countries?: string[];
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string;
  parent_id?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link?: string;
  button_text?: string;
  section: string;
  position: number;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  published_at?: string;
  author?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  is_visible: boolean;
}

export interface CartItem {
  variant_id: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface SearchResult {
  products: Product[];
  total: number;
  suggestions?: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Auth Types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}

// Form Types
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

export interface NewsletterSubscribeData {
  email: string;
}

// Checkout Types
export interface CheckoutItem {
  variant_id: string;
  quantity: number;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface CreateOrderData {
  items: CheckoutItem[];
  shipping_address: ShippingAddress;
  email: string;
  region_id?: string;
}
