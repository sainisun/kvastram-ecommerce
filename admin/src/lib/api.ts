const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Token storage key (must match auth-context.tsx)
const TOKEN_KEY = 'adminToken';

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
    token: string;
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

// Get token from localStorage (for client-side only)
function getToken(): string | null {
    if (typeof window === 'undefined') {
        debugLog('getToken called server-side, returning null');
        return null;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    debugLog(`Retrieved token from localStorage: ${token ? 'Found' : 'Not found'}`);
    return token;
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
            debugLog(`Attempting login for ${email}`);
            const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, twoFactorCode }),
            });

            if (!res.ok) {
                const data = await res.json();
                console.error('Login failed response:', data);
                const error = new Error(data.error || 'Login failed') as ApiError;
                error.response = data;
                throw error;
            }
            const response = await res.json();
            debugLog('Login API response structure:', response);
            // Return data property which contains { user, token }
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

    // Product endpoints
    getProducts: async (token: string, limit = 20, offset = 0) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products?limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getProductStats: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch product stats');
        return res.json();
    },

    getProduct: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    createProduct: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create product');
        return res.json();
    },

    updateProduct: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update product');
        return res.json();
    },

    deleteProduct: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete product');
        return res.json();
    },

    // Customer endpoints
    getCustomers: async (token: string, page = 1, search = '', filter = 'all') => {
        let url = `${API_BASE_URL}/customers?page=${page}&limit=20`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (filter === 'registered') url += `&has_account=true`;
        if (filter === 'guest') url += `&has_account=false`;

        const res = await fetchWithTimeout(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
    },

    getCustomer: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch customer');
        return res.json();
    },

    updateCustomer: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update customer');
        return res.json();
    },

    deleteCustomer: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete customer');
        return res.json();
    },

    getCustomerStats: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/customers/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch customer stats');
        return res.json();
    },

    // Region endpoints
    getRegions: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch regions');
        return res.json();
    },

    createRegion: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/regions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create region');
        return res.json();
    },

    deleteRegion: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/regions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete region');
        return res.json();
    },

    // Order endpoints
    getOrders: async (token: string, limit = 20, offset = 0, search?: string, status?: string) => {
        let url = `${API_BASE_URL}/orders?limit=${limit}&offset=${offset}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status && status !== 'all') url += `&status=${status}`;

        const res = await fetchWithTimeout(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    getDashboardChart: async (token: string, range = '30d') => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/stats/chart?range=${range}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch chart data');
        return res.json();
    },

    getOrder: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
    },

    updateOrderStatus: async (token: string, id: string, status: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update status');
        return res.json();
    },

    getOrderStats: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch order stats');
        return res.json();
    },

    updateOrdersBulk: async (token: string, order_ids: string[], status: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/bulk-update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ order_ids, status }),
        });
        if (!res.ok) return handleApiError(res, 'Failed to bulk update orders');
        return res.json();
    },

    exportOrders: async (token: string, search: string, status: string) => {
        let url = `${API_BASE_URL}/orders/export?status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetchWithTimeout(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) return handleApiError(res, 'Failed to export orders');
        return res.blob();
    },

    deleteOrder: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete order');
        return res.json();
    },

    // Upload endpoints
    uploadImage: async (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });
        if (!res.ok) return handleApiError(res, 'Failed to upload image');
        return res.json();
    },

    // Settings endpoints
    getSettings: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    updateSetting: async (token: string, key: string, value: any, category?: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/settings/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ value, category }),
        });
        if (!res.ok) return handleApiError(res, `Failed to update setting ${key}`);
        return res.json();
    },

    updateSettingsBulk: async (token: string, settings: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/settings/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ settings }),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update settings');
        return res.json();
    },

    // Marketing endpoints
    getCampaigns: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        return res.json();
    },

    createCampaign: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create campaign');
        return res.json();
    },

    updateCampaign: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update campaign');
        return res.json();
    },

    deleteCampaign: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/campaigns/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete campaign');
        return res.json();
    },

    getDiscounts: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch discounts');
        return res.json();
    },

    createDiscount: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create discount');
        return res.json();
    },

    updateDiscount: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update discount');
        return res.json();
    },

    deleteDiscount: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/marketing/discounts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete discount');
        return res.json();
    },

    // Analytics endpoints
    getGrowth: async (token: string, period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/growth?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch growth stats');
        return res.json();
    },

    getRevenueTrend: async (token: string, period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/revenue-trend?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch revenue trend');
        return res.json();
    },

    getOrdersTrend: async (token: string, period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/orders-trend?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch orders trend');
        return res.json();
    },

    getCustomersTrend: async (token: string, period: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/customers-trend?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch customers trend');
        return res.json();
    },

    getMe: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    // 2FA Endpoints,

    // 2FA Endpoints
    generate2FA: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to generate 2FA');
        return res.json();
    },

    verify2FA: async (token: string, otp: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ token: otp })
        });
        if (!res.ok) throw new Error('Failed to verify OTP');
        return res.json();
    },

    disable2FA: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/disable`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to disable 2FA');
        return res.json();
    },

    // Wholesale endpoints
    getWholesaleInquiries: async (token: string, status?: string, search?: string, page = 1, limit = 20) => {
        let url = `${API_BASE_URL}/wholesale?page=${page}&limit=${limit}`;
        if (status && status !== 'all') url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetchWithTimeout(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale inquiries');
        return res.json();
    },

    getWholesaleInquiry: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale inquiry');
        return res.json();
    },

    updateWholesaleInquiry: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update wholesale inquiry');
        return res.json();
    },

    deleteWholesaleInquiry: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete wholesale inquiry');
        return res.json();
    },

    getWholesaleStats: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/wholesale/stats/overview`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to fetch wholesale stats');
        return res.json();
    },
    // Content (Banners) endpoints
    getBanners: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch banners');
        return res.json();
    },

    createBanner: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create banner');
        return res.json();
    },

    updateBanner: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update banner');
        return res.json();
    },

    deleteBanner: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete banner');
        return res.json();
    },

    reorderBanners: async (token: string, items: any[]) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/banners/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items }),
        });
        if (!res.ok) return handleApiError(res, 'Failed to reorder banners');
        return res.json();
    },

    // Blog Posts
    getPosts: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
    },

    getPost: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch post');
        return res.json();
    },

    createPost: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create post');
        return res.json();
    },

    updatePost: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update post');
        return res.json();
    },

    deletePost: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete post');
        return res.json();
    },

    // Pages
    getPages: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/pages`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch pages');
        return res.json();
    },

    getPage: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch page');
        return res.json();
    },

    createPage: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create page');
        return res.json();
    },

    updatePage: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update page');
        return res.json();
    },

    deletePage: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/pages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete page');
        return res.json();
    },

    // Categories
    getCategories: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    getCategoriesTree: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories/tree`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch category tree');
        return res.json();
    },

    getCategory: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch category');
        return res.json();
    },

    createCategory: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create category');
        return res.json();
    },

    updateCategory: async (token: string, id: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update category');
        return res.json();
    },

    deleteCategory: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete category');
        return res.json();
    },

    // Tags
    getTags: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tags');
        return res.json();
    },

    createTag: async (token: string, data: any) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) return handleApiError(res, 'Failed to create tag');
        return res.json();
    },

    deleteTag: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/tags/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete tag');
        return res.json();
    },

    // Reviews
    getReviews: async (token: string, limit = 50, offset = 0, status?: string) => {
        let url = `${API_BASE_URL}/reviews?limit=${limit}&offset=${offset}`;
        if (status) url += `&status=${status}`;

        const res = await fetchWithTimeout(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
    },

    updateReviewStatus: async (token: string, id: string, status: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) return handleApiError(res, 'Failed to update review status');
        return res.json();
    },

    deleteReview: async (token: string, id: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return handleApiError(res, 'Failed to delete review');
        return res.json();
    },

    // Analytics
    getAnalyticsOverview: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/overview`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch analytics overview');
        return res.json();
    },

    getSalesTrend: async (token: string, days = 30) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/sales-trend?days=${days}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch sales trend');
        return res.json();
    },

    getOrdersByStatus: async (token: string) => {
        const res = await fetchWithTimeout(`${API_BASE_URL}/analytics/orders-by-status`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch orders by status');
        return res.json();
    },
};

