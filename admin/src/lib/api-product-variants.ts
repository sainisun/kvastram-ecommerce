import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminProductVariantsApi = {
  getVariants: async (productId: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants`);
    if (!response.ok) throw new Error('Failed to fetch variants');
    return (await response.json()).data;
  },
  createVariant: async (productId: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create variant');
    return response.json();
  },
  updateVariant: async (productId: string, variantId: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants/${variantId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update variant');
    return response.json();
  },
  createOption: async (productId: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create option');
    return response.json();
  },
  deleteVariant: async (productId: string, variantId: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete variant');
    return response.json();
  },
};
