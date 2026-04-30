'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import type { MoneyAmount, Product } from '@/types';

function getCurrentPrice(product: Product) {
  const prices = product.variants?.[0]?.prices || [];
  const inrPrice =
    prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];

  return inrPrice?.amount || 0;
}

function hasSalePrice(product: Product) {
  const variant = product.variants?.[0];
  const compareAt = variant?.compare_at_price || 0;
  const currentPrice = getCurrentPrice(product);

  return compareAt > 0 && currentPrice > 0 && compareAt > currentPrice;
}

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProducts({ limit: 50, sort: 'newest' })
      .then((data) => {
        const saleProducts = (data.products || []).filter(hasSalePrice).slice(0, 24);
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
        <ProductGrid
          initialProducts={products}
          loading={loading}
          emptyMessage="No sale items currently available."
        />
      </div>
    </div>
  );
}
