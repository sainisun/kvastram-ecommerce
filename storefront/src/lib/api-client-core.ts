import { getApiBaseUrl } from './api-base-url';

export const API_URL = getApiBaseUrl();

const DEFAULT_API_TIMEOUT_MS = 15000;
const DEFAULT_CLIENT_TIMEOUT_MS = 15000;

function getApiTimeout(): number {
  if (globalThis.window === undefined) {
    const envTimeout = process.env.API_TIMEOUT;
    if (envTimeout) {
      const parsed = Number.parseInt(envTimeout, 10);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
    }
    return DEFAULT_API_TIMEOUT_MS;
  }

  const publicEnvTimeout = process.env.NEXT_PUBLIC_API_TIMEOUT;
  if (publicEnvTimeout) {
    const parsed = Number.parseInt(publicEnvTimeout, 10);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed;
  }
  return DEFAULT_CLIENT_TIMEOUT_MS;
}

const apiTimeout = getApiTimeout();

function getTime(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function getUrlString(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

export async function fetchWithTrace(
  input: RequestInfo | URL,
  init?: RequestInit & { next?: object }
) {
  const startTime = getTime();
  const controller = typeof AbortController === 'undefined' ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), apiTimeout) : null;

  try {
    const response = await fetch(input, { ...init, signal: controller?.signal });
    const duration = Math.round(getTime() - startTime);

    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.log(`[API ${response.status}] ${getUrlString(input)} (${duration}ms)`);
    }
    return response;
  } catch (error) {
    const duration = Math.round(getTime() - startTime);
    if (process.env.NODE_ENV === 'development' && globalThis.window !== undefined) {
      console.error(`[API ERROR] ${getUrlString(input)} (${duration}ms):`, error);
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Response(null, { status: 504, statusText: 'Request timed out' });
    }
    return new Response(null, { status: 502, statusText: 'Bad Gateway' });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
