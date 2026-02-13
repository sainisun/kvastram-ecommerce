'use client';

import { ShoppingBag, Globe, ChevronDown, Search, User } from 'lucide-react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SearchOverlay from '@/components/search/SearchOverlay';

export function Header() {
    const { currentRegion, regions, setRegion } = useShop();
    const { totalItems } = useCart();
    const [showRegionMenu, setShowRegionMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (typeof window === 'undefined') return;

        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowRegionMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
    const [showShopMenu, setShowShopMenu] = useState(false);

    useEffect(() => {
        import('@/lib/api').then(({ api }) => {
            api.getCategories().then(data => setCategories(data.categories || []));
        });
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
            {/* Announcement Strip */}
            <div className="bg-black text-white text-[10px] uppercase tracking-widest text-center py-2 h-8 flex items-center justify-center gap-2">
                <span>Free Express Shipping to {currentRegion ? currentRegion.name : 'World'} on orders over $250</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-tighter text-stone-900">
                    KVASTRAM
                </Link>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
                    <Link href="/" className="hover:text-black transition-colors">Home</Link>
                    <Link href="/products?sort=newest" className="hover:text-black transition-colors">New Arrivals</Link>

                    {/* Shop Dropdown */}
                    <div className="relative group" onMouseEnter={() => setShowShopMenu(true)} onMouseLeave={() => setShowShopMenu(false)}>
                        <button
                            className="flex items-center gap-1 hover:text-black transition-colors py-2"
                            aria-label="Shop menu"
                            aria-expanded={showShopMenu}
                            aria-haspopup="true"
                        >
                            Shop
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showShopMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showShopMenu && (
                            <div className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-lg border border-stone-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <Link
                                    href="/products"
                                    className="block px-4 py-2 text-sm text-stone-900 hover:bg-stone-50 font-medium"
                                    onClick={() => setShowShopMenu(false)}
                                >
                                    Shop All
                                </Link>
                                <div className="h-px bg-stone-100 my-1" />
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/products?category_id=${cat.id}`}
                                        className="block px-4 py-2 text-sm text-stone-600 hover:text-black hover:bg-stone-50 transition-colors"
                                        onClick={() => setShowShopMenu(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/collections" className="hover:text-black transition-colors">Collections</Link>
                    <Link href="/about" className="hover:text-black transition-colors">About</Link>
                    <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSearch(true)}
                        className="text-stone-600 hover:text-black transition-colors"
                        aria-label="Search products"
                        title="Search"
                    >
                        <Search size={20} />
                    </button>

                    <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />

                    <Link href="/account" className="text-stone-600 hover:text-black transition-colors" aria-label="My Account" title="My Account">
                        <User size={20} />
                    </Link>

                    {/* Region Selector */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowRegionMenu(!showRegionMenu)}
                            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-black transition-colors px-3 py-1.5 rounded-full hover:bg-stone-100"
                            aria-label="Select region and currency"
                            aria-expanded={showRegionMenu}
                            aria-haspopup="true"
                            title="Select Region"
                        >
                            <Globe size={16} />
                            <span className="uppercase">{currentRegion?.currency_code || 'USD'}</span>
                            <ChevronDown size={14} />
                        </button>

                        {showRegionMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-stone-100 py-1 overflow-hidden">
                                <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase">
                                    Select Region
                                </div>
                                {regions.map((region) => (
                                    <button
                                        key={region.id}
                                        onClick={() => {
                                            setRegion(region);
                                            setShowRegionMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 flex items-center justify-between group ${currentRegion?.id === region.id ? 'text-blue-600 font-medium' : 'text-stone-600'
                                            }`}
                                    >
                                        <span>{region.name}</span>
                                        <span className="text-xs font-mono text-stone-400 group-hover:text-stone-600 uppercase">
                                            {region.currency_code}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/checkout" className="text-stone-600 hover:text-black transition-colors relative" aria-label={`Shopping cart with ${totalItems} items`} title="Shopping Cart">
                        <ShoppingBag size={20} />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-label={`${totalItems} items in cart`}>
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
