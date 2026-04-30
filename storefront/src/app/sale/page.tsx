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
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 34,
    seconds: 56,
  });

  useEffect(() => {
    api
      .getProducts({ limit: 50, sort: 'newest' })
      .then((data) => {
        const saleProducts = (data.products || []).filter(hasSalePrice).slice(0, 24);
        setProducts(saleProducts);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        const totalSeconds =
          current.hours * 3600 + current.minutes * 60 + current.seconds;
        const next = totalSeconds > 0 ? totalSeconds - 1 : 12 * 3600 + 34 * 60 + 56;
        return {
          hours: Math.floor(next / 3600),
          minutes: Math.floor((next % 3600) / 60),
          seconds: next % 60,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#c53030] to-[#e35b4f] px-6 py-16 text-white md:px-12 md:py-20 lg:px-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.24))]" />
        <div className="relative mx-auto max-w-[1440px] space-y-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">
            Limited Time
          </span>
          <h1 className="font-heading text-[clamp(48px,8vw,92px)] font-medium leading-none tracking-[-0.03em] text-white">
            Grand Sale
          </h1>
          <p className="mx-auto max-w-xl text-[16px] leading-7 text-white/80">
            Selected artisan pieces at special prices, powered by real product markdowns.
          </p>
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            {[
              ['Hours', timeLeft.hours],
              ['Mins', timeLeft.minutes],
              ['Secs', timeLeft.seconds],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm"
              >
                <span className="block font-heading text-[32px] leading-none text-white">
                  {String(value).padStart(2, '0')}
                </span>
                <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <a
            href="#saleGrid"
            className="inline-flex items-center justify-center bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-950 transition-colors hover:bg-stone-100"
          >
            Shop Sale
          </a>
        </div>
      </section>

      <div id="saleGrid" className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <ProductGrid
          initialProducts={products}
          loading={loading}
          emptyMessage="No sale items currently available."
        />
      </div>
    </div>
  );
}
