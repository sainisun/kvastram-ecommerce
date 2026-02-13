'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <Topbar />

                <main className="pl-64 pt-16 min-h-screen transition-all">
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
