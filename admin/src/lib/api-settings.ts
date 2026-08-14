import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminSettingsApi = {
  getSettings: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },
  getFooterSettings: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings/footer`);
    if (!response.ok) throw new Error('Failed to fetch footer settings');
    return response.json();
  },
  getWholesaleTiersPublic: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings/wholesale-tiers`);
    if (!response.ok) throw new Error('Failed to fetch wholesale tiers');
    return response.json();
  },
  updateSetting: async (key: string, value: unknown, category?: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value, category }) });
    if (!response.ok) return handleApiError(response, `Failed to update setting ${key}`);
    return response.json();
  },
  updateSettingsBulk: async (settings: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/settings/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) });
    if (!response.ok) return handleApiError(response, 'Failed to update settings');
    return response.json();
  },
};
