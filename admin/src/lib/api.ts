import { adminAuthApi } from './api-auth';
import { adminProductsApi } from './api-products';
import { adminCustomersApi } from './api-customers';
import { adminOrdersApi } from './api-orders';
import { adminContentMediaApi } from './api-content-media';
import { adminCatalogApi } from './api-catalog';
import { adminWholesaleInquiriesApi } from './api-wholesale-inquiries';
import { adminWholesaleCustomersApi } from './api-wholesale-customers';
import { adminWholesaleOrdersApi } from './api-wholesale-orders';
import { adminWholesaleTiersApi } from './api-wholesale-tiers';
import { adminSettingsApi } from './api-settings';
import { adminMarketingEngagementApi } from './api-marketing-engagement';
import { adminRegionsApi } from './api-regions';
import {
  API_BASE_URL,
  fetchWithTimeout,
  handleApiError,
} from './api-client-core';

export type { ApiError, AuthResponse, User } from './api-client-core';

export const api = {
    ...adminAuthApi,
  ...adminProductsApi,
  ...adminCustomersApi,
  ...adminOrdersApi,
  ...adminContentMediaApi,
  ...adminCatalogApi,
  ...adminWholesaleInquiriesApi,
  ...adminWholesaleCustomersApi,
  ...adminWholesaleOrdersApi,
  ...adminWholesaleTiersApi,
  ...adminSettingsApi,
  ...adminMarketingEngagementApi,
  ...adminRegionsApi,
  downloadInvoice: async (orderId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/${orderId}/invoice`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to download invoice');
    return res.blob();
  },

  ...adminRegionsApi,

  // Variant endpoints
  getVariants: async (productId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants`,
      {}
    );
    if (!res.ok) throw new Error('Failed to fetch variants');
    const response = await res.json();
    return response.data;
  },

  createVariant: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create variant');
    return res.json();
  },

  updateVariant: async (
    productId: string,
    variantId: string,
    data: unknown
  ) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants/${variantId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update variant');
    return res.json();
  },

  createOption: async (productId: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/options`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create option');
    return res.json();
  },

  deleteVariant: async (productId: string, variantId: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/${productId}/variants/${variantId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete variant');
    return res.json();
  },
  ...adminOrdersApi,

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return handleApiError(res, 'Failed to upload image');
    return res.json();
  },

  uploadMedia: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    url: string;
    publicId?: string;
    filename: string;
    originalName: string;
    size: number;
    type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
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

  ...adminSettingsApi,

  ...adminMarketingEngagementApi,

  // Generic POST helper for admin
  post: async (path: string, data?: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) return handleApiError(res, `POST ${path} failed`);
    return res.json();
  },
  delete: async (path: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, `DELETE ${path} failed`);
    return res.json();
  },

  get: async (path: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {});
    if (!res.ok) return handleApiError(res, `GET ${path} failed`);
    return res.json();
  },

  ...adminAuthApi,

  ...adminWholesaleInquiriesApi,

  ...adminWholesaleCustomersApi,

  ...adminWholesaleOrdersApi,

  ...adminWholesaleTiersApi,

  ...adminContentMediaApi,

  ...adminCatalogApi,

  getAnalyticsOverview: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/overview`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    return res.json();
  },

  getSalesTrend: async (days = 30) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/sales-trend?days=${days}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch sales trend');
    return res.json();
  },

  getOrdersByStatus: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/orders-by-status`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch orders by status');
    return res.json();
  },

  getTiers: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers`,
      {}
    );
    if (!res.ok) throw new Error('Failed to fetch tiers');
    return res.json();
  },

  createTier: async (data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to create tier');
    return res.json();
  },

  updateTier: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update tier');
    return res.json();
  },

  deleteTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/${id}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete tier');
    return res.json();
  },

};
