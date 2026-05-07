import axios, { AxiosInstance } from 'axios';
import 'dotenv/config';

const API_BASE = process.env.KVASTRAM_API_URL || 'http://localhost:4000';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const email = process.env.MCP_SERVICE_EMAIL || process.env.ADMIN_EMAIL;
  const password =
    process.env.MCP_SERVICE_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'MCP service credentials must be configured in the runtime environment'
    );
  }

  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  const token = res.data?.data?.token || res.headers['set-cookie']?.[0]?.match(/admin_token=([^;]+)/)?.[1];

  if (!token) {
    throw new Error(
      'Login failed: no token returned. Check MCP service credentials in the runtime environment'
    );
  }

  cachedToken = token;
  tokenExpiry = now + 6 * 60 * 60 * 1000; // cache for 6 hours
  return token;
}

export async function createApiClient(): Promise<AxiosInstance> {
  const token = await getAuthToken();
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  // Convert axios errors into readable messages so Claude AI sees the actual error
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err.response?.status;
      const body = err.response?.data;
      const message = body?.message || body?.error || JSON.stringify(body) || err.message;
      const enhanced = new Error(`API Error ${status ?? 'NETWORK'}: ${message}`);
      return Promise.reject(enhanced);
    }
  );

  return client;
}

export function formatResponse(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
