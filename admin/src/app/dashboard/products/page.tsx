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
  Upload,
} from 'lucide-react';
import { exportToCSV, formatProductsForExport } from '@/lib/csv-export';
import { api } from '@/lib/api';

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

/* ── Status helpers ── */
const STATUS_STYLE: Record<string, { badge: string; border: string }> = {
  published: { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  draft:     { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  archived:  { badge: 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]', border: 'border-[var(--surface-container-high)]' },
};
function getStatusStyle(status: string) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.draft;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as ListingFilter) ?? 'all';
  const viewMode = (searchParams.get('view') as ViewMode) ?? 'grid';
  const sortMode = (searchParams.get('sort') as SortMode) ?? 'newest';
  const categoryFilter = searchParams.get('category') ?? 'all';
  const collectionFilter = searchParams.get('collection') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all' || value === 'grid' || value === 'newest' || (key === 'page' && value === '1')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
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
      const result = await api.getProducts(limit, offset, search, statusParam, categoryFilter, collectionFilter);
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

  const fetchStats = async () => {
    try {
      const data = await api.getProductStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to load product stats:', error);
    }
  };

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchStats()]);
  }, [fetchProducts]);

  const getProductPrice = (product: Product) => {
    if (Array.isArray(product.prices) && product.prices[0]?.amount) return product.prices[0].amount;
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'object' && product.price?.amount) return product.price.amount;
    return null;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);
  };

  const filteredProducts = products
    .filter((p) => statusFilter === 'out_of_stock' ? p.total_inventory === 0 : true)
    .sort((a, b) => {
      if (sortMode === 'stock') return b.total_inventory - a.total_inventory;
      if (sortMode === 'price') return (getProductPrice(b) || 0) - (getProductPrice(a) || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const listingCounts = {
    all: stats?.total_products || 0,
    published: stats?.published_products || 0,
    draft: stats?.draft_products || 0,
    out_of_stock: stats?.out_of_stock_products || 0,
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedProducts);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProducts(next);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const nextStatus = product.status === 'published' ? 'draft' : 'published';
      await api.bulkUpdateProducts([product.id], { status: nextStatus });
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) { console.error('Failed to toggle product status:', error); }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(productId);
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) { console.error('Failed to delete product:', error); }
  };

  const handleBulkStatus = async (status: 'published' | 'draft' | 'archived') => {
    if (selectedProducts.size === 0) return;
    try {
      await api.bulkUpdateProducts(Array.from(selectedProducts), { status });
      setSelectedProducts(new Set());
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) { console.error('Failed bulk update:', error); }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Delete ${selectedProducts.size} selected products?`)) return;
    try {
      await api.bulkDeleteProducts(Array.from(selectedProducts));
      setSelectedProducts(new Set());
      await Promise.all([fetchProducts(), fetchStats()]);
    } catch (error) { console.error('Failed bulk delete:', error); }
  };

  /* ── Loading skeleton ── */
  if (loading && products.length === 0) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="h-10 w-40 bg-[var(--surface-container-high)] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[var(--surface-container-lowest)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const FILTER_TABS: { label: string; value: ListingFilter }[] = [
    { label: 'All',          value: 'all' },
    { label: 'Active',       value: 'published' },
    { label: 'Draft',        value: 'draft' },
    { label: 'Out of stock', value: 'out_of_stock' },
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">

      {/* ── Heading ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
            Products
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
            Manage listings, drafts, stock health, and bulk actions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void Promise.all([fetchProducts(), fetchStats()])}
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => exportToCSV(formatProductsForExport(products), 'products')}
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <Download size={13} /> Export
          </button>
          <Link
            href="/dashboard/products/bulk-import"
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <Upload size={13} /> Bulk Import
          </Link>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={13} /> Add product
          </Link>
        </div>
      </section>

      {/* ── Stats bento ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total',        value: stats?.total_products || 0 },
          { label: 'Active',       value: stats?.published_products || 0 },
          { label: 'Drafts',       value: stats?.draft_products || 0 },
          { label: 'Out of stock', value: stats?.out_of_stock_products || 0, warn: (stats?.out_of_stock_products || 0) > 0 },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] flex flex-col gap-3 ${card.warn ? 'ring-1 ring-[var(--error)]/30' : ''}`}
          >
            <Package size={18} className="text-[var(--on-surface-variant)]" />
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{card.label}</p>
              <p className={`text-xl font-black mt-0.5 ${card.warn ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Filters ── */}
      <section className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-4 space-y-4">
        {/* Filter tabs + view toggle */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-60">{listingCounts[tab.value]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[var(--surface-container-low)] p-1">
            {([['grid', Grid2X2], ['list', List]] as [ViewMode, typeof Grid2X2][]).map(([mode, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  viewMode === mode
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--on-surface-variant)]'
                }`}
              >
                <Icon size={12} /> {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Search + selects */}
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" />
            <input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] pl-10 pr-4 py-2.5 text-xs text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price">By price</option>
            <option value="stock">By stock</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={collectionFilter}
            onChange={(e) => { setCollectionFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-xs text-[var(--on-surface)] focus:outline-none"
          >
            <option value="all">All collections</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Bulk actions bar */}
        {selectedProducts.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--surface-container-low)] px-4 py-3 text-xs">
            <span className="font-bold text-[var(--on-surface)]">{selectedProducts.size} selected</span>
            {(['published', 'draft', 'archived'] as const).map((s) => (
              <button key={s} type="button" onClick={() => void handleBulkStatus(s)}
                className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 py-1.5 font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-colors capitalize">
                {s}
              </button>
            ))}
            <button type="button" onClick={() => void handleBulkDelete()}
              className="rounded-full border border-[var(--error)]/20 bg-[var(--error-container)] px-3 py-1.5 font-bold uppercase tracking-widest text-[var(--on-error-container)] hover:opacity-80 transition-opacity">
              Delete
            </button>
          </div>
        )}
      </section>

      {/* ── Product list ── */}
      {loading ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl px-4 py-12 text-center text-sm text-[var(--on-surface-variant)]">
          Loading listings…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-2xl px-4 py-12 text-center text-sm text-[var(--on-surface-variant)]">
          No products match the current filters.
        </div>
      ) : viewMode === 'grid' ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const price = getProductPrice(product);
            const outOfStock = product.total_inventory === 0;
            const lowStock = product.total_inventory > 0 && product.total_inventory < 5;
            const s = getStatusStyle(product.status);

            return (
              <div key={product.id} className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] overflow-hidden">
                <div className="relative aspect-[4/3] bg-[var(--surface-container-low)]">
                  <button
                    type="button"
                    onClick={() => toggleSelection(product.id)}
                    className={`absolute left-3 top-3 z-10 h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                      selectedProducts.has(product.id)
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                        : 'border-[var(--outline-variant)] bg-white/90 text-[var(--on-surface)]'
                    }`}
                    aria-label={`Select ${product.title}`}
                  >
                    {selectedProducts.has(product.id) ? '✓' : ''}
                  </button>
                  {product.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--on-surface-variant)]">
                      <Package size={22} />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--on-surface)] truncate">{product.title}</p>
                      <p className="text-xs text-[var(--on-surface-variant)] mt-0.5">{formatCurrency(price)}</p>
                    </div>
                    <span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex-shrink-0`}>
                      {product.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[var(--surface-container-low)] px-3 py-2 text-xs">
                    <span className="text-[var(--on-surface-variant)]">Stock</span>
                    <span className={`font-bold ${outOfStock ? 'text-[var(--error)]' : lowStock ? 'text-[var(--secondary-container)]' : 'text-[var(--on-surface)]'}`}>
                      {product.total_inventory}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button type="button" onClick={() => void handleToggleActive(product)}
                      className="rounded-full border border-[var(--outline-variant)] py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors">
                      {product.status === 'published' ? 'Pause' : 'Activate'}
                    </button>
                    <Link href={`/dashboard/products/${product.id}`}
                      className="rounded-full border border-[var(--outline-variant)] py-2 text-center text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors">
                      Edit
                    </Link>
                    <button type="button" onClick={() => void handleDelete(product.id)}
                      className="rounded-full border border-[var(--error)]/20 bg-[var(--error-container)] py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--on-error-container)] hover:opacity-80 transition-opacity">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* List view */
        <section className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] divide-y divide-[var(--surface-container-low)]">
          {filteredProducts.map((product) => {
            const price = getProductPrice(product);
            const outOfStock = product.total_inventory === 0;
            const lowStock = product.total_inventory > 0 && product.total_inventory < 5;
            const s = getStatusStyle(product.status);

            return (
              <div key={product.id} className={`flex items-center gap-4 p-4 border-l-4 ${s.border} hover:bg-[var(--surface-container-low)]/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl`}>
                <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => toggleSelection(product.id)}
                  className="h-4 w-4 rounded border-[var(--outline-variant)]" />
                <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--surface-container-low)] flex items-center justify-center">
                  {product.thumbnail
                    ? <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> // eslint-disable-line @next/next/no-img-element
                    : <Package size={18} className="text-[var(--on-surface-variant)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--on-surface)] truncate">{product.title}</p>
                  <p className="text-[10px] text-[var(--on-surface-variant)]">/products/{product.handle}</p>
                </div>
                <div className="hidden md:block text-xs font-bold text-[var(--on-surface)]">{formatCurrency(price)}</div>
                <div className={`hidden md:block text-xs font-bold ${outOfStock ? 'text-[var(--error)]' : lowStock ? 'text-[var(--on-secondary-container)]' : 'text-[var(--on-surface)]'}`}>
                  {product.total_inventory}
                </div>
                <span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase`}>{product.status}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => void handleToggleActive(product)}
                    className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                    {product.status === 'published' ? 'Pause' : 'Activate'}
                  </button>
                  <Link href={`/dashboard/products/${product.id}`}
                    className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">
                    Edit
                  </Link>
                  <button type="button" onClick={() => void handleDelete(product.id)}
                    className="h-8 w-8 rounded-full border border-[var(--error)]/20 bg-[var(--error-container)] flex items-center justify-center text-[var(--on-error-container)] hover:opacity-80">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
            Previous
          </button>
          <span className="text-[var(--on-surface-variant)]">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 font-bold text-[var(--on-surface)] disabled:opacity-40">
            Next
          </button>
        </div>
      )}

    </div>
  );
}
