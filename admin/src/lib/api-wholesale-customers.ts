import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminWholesaleCustomersApi = {
  getWholesaleCustomers: async (search?: string, tier?: string, page = 1, limit = 20) => {
    let url = `${API_BASE_URL}/wholesale-customers?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tier && tier !== 'all') url += `&tier=${tier}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale customers');
    return response.json();
  },
  getWholesaleCustomerStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale-customers/stats`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale customer stats');
    return response.json();
  },
  updateWholesaleCustomerTier: async (id: string, discount_tier: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesale-customers/${id}/tier`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ discount_tier }) });
    if (!response.ok) return handleApiError(response, 'Failed to update customer tier');
    return response.json();
  },
};
