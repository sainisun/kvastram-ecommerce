'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import CategoryBannerCarousel from '@/components/products/CategoryBannerCarousel';
import CategoryCircleStrip from '@/components/products/CategoryCircleStrip';
import FilterSidebar from '@/components/products/FilterSidebar';
import PageHero from '@/components/hero/PageHero';
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
    if (category.id === id) {
      return category;
    }

    if (category.children?.length) {
      const match = findCategoryById(category.children, id);
      if (match) {
        return match;
      }
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalProducts || initialProducts.length);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(false);

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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      fetchProducts(newPage);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

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

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  const clearFilter = (key: 'category_id' | 'tag_id' | 'collection_id') => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {categoryPageBanners.length > 0 ? (
        <CategoryBannerCarousel banners={categoryPageBanners} />
      ) : null}

      {categoryCircles.length > 0 ? <CategoryCircleStrip circles={categoryCircles} /> : null}

      <PageHero
        title="Shop All"
        subtitle="The Collection"
        description="Browse the full Kvastram edit. Sort by newest, filter by admin-managed categories, tags, and collections, and discover pieces ready to wear now."
        image="/images/home/hero-main.jpg"
      />

      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('category_id');
                params.delete('tag_id');
                params.delete('collection_id');
                router.push(`/products?${params.toString()}`);
              }}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                !currentCategoryId && !currentTagId && !currentCollectionId
                  ? 'border-stone-950 bg-stone-950 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
              }`}
            >
              All
            </button>

            {topCategories.map((category) => {
              const isActive = currentCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (isActive) {
                      params.delete('category_id');
                    } else {
                      params.set('category_id', category.id);
                      params.delete('tag_id');
                      params.delete('collection_id');
                    }
                    router.push(`/products?${params.toString()}`);
                  }}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                    isActive
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}

            {featuredCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
              >
                {collection.title}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 border border-stone-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {activeCategory ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                {activeCategory.name}
                <button
                  onClick={() => clearFilter('category_id')}
                  aria-label="Remove category filter"
                  className="text-stone-400 transition-colors hover:text-stone-900"
                >
                  ×
                </button>
              </span>
            ) : null}

            {activeTag ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                {activeTag.name}
                <button
                  onClick={() => clearFilter('tag_id')}
                  aria-label="Remove tag filter"
                  className="text-stone-400 transition-colors hover:text-stone-900"
                >
                  ×
                </button>
              </span>
            ) : null}

            {activeCollection ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                {activeCollection.title}
                <button
                  onClick={() => clearFilter('collection_id')}
                  aria-label="Remove collection filter"
                  className="text-stone-400 transition-colors hover:text-stone-900"
                >
                  ×
                </button>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <div className="font-body text-[13px] font-[300] text-stone-500">
              {total > 0 ? `${startItem}-${endItem} of ${total} Items` : `${total} Items`}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-stone-400" />
              <select
                value={currentSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="cursor-pointer border-none bg-transparent text-[13px] font-[300] text-stone-600 focus:outline-none hover:text-black"
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

        <main className="mt-8">
          <ProductGrid
            initialProducts={products}
            loading={loading}
            spotlightProducts={spotlightProducts}
          />

          {totalPages > 1 ? (
            <div className="mt-12 flex items-center justify-center gap-2">
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
                    className={`h-10 w-10 rounded-md text-sm font-medium transition-colors ${
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

      {mobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transition-transform duration-300">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-stone-100 p-4">
                <h2 className="font-heading text-[28px] font-semibold uppercase tracking-[0.02em] text-stone-900">
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
      )}
    </div>
  );
}
