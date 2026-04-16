'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
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

interface NewArrivalsProps {
  products: Product[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  const { formatPrice } = useCurrency();

  const displayed = products.slice(0, 4);
  if (displayed.length === 0) return null;

  function getPrice(product: Product): string {
    const prices = product.variants?.[0]?.prices;
    if (!prices?.length) return '';
    const inr = prices.find((p) => p.currency_code?.toLowerCase() === 'inr') ?? prices[0];
    return formatPrice(inr.amount);
  }

  return (
    <section className="py-16 bg-white px-6">
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-black">
          NEW ARRIVALS
        </h3>
        <Link
          href="/products?sort=newest"
          className="text-[10px] font-bold tracking-widest uppercase border-b border-black"
        >
          VIEW ALL →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 mb-10">
        {displayed.map((product) => (
          <div key={product.id} className="flex flex-col gap-3 relative">
            <div className="w-full relative overflow-hidden bg-zinc-200" style={{ height: '200px' }}>
              {product.thumbnail ? (
                <OptimizedImage
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-200" />
              )}
              <button
                type="button"
                aria-label={`Wishlist ${product.title}`}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center"
              >
                <Heart size={18} className="text-black" />
              </button>
            </div>
            <Link
              href={`/products/${product.handle || product.id}`}
              className="flex flex-col"
            >
              <span className="text-[12px] text-black truncate">{product.title}</span>
              <span className="text-[13px] font-bold text-black">{getPrice(product)}</span>
            </Link>
          </div>
        ))}
      </div>

      <Link
        href="/products?sort=newest"
        className="block w-full py-4 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase text-center hover:bg-white hover:text-black hover:border hover:border-black transition-all"
      >
        VIEW ALL COLLECTION
      </Link>
    </section>
  );
}
