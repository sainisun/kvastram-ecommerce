'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    Globe,
    Box,
    Palette,
    BarChart3,
    Building2,
    Layers
} from 'lucide-react';


const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Catalog', icon: ShoppingBag, path: '/dashboard/products' },
    { name: 'Orders', icon: Box, path: '/dashboard/orders' },
    { name: 'Customers', icon: Users, path: '/dashboard/customers' },
    { name: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { name: 'Marketing', icon: Palette, path: '/dashboard/marketing' },
    { name: 'Wholesale', icon: Building2, path: '/dashboard/wholesale' },
    { name: 'Content', icon: Layers, path: '/dashboard/content' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },

];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1e1e2d] text-white transition-all z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-700 bg-[#1b1b28]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">K</div>
                    <span className="font-bold text-xl tracking-wide">Kvastram</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
                <div className="mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Menu
                </div>

                {menuItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-[#2b2b40] hover:text-white'
                                }`}
                        >
                            <Icon size={18} />
                            {item.name}
                        </Link>
                    );
                })}

                <div className="mt-8 mb-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    International
                </div>

                <Link
                    href="/dashboard/regions"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard/regions'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-[#2b2b40] hover:text-white'
                        }`}
                >
                    <Globe size={18} />
                    Regions & Currencies
                </Link>
            </nav>
        </aside>
    );
}
