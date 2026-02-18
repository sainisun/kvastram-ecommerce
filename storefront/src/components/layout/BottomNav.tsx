'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, User } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export function BottomNav() {
    const pathname = usePathname();
    const { totalItems } = useCart();
    const [isVisible, setIsVisible] = useState(true);
    // Hide on checkout and admin pages only
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pathname?.startsWith('/checkout') || pathname?.startsWith('/admin')) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [pathname]);

    // Don't render on desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        return null;
    }

    const navItems = [
        {
            href: '/',
            icon: Home,
            label: 'Home',
            active: pathname === '/'
        },
        {
            href: '/collections',
            icon: LayoutGrid,
            label: 'Categories',
            active: pathname?.startsWith('/collections')
        },
        {
            href: '/wishlist',
            icon: Heart,
            label: 'Wishlist',
            active: pathname === '/wishlist'
        },
        {
            href: '/account',
            icon: User,
            label: 'Account',
            active: pathname?.startsWith('/account')
        }
    ];

    return (
        <>
            {/* Spacer to prevent content from being hidden */}
            <div className="h-16 md:hidden" aria-hidden="true" />
            
            {/* Bottom Navigation Bar */}
            <nav 
                className={`fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 transition-transform duration-300 md:hidden ${
                    isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
                aria-label="Bottom navigation"
            >
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.active;
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-colors relative ${
                                    isActive ? 'text-black' : 'text-stone-500 hover:text-stone-900'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="relative">
                                    <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                                </div>
                                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-black' : 'text-stone-500'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
