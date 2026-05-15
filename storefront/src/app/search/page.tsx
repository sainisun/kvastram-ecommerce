'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useCurrency } from '@/context/currency-context';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { Loader2, Filter, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import type { Product, MoneyAmount } from '@/types';
import { getProductDisplayTitle } from '@/lib/product-title';
import {
  storefrontAttributeFilters,
  storefrontDiscoveryQuickLinks,
} from '@/config/storefront-discovery';
import { storefrontTrust } from '@/config/storefront-trust';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{
    min?: string;
    max?: string;
    attributeCode?: string;
    attributeValue?: string;
  }>({});
  const { currentRegion } = useShop();
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const { addItem } = useCart();
  const hasActiveFilters = Boolean(
    appliedFilters.min ||
      appliedFilters.max ||
      (appliedFilters.attributeCode && appliedFilters.attributeValue)
  );

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Convert price to cents if necessary? API expects cents?
        // api.getProducts docs say params.min_price: number.
        // Assuming backend expects cents.
        const params: {
          search: string;
          limit: number;
          sort: string;
          min_price?: number;
          max_price?: number;
          attribute_code?: string;
          attribute_value?: string;
        } = {
          search: query,
          limit: 50,
          sort: sort,
        };
        if (appliedFilters.min)
          params.min_price = Number(appliedFilters.min) * 100;
        if (appliedFilters.max)
          params.max_price = Number(appliedFilters.max) * 100;
        if (appliedFilters.attributeCode && appliedFilters.attributeValue) {
          params.attribute_code = appliedFilters.attributeCode;
          params.attribute_value = appliedFilters.attributeValue;
        }

        const data = await api.getProducts(params);
        setProducts(data.products || []);
      } catch (error) {
        console.error('Failed to search products', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [query, sort, appliedFilters]);

  const handleFilterApply = () => {
    setAppliedFilters({
      min: minPrice,
      max: maxPrice,
      attributeCode: appliedFilters.attributeCode,
      attributeValue: appliedFilters.attributeValue,
    });
    setShowFilters(false);
  };

  const setAttributeFilter = (code: string, value: string) => {
    setAppliedFilters((prev) => {
      const isSame =
        prev.attributeCode === code && prev.attributeValue === value;

      return {
        ...prev,
        attributeCode: isSame ? undefined : code,
        attributeValue: isSame ? undefined : value,
      };
    });
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedFilters({});
    setShowFilters(false);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    const btn = e.currentTarget as HTMLButtonElement;

    if (!product.variants || product.variants.length === 0) return;
    const variant = product.variants[0];
    const prices = variant.prices || [];
    const priceObj =
      prices.find(
        (p: MoneyAmount) =>
          p.currency_code === currentRegion?.currency_code?.toLowerCase()
      ) || prices[0];

    if (!priceObj) return;

    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: getProductDisplayTitle(product.title),
      price: priceObj.amount,
      currency: priceObj.currency_code,
      thumbnail: product.thumbnail || undefined,
      material: product.material || undefined,
      origin: product.origin_country || undefined,
      sku: variant.sku || undefined,
      description: product.description || undefined,
    });

    // Simple feedback
    const originalText = btn.innerText;
    btn.innerText = 'Added';
    setTimeout(() => (btn.innerText = originalText), 1000);
  };

  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="search-back-link mb-6 inline-flex items-center gap-2 pl-1 hover:text-black"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="search-title mb-4">
            Search Results
          </h1>
          <p className="text-stone-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Searching for
                &quot;{query}&quot;...
              </span>
            ) : (
              <span>
                Found {products.length} results for &quot;
                <span className="search-query">{query}</span>&quot;
              </span>
            )}
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-y border-stone-100 py-4 mb-12 gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="search-toolbar-button flex items-center gap-2 hover:text-stone-600"
            >
              <Filter size={16} /> Filters
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-4 w-64 bg-white shadow-xl z-20 border border-stone-100 p-6">
                <h4 className="search-filter-title mb-4">Price Range</h4>
                <div className="flex items-center gap-2 mb-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleFilterApply()}
                  className="search-apply-button w-full bg-stone-900 py-2"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="search-toolbar-button flex items-center gap-2 hover:text-stone-600"
            >
              Sort by:{' '}
              {sort === 'relevance'
                ? 'Featured'
                : sort === 'price_asc'
                  ? 'Price: Low to High'
                  : sort === 'price_desc'
                    ? 'Price: High to Low'
                    : 'Newest'}
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl z-20 border border-stone-100 rounded-sm overflow-hidden py-1">
                <button
                  onClick={() => {
                    setSort('relevance');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-stone-50"
                >
                  Featured
                </button>
                <button
                  onClick={() => {
                    setSort('newest');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-stone-50"
                >
                  Newest Arrivals
                </button>
                <button
                  onClick={() => {
                    setSort('price_asc');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-stone-50"
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => {
                    setSort('price_desc');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-stone-50"
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {storefrontAttributeFilters.flatMap((group) =>
            group.values.slice(0, 3).map((item) => {
              const isActive =
                appliedFilters.attributeCode === group.code &&
                appliedFilters.attributeValue === item.value;

              return (
                <button
                  key={`${group.code}-${item.value}`}
                  type="button"
                  onClick={() => setAttributeFilter(group.code, item.value)}
                  className={`rounded-full border px-4 py-2 text-body-sm transition-colors ${
                    isActive
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-900 hover:text-stone-900'
                  }`}
                >
                  {group.label}: {item.label}
                </button>
              );
            })
          )}
        </div>

        <div className="mb-10 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
            <p className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
              Guided Discovery
            </p>
            <h2 className="mt-3 text-body-xl font-serif text-stone-900">
              Browse beyond one keyword
            </h2>
            <p className="mt-3 max-w-2xl text-body-sm text-stone-600">
              If your query is broad, jump into occasion, material, and color
              routes to keep momentum instead of bouncing.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {storefrontDiscoveryQuickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-body-sm text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
              Purchase Help
            </p>
            <h2 className="mt-3 text-body-xl font-serif text-stone-900">
              Need confidence before checkout?
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              Shipping, returns, and payment guidance are available before you
              place the order.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={storefrontTrust.policyRoutes.shipping}
                className="rounded-full border border-stone-200 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
              >
                Shipping
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.returns}
                className="rounded-full border border-stone-200 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
              >
                Returns
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="rounded-full border border-stone-200 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
              >
                Payment Help
              </Link>
            </div>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <span className="text-body-sm text-stone-600">Active filters:</span>
            {appliedFilters.attributeCode && appliedFilters.attributeValue ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-body-xs text-stone-700">
                {storefrontAttributeFilters.find(
                  (group) => group.code === appliedFilters.attributeCode
                )?.label || 'Filter'}
                :{' '}
                {storefrontAttributeFilters
                  .find((group) => group.code === appliedFilters.attributeCode)
                  ?.values.find(
                    (item) => item.value === appliedFilters.attributeValue
                  )?.label || appliedFilters.attributeValue}
              </span>
            ) : null}
            {appliedFilters.min || appliedFilters.max ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-body-xs text-stone-700">
                Price:{' '}
                {[
                  appliedFilters.min ? `${appliedFilters.min}+` : null,
                  appliedFilters.max ? `up to ${appliedFilters.max}` : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
            ) : null}
            <button
              type="button"
              onClick={clearFilters}
              className="text-body-xs uppercase tracking-token-wider text-stone-900 underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {/* Results Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => {
                const displayTitle = getProductDisplayTitle(product.title);
                return (
                  <Link
                    href={`/products/${product.handle || product.id}`}
                    key={product.id}
                    className="group block"
                  >
                    <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-stone-100">
                      {product.thumbnail ? (
                        <OptimizedImage
                          src={product.thumbnail}
                          alt={displayTitle}
                          fill
                          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="search-no-image flex h-full w-full items-center justify-center italic">
                          No Image
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="search-quick-add w-full bg-white py-3 shadow-lg transition-colors hover:bg-stone-900 hover:text-white"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-center">
                      <h3 className="search-product-title transition-colors group-hover:text-stone-600">
                        {displayTitle}
                      </h3>
                      <p className="search-product-price pt-1">
                        {(() => {
                          const prices = product.variants?.[0]?.prices || [];
                          const p =
                            prices.find(
                              (x: MoneyAmount) =>
                                x.currency_code?.toLowerCase() === 'inr'
                            ) || prices[0];
                          return p
                            ? formatCurrencyPrice(p.amount)
                            : 'Contact for price';
                        })()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
                    Still Deciding?
                  </p>
                  <h2 className="mt-2 text-body-xl font-serif text-stone-900">
                    Keep browsing with curated storefront routes
                  </h2>
                  <p className="mt-3 max-w-2xl text-body-sm text-stone-600">
                    Switch from search into broader discovery if you want faster
                    comparison and lower checkout hesitation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="rounded-full bg-stone-900 px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
                  >
                    Shop All
                  </Link>
                  <Link
                    href="/collections"
                    className="rounded-full border border-stone-300 px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-white"
                  >
                    Explore Collections
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-lg">
            <p className="search-empty-copy mb-4">
              No products found matching your search.
            </p>
            <p className="mx-auto mb-6 max-w-xl text-body-sm text-stone-500">
              Try removing filters, using a broader keyword, or jump into one of
              our curated discovery routes below.
            </p>
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {storefrontDiscoveryQuickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-body-sm text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="search-empty-action mb-4 inline-block border border-stone-900 px-8 py-3 text-stone-900 hover:bg-stone-100"
              >
                Remove Filters
              </button>
            ) : null}
            <div>
            <Link
              href="/products"
              className="search-empty-action inline-block bg-stone-900 px-8 py-3 hover:bg-stone-800"
            >
              Browse All Products
            </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
