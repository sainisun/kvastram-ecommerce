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
  Layers,
  Folder,
  Tag,
  Star,
  FileText,
  Bell,
  RotateCcw,
  Menu,
  ShoppingCart,
  Image,
} from 'lucide-react';

// Sidebar structure per PRD — reorganized into logical sections
const sections = [
  {
    title: 'MAIN',
    items: [{ name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }],
  },
  {
    title: 'CATALOG',
    items: [
      { name: 'Products', icon: ShoppingBag, path: '/dashboard/products' },
      { name: 'Collections', icon: Layers, path: '/dashboard/collections' },
      { name: 'Categories', icon: Folder, path: '/dashboard/categories' },
      { name: 'Tags', icon: Tag, path: '/dashboard/tags' },
    ],
  },
  {
    title: 'STOREFRONT',
    items: [
      {
        name: 'Header Navigation',
        icon: Menu,
        path: '/dashboard/header-navigation',
      },
      {
        name: 'Hero Banners',
        icon: Image,
        path: '/dashboard/content/hero-banners',
      },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Orders', icon: Box, path: '/dashboard/orders' },
      { name: 'Returns', icon: RotateCcw, path: '/dashboard/returns' },
      { name: 'Customers', icon: Users, path: '/dashboard/customers' },
      { name: 'Wholesale', icon: Building2, path: '/dashboard/wholesale' },
      { name: 'Regions & Currencies', icon: Globe, path: '/dashboard/regions' },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { name: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
      { name: 'Marketing', icon: Palette, path: '/dashboard/marketing' },
      {
        name: 'Abandoned Carts',
        icon: ShoppingCart,
        path: '/dashboard/abandoned-carts',
      },
      { name: 'Reviews', icon: Star, path: '/dashboard/reviews' },
    ],
  },
  {
    title: 'CONTENT',
    items: [{ name: 'Content', icon: FileText, path: '/dashboard/content' }],
  },
  {
    title: 'SETTINGS',
    items: [{ name: 'Settings', icon: Settings, path: '/dashboard/settings' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1e1e2d] text-white transition-all z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700 bg-[#1b1b28]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">
            K
          </div>
          <span className="font-bold text-xl tracking-wide">Kvastram</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-2 mt-5 first:mt-0 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(item.path + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-[#2b2b40] hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}

            {/* Marketing sub-items (show when in marketing section) */}
            {section.title === 'GROWTH' &&
              pathname.startsWith('/dashboard/marketing') && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    href="/dashboard/marketing/back-in-stock"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      pathname === '/dashboard/marketing/back-in-stock'
                        ? 'bg-amber-600/20 text-amber-400'
                        : 'text-gray-500 hover:bg-[#2b2b40] hover:text-gray-300'
                    }`}
                  >
                    <Bell size={14} />
                    Back-in-Stock
                  </Link>
                </div>
              )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
