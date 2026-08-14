export const API_BASE_URL = '/api';

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

export const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API DEBUG] ${message}`, data || '');
  }
};

export async function fetchWithTimeout(
  resource: RequestInfo,
  options: FetchOptions = {}
) {
  const { timeout = 60000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    debugLog('Fetch request:', {
      url: typeof resource === 'string' ? resource : resource.url,
      method: fetchOptions.method || 'GET',
      hasCredentials: true,
      credentials: fetchOptions.credentials || 'include',
    });

    const response = await fetch(resource, {
      ...fetchOptions,
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(id);

    debugLog('Fetch response:', {
      url: typeof resource === 'string' ? resource : resource.url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    return response;
  } catch (error: unknown) {
    clearTimeout(id);
    debugLog('Fetch error:', {
      error,
      url: typeof resource === 'string' ? resource : resource.url,
    });
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out. Please check your internet connection or try again.'
        );
      }
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

export async function handleApiError(
  res: Response,
  defaultMessage: string
): Promise<never> {
  try {
    const errorData = await res.json();
    const details = errorData.errors || errorData.details;
    const detailMessage = Array.isArray(details)
      ? details
          .map((detail) => {
            if (typeof detail === 'string') return detail;
            const field = detail?.field || detail?.path?.join?.('.');
            const message = detail?.message || detail?.code;
            return [field, message].filter(Boolean).join(': ');
          })
          .filter(Boolean)
          .join('; ')
      : typeof details === 'string'
        ? details
        : details?.fieldErrors
          ? Object.entries(details.fieldErrors)
              .flatMap(([field, messages]) =>
                Array.isArray(messages)
                  ? messages.map((message) => `${field}: ${message}`)
                  : []
              )
              .join('; ')
          : '';
    const baseMessage = errorData.message || errorData.error || defaultMessage;
    const errorMessage = detailMessage
      ? `${baseMessage}: ${detailMessage}`
      : baseMessage;
    console.error('API Error:', errorData);
    throw new Error(errorMessage);
  } catch (error) {
    if (error instanceof Error && error.message !== defaultMessage) throw error;
    throw new Error(defaultMessage);
  }
}

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

export async function debugCookieState(endpoint: string) {
  if (typeof window === 'undefined') return;

  const cookies = document.cookie;
  debugLog(`Cookie state before ${endpoint}:`, {
    hasCookies: !!cookies,
    hasAdminToken: cookies.includes('admin_token='),
  });
  debugLog(`Request target: ${endpoint}`, {
    apiBaseUrl: API_BASE_URL,
    fullUrl: API_BASE_URL + endpoint,
  });
}
