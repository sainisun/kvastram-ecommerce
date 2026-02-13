// CSRF Token Management
// Note: In production, ensure your backend validates the Origin/Referer header
// for cross-site request forgery protection.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

let csrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken;

    try {
        const res = await fetch(`${API_URL}/auth/csrf`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            const data = await res.json();
            csrfToken = data.csrf_token;
            return csrfToken || '';
        }
    } catch (_error) {
        console.warn('[CSRF] Failed to fetch CSRF token, continuing without it');
    }

    return '';
}

export function clearCsrfToken() {
    csrfToken = null;
}
