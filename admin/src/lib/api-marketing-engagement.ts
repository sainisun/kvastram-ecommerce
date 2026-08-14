import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminMarketingEngagementApi = {
  getDiscounts: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch discounts');
    return response.json();
  },
  createDiscount: async (data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create discount');
    return response.json();
  },
  updateDiscount: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update discount');
    return response.json();
  },
  deleteDiscount: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete discount');
    return response.json();
  },
  getReturns: async (status?: string) => {
    let url = `${API_BASE_URL}/admin/returns`;
    if (status) url += `?status=${status}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error('Failed to fetch returns');
    return response.json();
  },
  getReviews: async (limit = 50, offset = 0, status?: string) => {
    let url = `${API_BASE_URL}/reviews?limit=${limit}&offset=${offset}`;
    if (status) url += `&status=${status}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },
  updateReviewStatus: async (id: string, status: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!response.ok) return handleApiError(response, 'Failed to update review status');
    return response.json();
  },
  deleteReview: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete review');
    return response.json();
  },
};
