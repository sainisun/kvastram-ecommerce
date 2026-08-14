import {
  API_BASE_URL,
  debugLog,
  fetchWithTimeout,
  type ApiError,
  type AuthResponse,
} from './api-client-core';

export const adminAuthApi = {
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
      if (!res.ok) {
        let data: Record<string, unknown> = {};
        let errorText = '';
        try {
          errorText = await res.text();
          data = JSON.parse(errorText);
        } catch {
          data = { message: errorText || `HTTP ${res.status}: ${res.statusText}` };
        }
        const message =
          (typeof data.error === 'string' ? data.error : undefined) ||
          (typeof data.message === 'string' ? data.message : undefined) ||
          `Login failed (${res.status})`;
        const error = new Error(message) as ApiError;
        error.response = data;
        throw error;
      }
      const responseText = await res.text();
      let response;
      try {
        response = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from server');
      }
      if (!response.data?.user) {
        throw new Error('Invalid response structure from server');
      }
      return response.data as AuthResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  register: async (email: string, password: string, first_name?: string, last_name?: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },
  logout: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  },
  getMe: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return (await res.json()).data;
  },
  generate2FA: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/generate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate 2FA');
    return res.json();
  },
  verify2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: otp }) });
    if (!res.ok) throw new Error('Failed to verify OTP');
    return res.json();
  },
  disable2FA: async (otp: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/auth/2fa/disable`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: otp }) });
    if (!res.ok) throw new Error('Failed to disable 2FA');
    return res.json();
  },
};
