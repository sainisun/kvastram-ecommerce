'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/ProductGrid';
import { Drawer } from '@/components/ui/Drawer';
import { Select } from '@/components/ui/Select';
import { UnstyledButton } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

type Tag = {
  id: string;
  name: string;
};

type LinkChip = {
  label: string;
  href: string;
};

type FixedProductParams = {
  category_id?: string;
  collection_id?: string;
  search?: string;
  attribute_code?: string;
  attribute_value?: string;
};

type ListingPageClientProps = {
  basePath: string;
  initialProducts: Product[];
  totalProducts: number;
  tags: Tag[];
  fixedParams: FixedProductParams;
  intro?: string | null;
  emptyTitle: string;
  emptyLinks?: LinkChip[];
};

const DEFAULT_LIMIT = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function ListingPageClient({
  basePath,
  initialProducts,
  totalProducts,
  tags,
  fixedParams,
  intro,
  emptyTitle,
  emptyLinks = [],
}: ListingPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalProducts || initialProducts.length);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const currentSort = searchParams.get('sort') || 'newest';
  const currentTagId = searchParams.get('tag_id');
  const currentMinPrice = searchParams.get('min_price');
  const currentMaxPrice = searchParams.get('max_price');
  const activeTag = currentTagId
    ? tags.find((tag) => tag.id === currentTagId)
    : null;

  const activeFilterCount = [
    currentTagId,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;
  const totalPages = Math.ceil(total / DEFAULT_LIMIT);
  const startItem = total > 0 ? (page - 1) * DEFAULT_LIMIT + 1 : 0;
  const endItem = Math.min(page * DEFAULT_LIMIT, total);

  useEffect(() => {
    setProducts(initialProducts);
    setTotal(totalProducts || initialProducts.length);
    setPage(1);
  }, [initialProducts, totalProducts]);

  useEffect(() => {
    if (!filterDrawerOpen) return;
    const triggerButton = filterButtonRef.current;

    return () => {
      triggerButton?.focus();
    };
  }, [filterDrawerOpen]);

  const updateQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const nextQuery = params.toString();
    router.push(nextQuery ? `${basePath}?${nextQuery}` : basePath);
  };

  const fetchProducts = useCallback(
    async (pageNum: number, sortValue?: string) => {
      setLoading(true);
      try {
        const offset = (pageNum - 1) * DEFAULT_LIMIT;
        const result = await api.getProducts({
          ...fixedParams,
          limit: DEFAULT_LIMIT,
          offset,
          sort: sortValue || currentSort,
          tag_id: currentTagId || undefined,
          min_price: currentMinPrice ? Number(currentMinPrice) : undefined,
          max_price: currentMaxPrice ? Number(currentMaxPrice) : undefined,
          cache: false,
        });

        const readyProducts = filterStorefrontReadyProducts(result.products || []);
        setProducts(readyProducts);
        setTotal(readyProducts.length);
      } catch (error) {
        console.warn('[ListingPageClient] Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    },
    [currentMaxPrice, currentMinPrice, currentSort, currentTagId, fixedParams]
  );

  const handleSortChange = (newSort: string) => {
    updateQuery((params) => {
      if (newSort && newSort !== 'newest') {
        params.set('sort', newSort);
      } else {
        params.delete('sort');
      }
      params.delete('page');
    });
    setPage(1);
    fetchProducts(1, newSort);
  };

  const clearFilter = (key: 'tag_id' | 'min_price' | 'max_price') => {
    updateQuery((params) => params.delete(key));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 360, behavior: 'smooth' });
  };

  return (
    <section className="bg-[var(--ds-surface-paper)]">
      <div className="kv-page-container py-8 md:py-12 lg:py-16">
        {intro ? (
          <p className="mb-6 max-w-3xl text-body-md leading-token-relaxed text-[var(--ds-text-secondary)]">
            {intro}
          </p>
        ) : null}

        <div className="sticky top-[72px] z-30 -mx-4 border-y border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-x-0 md:px-0 md:backdrop-blur-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <UnstyledButton
              ref={filterButtonRef}
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="inline-flex h-10 items-center gap-2 border border-[var(--ds-text-primary)] bg-[var(--ds-surface-paper)] px-4 text-body-xs type-bold tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-text-primary)] hover:text-[var(--ds-text-inverse)]"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={14} />
              Filter
              {activeFilterCount > 0 ? (
                <span className="kv-count-badge inline-flex h-5 min-w-5 rounded-full bg-[var(--ds-text-primary)] px-1.5 text-[var(--ds-text-inverse)]">
                  {activeFilterCount}
                </span>
              ) : null}
            </UnstyledButton>

            <div className="flex items-center gap-3">
              <div className="catalog-count">
                {total > 0 ? `${startItem}-${endItem} of ${total}` : '0 products'}
              </div>
              <div className="flex h-10 items-center gap-2 border border-[var(--ds-border-subtle)] px-3">
                <ArrowUpDown size={14} className="text-[var(--ds-text-muted)]" />
                <Select
                  aria-label="Sort products"
                  value={currentSort}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="h-auto cursor-pointer border-0 bg-transparent px-0 py-0 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>

        {activeFilterCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeTag ? (
              <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                {activeTag.name}
                <UnstyledButton
                  onClick={() => clearFilter('tag_id')}
                  aria-label="Remove tag filter"
                  className="text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
                >
                  <X size={12} />
                </UnstyledButton>
              </span>
            ) : null}

            {currentMinPrice || currentMaxPrice ? (
              <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                Price filter
                <UnstyledButton
                  onClick={() =>
                    updateQuery((params) => {
                      params.delete('min_price');
                      params.delete('max_price');
                    })
                  }
                  aria-label="Remove price filter"
                  className="text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
                >
                  <X size={12} />
                </UnstyledButton>
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          <ProductGrid
            initialProducts={products}
            loading={loading}
            emptyMessage={emptyTitle}
          />
        </div>

        {products.length === 0 && emptyLinks.length > 0 ? (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-3">
            {emptyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--ds-border-subtle)] px-4 py-2 text-body-sm text-[var(--ds-text-secondary)] transition-colors hover:border-[var(--ds-text-primary)] hover:text-[var(--ds-text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="mt-14 flex items-center justify-center gap-2">
            <UnstyledButton
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-md border border-[var(--ds-border-subtle)] p-2 text-[var(--ds-text-secondary)] transition-colors hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </UnstyledButton>

            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              const pageNum = index + 1;
              return (
                <UnstyledButton
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`catalog-page-button h-10 w-10 rounded-md transition-colors ${
                    page === pageNum
                      ? 'border border-[var(--ds-text-primary)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]'
                      : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)]'
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={page === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </UnstyledButton>
              );
            })}

            <UnstyledButton
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="rounded-md border border-[var(--ds-border-subtle)] p-2 text-[var(--ds-text-secondary)] transition-colors hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </UnstyledButton>
          </div>
        ) : null}
      </div>

      <Drawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        side="bottom"
        className="max-h-[90vh] sm:inset-y-0 sm:left-0 sm:right-auto sm:h-full sm:max-h-none sm:w-[360px] sm:max-w-[92vw]"
        bodyClassName="p-4 sm:px-5 sm:py-0"
      >
        <FilterSidebar
          basePath={basePath}
          categories={[]}
          tags={tags}
          collections={[]}
          onApply={() => setFilterDrawerOpen(false)}
          onClose={() => setFilterDrawerOpen(false)}
        />
      </Drawer>
    </section>
  );
}
