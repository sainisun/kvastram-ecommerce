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
async function handleApiError(res: Response, defaultMessage: string): Promise<never> {
    try {
        const errorData = await res.json();
        // Try to get the most detailed error message available
        const errorMessage = errorData.message || errorData.error || errorData.details || defaultMessage;
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
async function fetchWithTimeout(resource: RequestInfo, options: FetchOptions = {}) {
    const { timeout = 60000, ...fetchOptions } = options; // Increased to 60s

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...fetchOptions,
            credentials: 'include', // Important: send cookies with request
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: unknown) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection or try again.');
        }
        throw error;
    }
}


export const api = {
    // Auth endpoints
    login: async (email: string, password: string, twoFactorCode?: string): Promise<AuthResponse> => {
        try {
            debugLog(`Attempting login for ${email} to ${API_BASE_URL}/auth/login`);
            console.log('[LOGIN DEBUG] API URL:', API_BASE_URL);
            console.log('[LOGIN DEBUG] Request body:', { email, password: '***', twoFactorCode });
            
            const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, twoFactorCode }),
            });

            console.log('[LOGIN DEBUG] Response status:', res.status, res.statusText);
            console.log('[LOGIN DEBUG] Response headers:', Object.fromEntries(res.headers.entries()));

            if (!res.ok) {
                let data: any = {};
                let errorText = '';
                try {
                    errorText = await res.text();
                    console.error('[LOGIN DEBUG] Raw error response:', errorText);
                    data = JSON.parse(errorText);
                } catch (e) {
                    console.error('[LOGIN DEBUG] Failed to parse error response:', errorText);
                    data = { message: errorText || `HTTP ${res.status}: ${res.statusText}` };
                }
                console.error('Login failed response:', data);
                const errorMessage = data.error || data.message || `Login failed (${res.status})`;
                const error = new Error(errorMessage) as ApiError;
                error.response = data;
                throw error;
            }
            const responseText = await res.text();
            console.log('[LOGIN DEBUG] Raw success response:', responseText);
            let response;
            try {
                response = JSON.parse(responseText);
            } catch (e) {
                console.error('[LOGIN DEBUG] Failed to parse success response:', e);
                throw new Error('Invalid response from server');
            }
            debugLog('Login API response structure:', response);
            console.log('[LOGIN DEBUG] Parsed response:', response);
            
            // Check if response has the expected structure
            if (!response.data || !response.data.user) {
                console.error('[LOGIN DEBUG] Invalid response structure:', response);
                throw new Error('Invalid response structure from server');
            }
            
            // Token is now in httpOnly cookie, only user data returned
            return response.data as AuthResponse;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (email: string, password: string, first_name?: string, last_name?: string) => {
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
    getProducts: async (limit = 20, offset = 0) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products?limit=${limit}&offset=${offset}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const response = await res.json();
        return response.data;
    },

    getProductStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products/stats/overview`, {
            // No Authorization header needed - cookie is sent automatically
        });
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/customers/stats/overview`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch customer stats');
        const response = await res.json();
        return response.data;
    },

    downloadInvoice: async (orderId: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${orderId}/invoice`, {
            // No Authorization header needed - cookie is sent automatically
        });
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
    getOrders: async (limit = 20, offset = 0, search?: string, status?: string) => {
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/stats/chart?range=${range}`, {
            // No Authorization header needed - cookie is sent automatically
        });
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/stats/overview`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch order stats');
        const response = await res.json();
        return response.data;
    },

    updateOrdersBulk: async (order_ids: string[], status: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/bulk-update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_ids, status }),
        });
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update campaign');
        return res.json();
    },

    deleteCampaign: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns/${id}`, {
            method: 'DELETE',
        });
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update discount');
        return res.json();
    },

    deleteDiscount: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete discount');
        return res.json();
    },

    // Analytics endpoints
    getGrowth: async (period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/growth?period=${period}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch growth stats');
        return res.json();
    },

    getRevenueTrend: async (period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/revenue-trend?period=${period}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch revenue trend');
        return res.json();
    },

    getOrdersTrend: async (period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/orders-trend?period=${period}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch orders trend');
        return res.json();
    },

    getCustomersTrend: async (period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/customers-trend?period=${period}`, {
            // No Authorization header needed - cookie is sent automatically
        });
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
            body: JSON.stringify({ token: otp })
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
    getWholesaleInquiries: async (status?: string, search?: string, page = 1, limit = 20) => {
        let url = `${API_BASE_URL}/wholesale?page=${page}&limit=${limit}`;
        if (status && status !== 'all') url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetchWithTimeout(url, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale inquiries');
        return res.json();
    },

    getWholesaleInquiry: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale inquiry');
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
        if (!res.ok) return handleApiError(res, 'Failed to update wholesale inquiry');
        return res.json();
    },

    deleteWholesaleInquiry: async (id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete wholesale inquiry');
        return res.json();
    },

    getWholesaleStats: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/stats/overview`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale stats');
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
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/sales-trend?days=${days}`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch sales trend');
        return res.json();
    },

    getOrdersByStatus: async () => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/orders-by-status`, {
            // No Authorization header needed - cookie is sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch orders by status');
        return res.json();
    },
};
