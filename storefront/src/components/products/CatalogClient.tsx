'use client';

import { useState, useCallback } from 'react';
import {
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Product } from '@/types';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import FilterSidebar from '@/components/products/FilterSidebar';
import PageHero from '@/components/hero/PageHero';
import { useSearchParams, useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Tag {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  tags: Tag[];
  collections?: Collection[];
  totalProducts?: number;
}

const DEFAULT_LIMIT = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function CatalogClient({
  initialProducts,
  categories,
  tags,
  collections = [],
  totalProducts,
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalProducts || initialProducts.length);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(false);

  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategoryId = searchParams.get('category_id');
  const currentTagId = searchParams.get('tag_id');
  const currentCollectionId = searchParams.get('collection_id');

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(
    async (pageNum: number, sortValue?: string) => {
      setLoading(true);
      try {
        const offset = (pageNum - 1) * limit;
        const result = await api.getProducts({
          limit,
          offset,
          sort: sortValue || currentSort,
          category_id: currentCategoryId || undefined,
          tag_id: currentTagId || undefined,
          collection_id: currentCollectionId || undefined,
        });
        if (result.products) {
          setProducts(result.products);
          setTotal(result.total || result.products.length);
        }
      } catch (error) {
        console.warn('[CatalogClient] Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    },
    [limit, currentSort, currentCategoryId, currentTagId, currentCollectionId]
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      fetchProducts(newPage);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== 'newest') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    router.push(`/products?${params.toString()}`);
    setPage(1);
    fetchProducts(1, newSort);
  };

  // Calculate showing range
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Poster */}
      <PageHero
        title="All Products"
        subtitle="The Collection"
        description="Discover our curated selection of artisanal luxury, from Kashmiri weaves to Florentine leather."
        image="/images/home/hero-main.jpg"
      />

      {/* Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <FilterSidebar
            categories={categories}
            tags={tags}
            collections={collections}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden flex items-center gap-2 text-sm font-medium text-stone-600 cursor-pointer hover:text-black"
                aria-label="Open filters"
              >
                <SlidersHorizontal size={16} />
                <span>Filter</span>
              </button>

              {/* Active Filters Display */}
              {(currentCategoryId || currentTagId || currentCollectionId) && (
                <div className="hidden md:flex items-center gap-2">
                  {currentCategoryId && (
                    <span className="px-2 py-1 bg-stone-100 text-xs text-stone-600 rounded">
                      Category
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.delete('category_id');
                          router.push(`/products?${params.toString()}`);
                        }}
                        className="ml-1 text-stone-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {currentTagId && (
                    <span className="px-2 py-1 bg-stone-100 text-xs text-stone-600 rounded">
                      Tag
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.delete('tag_id');
                          router.push(`/products?${params.toString()}`);
                        }}
                        className="ml-1 text-stone-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {currentCollectionId && (
                    <span className="px-2 py-1 bg-stone-100 text-xs text-stone-600 rounded">
                      Collection
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.delete('collection_id');
                          router.push(`/products?${params.toString()}`);
                        }}
                        className="ml-1 text-stone-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-stone-500">
                {total > 0
                  ? `${startItem}-${endItem} of ${total} Items`
                  : `${total} Items`}
              </div>

              {/* Sort Dropdown */}
              <div className="hidden md:flex items-center gap-2">
                <ArrowUpDown size={14} className="text-stone-400" />
                <select
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm text-stone-600 bg-transparent border-none cursor-pointer focus:outline-none hover:text-black"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                    className={`w-10 h-10 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                      page === pageNum
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
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Filters
                </h2>
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
