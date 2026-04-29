'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts({ limit: 50, sort: 'price' })
      .then((data) => {
        // Filter for discounted products (would need backend to properly filter sale items)
        const saleProducts = (data.products || []).slice(0, 12);
        setProducts(saleProducts);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-amber-100 bg-amber-50 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] space-y-4 text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase">
            Limited Time
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900">
            Sale
          </h1>
          <p className="max-w-xl mx-auto text-stone-600 font-light">
            Selected styles at special prices. Limited quantities available.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <ProductGrid initialProducts={products} loading={loading} />

        {!loading && products.length === 0 && (
          <div className="py-12 text-center md:py-16 lg:py-20">
            <p className="text-stone-500">No sale items currently available.</p>
            <p className="text-stone-400 text-sm mt-2">
              Check back soon for new arrivals!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
