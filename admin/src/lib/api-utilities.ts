import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export type UploadedMedia = {
  url: string;
  publicId?: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
};

export const adminUtilitiesApi = {
  downloadInvoice: async (orderId: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${orderId}/invoice`);
    if (!response.ok) return handleApiError(response, 'Failed to download invoice');
    return response.blob();
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithTimeout(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
    if (!response.ok) return handleApiError(response, 'Failed to upload image');
    return response.json();
  },
  uploadMedia: async (file: File, onProgress?: (progress: number) => void): Promise<UploadedMedia> => {
    const formData = new FormData();
    formData.append('file', file);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress?.(100);
            resolve(json);
            return;
          }
          reject(new Error(json.error || json.message || 'Failed to upload file'));
        } catch {
          reject(new Error('Failed to upload file'));
        }
      };
      xhr.onerror = () => reject(new Error('Failed to upload file'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.timeout = 120000;
      xhr.send(formData);
    });
  },
  post: async (path: string, data?: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });
    if (!response.ok) return handleApiError(response, `POST ${path} failed`);
    return response.json();
  },
  delete: async (path: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, `DELETE ${path} failed`);
    return response.json();
  },
  get: async (path: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}${path}`);
    if (!response.ok) return handleApiError(response, `GET ${path} failed`);
    return response.json();
  },
  getTiers: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers`);
    if (!response.ok) throw new Error('Failed to fetch tiers');
    return response.json();
  },
  createTier: async (data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to create tier');
    return response.json();
  },
  updateTier: async (id: string, data: unknown) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) return handleApiError(response, 'Failed to update tier');
    return response.json();
  },
  deleteTier: async (id: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/${id}`, { method: 'DELETE' });
    if (!response.ok) return handleApiError(response, 'Failed to delete tier');
    return response.json();
  },
};
