'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    const [localToken, setLocalToken] = useState<string | null>(null);

    // Set isClient to true after hydration
    useEffect(() => {
        setIsClient(true);
        // Check localStorage only on client side
        const storedToken = localStorage.getItem('adminToken');
        setLocalToken(storedToken);
        console.log('[ProtectedRoute DEBUG] Client mounted, localToken:', storedToken ? 'Present' : 'Missing');
    }, []);

    useEffect(() => {
        console.log('[ProtectedRoute DEBUG] Checking auth...');
        console.log('[ProtectedRoute DEBUG] Loading:', loading);
        console.log('[ProtectedRoute DEBUG] Context Token:', token ? 'Present' : 'Missing');
        console.log('[ProtectedRoute DEBUG] LocalStorage Token:', localToken ? 'Present' : 'Missing');
        console.log('[ProtectedRoute DEBUG] Pathname:', pathname);

        // Only check auth after loading is complete and we're on client
        if (!loading && isClient) {
            if (!token && !localToken) {
                console.log('[ProtectedRoute DEBUG] No token found, redirecting to login');
                router.push('/');
            } else {
                console.log('[ProtectedRoute DEBUG] Token found, allowing access');
            }
        }
    }, [token, loading, router, pathname, isClient, localToken]);

    // Show loading during SSR and initial hydration
    if (!isClient || loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column'
            }}>
                <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Checking authentication</div>
            </div>
        );
    }

    // After hydration, check both tokens
    if (!token && !localToken) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
