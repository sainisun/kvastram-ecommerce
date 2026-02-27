const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Debug logging helper
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API DEBUG] ${message}`, data || '');
  }
};

// Type Definitions
export interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
}

export interface ApiError extends Error {
  response?: {
    error?: string;
    message?: string;
    require2fa?: boolean;
  };
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

// Helper function to handle API errors with detailed messages
async function handleApiError(
  res: Response,
  defaultMessage: string
): Promise<never> {
  try {
    const errorData = await res.json();
    // Try to get the most detailed error message available
    const errorMessage =
      errorData.message ||
      errorData.error ||
      errorData.details ||
      defaultMessage;
    console.error('API Error:', errorData);
    throw new Error(errorMessage);
  } catch (e) {
    if (e instanceof Error && e.message !== defaultMessage) {
      throw e;
    }
    throw new Error(defaultMessage);
  }
}

// Wrapper for fetch with 60s timeout (increased for Supabase)
async function fetchWithTimeout(
  resource: RequestInfo,
  options: FetchOptions = {}
) {
  const { timeout = 60000, ...fetchOptions } = options; // Increased to 60s

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      credentials: 'include', // Important: send cookies with request
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your internet connection or try again.'
        );
      }
      // Provide more helpful error message
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Cannot connect to server. Please ensure the backend is running on port 4000.'
        );
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

export const api = {
  // Auth endpoints
  login: async (
    email: string,
    password: string,
    twoFactorCode?: string
  ): Promise<AuthResponse> => {
    try {
      debugLog(`Attempting login for ${email} to ${API_BASE_URL}/auth/login`);

      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });

      debugLog('Response status:', res.status);

      if (!res.ok) {
        let data: any = {};
        let errorText = '';
        try {
          errorText = await res.text();
          debugLog('Raw error response:', errorText);
          data = JSON.parse(errorText);
        } catch (e) {
          debugLog('Failed to parse error response:', errorText);
          data = {
            message: errorText || `HTTP ${res.status}: ${res.statusText}`,
          };
        }
        const errorMessage =
          data.error || data.message || `Login failed (${res.status})`;
        const error = new Error(errorMessage) as ApiError;
        error.response = data;
        throw error;
      }
      const responseText = await res.text();
      debugLog('Raw success response received');
      let response;
      try {
        response = JSON.parse(responseText);
      } catch (e) {
        debugLog('Failed to parse success response', e);
        throw new Error('Invalid response from server');
      }
      debugLog('Login API response structure:', response);

      // Check if response has the expected structure
      if (!response.data || !response.data.user) {
        debugLog('Invalid response structure:', response);
        throw new Error('Invalid response structure from server');
      }

      // Token is now in httpOnly cookie, only user data returned
      return response.data as AuthResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string
  ) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  logout: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },

  // Product endpoints
  getProducts: async (limit = 20, offset = 0, search = '', status = '', categoryId = '', collectionId = '') => {
    let url = `${API_BASE_URL}/products?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (categoryId && categoryId !== 'all') url += `&category_id=${categoryId}`;
    if (collectionId && collectionId !== 'all') url += `&collection_id=${collectionId}`;
    
    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const response = await res.json();
    return response; // Return full response including pagination
  },

  getProductStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/products/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch product stats');
    const response = await res.json();
    return response.data;
  },

  getProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch product');
    const response = await res.json();
    return response.data;
  },

  createProduct: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create product');
    const response = await res.json();
    return response.data;
  },

  updateProduct: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update product');
    const response = await res.json();
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete product');
    const response = await res.json();
    return response.data;
  },

  bulkDeleteProducts: async (productIds: string[]) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete products');
    const response = await res.json();
    return response.data;
  },

  bulkUpdateProducts: async (productIds: string[], updates: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/products/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_ids: productIds, updates }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update products');
    const response = await res.json();
    return response.data;
  },

  // Customer endpoints
  getCustomers: async (page = 1, search = '', filter = 'all') => {
    let url = `${API_BASE_URL}/customers?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filter === 'registered') url += `&has_account=true`;
    if (filter === 'guest') url += `&has_account=false`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch customers');
    const response = await res.json();
    return response.data;
  },

  getCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch customer');
    const response = await res.json();
    return response.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update customer');
    const response = await res.json();
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete customer');
    const response = await res.json();
    return response.data;
  },

  getCustomerStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/customers/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch customer stats');
    const response = await res.json();
    return response.data;
  },

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

  // Region endpoints
  getRegions: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch regions');
    return res.json();
  },

  createRegion: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create region');
    return res.json();
  },

  deleteRegion: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete region');
    return res.json();
  },

  // Order endpoints
  getOrders: async (
    limit = 20,
    offset = 0,
    search?: string,
    status?: string
  ) => {
    let url = `${API_BASE_URL}/orders?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    const response = await res.json();
    return response.data;
  },

  getDashboardChart: async (range = '30d') => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/stats/chart?range=${range}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch chart data');
    const response = await res.json();
    return response.data;
  },

  getOrder: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch order');
    const response = await res.json();
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update status');
    return res.json();
  },

  getOrderStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch order stats');
    const response = await res.json();
    return response.data;
  },

  updateOrdersBulk: async (order_ids: string[], status: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/orders/bulk-update-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_ids, status }),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to bulk update orders');
    return res.json();
  },

  exportOrders: async (search: string, status: string) => {
    let url = `${API_BASE_URL}/orders/export?status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });

    if (!res.ok) return handleApiError(res, 'Failed to export orders');
    return res.blob();
  },

  deleteOrder: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete order');
    return res.json();
  },

  // Upload endpoints
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

  // Settings endpoints
  getSettings: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  // Get footer settings for wholesale page
  getFooterSettings: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/footer`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch footer settings');
    return res.json();
  },

  // Get wholesale tiers for public page
  getWholesaleTiersPublic: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/wholesale-tiers`, {
      // Public endpoint - no auth required
    });
    if (!res.ok) throw new Error('Failed to fetch wholesale tiers');
    return res.json();
  },

  updateSetting: async (key: string, value: any, category?: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, category }),
    });
    if (!res.ok) return handleApiError(res, `Failed to update setting ${key}`);
    return res.json();
  },

  updateSettingsBulk: async (settings: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update settings');
    return res.json();
  },

  // Marketing endpoints
  getCampaigns: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  createCampaign: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create campaign');
    return res.json();
  },

  updateCampaign: async (id: string, data: any) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/campaigns/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update campaign');
    return res.json();
  },

  deleteCampaign: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/campaigns/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete campaign');
    return res.json();
  },

  getDiscounts: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch discounts');
    return res.json();
  },

  createDiscount: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create discount');
    return res.json();
  },

  updateDiscount: async (id: string, data: any) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/discounts/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update discount');
    return res.json();
  },

  deleteDiscount: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/marketing/discounts/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete discount');
    return res.json();
  },

  // Analytics endpoints
  getGrowth: async (period: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/growth?period=${period}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch growth stats');
    return res.json();
  },

  getRevenueTrend: async (period: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/revenue-trend?period=${period}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch revenue trend');
    return res.json();
  },

  getOrdersTrend: async (period: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/orders-trend?period=${period}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch orders trend');
    return res.json();
  },

  getCustomersTrend: async (period: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/analytics/customers-trend?period=${period}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) throw new Error('Failed to fetch customers trend');
    return res.json();
  },

  getMe: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const response = await res.json();
    return response.data;
  },

  // 2FA Endpoints
  generate2FA: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/generate`, {
      method: 'POST',
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to generate 2FA');
    return res.json();
  },

  verify2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: otp }),
    });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
  },

  disable2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: otp }),
    });
    if (!res.ok) throw new Error('Failed to disable 2FA');
    return res.json();
  },

  // Wholesale endpoints
  getWholesaleInquiries: async (
    status?: string,
    search?: string,
    page = 1,
    limit = 20
  ) => {
    let url = `${API_BASE_URL}/wholesale?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale inquiries');
    return res.json();
  },

  getWholesaleInquiry: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale inquiry');
    return res.json();
  },

  updateWholesaleInquiry: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to update wholesale inquiry');
    return res.json();
  },

  deleteWholesaleInquiry: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to delete wholesale inquiry');
    return res.json();
  },

  getWholesaleStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale stats');
    return res.json();
  },

  // Wholesale Customers endpoints
  getWholesaleCustomers: async (
    search?: string,
    tier?: string,
    page = 1,
    limit = 20
  ) => {
    let url = `${API_BASE_URL}/wholesale-customers?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tier && tier !== 'all') url += `&tier=${tier}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale customers');
    return res.json();
  },

  getWholesaleCustomerStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale-customers/stats`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale customer stats');
    return res.json();
  },

  updateWholesaleCustomerTier: async (id: string, discount_tier: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/wholesale-customers/${id}/tier`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discount_tier }),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update customer tier');
    return res.json();
  },

  // Wholesale Orders endpoints
  getWholesaleOrders: async (status?: string, page = 1, limit = 20) => {
    let url = `${API_BASE_URL}/admin/wholesale/orders?page=${page}&limit=${limit}`;
    if (status && status !== 'all') url += `&status=${status}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale orders');
    return res.json();
  },

  getWholesaleOrderStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/stats`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale order stats');
    return res.json();
  },

  getWholesaleOrder: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/${id}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale order');
    return res.json();
  },

  updateWholesaleOrder: async (id: string, data: any) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/wholesale/orders/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update wholesale order');
    return res.json();
  },

  // Tier Management endpoints
  getWholesaleTiers: async (active?: boolean) => {
    let url = `${API_BASE_URL}/admin/tiers/tiers`;
    if (active !== undefined) url += `?active=${active}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale tiers');
    return res.json();
  },

  getWholesaleTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/tiers/${id}`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale tier');
    return res.json();
  },

  createWholesaleTier: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/tiers/tiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create wholesale tier');
    return res.json();
  },

  updateWholesaleTier: async (id: string, data: any) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/tiers/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to update wholesale tier');
    return res.json();
  },

  deleteWholesaleTier: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/tiers/${id}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete wholesale tier');
    return res.json();
  },

  getWholesaleTierStats: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/tiers/tiers/stats/overview`,
      {
        // No Authorization header needed - cookie is sent automatically
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to fetch wholesale tier stats');
    return res.json();
  },

  // Content (Banners) endpoints
  getBanners: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/banners`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch banners');
    return res.json();
  },

  createBanner: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create banner');
    return res.json();
  },

  updateBanner: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/banners/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update banner');
    return res.json();
  },

  deleteBanner: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/banners/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete banner');
    return res.json();
  },

  reorderBanners: async (items: any[]) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/banners/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to reorder banners');
    return res.json();
  },

  // Blog Posts
  getPosts: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/posts`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  getPost: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  },

  createPost: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create post');
    return res.json();
  },

  updatePost: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update post');
    return res.json();
  },

  deletePost: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete post');
    return res.json();
  },

  // Pages
  getPages: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch pages');
    return res.json();
  },

  getPage: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
  },

  createPage: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create page');
    return res.json();
  },

  updatePage: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update page');
    return res.json();
  },

  deletePage: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete page');
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  getCategoriesTree: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/tree`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch category tree');
    return res.json();
  },

  getCategory: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch category');
    return res.json();
  },

  createCategory: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create category');
    return res.json();
  },

  updateCategory: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update category');
    return res.json();
  },

  deleteCategory: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete category');
    return res.json();
  },

  // Collections
  getCollections: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch collections');
    return res.json();
  },

  getCollection: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch collection');
    return res.json();
  },

  createCollection: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create collection');
    return res.json();
  },

  updateCollection: async (id: string, data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update collection');
    return res.json();
  },

  deleteCollection: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete collection');
    return res.json();
  },

  // Tags
  getTags: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  createTag: async (data: any) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create tag');
    return res.json();
  },

  deleteTag: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete tag');
    return res.json();
  },

  // Reviews
  getReviews: async (limit = 50, offset = 0, status?: string) => {
    let url = `${API_BASE_URL}/reviews?limit=${limit}&offset=${offset}`;
    if (status) url += `&status=${status}`;

    const res = await fetchWithTimeout(url, {
      // No Authorization header needed - cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  updateReviewStatus: async (id: string, status: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update review status');
    return res.json();
  },

  deleteReview: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete review');
    return res.json();
  },

  // Analytics - These endpoints return DIRECT responses (not wrapped)
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

  // Testimonials
  getAdminTestimonials: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/testimonials`, {
      // Cookie is sent automatically
    });
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return res.json();
  },

  createTestimonial: async (data: {
    name: string;
    location?: string;
    avatar_url?: string;
    rating: number;
    content: string;
    is_active: boolean;
    display_order: number;
  }) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to create testimonial');
    return res.json();
  },

  updateTestimonial: async (
    id: string,
    data: Partial<{
      name: string;
      location?: string;
      avatar_url?: string;
      rating: number;
      content: string;
      is_active: boolean;
      display_order: number;
    }>
  ) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/testimonials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) return handleApiError(res, 'Failed to update testimonial');
    return res.json();
  },

  deleteTestimonial: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/testimonials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return handleApiError(res, 'Failed to delete testimonial');
    return res.json();
  },

  // Notifications
  getNotifications: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/admin/notifications`, {
      credentials: 'include',
    });
    if (!res.ok) return handleApiError(res, 'Failed to fetch notifications');
    return res.json();
  },

  getUnreadNotificationCount: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/notifications/unread-count`,
      {
        credentials: 'include',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to fetch unread count');
    return res.json();
  },

  markNotificationRead: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/notifications/${id}/read`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to mark notification as read');
    return res.json();
  },

  markAllNotificationsRead: async () => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/notifications/read-all`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    if (!res.ok)
      return handleApiError(res, 'Failed to mark all notifications as read');
    return res.json();
  },

  deleteNotification: async (id: string) => {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/admin/notifications/${id}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );
    if (!res.ok) return handleApiError(res, 'Failed to delete notification');
    return res.json();
  },
};
