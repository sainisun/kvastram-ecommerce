const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

// Helper to get CSRF token for mutations
async function getCsrfHeader(): Promise<Record<string, string>> {
    try {
        const res = await fetch(`${API_URL}/auth/csrf`, {
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
    async getRegions() {
        try {
            const res = await fetch(`${API_URL}/regions`);
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
            const res = await fetch(`${API_URL}/categories/tree`, { next: { revalidate: 3600 } });
            if (!res.ok) return { categories: [] };
            return res.json();
        } catch {
            return { categories: [] };
        }
    },

    async getTags() {
        try {
            const res = await fetch(`${API_URL}/tags`, { next: { revalidate: 3600 } });
            if (!res.ok) return { tags: [] };
            return res.json();
        } catch {
            return { tags: [] };
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

        try {
            // Cache for 60 seconds (ISR)
            const res = await fetch(url.toString(), {
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
            const res = await fetch(`${API_URL}/products/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!res.ok) return { suggestions: [] };
            return res.json();
        } catch {
            return { suggestions: [] };
        }
    },

    getProduct: async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
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

    createOrder: async (data: OrderCreateData) => {
        const csrfHeader = await getCsrfHeader();
        const res = await fetch(`${API_URL}/store/checkout/place-order`, {
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
        const res = await fetch(`${API_URL}/store/checkout/validate-coupon`, {
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
            
            const res = await fetch(`${API_URL}/store/checkout/shipping-options?${params}`, {
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
    async calculateTax(countryCode: string, subtotal: number, regionId?: string) {
        try {
            const res = await fetch(`${API_URL}/store/checkout/tax`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country_code: countryCode,
                    subtotal,
                    region_id: regionId
                }),
                credentials: 'include',
            });
            if (!res.ok) {
                // Return default tax if endpoint doesn't exist
                return getDefaultTax(countryCode, subtotal);
            }
            return res.json();
        } catch {
            // Return default tax on error
            return getDefaultTax(countryCode, subtotal);
        }
    },

    // --- Auth ---
    async register(data: RegisterData) {
        const res = await fetch(`${API_URL}/store/auth/register`, {
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
        const res = await fetch(`${API_URL}/store/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to resend verification email');
        }
        return res.json();
    },

    async login(data: LoginData) {
        const res = await fetch(`${API_URL}/store/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include',
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async socialLogin(provider: 'google' | 'facebook', data: { id_token?: string; access_token?: string; email: string; name?: string; avatar?: string }) {
        const res = await fetch(`${API_URL}/store/auth/social/${provider}`, {
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
        const res = await fetch(`${API_URL}/store/auth/me`, {
            credentials: 'include', // Cookies are sent automatically
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    async updateCustomer(data: CustomerUpdateData) {
        const res = await fetch(`${API_URL}/store/customers/me`, {
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
        const res = await fetch(`${API_URL}/store/customers/me/orders`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    async getOrder(id: string) {
        const res = await fetch(`${API_URL}/store/customers/me/orders/${id}`, {
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch order');
        return res.json();
    },

    async getBanners() {
        try {
            // Cache for 60 seconds
            const res = await fetch(`${API_URL}/banners/storefront`, { next: { revalidate: 60 } });
            if (!res.ok) return { banners: [] }; // Return empty if fails, don't crash
            return res.json();
        } catch {
            return { banners: [] };
        }
    },

    async getPosts() {
        try {
            // Cache for 60 seconds
            const res = await fetch(`${API_URL}/posts/storefront`, { next: { revalidate: 60 } });
            if (!res.ok) return { posts: [] };
            return res.json();
        } catch {
            return { posts: [] };
        }
    },

    async getPost(slug: string) {
        // Cache for 60 seconds
        const res = await fetch(`${API_URL}/posts/storefront/${slug}`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Post not found');
        return res.json();
    },

    async getPages() {
        try {
            const res = await fetch(`${API_URL}/pages/storefront`, { next: { revalidate: 3600 } });
            if (!res.ok) return { pages: [] };
            return res.json();
        } catch {
            return { pages: [] };
        }
    },

    async getPage(slug: string) {
        // Cache for 60 mins
        const res = await fetch(`${API_URL}/pages/storefront/${slug}`, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Page not found');
        return res.json();
    },

    async getReviews(productId: string) {
        try {
            const res = await fetch(`${API_URL}/reviews/store/products/${productId}`, { next: { revalidate: 60 } });
            if (!res.ok) return { reviews: [] };
            return res.json();
        } catch {
            return { reviews: [] };
        }
    },

    async createReview(productId: string, data: ReviewCreateData) {
        const csrfHeader = await getCsrfHeader();
        const res = await fetch(`${API_URL}/reviews/store`, {
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
        const res = await fetch(`${API_URL}/store/back-in-stock`, {
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
        const res = await fetch(`${API_URL}/store/payments/create-intent`, {
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
        const res = await fetch(`${API_URL}/store/payments/status/${orderId}`);
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to check payment status');
        }
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
function getDefaultTax(countryCode: string, subtotal: number) {
    // Mock tax rates - in production these should come from backend
    const taxRates: Record<string, number> = {
        'US': 0.08,       // 8% average US sales tax
        'GB': 0.20,       // 20% UK VAT
        'CA': 0.13,       // 13% Canada HST
        'AU': 0.10,       // 10% Australia GST
        'DE': 0.19,       // 19% Germany VAT
        'FR': 0.20,       // 20% France VAT
        'IN': 0.18,       // 18% India GST
        'JP': 0.10,       // 10% Japan consumption tax
        // Default for other countries
        'default': 0.10   // 10% default
    };

    const rate = taxRates[countryCode] || taxRates['default'];
    const taxAmount = Math.round(subtotal * rate);

    return {
        tax_amount: taxAmount,
        tax_rate: rate,
        tax_name: countryCode === 'US' ? 'Sales Tax' : 'VAT',
        currency_code: 'USD'
    };
}
