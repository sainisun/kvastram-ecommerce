import {
  API_BASE_URL,
  debugCookieState,
  debugLog,
  fetchWithTimeout,
  handleApiError,
} from './api-client-core';

export const adminProductsApi = {
  getProducts: async (limit = 20, offset = 0, search = '', status = '', categoryId = '', collectionId = '') => {
    let url = `${API_BASE_URL}/products?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (categoryId && categoryId !== 'all') url += `&category_id=${categoryId}`;
    if (collectionId && collectionId !== 'all') url += `&collection_id=${collectionId}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return handleApiError(res, 'Failed to fetch products');
    return res.json();
  },
  getProductStats: async () => {
    await debugCookieState('/products/stats/overview');
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/stats/overview`);
    debugLog('getProductStats response:', { status: res.status, ok: res.ok });
    if (!res.ok) return handleApiError(res, 'Failed to fetch product stats');
    return (await res.json()).data;
  },
  getProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) return handleApiError(res, 'Failed to fetch product');
    return (await res.json()).data;
  },
  createProduct: async (data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to create product');
    return (await res.json()).data;
  },
  updateProduct: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to update product');
    return (await res.json()).data;
  },
  updateProductSeo: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}/seo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to update product SEO');
    return (await res.json()).data;
  },
  deleteProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) return handleApiError(res, 'Failed to delete product');
    return (await res.json()).data;
  },
  duplicateProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) return handleApiError(res, 'Failed to duplicate product');
    return (await res.json()).data;
  },
  bulkProductsAction: async (action: 'status' | 'delete', productIds: string[], status?: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, productIds, status }) });
    if (!res.ok) return handleApiError(res, `Failed to bulk ${action} products`);
    return (await res.json()).data;
  },
  getVariants: async (productId: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants`);
    if (!res.ok) throw new Error('Failed to fetch variants');
    return (await res.json()).data;
  },
  createVariant: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to create variant');
    return res.json();
  },
  updateVariant: async (productId: string, variantId: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants/${variantId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to update variant');
    return res.json();
  },
  createOption: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to create option');
    return res.json();
  },
  deleteVariant: async (productId: string, variantId: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
    if (!res.ok) return handleApiError(res, 'Failed to delete variant');
    return res.json();
  },
};
