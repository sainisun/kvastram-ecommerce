import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminRegionsApi = {
  getRegions: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/regions`);
    if (!response.ok) return handleApiError(response, 'Failed to fetch regions');
    return response.json();
  },
  createRegion: async (data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/regions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create region');
    return response.json();
  },
  deleteRegion: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete region');
    return response.json();
  },
  updateRegion: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update region');
    return response.json();
  },
};
