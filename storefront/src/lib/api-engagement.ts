import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';

export interface StudioInquiryData {
  product_id?: string;
  product_title: string;
  product_handle?: string;
  product_url?: string;
  inquiry_type: 'question' | 'custom_size' | 'shipping';
  customer_name: string;
  email?: string;
  phone?: string;
  message: string;
  measurements?: {
    height?: string;
    bust?: string;
    waist?: string;
    hips?: string;
    preferredLength?: string;
  };
}

interface ReviewCreateData {
  rating: number;
  title?: string;
  content: string;
  author_name?: string;
  customer_id?: string;
  images?: string[];
}

export interface StudioInquirySummary {
  id: string;
  product_title: string;
  product_handle: string | null;
  inquiry_type: string;
  status: string;
  last_message_at: string | null;
  unread_by_customer: boolean | null;
  created_at: string;
}

export interface StudioInquiryDetail {
  id: string;
  product_title: string;
  product_url: string | null;
  status: string;
  inquiry_type: string;
}

export interface StudioInquiryMessage {
  id: string;
  sender_type: 'customer' | 'admin' | string;
  sender_name: string | null;
  sender_email?: string | null;
  message: string;
  created_at: string;
}

export interface CustomerStudioInquiryListResponse {
  inquiries: StudioInquirySummary[];
}

export interface CustomerStudioInquiryResponse {
  inquiry: StudioInquiryDetail;
  messages: StudioInquiryMessage[];
}

export interface CustomerStudioMessageResponse {
  success: true;
  message: StudioInquiryMessage;
}

type RequestError = Error & { status: number; data: unknown };

async function getAuthenticated<TResponse = unknown>(endpoint: string): Promise<TResponse> {
  const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.message || data.error || 'Request failed';
    const error = new Error(message) as RequestError;
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return res.json() as Promise<TResponse>;
}

export const engagementApi = {
  async getReviews(productId: string) {
    const res = await fetchWithTrace(`${API_URL}/reviews/store/products/${productId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Failed to load reviews (${res.status})`);
    return res.json();
  },

  async createReview(productId: string, data: ReviewCreateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/reviews/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ ...data, product_id: productId }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async subscribeBackInStock(data: {
    product_id: string;
    email: string;
    variant_id?: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/back-in-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        product_id: data.product_id,
        variant_id: data.variant_id,
        email: data.email,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async submitStudioInquiry(data: StudioInquiryData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getStudioInquiryConversation(id: string, token: string) {
    const res = await fetchWithTrace(
      `${API_URL}/store/studio-inquiries/${id}?token=${encodeURIComponent(token)}`,
      { credentials: 'include' }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async sendStudioInquiryMessage(data: {
    id: string;
    token: string;
    customer_name?: string;
    email?: string;
    message: string;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/studio-inquiries/${data.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        token: data.token,
        customer_name: data.customer_name,
        email: data.email,
        message: data.message,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomerStudioInquiries() {
    return getAuthenticated<CustomerStudioInquiryListResponse>(
      '/store/customers/me/studio-inquiries'
    );
  },

  async getCustomerStudioInquiry(id: string) {
    return getAuthenticated<CustomerStudioInquiryResponse>(
      `/store/customers/me/studio-inquiries/${id}`
    );
  },

  async sendCustomerStudioMessage(id: string, message: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/studio-inquiries/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ message }),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json() as Promise<CustomerStudioMessageResponse>;
  },

  async requestReturn(data: {
    order_id: string;
    reason: string;
    items: Array<{ line_item_id: string; quantity: number; restock?: boolean }>;
  }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || error.error || 'Failed to submit return request');
    }
    return res.json();
  },

  async getCustomerReturns() {
    const res = await fetchWithTrace(`${API_URL}/store/returns`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch returns');
    return res.json();
  },

  async getWishlist() {
    try {
      const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
        credentials: 'include',
      });
      if (!res.ok) return { wishlist: [] };
      return res.json();
    } catch {
      return { wishlist: [] };
    }
  },

  async addToWishlist(product_id: string, variant_id?: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, variant_id }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to add to wishlist');
    }
    return res.json();
  },

  async removeFromWishlist(product_id: string) {
    const res = await fetchWithTrace(`${API_URL}/store/wishlist/${product_id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to remove from wishlist');
    }
    return res.json();
  },

  async getActiveCampaigns() {
    try {
      const res = await fetchWithTrace(`${API_URL}/marketing/campaigns/active`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return { campaigns: [] };
      return res.json();
    } catch {
      return { campaigns: [] };
    }
  },
};
