'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Rows3,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import CategoryBannerCarousel from '@/components/products/CategoryBannerCarousel';
import CategoryCircleStrip from '@/components/products/CategoryCircleStrip';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/ProductGrid';
import { api } from '@/lib/api';
import { Product } from '@/types';

interface Category {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  children?: Category[];
}

interface Tag {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
  handle?: string;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  tags: Tag[];
  collections?: Collection[];
  totalProducts?: number;
  categoryPageBanners?: Array<{
    id: string;
    image_url: string;
    headline?: string | null;
    button_label?: string | null;
    button_url?: string | null;
  }>;
  categoryCircles?: Array<{
    id: string;
    image_url: string;
    label: string;
    link_url: string;
  }>;
  spotlightProducts?: Array<{
    id: string;
    custom_image_url?: string | null;
    badge_text?: string | null;
    product: Product | null;
  }>;
}

const DEFAULT_LIMIT = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children?.length) {
      const match = findCategoryById(category.children, id);
      if (match) return match;
    }
  }
  return null;
}

export default function CatalogClient({
  initialProducts,
  categories,
  tags,
  collections = [],
  totalProducts,
  categoryPageBanners = [],
  categoryCircles = [],
  spotlightProducts = [],
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const filterDrawerRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalProducts || initialProducts.length);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(false);
  const [gridDensity, setGridDensity] = useState<'grid' | 'compact'>('grid');

  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategoryId = searchParams.get('category_id');
  const currentTagId = searchParams.get('tag_id');
  const currentCollectionId = searchParams.get('collection_id');

  const activeCategory = currentCategoryId
    ? findCategoryById(categories, currentCategoryId)
    : null;
  const activeTag = currentTagId
    ? tags.find((tag) => tag.id === currentTagId)
    : null;
  const activeCollection = currentCollectionId
    ? collections.find((collection) => collection.id === currentCollectionId)
    : null;

  const topCategories = categories.slice(0, 6);
  const featuredCollections = collections
    .slice(0, 6)
    .filter((collection) => Boolean(collection.handle));

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setProducts(initialProducts);
    setTotal(totalProducts || initialProducts.length);
    setPage(1);
  }, [initialProducts, totalProducts]);

  useEffect(() => {
    if (!mobileFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    filterDrawerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFilterOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      filterButtonRef.current?.focus();
    };
  }, [mobileFilterOpen]);

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

  const updateQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: string) => {
    updateQuery((params) => {
      if (newSort && newSort !== 'newest') {
        params.set('sort', newSort);
      } else {
        params.delete('sort');
      }
    });
    setPage(1);
    fetchProducts(1, newSort);
  };

  const clearFilter = (key: 'category_id' | 'tag_id' | 'collection_id') => {
    updateQuery((params) => params.delete(key));
  };

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {categoryPageBanners.length > 0 ? (
        <CategoryBannerCarousel banners={categoryPageBanners} />
      ) : null}

      {categoryCircles.length > 0 ? (
        <CategoryCircleStrip circles={categoryCircles} />
      ) : null}

      <div className="border-b border-[var(--line)] bg-white py-4">
        <div className="catalog-breadcrumb kv-container flex flex-wrap gap-2">
          <Link href="/">Home</Link>
          <span>{'>'}</span>
          <span className="catalog-breadcrumb-current">Shop All</span>
        </div>
      </div>

      <section className="kv-section-sm">
        <div className="kv-container">
          <div className="kv-tag">Shop All</div>
          <h1 className="kv-title max-w-2xl">Complete artisan catalog</h1>
          <p className="kv-sub mt-2 max-w-3xl">
            Browse real Kvastram products with backend-backed filters only.
          </p>
        </div>
      </section>

      <div className="bg-white py-6">
        <div className="kv-container pb-12 md:pb-16 lg:pb-24">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div className="filter-chips flex gap-3 overflow-x-auto pb-1 no-scrollbar lg:max-w-[calc(100%-180px)]">
              <button
                onClick={() =>
                  updateQuery((params) => {
                    params.delete('category_id');
                    params.delete('tag_id');
                    params.delete('collection_id');
                  })
                }
                className={!currentCategoryId && !currentTagId && !currentCollectionId ? 'bg-stone-950' : ''}
              >
                All
              </button>

              {topCategories.map((category) => {
                const isActive = currentCategoryId === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() =>
                      updateQuery((params) => {
                        if (isActive) {
                          params.delete('category_id');
                        } else {
                          params.set('category_id', category.id);
                          params.delete('tag_id');
                          params.delete('collection_id');
                        }
                      })
                    }
                    className={isActive ? 'bg-stone-950' : ''}
                  >
                    {category.name}
                  </button>
                );
              })}

              {featuredCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="catalog-filter-link inline-flex items-center rounded-full border border-[var(--line)] bg-white px-4 py-2"
                >
                  {collection.title}
                </Link>
              ))}
            </div>

            <button
              ref={filterButtonRef}
              onClick={() => setMobileFilterOpen(true)}
              className="kv-btn lg:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {activeCategory ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  {activeCategory.name}
                  <button
                    onClick={() => clearFilter('category_id')}
                    aria-label="Remove category filter"
                    className="text-stone-400 transition-colors hover:text-stone-900"
                  >
                    {'X'}
                  </button>
                </span>
              ) : null}

              {activeTag ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  {activeTag.name}
                  <button
                    onClick={() => clearFilter('tag_id')}
                    aria-label="Remove tag filter"
                    className="text-stone-400 transition-colors hover:text-stone-900"
                  >
                    {'X'}
                  </button>
                </span>
              ) : null}

              {activeCollection ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  {activeCollection.title}
                  <button
                    onClick={() => clearFilter('collection_id')}
                    aria-label="Remove collection filter"
                    className="text-stone-400 transition-colors hover:text-stone-900"
                  >
                    {'X'}
                  </button>
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <div className="catalog-count">
                {total > 0 ? `${startItem}-${endItem} of ${total} Items` : `${total} Items`}
              </div>

              <div
                className="hidden items-center overflow-hidden rounded-full border border-stone-200 bg-white sm:flex"
                aria-label="Product grid density"
              >
                <button
                  type="button"
                  onClick={() => setGridDensity('grid')}
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    gridDensity === 'grid'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid2X2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setGridDensity('compact')}
                  className={`flex h-9 w-9 items-center justify-center transition-colors ${
                    gridDensity === 'compact'
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  aria-label="Compact view"
                  title="Compact view"
                >
                  <Rows3 size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-stone-400" />
                <select
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="catalog-sort-select cursor-pointer border-none bg-transparent focus:outline-none hover:text-black"
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

          <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <FilterSidebar
                  categories={categories}
                  tags={tags}
                  collections={collections}
                  className="rounded-lg border border-[var(--line)] bg-[var(--cream)] p-5"
                />
              </div>
            </aside>

            <main className="min-w-0">
              <ProductGrid
                initialProducts={products}
                loading={loading}
                spotlightProducts={spotlightProducts}
                density={gridDensity}
              />

              {totalPages > 1 ? (
                <div className="mt-16 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        className={`catalog-page-button h-10 w-10 rounded-md transition-colors ${
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
                    className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </div>

      {mobileFilterOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={filterDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
            tabIndex={-1}
            className="fixed inset-0 z-50 w-full bg-white shadow-xl transition-transform duration-300 sm:inset-y-0 sm:left-0 sm:right-auto sm:max-w-[420px]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-stone-100 p-4">
                <h2 id="mobile-filter-title" className="catalog-filter-title">
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
              <div className="flex-1 overflow-y-auto p-4">
                <FilterSidebar
                  categories={categories}
                  tags={tags}
                  collections={collections}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
