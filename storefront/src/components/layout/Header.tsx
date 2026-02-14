'use client';

import { ShoppingBag, Globe, ChevronDown, Search, User, Menu, X, Heart } from 'lucide-react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchOverlay from '@/components/search/SearchOverlay';
import { AnimatePresence, motion } from 'framer-motion';

export function Header() {
    const { currentRegion, regions, setRegion } = useShop();
    const { totalItems } = useCart();
    const { totalItems: wishlistCount } = useWishlist();
    const [showRegionMenu, setShowRegionMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
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

                {/* Nav - Desktop */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
                    <Link href="/" className="hover:text-black transition-colors">Home</Link>
                    <Link href="/products?sort=newest" className="hover:text-black transition-colors">New Arrivals</Link>

                    {/* Shop Mega Menu */}
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
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] max-w-[90vw] bg-white shadow-2xl border border-stone-100 py-6 px-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-4 gap-6">
                                    {/* Featured Category */}
                                    <div className="col-span-1">
                                        <Link
                                            href="/products"
                                            className="block group/menu"
                                            onClick={() => setShowShopMenu(false)}
                                        >
                                            <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden mb-3 rounded-sm">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <span className="text-white text-xs font-bold uppercase tracking-wider">New Arrivals</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-stone-900 group-hover/menu:text-stone-600">Shop All</span>
                                        </Link>
                                    </div>
                                    
                                    {/* Categories */}
                                    <div className="col-span-2 grid grid-cols-2 gap-x-8 gap-y-3">
                                        {categories.slice(0, 6).map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/products?category_id=${cat.id}`}
                                                className="text-sm text-stone-600 hover:text-black transition-colors py-1"
                                                onClick={() => setShowShopMenu(false)}
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                        <div className="col-span-2 h-px bg-stone-100 my-2" />
                                        <Link
                                            href="/products?sort=newest"
                                            className="text-sm font-medium text-stone-900 hover:text-stone-600"
                                            onClick={() => setShowShopMenu(false)}
                                        >
                                            View All Categories →
                                        </Link>
                                    </div>
                                    
                                    {/* Quick Links */}
                                    <div className="col-span-1 space-y-3 bg-stone-50 p-4 rounded-sm">
                                        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Shop By</p>
                                        <Link href="/products?tag=bestseller" className="block text-sm text-stone-700 hover:text-black" onClick={() => setShowShopMenu(false)}>
                                            Bestsellers
                                        </Link>
                                        <Link href="/products?tag=new" className="block text-sm text-stone-700 hover:text-black" onClick={() => setShowShopMenu(false)}>
                                            New Arrivals
                                        </Link>
                                        <Link href="/collections" className="block text-sm text-stone-700 hover:text-black" onClick={() => setShowShopMenu(false)}>
                                            Collections
                                        </Link>
                                        <Link href="/sale" className="block text-sm text-amber-600 font-medium hover:text-amber-700" onClick={() => setShowShopMenu(false)}>
                                            Sale
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/collections" className="hover:text-black transition-colors">Collections</Link>
                    <Link href="/sale" className="hover:text-black transition-colors text-amber-600 font-medium">Sale</Link>
                    <Link href="/about" className="hover:text-black transition-colors">About</Link>
                    <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
                </nav>

                {/* PHASE 3.1: Mobile Menu Button */}
                <button
                    className="md:hidden text-stone-600 hover:text-black p-2"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>

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

                    {/* Wishlist Icon */}
                    <Link href="/wishlist" className="text-stone-600 hover:text-black transition-colors relative" aria-label={`Wishlist with ${wishlistCount} items`} title="Wishlist">
                        <Heart size={20} />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {wishlistCount}
                            </span>
                        )}
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

                    <Link href="/cart" className="text-stone-600 hover:text-black transition-colors relative" aria-label={`Shopping cart with ${totalItems} items`} title="Shopping Cart">
                        <ShoppingBag size={20} />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-label={`${totalItems} items in cart`}>
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* PHASE 3.1: Mobile Menu Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 md:hidden shadow-xl"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-stone-100">
                                    <Link 
                                        href="/" 
                                        className="text-xl font-bold tracking-tighter text-stone-900"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        KVASTRAM
                                    </Link>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 text-stone-500 hover:text-black"
                                        aria-label="Close menu"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                {/* Navigation Links */}
                                <nav className="flex-1 overflow-y-auto py-4">
                                    <div className="space-y-1">
                                        <Link
                                            href="/"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === '/' ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Home
                                        </Link>
                                        <Link
                                            href="/products?sort=newest"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname?.startsWith('/products') ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            New Arrivals
                                        </Link>
                                        <Link
                                            href="/products"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === '/products' ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Shop All
                                        </Link>
                                        <Link
                                            href="/collections"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === '/collections' ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Collections
                                        </Link>
                                        <Link
                                            href="/about"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === '/about' ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            About
                                        </Link>
                                        <Link
                                            href="/contact"
                                            className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === '/contact' ? 'text-black bg-stone-50' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Contact
                                        </Link>
                                    </div>

                                    {/* Categories Section */}
                                    {categories.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-stone-100">
                                            <h3 className="px-6 text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Categories</h3>
                                            <div className="space-y-1">
                                                {categories.map((cat) => (
                                                    <Link
                                                        key={cat.id}
                                                        href={`/products?category_id=${cat.id}`}
                                                        className="block px-6 py-2 text-sm text-stone-600 hover:text-black hover:bg-stone-50 transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Account Links */}
                                    <div className="mt-6 pt-6 border-t border-stone-100">
                                        <h3 className="px-6 text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Account</h3>
                                        <div className="space-y-1">
                                            <Link
                                                href="/account"
                                                className="flex items-center gap-3 px-6 py-2 text-sm text-stone-600 hover:text-black hover:bg-stone-50 transition-colors"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <User size={18} />
                                                My Account
                                            </Link>
                                            <Link
                                                href="/account/orders"
                                                className="flex items-center gap-3 px-6 py-2 text-sm text-stone-600 hover:text-black hover:bg-stone-50 transition-colors"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <ShoppingBag size={18} />
                                                Orders
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setMobileMenuOpen(false);
                                                    setShowRegionMenu(true);
                                                }}
                                                className="flex items-center gap-3 px-6 py-2 text-sm text-stone-600 hover:text-black hover:bg-stone-50 transition-colors w-full text-left"
                                            >
                                                <Globe size={18} />
                                                {currentRegion ? `${currentRegion.name} (${currentRegion.currency_code})` : 'Select Region'}
                                            </button>
                                        </div>
                                    </div>
                                </nav>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
