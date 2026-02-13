'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: any;
    token: string | null;
    loading: boolean;
    login: (data: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

// Debug logging helper
const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth DEBUG] ${message}`, data || '');
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        debugLog('Initializing auth state from localStorage');
        const storedToken = localStorage.getItem('adminToken');
        const storedUser = localStorage.getItem('user');

        debugLog('Stored token:', storedToken ? 'Present' : 'Missing');
        debugLog('Stored user:', storedUser ? 'Present' : 'Missing');

        if (storedToken && storedUser && storedUser !== "undefined") {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                debugLog('Auth state restored from localStorage');
            } catch (e) {
                console.error("[Auth DEBUG] Failed to parse stored user", e);
                localStorage.removeItem('user'); // Clear corrupted data
                debugLog('Cleared corrupted user data from localStorage');
            }
        } else {
            debugLog('No valid auth data found in localStorage');
            // Redirect to login if not found (optional, or handle in protected routes)
            // router.push('/'); 
        }
        setLoading(false);
    }, []);

    const login = (data: any) => {
        debugLog('Login called with data:', { hasToken: !!data.token, hasUser: !!data.user });
        
        if (!data.token) {
            debugLog('ERROR: No token found in login data!', data);
            return;
        }

        localStorage.setItem('adminToken', data.token);
        debugLog('Token saved to localStorage');
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            debugLog('User data saved to localStorage');
        }
        setToken(data.token);
        debugLog('Auth state updated, navigating to dashboard');
        router.push('/dashboard');
    };

    const logout = () => {
        debugLog('Logging out user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        debugLog('Auth state cleared, navigating to login');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
