'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { Customer, LoginData, RegisterData } from '@/types';

interface AuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (customer: Customer | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// 🔒 FIX-010: Cookie helper functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function eraseCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCustomer = async (token: string) => {
    try {
      const data = await api.getCustomer();
      setCustomer(data.customer);
    } catch {
      eraseCookie('auth_token');
      localStorage.removeItem('auth_token');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔒 FIX-010: Read token from cookie instead of localStorage
    let token = getCookie('auth_token');

    // Also check localStorage for wholesale login (fallback)
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token');
      if (token) {
        // Sync to cookie for consistency
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    }

    if (token) {
      fetchCustomer(token);
    } else {
      // Use setTimeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Listen for auth changes (e.g., from wholesale login)
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('auth_token');
      if (newToken) {
        fetchCustomer(newToken);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', handleAuthChange);
      return () => window.removeEventListener('auth-change', handleAuthChange);
    }
  }, []);

  const login = async (data: LoginData) => {
    const res = await api.login(data);
    // Token is set in httpOnly cookie by backend
    setCustomer(res.customer);
  };

  const register = async (data: RegisterData) => {
    const res = await api.register(data);
    // FIX-011: No auto-login - user must verify email first
    // Return the customer for display but don't set as logged in
    return res;
  };

  const logout = () => {
    eraseCookie('auth_token');
    setCustomer(null);
    router.push('/');
  };

  const setUser = (customer: Customer | null) => {
    setCustomer(customer);
  };

  return (
    <AuthContext.Provider
      value={{ customer, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
