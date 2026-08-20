'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { api } from '@/lib/api';

export interface AssignedProduct {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string | null;
  status?: string;
  skus?: string[];
}

interface ProductAssignmentPickerProps {
  selectedProducts: AssignedProduct[];
  onChange: (products: AssignedProduct[]) => void;
  label?: string;
  helpText?: string;
}

export default function ProductAssignmentPicker({
  selectedProducts,
  onChange,
  label = 'Assigned Products',
  helpText = 'Search and select products for this section.',
}: ProductAssignmentPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssignedProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((product) => product.id)),
    [selectedProducts]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.searchFeaturedProductCandidates(trimmed);
        setResults(response.products || []);
      } catch (error) {
        console.error('Failed to search products:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  const addProduct = (product: AssignedProduct) => {
    if (selectedIds.has(product.id)) return;
    onChange([...selectedProducts, product]);
    setQuery('');
    setResults([]);
  };

  const removeProduct = (id: string) => {
    onChange(selectedProducts.filter((product) => product.id !== id));
  };

  return (
    <section className="space-y-4 rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-[var(--kv-text)]">{label}</h2>
        <p className="mt-1 text-sm text-[var(--kv-muted)]">{helpText}</p>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-xl border border-[var(--kv-border)] py-2.5 pl-10 pr-3 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
          placeholder="Search products by name or SKU"
        />
      </div>

      {searching ? <p className="text-sm text-[var(--kv-muted)]">Searching products...</p> : null}

      {results.length > 0 ? (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-[var(--kv-border)] p-3">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              disabled={selectedIds.has(product.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--kv-border)] px-3 py-2 text-left transition hover:bg-[var(--kv-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-[var(--kv-soft)]">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--kv-text)]">
                  {product.title}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.14em] text-[var(--kv-muted)]">
                  {product.skus?.join(', ') || product.status || 'Product'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {selectedProducts.length > 0 ? (
        <div className="space-y-2">
          {selectedProducts.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--kv-border)] bg-[var(--kv-soft)] px-3 py-2"
            >
              <span className="w-6 text-xs font-bold text-[var(--kv-muted)]">
                {index + 1}
              </span>
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[var(--kv-soft)]">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--kv-text)]">
                  {product.title}
                </p>
                <p className="truncate text-xs text-[var(--kv-muted)]">
                  {product.handle ? `/products/${product.handle}` : product.status || 'Selected'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                className="rounded-full p-2 text-[var(--kv-muted)] transition hover:bg-[var(--kv-card)] hover:text-[var(--kv-danger)]"
                aria-label={`Remove ${product.title}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--kv-border)] p-6 text-center text-sm text-[var(--kv-muted)]">
          No products selected yet.
        </div>
      )}
    </section>
  );
}
