import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CustomerUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface CustomerAddressInput {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  province?: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface CustomerAddressRecord extends CustomerAddressInput {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialLoginData {
  id_token?: string;
  access_token?: string;
  email: string;
  name?: string;
  avatar?: string;
}

type RequestError = Error & { status: number; data: unknown };

async function request<TResponse = unknown, TBody = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: TBody
): Promise<TResponse | null> {
  const csrfHeader = await getCsrfHeader();
  const res = await fetchWithTrace(`${API_URL}${endpoint}`, {
    method,
    headers: {
      ...(method !== 'DELETE' ? { 'Content-Type': 'application/json' } : {}),
      ...csrfHeader,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    credentials: 'include',
  });

  if (res.status === 204) return null;
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

export const authAccountApi = {
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
        if (errorData.success === false && errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          errorMessage = typeof firstError === 'string' ? firstError : 'Validation failed';
        } else if (errorData.success === false && errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // Response body was empty or not JSON, keep the default errorMessage.
      }

      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return res.json();
  },

  async resendVerification(email: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
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
          // Keep default error message.
        }
      }
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async verifyOtp(data: { email: string; otp: string }) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      let errorMessage = 'Verification failed';
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // Keep default error message.
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
    if (!res.ok) throw await res.json().catch(() => ({}));
    return res.json();
  },

  async socialLogin(provider: 'google' | 'facebook', data: SocialLoginData) {
    const res = await fetchWithTrace(`${API_URL}/store/auth/social/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async getCustomer() {
    const res = await fetchWithTrace(`${API_URL}/store/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateCustomer(data: CustomerUpdateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/customers/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
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

  async getCustomerAddresses(): Promise<{ addresses: CustomerAddressRecord[] }> {
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/addresses`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return res.json();
  },

  async createCustomerAddress(
    data: CustomerAddressInput
  ): Promise<{ address: CustomerAddressRecord }> {
    return request<{ address: CustomerAddressRecord }, CustomerAddressInput>(
      '/store/customers/me/addresses',
      'POST',
      data
    ) as Promise<{ address: CustomerAddressRecord }>;
  },

  async updateCustomerAddress(
    id: string,
    data: Partial<CustomerAddressInput>
  ): Promise<{ address: CustomerAddressRecord }> {
    return request<{ address: CustomerAddressRecord }, Partial<CustomerAddressInput>>(
      `/store/customers/me/addresses/${id}`,
      'PUT',
      data
    ) as Promise<{ address: CustomerAddressRecord }>;
  },

  async deleteCustomerAddress(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(
      `/store/customers/me/addresses/${id}`,
      'DELETE'
    ) as Promise<{ success: boolean }>;
  },

  async getOrder(id: string) {
    const res = await fetchWithTrace(`${API_URL}/store/customers/me/orders/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  async trackOrder(orderNumber: string, email: string) {
    const query = new URLSearchParams({
      order_number: orderNumber,
      email,
    });
    const res = await fetchWithTrace(`${API_URL}/store/orders/track?${query.toString()}`);
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || error?.error || 'Failed to track order');
    }
    const payload = await res.json();
    return payload.data;
  },
};
