'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { Loader2, Filter, ArrowLeft } from 'lucide-react';
import type { Product, MoneyAmount } from '@/types';

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
  }>({});
  const { currentRegion } = useShop();
  const { addItem } = useCart();

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
        } = {
          search: query,
          limit: 50,
          sort: sort,
        };
        if (appliedFilters.min)
          params.min_price = Number(appliedFilters.min) * 100;
        if (appliedFilters.max)
          params.max_price = Number(appliedFilters.max) * 100;

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
    });
    setShowFilters(false);
  };

  const formatPrice = (product: Product) => {
    if (!currentRegion) return 'Loading...';
    if (!product.variants || product.variants.length === 0)
      return 'Unavailable';

    const prices = product.variants[0].prices || [];
    const price = prices.find(
      (p: MoneyAmount) =>
        p.currency_code === currentRegion.currency_code?.toLowerCase()
    );
    const fallback = prices[0];

    const validPrice = price || fallback;

    if (validPrice) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: validPrice.currency_code.toUpperCase(),
      }).format(validPrice.amount / 100);
    }

    return 'Contact for price';
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
      title: product.title,
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
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-black mb-6 uppercase tracking-widest pl-1"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif text-stone-900 mb-4">
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
                <span className="text-black font-medium">{query}</span>&quot;
              </span>
            )}
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-y border-stone-100 py-4 mb-12 gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-stone-600"
            >
              <Filter size={16} /> Filters
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-4 w-64 bg-white shadow-xl z-20 border border-stone-100 p-6">
                <h4 className="font-serif text-lg mb-4">Price Range</h4>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full border p-2 text-sm"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full border p-2 text-sm"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleFilterApply()}
                  className="w-full bg-stone-900 text-white py-2 text-xs font-bold uppercase"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-stone-600"
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
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                >
                  Featured
                </button>
                <button
                  onClick={() => {
                    setSort('newest');
                    setShowSortMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                >
                  Newest Arrivals
                </button>
                <button
                  onClick={() => {
                    setSort('price_asc');
                    setShowSortMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => {
                    setSort('price_desc');
                    setShowSortMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => (
              <Link
                href={`/products/${product.handle}`}
                key={product.id}
                className="group block"
              >
                <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden mb-4 rounded-sm">
                  {product.thumbnail ? (
                    <OptimizedImage
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 italic">
                      No Image
                    </div>
                  )}

                  {/* Quick Add Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className="w-full bg-white text-stone-900 py-3 text-xs font-bold uppercase tracking-wider hover:bg-stone-900 hover:text-white transition-colors shadow-lg"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-sm font-medium text-stone-900 pt-1">
                    {formatPrice(product)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-stone-50 rounded-lg">
            <p className="text-stone-500 mb-4">
              No products found matching your search.
            </p>
            <Link
              href="/products"
              className="inline-block bg-stone-900 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-800"
            >
              Browse All Products
            </Link>
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
