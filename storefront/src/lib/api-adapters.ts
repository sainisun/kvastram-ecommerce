// Centralized API response adapters for consistent data handling

import type { Product, ProductVariant, ProductOption } from '@/types';

export interface ApiProductResponse {
  id: string;
  title: string;
  description: string;
  handle: string;
  thumbnail?: string | null;
  subtitle?: string;
  status: 'draft' | 'published' | 'archived';
  variants?: ProductVariant[];
  options?: ProductOption[];
  created_at: string;
  material?: string;
  origin_country?: string;
  collection?: { id: string; title: string };
  images?: { id: string; url: string; position?: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface SingleResponse<T> {
  data: T;
}

// Normalize product from various API response formats
export function normalizeProduct(json: any): Product | null {
  if (!json) return null;
  
  let productObj: any = null;
  
  // Handle wrapped format: { data: { product: {...} } }
  if (json.data?.product) {
    productObj = json.data.product;
  }
  // Handle wrapped format: { data: {...} }
  else if (json.data && !Array.isArray(json.data)) {
    productObj = json.data;
  }
  // Handle direct product object
  else if (json.id && json.title) {
    productObj = json;
  }
  
  // Validate required fields
  if (productObj && productObj.id && productObj.title && 
      typeof productObj.id === 'string' && typeof productObj.title === 'string') {
    return productObj;
  }
  
  return null;
}

// Normalize products list from various API response formats
export function normalizeProductsList(json: any): { products: Product[]; total: number; limit?: number; offset?: number } {
  // Guard against null/undefined
  if (json == null) {
    return { products: [], total: 0 };
  }
  
  // Handle wrapped format: { data: [...], pagination: {...} }
  if (json.data && Array.isArray(json.data)) {
    return {
      products: json.data,
      total: json.pagination?.total ?? json.data.length,
      limit: json.pagination?.limit,
      offset: json.pagination?.offset,
    };
  }
  
  // Handle direct array format: [...]
  if (Array.isArray(json)) {
    return {
      products: json,
      total: json.length,
    };
  }
  
  // Handle wrapped format: { products: [...] }
  if (json.products && Array.isArray(json.products)) {
    return {
      products: json.products,
      total: json.total ?? json.products.length,
    };
  }
  
  return { products: [], total: 0 };
}

// Normalize single item from various API response formats
export function normalizeSingleItem<T>(json: any, key?: string): T | null {
  if (!json) return null;
  
  // Handle wrapped format: { data: {...} }
  if (Object.prototype.hasOwnProperty.call(json, 'data') && json.data !== undefined) {
    return json.data as T;
  }
  
  // Handle keyed format: { products: {...} }
  if (key && Object.prototype.hasOwnProperty.call(json, key)) {
    return json[key] as T;
  }
  
  // Return null if neither property exists (avoid returning raw json)
  return null;
}

// Normalize array from various API response formats
export function normalizeArray<T>(json: any): T[] {
  if (!json) return [];
  
  // Handle wrapped format: { data: [...] }
  if (json.data && Array.isArray(json.data)) {
    return json.data;
  }
  
  // Handle direct array format
  if (Array.isArray(json)) {
    return json;
  }
  
  return [];
}

// Extract featured products from API response
export function normalizeFeaturedProducts(json: any): Product[] {
  // Handle format: { data: { data: [...] } }
  if (json?.data?.data && Array.isArray(json.data.data)) {
    return json.data.data;
  }
  
  // Handle format: { data: [...] }
  if (json?.data && Array.isArray(json.data)) {
    return json.data;
  }
  
  // Handle format: { products: [...] }
  if (json?.products && Array.isArray(json.products)) {
    return json.products;
  }
  
  // Handle direct array
  if (Array.isArray(json)) {
    return json;
  }
  
  return [];
}

// Search result normalization
export function normalizeSearchResults(json: any): { products: Product[]; total: number } {
  // Handle format: { data: [...] }
  if (json?.data && Array.isArray(json.data)) {
    return {
      products: json.data,
      total: json.total ?? json.data.length,
    };
  }
  
  // Handle direct array
  if (Array.isArray(json)) {
    return {
      products: json,
      total: json.length,
    };
  }
  
  return { products: [], total: 0 };
}
