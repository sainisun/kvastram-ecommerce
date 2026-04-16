'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useCurrency } from '@/context/currency-context';

interface ProductPrice {
  amount: number;
  currency_code: string;
}

interface ProductVariant {
  prices?: ProductPrice[];
}

interface Product {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string;
  variants?: ProductVariant[];
}

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  const { formatPrice } = useCurrency();
  const [activeDot, setActiveDot] = useState(0);

  const displayed = products.slice(0, 6);
  if (displayed.length === 0) return null;

  function getPrice(product: Product): string {
    const prices = product.variants?.[0]?.prices;
    if (!prices?.length) return '';
    const inr = prices.find((p) => p.currency_code?.toLowerCase() === 'inr') ?? prices[0];
    return formatPrice(inr.amount);
  }

  return (
    <section className="py-20 bg-zinc-200 overflow-hidden">
      <h3 className="font-heading text-3xl text-center mb-10">Best Sellers</h3>

      <div className="overflow-x-auto no-scrollbar flex gap-6 px-6 snap-x snap-mandatory">
        {displayed.map((product, i) => (
          <Link
            key={product.id}
            href={`/products/${product.handle || product.id}`}
            className="min-w-[300px] relative snap-center overflow-hidden block"
            style={{ height: '380px' }}
            onMouseEnter={() => setActiveDot(i)}
          >
            {product.thumbnail ? (
              <OptimizedImage
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="300px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-300" />
            )}
            <div className="absolute inset-x-4 bottom-4 bg-white/90 backdrop-blur-sm p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium uppercase tracking-tighter text-black line-clamp-1">
                  {product.title}
                </span>
                <span className="text-[14px] font-bold text-black">{getPrice(product)}</span>
              </div>
              <ShoppingCart size={20} className="text-black" />
            </div>
          </Link>
        ))}
      </div>

      {displayed.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {displayed.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActiveDot(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeDot ? 'bg-black' : 'bg-zinc-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
