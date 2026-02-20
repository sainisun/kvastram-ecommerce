'use client';

import { ShoppingBag, Globe, ChevronDown, Search, User, Menu, Heart } from 'lucide-react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchOverlay from '@/components/search/SearchOverlay';
import MobileMenu from '@/components/layout/MobileMenu';

interface NavLink {
    label: string;
    url: string;
    order: number;
    highlight?: boolean;
}

// DEFAULT FALLBACK VALUES - Used if API fails or returns empty
const DEFAULT_NAV_LINKS: NavLink[] = [
    { label: 'Home', url: '/', order: 1 },
    { label: 'New Arrivals', url: '/products?sort=newest', order: 2 },
    { label: 'Shop', url: '/products', order: 3 },
    { label: 'Collections', url: '/collections', order: 4 },
    { label: 'Sale', url: '/sale', order: 5, highlight: true },
    { label: 'About', url: '/about', order: 6 },
    { label: 'Contact', url: '/contact', order: 7 },
];

const DEFAULT_QUICK_LINKS: NavLink[] = [
    { label: 'Bestsellers', url: '/products?tag=bestseller', order: 1 },
    { label: 'New Arrivals', url: '/products?tag=new', order: 2 },
    { label: 'Collections', url: '/collections', order: 3 },
    { label: 'Sale', url: '/sale', order: 4, highlight: true },
];

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
    const [announcementText, setAnnouncementText] = useState('');
    const [announcementEnabled, setAnnouncementEnabled] = useState(false);
    const [navLinks, setNavLinks] = useState<NavLink[]>(DEFAULT_NAV_LINKS);
    const [quickLinks, setQuickLinks] = useState<NavLink[]>(DEFAULT_QUICK_LINKS);

    useEffect(() => {
        async function fetchData() {
            try {
                const [{ api: apiModule }] = await Promise.all([
                    import('@/lib/api')
                ]);
                
                // Fetch categories
                const categoriesData = await apiModule.getCategories();
                setCategories(categoriesData.categories || []);
                
                // Fetch homepage settings (includes nav_links and quick_links)
                const settingsData = await apiModule.getHomepageSettings();
                const settings = settingsData.settings || {};
                
                setAnnouncementText(settings.announcement_bar_text || '');
                setAnnouncementEnabled(settings.announcement_bar_enabled || false);
                
                // Parse nav_links from JSON
                if (settings.nav_links) {
                    try {
                        const parsed = JSON.parse(settings.nav_links);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setNavLinks(parsed.sort((a: NavLink, b: NavLink) => a.order - b.order));
                        }
                    } catch (e) {
                        console.error('Error parsing nav_links:', e);
                        // Uses DEFAULT_NAV_LINKS
                    }
                }
                
                // Parse quick_links from JSON
                if (settings.quick_links) {
                    try {
                        const parsed = JSON.parse(settings.quick_links);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setQuickLinks(parsed.sort((a: NavLink, b: NavLink) => a.order - b.order));
                        }
                    } catch (e) {
                        console.error('Error parsing quick_links:', e);
                        // Uses DEFAULT_QUICK_LINKS
                    }
                }
            } catch (error) {
                console.error('Error fetching header data:', error);
                // Uses DEFAULT values (already set in useState)
            }
        }
        fetchData();
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
            {/* Announcement Strip */}
            {(announcementEnabled && announcementText) && (
                <div className="bg-black text-white text-[10px] uppercase tracking-widest text-center py-2 h-8 flex items-center justify-center gap-2">
                    <span>{announcementText}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Mobile Header Layout */}
                <div className="flex items-center justify-between w-full md:hidden relative px-2">
                    {/* Left: Hamburger Menu */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 text-stone-900 hover:text-stone-600 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Center: Logo */}
                    <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold tracking-tighter text-stone-900">
                        KVASTRAM
                    </Link>

                    {/* Right: Search & Cart */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 text-stone-900 hover:text-stone-600 transition-colors"
                            aria-label="Search"
                        >
                            <Search size={22} />
                        </button>
                        <Link href="/cart" className="p-2 text-stone-900 hover:text-stone-600 transition-colors relative" aria-label="Cart">
                            <ShoppingBag size={22} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Desktop Header Layout */}
                <div className="hidden md:flex items-center justify-between w-full">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-stone-900">
                        KVASTRAM
                    </Link>

                    {/* Nav - Desktop */}
                    <nav className="flex items-center gap-8 text-sm font-medium text-stone-600">
                        {navLinks.map((link) => {
                            if (link.label === 'Shop') {
                                return (
                                    <div key={link.label} className="relative group" onMouseEnter={() => setShowShopMenu(true)} onMouseLeave={() => setShowShopMenu(false)}>
                                        <button
                                            className="flex items-center gap-1 hover:text-black transition-colors py-2"
                                            aria-label="Shop menu"
                                            aria-expanded={showShopMenu}
                                            aria-haspopup="true"
                                        >
                                            {link.label}
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
                                                        {quickLinks.map((qLink) => (
                                                            <Link 
                                                                key={qLink.label}
                                                                href={qLink.url} 
                                                                className={`block text-sm hover:text-black ${qLink.highlight ? 'text-amber-600 font-medium hover:text-amber-700' : 'text-stone-700'}`}
                                                                onClick={() => setShowShopMenu(false)}
                                                            >
                                                                {qLink.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            
                            return (
                                <Link 
                                    key={link.label}
                                    href={link.url} 
                                    className={`hover:text-black transition-colors ${link.highlight ? 'text-amber-600 font-medium' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
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
            </div>

            {/* Amazon-style Mobile Menu */}
            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                categories={categories}
                regions={regions}
                currentRegion={currentRegion}
                onRegionChange={setRegion}
            />
        </header>
    );
}
