'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  Grid2X2,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { exportToCSV, formatProductsForExport } from '@/lib/csv-export';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

type ListingFilter = 'all' | 'published' | 'draft' | 'out_of_stock';
type ViewMode = 'grid' | 'list';
type SortMode = 'newest' | 'price' | 'stock';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  thumbnail: string | null;
  created_at: string;
  variant_count: number;
  total_inventory: number;
  prices?: Array<{ amount: number; currency_code?: string }>;
  price?: number | { amount?: number; currency_code?: string };
}

interface ProductStats {
  total_products: number;
  published_products: number;
  draft_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CollectionOption {
  id: string;
  title: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // UX-004: Read filter state from URL so it persists on refresh and is shareable
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as ListingFilter) ?? 'all';
  const viewMode = (searchParams.get('view') as ViewMode) ?? 'grid';
  const sortMode = (searchParams.get('sort') as SortMode) ?? 'newest';
  const categoryFilter = searchParams.get('category') ?? 'all';
  const collectionFilter = searchParams.get('collection') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  // Helper to update one URL param while keeping the rest
  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all' || value === 'grid' || value === 'newest' || (key === 'page' && value === '1')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page to 1 when filters change (but not when page itself changes)
    if (key !== 'page') params.delete('page');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const setSearch = (v: string) => setParam('q', v);
  const setStatusFilter = (v: ListingFilter) => setParam('status', v);
  const setViewMode = (v: ViewMode) => setParam('view', v);
  const setSortMode = (v: SortMode) => setParam('sort', v);
  const setCategoryFilter = (v: string) => setParam('category', v);
  const setCollectionFilter = (v: string) => setParam('collection', v);
  const setPage = (v: number) => setParam('page', String(v));

  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoryData, collectionData] = await Promise.all([
          api.getCategories(),
          api.getCollections(),
        ]);
        setCategories(categoryData.categories || []);
        setCollections(collectionData.collections || []);
      } catch (error) {
        console.error('Failed to load product filters:', error);
      }
    };

    void loadFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 20;
      const offset = (page - 1) * limit;
      const statusParam = statusFilter === 'out_of_stock' ? 'all' : statusFilter;
      const result = await api.getProducts(
        limit,
        offset,
        search,
        statusParam,
        categoryFilter,
        collectionFilter
      );

      setProducts(result?.data || result || []);
      setTotalPages(result?.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, collectionFilter]);

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchStats()]);
  }, [fetchProducts]);

  const fetchStats = async () => {
    try {
      const data = await api.getProductStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to load product stats:', error);
    }
  };

  const getProductPrice = (product: Product) => {
    if (Array.isArray(product.prices) && product.prices[0]?.amount) {
      return product.prices[0].amount;
    }
    if (typeof product.price === 'number') {
      return product.price;
    }
    if (typeof product.price === 'object' && product.price?.amount) {
      return product.price.amount;
    }
    return null;
  };

  const formatCurrency = (amount: number | null, currency = 'USD') => {
    if (amount === null) {
      return 'Price in detail view';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const filteredProducts = products
    .filter((product) =>
      statusFilter === 'out_of_stock' ? product.total_inventory === 0 : true
    )
    .sort((left, right) => {
      if (sortMode === 'stock') {
        return right.total_inventory - left.total_inventory;
      }
      if (sortMode === 'price') {
        return (getProductPrice(right) || 0) - (getProductPrice(left) || 0);
      }
      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });

  const listingCounts = {
    all: stats?.total_products || 0,
    published: stats?.published_products || 0,
    draft: stats?.draft_products || 0,
    out_of_stock: stats?.out_of_stock_products || 0,
  };

  const toggleSelection = (productId: string) => {
    const next = new Set(selectedProducts);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedProducts(next);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const nextStatus = product.status === 'published' ? 'draft' : 'published';
      await api.bulkUpdateProducts([product.id], { status: nextStatus });
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleBulkStatus = async (status: 'published' | 'draft' | 'archived') => {
    if (selectedProducts.size === 0) {
      return;
    }

    try {
      await api.bulkUpdateProducts(Array.from(selectedProducts), { status });
      setSelectedProducts(new Set());
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed bulk update:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      return;
    }

    if (!window.confirm(`Delete ${selectedProducts.size} selected products?`)) {
      return;
    }

    try {
      await api.bulkDeleteProducts(Array.from(selectedProducts));
      setSelectedProducts(new Set());
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) {
      console.error('Failed bulk delete:', error);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Listings"
        title="Products"
        description="Manage active listings, drafts, stock health, and bulk catalog actions from a single responsive workspace."
        actions={
          <>
            <ActionButton
              onClick={() => void Promise.all([fetchProducts(), fetchStats()])}
              icon={RefreshCw}
              variant="secondary"
            >
              Refresh
            </ActionButton>
            <ActionButton onClick={() => exportToCSV(formatProductsForExport(products), 'products')} icon={Download} variant="secondary">
              Export
            </ActionButton>
            <ActionButton href="/dashboard/products/new" icon={Plus}>
              Add product
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total products"
          value={stats?.total_products || 0}
          icon={Package}
          hint="Across every status"
        />
        <MetricCard
          label="Active listings"
          value={stats?.published_products || 0}
          icon={Package}
          hint="Visible on storefront"
          tone="success"
        />
        <MetricCard
          label="Drafts"
          value={stats?.draft_products || 0}
          icon={Package}
          hint="Hidden from customers"
          tone="warning"
        />
        <MetricCard
          label="Low / out of stock"
          value={`${stats?.low_stock_products || 0} / ${stats?.out_of_stock_products || 0}`}
          icon={Package}
          hint="Inventory alerts"
          tone={(stats?.out_of_stock_products || 0) > 0 ? 'danger' : 'accent'}
        />
      </div>

      <Surface className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <SegmentedTabs
              value={statusFilter}
              options={[
                { label: 'All', value: 'all', count: listingCounts.all },
                {
                  label: 'Active',
                  value: 'published',
                  count: listingCounts.published,
                },
                { label: 'Draft', value: 'draft', count: listingCounts.draft },
                {
                  label: 'Out of stock',
                  value: 'out_of_stock',
                  count: listingCounts.out_of_stock,
                },
              ]}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />

            <div className="flex items-center gap-2 rounded-full border border-[var(--kv-border)] bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  viewMode === 'grid'
                    ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                    : 'text-[var(--kv-muted)]'
                }`}
              >
                <Grid2X2 size={16} />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                    : 'text-[var(--kv-muted)]'
                }`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
              />
              <input
                type="search"
                placeholder="Search by product name"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full border px-11 py-3 text-sm"
              />
            </div>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="border px-4 py-3 text-sm"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price">Sort: Price</option>
              <option value="stock">Sort: Stock</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="border px-4 py-3 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={collectionFilter}
              onChange={(event) => {
                setCollectionFilter(event.target.value);
                setPage(1);
              }}
              className="border px-4 py-3 text-sm"
            >
              <option value="all">All collections</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </select>
          </div>

          {selectedProducts.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
              <span className="font-medium text-[var(--kv-text)]">
                {selectedProducts.size} selected
              </span>
              <button
                type="button"
                onClick={() => void handleBulkStatus('published')}
                className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 font-medium text-[var(--kv-text)]"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => void handleBulkStatus('draft')}
                className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 font-medium text-[var(--kv-text)]"
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => void handleBulkStatus('archived')}
                className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 font-medium text-[var(--kv-text)]"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                className="rounded-full border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 px-4 py-2 font-medium text-[var(--kv-danger)]"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </Surface>

      {loading ? (
        <Surface className="px-4 py-12 text-center text-sm text-[var(--kv-muted)] md:px-6">
          Loading listings…
        </Surface>
      ) : filteredProducts.length === 0 ? (
        <Surface className="px-4 py-12 text-center text-sm text-[var(--kv-muted)] md:px-6">
          No products match the current filters.
        </Surface>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const price = getProductPrice(product);
            const outOfStock = product.total_inventory === 0;
            const lowStock = product.total_inventory > 0 && product.total_inventory < 5;

            return (
              <Surface key={product.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-[var(--kv-soft)]">
                  <button
                    type="button"
                    onClick={() => toggleSelection(product.id)}
                    className={`absolute left-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border ${
                      selectedProducts.has(product.id)
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent)] text-white'
                        : 'border-[var(--kv-border)] bg-white text-[var(--kv-text)]'
                    }`}
                    aria-label={`Select ${product.title}`}
                  >
                    {selectedProducts.has(product.id) ? '✓' : ''}
                  </button>
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--kv-muted)]">
                      <Package size={22} />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--kv-text)]">
                        {product.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--kv-muted)]">
                        {formatCurrency(price)}
                      </p>
                    </div>
                    <StatusBadge
                      status={product.status === 'published' ? 'active' : product.status}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-[1rem] bg-[var(--kv-soft)] px-4 py-3 text-sm">
                    <span className="text-[var(--kv-muted)]">Stock</span>
                    <span
                      className={`font-semibold ${
                        outOfStock
                          ? 'text-[var(--kv-danger)]'
                          : lowStock
                            ? 'text-[var(--kv-warning)]'
                            : 'text-[var(--kv-text)]'
                      }`}
                    >
                      {product.total_inventory}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(product)}
                      className="rounded-2xl border border-[var(--kv-border)] px-3 py-3 text-xs font-semibold text-[var(--kv-text)]"
                    >
                      {product.status === 'published' ? 'Pause' : 'Activate'}
                    </button>
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="rounded-2xl border border-[var(--kv-border)] px-3 py-3 text-center text-xs font-semibold text-[var(--kv-text)]"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product.id)}
                      className="rounded-2xl border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 px-3 py-3 text-xs font-semibold text-[var(--kv-danger)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      ) : (
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--kv-border)] text-left text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProducts.size === filteredProducts.length
                      }
                      onChange={() =>
                        setSelectedProducts(
                          selectedProducts.size === filteredProducts.length
                            ? new Set()
                            : new Set(filteredProducts.map((product) => product.id))
                        )
                      }
                      className="h-4 w-4 rounded border-[var(--kv-border)]"
                    />
                  </th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const price = getProductPrice(product);
                  const outOfStock = product.total_inventory === 0;
                  const lowStock =
                    product.total_inventory > 0 && product.total_inventory < 5;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-[var(--kv-border)]/70 text-sm text-[var(--kv-text)]"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="h-4 w-4 rounded border-[var(--kv-border)]"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--kv-soft)]">
                            {product.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.thumbnail}
                                alt={product.title}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <Package
                                size={18}
                                className="text-[var(--kv-muted)]"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{product.title}</p>
                            <p className="text-xs text-[var(--kv-muted)]">
                              /products/{product.handle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(price)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${
                            outOfStock
                              ? 'text-[var(--kv-danger)]'
                              : lowStock
                                ? 'text-[var(--kv-warning)]'
                                : 'text-[var(--kv-text)]'
                          }`}
                        >
                          {product.total_inventory}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={
                            product.status === 'published' ? 'active' : product.status
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(product)}
                            className="rounded-full border border-[var(--kv-border)] px-3 py-2 text-xs font-semibold text-[var(--kv-text)]"
                          >
                            {product.status === 'published' ? 'Pause' : 'Activate'}
                          </button>
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="rounded-full border border-[var(--kv-border)] px-3 py-2 text-xs font-semibold text-[var(--kv-text)]"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleDelete(product.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 text-[var(--kv-danger)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-[var(--kv-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
