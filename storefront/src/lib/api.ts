const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// 🕵️‍♂️ TRACER: Helper to verify request flow
async function fetchWithTrace(input: RequestInfo | URL, init?: RequestInit & { next?: any }) {
    const traceId = `TRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (typeof input === 'string' && input.includes(API_URL)) {
        console.log(`[Storefront TRACER] Outgoing -> ${input} [${traceId}]`);
    }

    const headers = new Headers(init?.headers || {});
    headers.set('x-debug-trace', traceId);

    return fetch(input, {
        ...init,
        headers
    });
}

// Type definitions for API requests/responses
interface OrderCreateData {
    region_id: string;
    currency_code: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    shipping_address: {
        first_name?: string;
        last_name?: string;
        address_1: string;
        address_2?: string;
        city: string;
        postal_code: string;
        province?: string;
        country_code: string;
    };
    items: Array<{
        variant_id: string;
        quantity: number;
    }>;
}

interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface CustomerUpdateData {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}

interface ReviewCreateData {
    rating: number;
    title?: string;
    content: string;
    author_name?: string;
    customer_id?: string;
}

interface TaxRate {
    country_code: string;
    rate: number;
    name: string;
}

interface StoreSettings {
    free_shipping_threshold?: number;
    currency_code?: string;
    store_name?: string;
    tax_rates?: TaxRate[];
    default_tax_rate?: number;
}

interface CartItem {
    id: string;
    variantId: string;
    quantity: number;
    title: string;
    price: number;
    currency: string;
    thumbnail?: string;
    material?: string;
    origin?: string;
    sku?: string;
    description?: string;
}

// Helper to get CSRF token for mutations
async function getCsrfHeader(): Promise<Record<string, string>> {
    try {
        const res = await fetchWithTrace(`${API_URL}/auth/csrf`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            const data = await res.json();
            if (data.csrf_token) {
                return { 'x-csrf-token': data.csrf_token };
            }
        }
    } catch {
        // CSRF endpoint may not exist, continue without it
    }
    return {};
}

export const api = {
    // Generic methods for untyped calls (fixes compilation errors and enables tracing)
    async get(endpoint: string) {
        const res = await fetchWithTrace(`${API_URL}${endpoint}`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async post(endpoint: string, body: any) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });
        if (!res.ok) {
            // Try to parse error response
            const data = await res.json().catch(() => ({}));
            throw { ...data, status: res.status, message: data.message || data.error || 'Request failed' };
        }
        return res.json();
    },

    async put(endpoint: string, body: any) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async delete(endpoint: string) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                ...csrfHeader
            },
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async getRegions() {
        try {
            const res = await fetchWithTrace(`${API_URL}/regions`);
            if (!res.ok) throw new Error('Failed to fetch regions');
            return res.json();
        } catch {
            // Return fallback structure found in regions response
            return { regions: [] };
        }
    },

    async getCategories() {
        try {
            // Cache for 1 hour
            const res = await fetchWithTrace(`${API_URL}/categories/tree`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getCategories failed:', res.status, res.statusText);
                return { categories: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getCategories error:', error);
            return { categories: [] };
        }
    },

    async getCollections() {
        try {
            const res = await fetchWithTrace(`${API_URL}/collections`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getCollections failed:', res.status, res.statusText);
                return { collections: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getCollections error:', error);
            return { collections: [] };
        }
    },

    async getHomepageSettings() {
        try {
            const res = await fetchWithTrace(`${API_URL}/settings/homepage`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getHomepageSettings failed:', res.status, res.statusText);
                return { settings: {} };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getHomepageSettings error:', error);
            return { settings: {} };
        }
    },

    async getStoreSettings() {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/settings`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getStoreSettings failed:', res.status, res.statusText);
                return null;
            }
            return res.json();
        } catch (error) {
            console.error('[API] getStoreSettings error:', error);
            return null;
        }
    },

    async getPages() {
        try {
            const res = await fetchWithTrace(`${API_URL}/pages/storefront`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getPages failed:', res.status, res.statusText);
                return { pages: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getPages error:', error);
            return { pages: [] };
        }
    },

    async getTags() {
        try {
            const res = await fetchWithTrace(`${API_URL}/tags`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getTags failed:', res.status, res.statusText);
                return { tags: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getTags error:', error);
            return { tags: [] };
        }
    },

    async getTestimonials() {
        try {
            const res = await fetchWithTrace(`${API_URL}/testimonials/store`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getTestimonials failed:', res.status, res.statusText);
                return { testimonials: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getTestimonials error:', error);
            return { testimonials: [] };
        }
    },

    async getFeaturedProducts(ids: string[]) {
        if (!ids || ids.length === 0) return { products: [] };
        try {
            const idsString = ids.join(',');
            const res = await fetchWithTrace(`${API_URL}/products/featured?ids=${encodeURIComponent(idsString)}`, { next: { revalidate: 3600 } });
            if (!res.ok) {
                console.error('[API] getFeaturedProducts failed:', res.status, res.statusText);
                return { products: [] };
            }
            const data = await res.json();
            return { products: data.data || [] };
        } catch (error) {
            console.error('[API] getFeaturedProducts error:', error);
            return { products: [] };
        }
    },

    async getProducts(params: {
        region_id?: string;
        search?: string;
        min_price?: number;
        max_price?: number;
        sort?: string;
        limit?: number;
        offset?: number;
        category_id?: string;
        tag_id?: string;
        collection_id?: string;
    } = {}) {
        const url = new URL(`${API_URL}/products`);
        url.searchParams.set('status', 'published'); // Only show published products
        if (params.search) url.searchParams.set('search', params.search);
        if (params.min_price) url.searchParams.set('min_price', params.min_price.toString());
        if (params.max_price) url.searchParams.set('max_price', params.max_price.toString());
        if (params.sort) url.searchParams.set('sort', params.sort);
        if (params.limit) url.searchParams.set('limit', params.limit.toString());
        if (params.offset) url.searchParams.set('offset', params.offset.toString());
        if (params.category_id) url.searchParams.set('category_id', params.category_id);
        if (params.tag_id) url.searchParams.set('tag_id', params.tag_id);
        if (params.collection_id) url.searchParams.set('collection_id', params.collection_id);

        try {
            // Cache for 60 seconds (ISR)
            const res = await fetchWithTrace(url.toString(), {
                next: { revalidate: 60, tags: ['products'] }
            });
            if (!res.ok) {
                return { products: [], total: 0 };
            }
            const json = await res.json();
            // Adapter for standardized backend response
            if (json.data && Array.isArray(json.data)) {
                return {
                    products: json.data,
                    total: json.pagination?.total || json.data.length,
                    limit: json.pagination?.limit,
                    offset: json.pagination?.offset
                };
            }
            return json; // Fallback if backend format changes or is raw
        } catch {
            // Fallback for build time
            return { products: [], total: 0 };
        }
    },

    async getSuggestions(query: string) {
        if (!query || query.length < 2) return { suggestions: [] };
        try {
            const res = await fetchWithTrace(`${API_URL}/products/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!res.ok) return { suggestions: [] };
            return res.json();
        } catch {
            return { suggestions: [] };
        }
    },

    getProduct: async (id: string) => {
        try {
            const res = await fetchWithTrace(`${API_URL}/products/${id}`, {
                next: { revalidate: 60, tags: [`product-${id}`] }
            });
            if (!res.ok) throw new Error('Failed to fetch product');
            const json = await res.json();
            // Adapter: Backend returns { data: { product: ... } }
            if (json.data && json.data.product) {
                return json.data.product;
            }
            return json; // Fallback
        } catch (error) {
            console.error('[API] getProduct failed', error);
            throw error; // Rethrow because page depends on it (dynamic params usually handled by notFound())
        }
    },

    // Search product by title (for reorder functionality)
    async searchProductsByTitle(title: string) {
        try {
            const res = await fetchWithTrace(`${API_URL}/products?title=${encodeURIComponent(title)}&limit=1`, {
                next: { revalidate: 60 }
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json.products?.[0] || null;
        } catch (error) {
            console.error('[API] searchProductsByTitle failed', error);
            return null;
        }
    },

    createOrder: async (data: OrderCreateData) => {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/checkout/place-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.details || error.error || 'Failed to place order');
        }
        return res.json();
    },

    validateCoupon: async (code: string, cartTotal: number) => {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/checkout/validate-coupon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify({ code, cart_total: cartTotal }),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Invalid coupon');
        }
        return res.json();
    },

    // --- Shipping Options (PHASE 1.3) ---
    async getShippingOptions(countryCode: string, regionId?: string) {
        try {
            const params = new URLSearchParams({ country_code: countryCode });
            if (regionId) params.append('region_id', regionId);
            
            const res = await fetchWithTrace(`${API_URL}/store/checkout/shipping-options?${params}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                // Return default options if endpoint doesn't exist
                return getDefaultShippingOptions(countryCode);
            }
            return res.json();
        } catch {
            // Return default options on error
            return getDefaultShippingOptions(countryCode);
        }
    },

    // --- Tax Calculation (PHASE 1.4) ---
    async calculateTax(countryCode: string, subtotal: number, regionId?: string, settings?: StoreSettings) {
        try {
            const csrfHeader = await getCsrfHeader();
            const res = await fetchWithTrace(`${API_URL}/store/checkout/tax`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...csrfHeader 
                },
                body: JSON.stringify({
                    country_code: countryCode,
                    subtotal,
                    region_id: regionId
                }),
                credentials: 'include',
            });
            if (!res.ok) {
                // Return default tax if endpoint doesn't exist
                return getDefaultTax(countryCode, subtotal, settings);
            }
            return res.json();
        } catch {
            // Return default tax on error
            return getDefaultTax(countryCode, subtotal, settings);
        }
    },

    // --- Auth ---
    async register(data: RegisterData) {
        const res = await fetchWithTrace(`${API_URL}/store/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });

        if (!res.ok) {
            let errorMessage = `HTTP ${res.status}: Request failed`;

            try {
                const errorData = await res.json();

                // Handle Zod validation errors from backend (errorData.errors)
                if (errorData.success === false && errorData.errors) {
                    const errors = errorData.errors;
                    const firstError = Object.values(errors)[0];
                    errorMessage = typeof firstError === 'string' ? firstError : 'Validation failed';
                } else if (errorData.success === false && errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.message || errorData.error) {
                    errorMessage = errorData.message || errorData.error;
                }
            } catch {
                // Response body was empty or not JSON, keep the default errorMessage
            }

            const error: any = new Error(errorMessage);
            error.status = res.status;
            throw error;
        }

        return res.json();
    },

    // --- Resend Verification Email ---
    async resendVerification(email: string) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/auth/resend-verification`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify({ email }),
            credentials: 'include',
        });
        if (!res.ok) {
            let errorMessage = 'Failed to resend verification email';
            try {
                const error = await res.json();
                errorMessage = error.error || error.message || errorMessage;
            } catch {
                try {
                    const errorText = await res.text();
                    if (errorText) errorMessage = errorText;
                } catch {
                    // Keep default error message
                }
            }
            throw new Error(errorMessage);
        }
        return res.json();
    },

    async login(data: LoginData) {
        const res = await fetchWithTrace(`${API_URL}/store/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async socialLogin(provider: 'google' | 'facebook', data: { id_token?: string; access_token?: string; email: string; name?: string; avatar?: string }) {
        const res = await fetchWithTrace(`${API_URL}/store/auth/social/${provider}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async getCustomer() {
        const res = await fetchWithTrace(`${API_URL}/store/auth/me`, {
            credentials: 'include', // Cookies are sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    async updateCustomer(data: CustomerUpdateData) {
        const res = await fetchWithTrace(`${API_URL}/store/customers/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include', // 🔒 FIX-010: Cookies sent automatically
        });
        if (!res.ok) throw new Error('Failed to update profile');
        return res.json();
    },

    async getCustomerOrders() {
        const res = await fetchWithTrace(`${API_URL}/store/customers/me/orders`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    async getOrder(id: string) {
        const res = await fetchWithTrace(`${API_URL}/store/customers/me/orders/${id}`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
    },

    // --- Cart Persistence (Cart Abandonment Recovery) ---
    async saveCart(items: CartItem[]) {
        try {
            const csrfHeader = await getCsrfHeader();
            const res = await fetchWithTrace(`${API_URL}/store/cart/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeader
                },
                body: JSON.stringify({ items }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to save cart');
            return res.json();
        } catch (error) {
            console.error('[API] saveCart error:', error);
            throw error;
        }
    },

    async getSavedCart() {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/cart`, {
                credentials: 'include',
            });
            if (!res.ok) {
                // Return empty cart if not found
                return { items: [] };
            }
            return res.json();
        } catch (error) {
            console.error('[API] getSavedCart error:', error);
            return { items: [] };
        }
    },

    async clearSavedCart() {
        try {
            const csrfHeader = await getCsrfHeader();
            const res = await fetchWithTrace(`${API_URL}/store/cart/clear`, {
                method: 'POST',
                headers: {
                    ...csrfHeader
                },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to clear saved cart');
            return res.json();
        } catch (error) {
            console.error('[API] clearSavedCart error:', error);
            throw error;
        }
    },

    async getBanners() {
        try {
            // Cache for 60 seconds
            const res = await fetchWithTrace(`${API_URL}/banners/storefront`, { next: { revalidate: 60 } });
            if (!res.ok) return { banners: [] }; // Return empty if fails, don't crash
            return res.json();
        } catch {
            return { banners: [] };
        }
    },

    async getPosts() {
        try {
            // Cache for 60 seconds
            const res = await fetchWithTrace(`${API_URL}/posts/storefront`, { next: { revalidate: 60 } });
            if (!res.ok) return { posts: [] };
            return res.json();
        } catch {
            return { posts: [] };
        }
    },

    async getPost(slug: string) {
        // Cache for 60 seconds
        const res = await fetchWithTrace(`${API_URL}/posts/storefront/${slug}`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Post not found');
        return res.json();
    },

    async getPage(slug: string) {
        // Cache for 60 mins
        const res = await fetchWithTrace(`${API_URL}/pages/storefront/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Page not found');
        return res.json();
    },

    async getReviews(productId: string) {
        try {
            const res = await fetchWithTrace(`${API_URL}/reviews/store/products/${productId}`, { next: { revalidate: 60 } });
            if (!res.ok) return { reviews: [] };
            return res.json();
        } catch {
            return { reviews: [] };
        }
    },

    async createReview(productId: string, data: ReviewCreateData) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/reviews/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify({ ...data, product_id: productId }),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    // --- Back in Stock Notifications ---
    async subscribeBackInStock(productId: string, email: string, variantId?: string) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/back-in-stock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify({ 
                product_id: productId,
                variant_id: variantId,
                email 
            }),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    // --- Payments ---
    async createPaymentIntent(orderId: string) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/payments/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify({ order_id: orderId }),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to create payment intent');
        }
        return res.json();
    },

    async checkPaymentStatus(orderId: string) {
        const res = await fetchWithTrace(`${API_URL}/store/payments/status/${orderId}`);
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to check payment status');
        }
        return res.json();
    },

    // --- Wholesale Pricing ---
    async getWholesalePricing() {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/wholesale/prices`, {
                credentials: 'include',
            });
            if (!res.ok) return { hasWholesaleAccess: false, tier: null };
            return res.json();
        } catch {
            return { hasWholesaleAccess: false, tier: null };
        }
    },

    async getWholesalePrices(variantIds: string[]) {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/wholesale/prices/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantIds }),
                credentials: 'include',
            });
            if (!res.ok) return { prices: [] };
            return res.json();
        } catch {
            return { prices: [] };
        }
    },

    async getWholesaleMOQ(variantId: string) {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/wholesale/moq/${variantId}`, {
                credentials: 'include',
            });
            if (!res.ok) return { moq: 1 };
            return res.json();
        } catch {
            return { moq: 1 };
        }
    },

    async getWholesaleBulkDiscounts(variantId: string) {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/wholesale/bulk-discounts/${variantId}`, {
                credentials: 'include',
            });
            if (!res.ok) return { discounts: [] };
            return res.json();
        } catch {
            return { discounts: [] };
        }
    },

    async calculateWholesalePrice(variantId: string, quantity: number) {
        try {
            const res = await fetchWithTrace(`${API_URL}/store/wholesale/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantId, quantity }),
                credentials: 'include',
            });
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    async createWholesaleOrder(data: any) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetchWithTrace(`${API_URL}/store/wholesale/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeader
            },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return res.json();
    }
};

// Default shipping options fallback (PHASE 1.3)
function getDefaultShippingOptions(countryCode: string) {
    const isInternational = countryCode !== 'US';
    
    const options = [
        {
            id: 'standard',
            name: isInternational ? 'Standard International Shipping' : 'Standard Shipping',
            description: isInternational ? '7-14 business days' : '5-7 business days',
            price: isInternational ? 2500 : 0, // $25 or free
            estimated_days: isInternational ? '7-14' : '5-7',
            currency_code: 'USD'
        },
        {
            id: 'express',
            name: isInternational ? 'Express International Shipping' : 'Express Shipping',
            description: isInternational ? '3-5 business days' : '2-3 business days',
            price: isInternational ? 4500 : 1500, // $45 or $15
            estimated_days: isInternational ? '3-5' : '2-3',
            currency_code: 'USD'
        }
    ];

    // Free shipping threshold (mock - should come from backend)
    const freeShippingThreshold = 25000; // $250

    return { 
        options,
        free_shipping_threshold: freeShippingThreshold,
        currency_code: 'USD'
    };
}

// Default tax calculation fallback (PHASE 1.4)
function getDefaultTax(countryCode: string, subtotal: number, settings?: StoreSettings) {
    // Use dynamic tax rates from settings if available, otherwise use hardcoded defaults
    const defaultTaxRates: Record<string, { rate: number; name: string }> = {
        'US': { rate: 0.08, name: 'Sales Tax' },
        'GB': { rate: 0.20, name: 'VAT' },
        'CA': { rate: 0.13, name: 'HST' },
        'AU': { rate: 0.10, name: 'GST' },
        'DE': { rate: 0.19, name: 'VAT' },
        'FR': { rate: 0.20, name: 'VAT' },
        'IN': { rate: 0.18, name: 'GST' },
        'JP': { rate: 0.10, name: 'Consumption Tax' },
    };

    // Try to get rate from settings first
    let rate: number;
    let taxName: string;
    
    if (settings?.tax_rates) {
        const settingRate = settings.tax_rates.find(tr => tr.country_code === countryCode);
        if (settingRate) {
            rate = settingRate.rate;
            taxName = settingRate.name;
        } else {
            rate = settings.default_tax_rate || 0.10;
            taxName = countryCode === 'US' ? 'Sales Tax' : 'VAT';
        }
    } else {
        // Fall back to hardcoded defaults
        const defaultRate = defaultTaxRates[countryCode] || { rate: 0.10, name: countryCode === 'US' ? 'Sales Tax' : 'VAT' };
        rate = defaultRate.rate;
        taxName = defaultRate.name;
    }

    const taxAmount = Math.round(subtotal * rate);

    return {
        tax_amount: taxAmount,
        tax_rate: rate,
        tax_name: taxName,
        currency_code: settings?.currency_code || 'USD'
    };
}
