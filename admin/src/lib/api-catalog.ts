import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

async function json(path: string, options: RequestInit = {}, message = 'Request failed') {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, options);
  if (!response.ok) return handleApiError(response, message);
  return response.json();
}

const body = (method: string, value: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

export const adminCatalogApi = {
  getPages: () => json('/pages', {}, 'Failed to fetch pages'),
  updatePage: (id: string, data: unknown) => json(`/pages/${id}`, body('PUT', data), 'Failed to update page'),
  searchFeaturedProductCandidates: (query: string) => json(`/admin/featured-products/product-search?q=${encodeURIComponent(query)}`, {}, 'Failed to search products'),
  getCategories: () => json('/categories', {}, 'Failed to fetch categories'),
  getCategoriesTree: () => json('/categories/tree', {}, 'Failed to fetch category tree'),
  getCategory: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`);
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  },
  getCategoryProducts: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}/products`);
    if (!response.ok) throw new Error('Failed to fetch category products');
    return response.json();
  },
  updateCategoryProducts: (id: string, productIds: string[]) => json(`/categories/${id}/products`, body('PUT', { product_ids: productIds }), 'Failed to update category products'),
  createCategory: (data: unknown) => json('/categories', body('POST', data), 'Failed to create category'),
  updateCategory: (id: string, data: unknown) => json(`/categories/${id}`, body('PUT', data), 'Failed to update category'),
  deleteCategory: (id: string) => json(`/categories/${id}`, { method: 'DELETE' }, 'Failed to delete category'),
  getCollections: () => json('/collections?status=all', {}, 'Failed to fetch collections'),
  getCollection: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`);
    if (!response.ok) throw new Error('Failed to fetch collection');
    return response.json();
  },
  getCollectionProducts: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}/products`);
    if (!response.ok) throw new Error('Failed to fetch collection products');
    return response.json();
  },
  updateCollectionProducts: (id: string, productIds: string[]) => json(`/collections/${id}/products`, body('PUT', { product_ids: productIds }), 'Failed to update collection products'),
  createCollection: (data: unknown) => json('/collections', body('POST', data), 'Failed to create collection'),
  updateCollection: (id: string, data: unknown) => json(`/collections/${id}`, body('PUT', data), 'Failed to update collection'),
  deleteCollection: (id: string) => json(`/collections/${id}`, { method: 'DELETE' }, 'Failed to delete collection'),
  getTags: async () => { const response = await fetchWithTimeout(`${API_BASE_URL}/tags`); if (!response.ok) throw new Error('Failed to fetch tags'); return response.json(); },
  createTag: (data: unknown) => json('/tags', body('POST', data), 'Failed to create tag'),
  deleteTag: (id: string) => json(`/tags/${id}`, { method: 'DELETE' }, 'Failed to delete tag'),
  updateCategoriesOrder: (updates: Array<{ id: string; display_order: number; show_in_header?: boolean }>) => json('/categories/reorder', body('PUT', { updates }), 'Failed to update category order'),
};
