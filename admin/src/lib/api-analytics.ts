import { API_BASE_URL, fetchWithTimeout } from './api-client-core';

export const adminAnalyticsApi = {
  getAnalyticsOverview: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/overview`);
    if (!response.ok) throw new Error('Failed to fetch analytics overview');
    return response.json();
  },
  getSalesTrend: async (days = 30) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/sales-trend?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch sales trend');
    return response.json();
  },
  getOrdersByStatus: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/orders-by-status`);
    if (!response.ok) throw new Error('Failed to fetch orders by status');
    return response.json();
  },
};
