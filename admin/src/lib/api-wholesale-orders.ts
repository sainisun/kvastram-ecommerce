import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminWholesaleOrdersApi = {
  getWholesaleOrders: async (status?: string, page = 1, limit = 20) => {
    let url = `${API_BASE_URL}/admin/wholesale/orders?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale orders');
    return response.json();
  },
  getWholesaleOrderStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/wholesale/orders/stats`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale order stats');
    return response.json();
  },
  getWholesaleOrder: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/wholesale/orders/${id}`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale order');
    return response.json();
  },
  updateWholesaleOrder: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/wholesale/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update wholesale order');
    return response.json();
  },
};
