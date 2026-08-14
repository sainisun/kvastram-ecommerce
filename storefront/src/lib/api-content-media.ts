import { adaptProduct } from './api-adapters';
import { API_URL, fetchWithTrace } from './api-client-core';

export const contentMediaApi = {
  async getHomepageSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/homepage`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { settings: {} };
      return res.json();
    } catch {
      return { settings: {} };
    }
  },

  async getStoreSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/settings`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getFooterSettings() {
    try {
      const res = await fetchWithTrace(`${API_URL}/settings/footer`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { settings: {} };
      return res.json();
    } catch {
      return { settings: {} };
    }
  },

  async getPages() {
    try {
      const res = await fetchWithTrace(`${API_URL}/pages/storefront`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { pages: [] };
      return res.json();
    } catch {
      return { pages: [] };
    }
  },

  async getTestimonials() {
    try {
      const res = await fetchWithTrace(`${API_URL}/testimonials/store`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) return { testimonials: [] };
      return res.json();
    } catch {
      return { testimonials: [] };
    }
  },

  async getFeaturedProducts(ids: string[]) {
    if (!ids || ids.length === 0) return { products: [] };
    try {
      const idsString = ids.join(',');
      const res = await fetchWithTrace(
        `${API_URL}/products/featured?ids=${encodeURIComponent(idsString)}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return { products: [] };
      const data = await res.json();
      return { products: data.data || [] };
    } catch {
      return { products: [] };
    }
  },

  async getBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/banners`, { cache: 'no-store' });
      if (!res.ok) return { banners: [] };
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getHeroBanners() {
    try {
      const res = await fetchWithTrace(`${API_URL}/hero-banners`, { cache: 'no-store' });
      if (!res.ok) return { banners: [] };
      return res.json();
    } catch {
      return { banners: [] };
    }
  },

  async getTrustItems() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trust-items`, { cache: 'no-store' });
      if (!res.ok) return { items: [] };
      return res.json();
    } catch {
      return { items: [] };
    }
  },

  async getTrendingReels() {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels`, { cache: 'no-store' });
      if (!res.ok) return { reels: [] };
      return res.json();
    } catch {
      return { reels: [] };
    }
  },

  async getReelCollections() {
    try {
      const res = await fetchWithTrace(`${API_URL}/reel-collections`, { cache: 'no-store' });
      if (!res.ok) return { collections: [] };
      return res.json();
    } catch {
      return { collections: [] };
    }
  },

  async recordTrendingReelView(id: string) {
    try {
      const res = await fetchWithTrace(`${API_URL}/trending-reels/${id}/view`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getHomepageCategories() {
    try {
      const res = await fetchWithTrace(`${API_URL}/homepage-categories`, { cache: 'no-store' });
      if (!res.ok) return { categories: [] };
      return res.json();
    } catch {
      return { categories: [] };
    }
  },

  async getCategoryCircles() {
    try {
      const res = await fetchWithTrace(`${API_URL}/category-circles`, { cache: 'no-store' });
      if (!res.ok) return { circles: [] };
      return res.json();
    } catch {
      return { circles: [] };
    }
  },

  async getSpotlightProducts(section = 'spotlight') {
    try {
      const suffix = section ? `?section=${encodeURIComponent(section)}` : '';
      const res = await fetchWithTrace(`${API_URL}/featured-products${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { featuredProducts: [] };
      const json = await res.json();
      type SpotlightApiItem = Record<string, unknown> & {
        product?: Parameters<typeof adaptProduct>[0] | null;
      };

      return {
        featuredProducts: Array.isArray(json.featuredProducts)
          ? json.featuredProducts.map((item: SpotlightApiItem) => ({
              ...item,
              product: item.product ? adaptProduct(item.product) : null,
            }))
          : [],
      };
    } catch {
      return { featuredProducts: [] };
    }
  },

  async getHomepageMerchandising(slot?: string) {
    try {
      const suffix = slot ? `?slot=${encodeURIComponent(slot)}` : '';
      const res = await fetchWithTrace(`${API_URL}/homepage-merchandising${suffix}`, {
        cache: 'no-store',
      });
      if (!res.ok) return { slots: [] };
      return res.json();
    } catch {
      return { slots: [] };
    }
  },

  async getPosts() {
    try {
      const res = await fetchWithTrace(`${API_URL}/posts/storefront`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return { posts: [] };
      return res.json();
    } catch {
      return { posts: [] };
    }
  },

  async getPost(slug: string) {
    const res = await fetchWithTrace(`${API_URL}/posts/storefront/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Post not found');
    return res.json();
  },

  async getPage(slug: string) {
    const res = await fetchWithTrace(`${API_URL}/pages/storefront/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('Page not found');
    return res.json();
  },
};
