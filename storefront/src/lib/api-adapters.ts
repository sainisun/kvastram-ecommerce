/**
 * API Response Adapters
 * 
 * Converts API response types (ApiProductResponse, etc) to frontend types
 * This layer ensures type safety and handles any data transformations
 * 
 * Usage:
 *   const apiProduct = ... // from API
 *   const frontendProduct = adaptProduct(apiProduct);
 */

import type { Product, ProductVariant, Category } from '@/types';
import type {
  ApiProductResponse,
  ApiVariantResponse,
  ApiPriceResponse,
  ApiOptionResponse,
  ApiCollectionResponse,
} from '@/types/api-contracts';

/**
 * Adapt single API product response to frontend Product type
 * Handles any differences between API and frontend types
 */
export function adaptProduct(apiProduct: ApiProductResponse): Product {
  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description ?? '',
    handle: apiProduct.handle,
    thumbnail: apiProduct.thumbnail,
    subtitle: apiProduct.subtitle,
    status: apiProduct.status,
    variants: apiProduct.variants ? adaptProductVariants(apiProduct.variants) : undefined,
    options: apiProduct.options,
    images: apiProduct.images,
    material: apiProduct.material,
    origin_country: apiProduct.origin_country,
    // size_guide can be a string or object in the API, keep as-is for frontend
    size_guide: apiProduct.size_guide as string | undefined,
    care_instructions: apiProduct.care_instructions,
    seo_title: apiProduct.seo_title,
    seo_description: apiProduct.seo_description,
    avg_rating: apiProduct.avg_rating,
    review_count: apiProduct.review_count,
    created_at: apiProduct.created_at,
    collection: apiProduct.collection,
    categories: apiProduct.categories
      ? apiProduct.categories.map(c => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
          description: undefined,
        }))
      : undefined,
  };
}

/**
 * Adapt array of API products to frontend Product array
 */
export function adaptProducts(apiProducts: ApiProductResponse[]): Product[] {
  if (!Array.isArray(apiProducts)) {
    console.warn('[adaptProducts] Received non-array:', apiProducts);
    return [];
  }
  return apiProducts.map(adaptProduct);
}

/**
 * Adapt single API variant to frontend ProductVariant type
 */
export function adaptProductVariant(apiVariant: ApiVariantResponse): ProductVariant {
  return {
    id: apiVariant.id,
    title: apiVariant.title,
    sku: apiVariant.sku,
    inventory_quantity: apiVariant.inventory_quantity,
    prices: apiVariant.prices ? adaptPrices(apiVariant.prices) : undefined,
    compare_at_price: apiVariant.compare_at_price,
  };
}

/**
 * Adapt array of API variants to frontend ProductVariant array
 */
export function adaptProductVariants(apiVariants: ApiVariantResponse[]): ProductVariant[] {
  if (!Array.isArray(apiVariants)) {
    return [];
  }
  return apiVariants.map(adaptProductVariant);
}

/**
 * Adapt API prices to MoneyAmount type
 */
export function adaptPrices(apiPrices: ApiPriceResponse[]) {
  if (!Array.isArray(apiPrices)) {
    return undefined;
  }
  return apiPrices;
}

/**
 * Adapt API collection to frontend Collection type
 */
export function adaptCollection(apiCollection: ApiCollectionResponse) {
  return {
    id: apiCollection.id,
    title: apiCollection.title,
    handle: apiCollection.handle,
    description: apiCollection.description,
    image: apiCollection.image,
    products: apiCollection.products ? adaptProducts(apiCollection.products) : undefined,
  };
}

/**
 * Adapt array of API collections
 */
export function adaptCollections(apiCollections: ApiCollectionResponse[]) {
  if (!Array.isArray(apiCollections)) {
    return [];
  }
  return apiCollections.map(adaptCollection);
}

// ==========================================
// LEGACY NORMALIZATION FUNCTIONS
// (Keep for backwards compatibility, but prefer new adapt* functions)
// ==========================================

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
  } // Handle wrapped format: { data: {...} }
  else if (json.data && !Array.isArray(json.data)) {
    productObj = json.data;
  } // Handle direct product object
  else if (json.id && json.title) {
    productObj = json;
  }

  // Validate required fields
  if (
    productObj &&
    productObj.id &&
    productObj.title &&
    typeof productObj.id === 'string' &&
    typeof productObj.title === 'string'
  ) {
    return productObj;
  }

  return null;
}

// Normalize products list from various API response formats
export function normalizeProductsList(json: any): {
  products: Product[];
  total: number;
  limit?: number;
  offset?: number;
} {
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
  if (
    Object.prototype.hasOwnProperty.call(json, 'data') &&
    json.data !== undefined
  ) {
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
export function normalizeSearchResults(
  json: any
): { products: Product[]; total: number } {
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
