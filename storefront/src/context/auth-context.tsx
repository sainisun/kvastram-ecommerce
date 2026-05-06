'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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

function eraseCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshCustomer = async () => {
    try {
      const data = await api.getCustomer();
      setCustomer(data.customer);
    } catch {
      eraseCookie('auth_token');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCustomer();

    const handleAuthChange = () => {
      setLoading(true);
      void refreshCustomer();
    };

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('auth-change', handleAuthChange);
      return () =>
        globalThis.window.removeEventListener('auth-change', handleAuthChange);
    }
  }, []);

  const login = async (data: LoginData) => {
    const res = await api.login(data);
    // Token is set in httpOnly cookie by backend
    // Handle both response formats: { customer: {...} } or direct customer object
    if (res.customer) {
      setCustomer(res.customer);
    } else if (res.data?.customer) {
      setCustomer(res.data.customer);
    }
  };

  const register = async (data: RegisterData) => {
    const res = await api.register(data);
    // FIX-011: No auto-login - user must verify email first
    // Return the customer for display but don't set as logged in
    return res;
  };

  const logout = () => {
    void api.post('/store/auth/logout', {}).catch(() => undefined);
    eraseCookie('auth_token');
    setCustomer(null);
    router.push('/');
  };

  const setUser = (customer: Customer | null) => {
    setCustomer(customer);
  };

  // useMemo prevents a new object being created on every render, avoiding unnecessary re-renders
  const contextValue = useMemo(
    () => ({ customer, loading, login, register, logout, setUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customer, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
