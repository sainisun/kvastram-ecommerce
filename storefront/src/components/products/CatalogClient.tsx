'use client';

import { useState, useCallback } from 'react';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/products/FilterSidebar';

interface Category {
    id: string;
    name: string;
    children?: Category[];
}

interface Tag {
    id: string;
    name: string;
}

interface CatalogClientProps {
    initialProducts: Product[];
    categories: Category[];
    tags: Tag[];
    totalProducts?: number;
}

const DEFAULT_LIMIT = 12;

export default function CatalogClient({ initialProducts, categories, tags, totalProducts }: CatalogClientProps) {
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [total, setTotal] = useState(totalProducts || initialProducts.length);
    const [page, setPage] = useState(1);
    const [limit] = useState(DEFAULT_LIMIT);
    const [loading, setLoading] = useState(false);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Fetch products with pagination
    const fetchProducts = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const offset = (pageNum - 1) * limit;
            const result = await api.getProducts({ limit, offset });
            if (result.products) {
                setProducts(result.products);
                setTotal(result.total || result.products.length);
            }
        } catch (error) {
            console.warn('[CatalogClient] Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            setPage(newPage);
            fetchProducts(newPage);
            // Scroll to top of product grid
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    // Calculate showing range
    const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="min-h-screen bg-white pt-20">
            {/* Header */}
            <div className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-100">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">The Collection</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-900">All Products</h1>
                    <p className="max-w-xl mx-auto text-stone-600 font-light">
                        Discover our curated selection of artisanal luxury, from Kashmiri weaves to Florentine leather.
                    </p>
                </div>
            </div>

            {/* Content with Sidebar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
                {/* Sidebar (Desktop) */}
                <aside className="hidden md:block w-64 shrink-0">
                    <FilterSidebar categories={categories} tags={tags} />
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
                        <button
                            onClick={() => setMobileFilterOpen(true)}
                            className="md:hidden flex items-center gap-2 text-sm font-medium text-stone-600 cursor-pointer hover:text-black"
                            aria-label="Open filters"
                        >
                            <SlidersHorizontal size={16} />
                            <span>Filter</span>
                        </button>
                        <div className="text-sm text-stone-500">
                            {total > 0 ? `${startItem}-${endItem} of ${total} Items` : `${total} Items`}
                        </div>
                        {/* Sort could go here */}
                    </div>

                    <ProductGrid initialProducts={products} loading={loading} />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Show pages around current page
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`w-10 h-10 rounded-md text-sm font-medium cursor-pointer transition-colors ${page === pageNum
                                            ? 'bg-stone-900 text-white'
                                            : 'text-stone-600 hover:bg-stone-50 hover:text-black'
                                            }`}
                                        aria-label={`Page ${pageNum}`}
                                        aria-current={page === pageNum ? 'page' : undefined}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFilterOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setMobileFilterOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden shadow-xl transform transition-transform duration-300">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-stone-100">
                                <h2 className="font-serif text-lg font-bold text-stone-900">Filters</h2>
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="p-2 text-stone-500 hover:text-black"
                                    aria-label="Close filters"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <FilterSidebar categories={categories} tags={tags} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
