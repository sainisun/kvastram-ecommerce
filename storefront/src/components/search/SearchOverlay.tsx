'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import { useShop } from '@/context/shop-context';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; title: string; handle: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentRegion } = useShop();

  // Store the element that triggered the search for focus restoration
  const triggerRef = useRef<HTMLElement | null>(null);

  // Focus trap implementation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose]
  );

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(
          localStorage.getItem('kv_recent_searches') || '[]'
        );
        setRecentSearches(Array.isArray(stored) ? stored.slice(0, 5) : []);
      } catch {
        setRecentSearches([]);
      }
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current)
        setTimeout(() => triggerRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const saveRecentSearch = (term: string) => {
    try {
      const current = JSON.parse(
        localStorage.getItem('kv_recent_searches') || '[]'
      );
      const updated = [
        term,
        ...current.filter((s: string) => s !== term),
      ].slice(0, 5);
      localStorage.setItem('kv_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      /* ignore */
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('kv_recent_searches');
    setRecentSearches([]);
  };

  // Fetch Suggestions/Results
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch full products for simple preview
        const { products } = await api.getProducts({
          search: debouncedQuery,
          limit: 4,
        });

        // Fetch suggestions
        const { suggestions: suggs } = await api.getSuggestions(debouncedQuery);

        setResults(products || []);
        setSuggestions(suggs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    e?.preventDefault();
    const searchTerm = term || query.trim();
    if (searchTerm) {
      saveRecentSearch(searchTerm);
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:z-[60]"
          />

          {/* Search Panel */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 right-0 bg-white z-[70] md:z-[70] shadow-xl rounded-b-3xl overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Search Input Header */}
            <div className="p-6 border-b border-stone-100 flex items-center gap-4">
              <Search className="text-stone-400" size={24} aria-hidden="true" />
              <form onSubmit={handleSearch} className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, collections, and more..."
                  className="w-full text-xl font-medium outline-none placeholder:text-stone-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search query"
                  aria-controls="search-results"
                  aria-expanded={results.length > 0 || suggestions.length > 0}
                  autoComplete="off"
                />
              </form>
              {loading && (
                <Loader2
                  className="animate-spin text-stone-400"
                  size={20}
                  aria-label="Loading results"
                />
              )}
              <button
                onClick={onClose}
                className="p-2 min-h-[44px] min-w-[44px] hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center"
                aria-label="Close search"
                type="button"
              >
                <X size={24} className="text-stone-500" aria-hidden="true" />
              </button>
            </div>

            {/* Content Area */}
            <div
              id="search-results"
              className="overflow-y-auto flex-1 p-8"
              role="region"
              aria-label="Search results"
            >
              {!query && (
                <div className="max-w-4xl mx-auto space-y-10">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-[10px] text-stone-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => handleSearch(undefined, term)}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-900 hover:text-white rounded-full text-sm transition-colors border border-stone-200 hover:border-stone-900 text-stone-700"
                          >
                            <Search size={12} className="opacity-50" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Now */}
                  <div>
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles size={12} /> Trending Now
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        {
                          label: 'Shawls',
                          emoji: '🧣',
                          href: '/products?category=shawls',
                        },
                        {
                          label: 'Kurtis',
                          emoji: '👘',
                          href: '/products?category=kurtis',
                        },
                        {
                          label: 'Sarees',
                          emoji: '🥻',
                          href: '/products?category=sarees',
                        },
                        {
                          label: 'Accessories',
                          emoji: '💍',
                          href: '/products?tag=accessories',
                        },
                        {
                          label: 'Wedding',
                          emoji: '💛',
                          href: '/products?tag=wedding',
                        },
                        { label: 'Sale', emoji: '🔖', href: '/sale' },
                      ].map(({ label, emoji, href }) => (
                        <button
                          key={label}
                          onClick={() => {
                            onClose();
                            router.push(href);
                          }}
                          className="flex flex-col items-center gap-2 p-4 bg-stone-50 hover:bg-stone-900 hover:text-white rounded-xl transition-all duration-200 group border border-stone-100 hover:border-stone-900"
                        >
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {emoji}
                          </span>
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Searches */}
                  <div>
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                      Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Pashmina Shawl',
                        'Anarkali Suit',
                        'Silk Saree',
                        'New Arrivals',
                        'Gift Cards',
                        'Wedding Collection',
                      ].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-4 py-2 bg-stone-50 hover:bg-stone-900 hover:text-white rounded-full text-sm transition-colors border border-stone-200 hover:border-stone-900 text-stone-600"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {query && (
                <div className="max-w-5xl mx-auto">
                  {results.length === 0 && !loading && (
                    <div className="text-center py-12 text-stone-500">
                      No results found for &quot;{query}&quot;
                    </div>
                  )}

                  {/* Suggestions List */}
                  {suggestions.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                        Suggestions
                      </h3>
                      <ul className="space-y-2">
                        {suggestions.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => {
                                onClose();
                                router.push(`/products/${s.handle}`);
                              }}
                              className="flex items-center gap-3 text-stone-600 hover:text-black w-full text-left group"
                            >
                              <Search
                                size={14}
                                className="text-stone-300 group-hover:text-black"
                              />
                              {s.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Product Grid Preview */}
                  {results.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">
                        Products
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {results.map((product) => (
                          <div
                            key={product.id}
                            className="group cursor-pointer"
                            onClick={() => {
                              onClose();
                              router.push(`/products/${product.handle}`);
                            }}
                          >
                            <div className="aspect-[3/4] bg-stone-100 relative rounded-lg overflow-hidden mb-3">
                              {product.thumbnail && (
                                <OptimizedImage
                                  src={product.thumbnail}
                                  alt={product.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-stone-900 group-hover:underline decoration-1 underline-offset-4 line-clamp-1">
                              {product.title}
                            </h4>
                            {product.price !== undefined && (
                              <p className="text-sm text-stone-500 mt-1">
                                from{' '}
                                {formatPrice(
                                  product.price * 100,
                                  currentRegion?.currency_code || 'USD'
                                )}
                                {/* Note: product.price from backend search is formatted generic price, multiplying by 100 to convert back to cents if needed or assuming standard format. Checking backend logic: backend returns `minProductPrice` which is int cents? No, service mapped `price: minProductPrice`. wait, map returns minProductPrice which is variants' amount. Amount is in cents. So we pass cents to `formatPrice`. */}
                                {/* Update: In service we did `return { ...p, price: minProductPrice };`. minProductPrice comes from `pr.amount` which is in cents. formatPrice expects cents? No, `formatPrice` usually expects number. Let's check logic. `new Intl.NumberFormat().format(amount / 100)`. So yes, pass cents. */}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 text-center border-t border-stone-100 pt-6">
                        <button
                          onClick={handleSearch}
                          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:underline"
                        >
                          View All Results <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-8 py-3.5 text-xs text-stone-400 flex justify-between items-center border-t border-stone-100">
              <span>
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono">
                  Enter
                </kbd>{' '}
                to search
              </span>
              <span className="hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px] font-mono">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
