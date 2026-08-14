import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminWholesaleInquiriesApi = {
  getWholesaleInquiries: async (status?: string, search?: string, page = 1, limit = 20) => {
    let url = `${API_BASE_URL}/wholesale?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale inquiries');
    return response.json();
  },
  getWholesaleInquiry: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale inquiry');
    return response.json();
  },
  updateWholesaleInquiry: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update wholesale inquiry');
    return response.json();
  },
  deleteWholesaleInquiry: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete wholesale inquiry');
    return response.json();
  },
  getWholesaleStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale/stats/overview`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale stats');
    return response.json();
  },
};
