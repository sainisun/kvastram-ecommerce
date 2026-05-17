'use client';

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

import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/ProductGrid';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { UnstyledButton } from '@/components/ui/Button';

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
  spotlightProducts = [],
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
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
  const currentAttributeCode = searchParams.get('attribute_code');
  const currentAttributeValue = searchParams.get('attribute_value');
  const currentMinPrice = searchParams.get('min_price');
  const currentMaxPrice = searchParams.get('max_price');

  const activeCategory = currentCategoryId
    ? findCategoryById(categories, currentCategoryId)
    : null;
  const activeTag = currentTagId
    ? tags.find((tag) => tag.id === currentTagId)
    : null;
  const activeCollection = currentCollectionId
    ? collections.find((collection) => collection.id === currentCollectionId)
    : null;
  const activeFilterCount = [
    currentCategoryId,
    currentTagId,
    currentCollectionId,
    currentAttributeCode && currentAttributeValue,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(total / limit);

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
          attribute_code: currentAttributeCode || undefined,
          attribute_value: currentAttributeValue || undefined,
          min_price: currentMinPrice ? Number(currentMinPrice) : undefined,
          max_price: currentMaxPrice ? Number(currentMaxPrice) : undefined,
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
    [
      limit,
      currentSort,
      currentCategoryId,
      currentTagId,
      currentCollectionId,
      currentAttributeCode,
      currentAttributeValue,
      currentMinPrice,
      currentMaxPrice,
    ]
  );

  const updateQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const nextQuery = params.toString();
    router.push(nextQuery ? `/products?${nextQuery}` : '/products');
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

  const clearFilter = (
    key:
      | 'category_id'
      | 'tag_id'
      | 'collection_id'
      | 'attribute_code'
      | 'attribute_value'
      | 'min_price'
      | 'max_price'
  ) => {
    updateQuery((params) => params.delete(key));
  };

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
      <div className="bg-[var(--ds-surface-paper)]">
        <div className="kv-container pb-12 pt-6 md:pb-16 md:pt-8 lg:pb-24">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ds-border-subtle)] pb-4">
            <div className="min-w-0">
              <h1 className="catalog-page-heading">Products</h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <UnstyledButton
                ref={filterButtonRef}
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="group inline-flex h-10 items-center gap-2 border border-[var(--ds-text-primary)] bg-[var(--ds-surface-paper)] px-4 text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-text-primary)] hover:text-[var(--ds-text-inverse)]"
                aria-label="Open filters"
              >
                <SlidersHorizontal size={14} />
                Filter
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ds-text-primary)] px-1.5 text-[10px] leading-none text-[var(--ds-text-inverse)] group-hover:bg-[var(--ds-surface-paper)] group-hover:text-[var(--ds-text-primary)]">
                    {activeFilterCount}
                  </span>
                ) : null}
              </UnstyledButton>

              <div className="catalog-count">
                {total > 0
                  ? `${startItem}-${endItem} of ${total} Items`
                  : `${total} Items`}
              </div>

              <div
                className="hidden items-center overflow-hidden border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] sm:flex"
                aria-label="Product grid density"
              >
                <UnstyledButton
                  type="button"
                  onClick={() => setGridDensity('grid')}
                  className={`flex h-10 w-10 items-center justify-center border transition-colors ${
                    gridDensity === 'grid'
                      ? 'border-[var(--ds-text-primary)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]'
                      : 'border-transparent text-[var(--ds-text-muted)] hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)]'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid2X2 size={15} />
                </UnstyledButton>
                <UnstyledButton
                  type="button"
                  onClick={() => setGridDensity('compact')}
                  className={`flex h-10 w-10 items-center justify-center border transition-colors ${
                    gridDensity === 'compact'
                      ? 'border-[var(--ds-text-primary)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-primary)]'
                      : 'border-transparent text-[var(--ds-text-muted)] hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)]'
                  }`}
                  aria-label="Compact view"
                  title="Compact view"
                >
                  <Rows3 size={15} />
                </UnstyledButton>
              </div>

              <div className="flex h-10 items-center gap-2 border border-[var(--ds-border-subtle)] px-3">
                <ArrowUpDown size={14} className="text-[var(--ds-text-muted)]" />
                <Select
                  aria-label="Sort products"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
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

          {activeFilterCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeCategory ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                  {activeCategory.name}
                  <UnstyledButton
                    onClick={() => clearFilter('category_id')}
                    aria-label="Remove category filter"
                    className="text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
                  >
                    <X size={12} />
                  </UnstyledButton>
                </span>
              ) : null}

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

              {activeCollection ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                  {activeCollection.title}
                  <UnstyledButton
                    onClick={() => clearFilter('collection_id')}
                    aria-label="Remove collection filter"
                    className="text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
                  >
                    <X size={12} />
                  </UnstyledButton>
                </span>
              ) : null}

              {currentAttributeCode && currentAttributeValue ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                  Attribute filter
                  <UnstyledButton
                    onClick={() =>
                      updateQuery((params) => {
                        params.delete('attribute_code');
                        params.delete('attribute_value');
                      })
                    }
                    aria-label="Remove attribute filter"
                    className="text-[var(--ds-text-muted)] transition-colors hover:text-[var(--ds-text-primary)]"
                  >
                    <X size={12} />
                  </UnstyledButton>
                </span>
              ) : null}

              {(currentMinPrice || currentMaxPrice) ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-3 py-1">
                  Price:{' '}
                  {[
                    currentMinPrice
                      ? `${Math.round(Number(currentMinPrice) / 100)}+`
                      : null,
                    currentMaxPrice
                      ? `up to ${Math.round(Number(currentMaxPrice) / 100)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
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

          <main className="mt-6 min-w-0">
            <ProductGrid
              initialProducts={products}
              loading={loading}
              spotlightProducts={spotlightProducts}
              density={gridDensity}
            />

            {totalPages > 1 ? (
              <div className="mt-16 flex items-center justify-center gap-2">
                <UnstyledButton
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="rounded-md border border-[var(--ds-border-subtle)] p-2 text-[var(--ds-text-secondary)] transition-colors hover:bg-[var(--ds-surface-parchment)] hover:text-[var(--ds-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </UnstyledButton>

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
          </main>
        </div>
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
          categories={categories}
          tags={tags}
          collections={collections}
          onApply={() => setFilterDrawerOpen(false)}
          onClose={() => setFilterDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}
