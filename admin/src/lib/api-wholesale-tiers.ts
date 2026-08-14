import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminWholesaleTiersApi = {
  getWholesaleTiers: async (active?: boolean) => {
    let url = `${API_BASE_URL}/admin/tiers`;
    if (active !== undefined) url += `?active=${active}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale tiers');
    return response.json();
  },
  getWholesaleTier: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/${id}`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale tier');
    return response.json();
  },
  createWholesaleTier: async (data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create wholesale tier');
    return response.json();
  },
  updateWholesaleTier: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update wholesale tier');
    return response.json();
  },
  deleteWholesaleTier: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete wholesale tier');
    return response.json();
  },
  getWholesaleTierStats: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/stats/overview`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch wholesale tier stats');
    return response.json();
  },
};
