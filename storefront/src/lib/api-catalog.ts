import { adaptProduct, adaptProducts } from './api-adapters';
import { API_URL, fetchWithTrace } from './api-client-core';

import type { Product } from '@/types';

export interface CatalogQuery {
  region_id?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  limit?: number;
  offset?: number;
  category_id?: string;
  tag_id?: string;
  collection_id?: string;
  attribute_code?: string;
  attribute_value?: string;
  cache?: boolean;
}

export const catalogApi = {
  async getProducts(
    params: CatalogQuery = {}
  ): Promise<{ products: Product[]; total: number; limit?: number; offset?: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set('status', 'published');

    Object.entries(params).forEach(([key, value]) => {
      if (value != null && key !== 'cache') searchParams.set(key, value.toString());
    });

    try {
      const cacheOptions = params.cache === false
        ? { cache: 'no-store' as RequestCache }
        : { next: { revalidate: 60, tags: ['products'] } };
      const res = await fetchWithTrace(`${API_URL}/products?${searchParams.toString()}`, cacheOptions);
      if (!res.ok) return { products: [], total: 0 };

      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) return { products: [], total: 0 };

      const products = adaptProducts(json.data);
      return {
        products,
        total: json.pagination?.total || products.length,
        limit: json.pagination?.limit,
        offset: json.pagination?.offset,
      };
    } catch (error) {
      console.error('[API] getProducts error:', error);
      return { products: [], total: 0 };
    }
  },

  async getSuggestions(query: string) {
    if (!query || query.length < 2) return { suggestions: [] };
    try {
      const res = await fetchWithTrace(
        `${API_URL}/products/search/suggestions?q=${encodeURIComponent(query)}`
      );
      return res.ok ? res.json() : { suggestions: [] };
    } catch {
      return { suggestions: [] };
    }
  },

  async getSeoLandingPages() {
    try {
      const res = await fetchWithTrace(`${API_URL}/seo/landing-pages?status=active`, {
        next: { revalidate: 300, tags: ['seo-landing-pages'] },
      });
      if (!res.ok) return { landing_pages: [] };
      const json = await res.json();
      return json.data || { landing_pages: [] };
    } catch {
      return { landing_pages: [] };
    }
  },

  async getSeoLandingPage(slug: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/seo/landing-pages/${encodeURIComponent(slug)}`, {
        next: { revalidate: 300, tags: [`seo-landing-page-${slug}`] },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.landing_page || null;
    } catch {
      return null;
    }
  },

  async getArtisans() {
    try {
      const res = await fetchWithTrace(`${API_URL}/artisans`, {
        next: { revalidate: 3600, tags: ['artisans'] },
      });
      if (!res.ok) return { artisans: [] };
      const json = await res.json();
      return json.data || { artisans: [] };
    } catch {
      return { artisans: [] };
    }
  },

  async getArtisan(slug: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/artisans/${encodeURIComponent(slug)}`, {
        next: { revalidate: 3600, tags: [`artisan-${slug}`] },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async getProduct(id: string): Promise<Product> {
    try {
      const res = await fetchWithTrace(`${API_URL}/products/${id}`, {
        next: { revalidate: 60, tags: [`product-${id}`] },
      });
      if (!res.ok) throw new Error('Failed to fetch product');
      const json = await res.json();

      if (json.data?.product) return adaptProduct(json.data.product);
      if (json.data?.id) return adaptProduct(json.data);
      if (json.success && json.data) return adaptProduct(json.data);
      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('[API] getProduct failed', error);
      throw error;
    }
  },

  async searchProductsByTitle(title: string) {
    try {
      const res = await fetchWithTrace(
        `${API_URL}/products?search=${encodeURIComponent(title)}&status=published&limit=1`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    } catch (error) {
      console.error('[API] searchProductsByTitle failed', error);
      return null;
    }
  },
};
