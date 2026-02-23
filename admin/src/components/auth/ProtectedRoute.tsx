'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log('[ProtectedRoute DEBUG] Checking auth...');
    console.log('[ProtectedRoute DEBUG] Loading:', loading);
    console.log('[ProtectedRoute DEBUG] User:', user ? 'Present' : 'Missing');
    console.log('[ProtectedRoute DEBUG] Pathname:', pathname);

    // Only check auth after loading is complete and we're on client
    if (!loading && isClient) {
      if (!user) {
        console.log(
          '[ProtectedRoute DEBUG] No user found, redirecting to login'
        );
        router.push('/');
      } else {
        console.log('[ProtectedRoute DEBUG] User found, allowing access');
      }
    }
  }, [user, loading, router, pathname, isClient]);

  // Show loading during SSR and initial hydration
  if (!isClient || loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Checking authentication
        </div>
      </div>
    );
  }

  // After hydration, check if user exists
  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
