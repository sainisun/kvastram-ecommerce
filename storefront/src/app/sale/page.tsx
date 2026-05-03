'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ProductGrid from '@/components/ProductGrid';
import type { MoneyAmount, Product } from '@/types';

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  end_date?: string | null;
};

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
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([api.getProducts({ limit: 50, sort: 'newest' }), api.getActiveCampaigns()])
      .then(([data, campaignData]) => {
        const saleProducts = (data.products || []).filter(hasSalePrice).slice(0, 24);
        setProducts(saleProducts);
        const campaign = (campaignData.campaigns || []).find(
          (item: Campaign) => item.name?.toLowerCase().includes('sale') || item.end_date
        );
        setActiveCampaign(campaign || null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCampaign?.end_date) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = new Date(activeCampaign.end_date as string).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft(null);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    updateCountdown();
    const timer = window.setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeCampaign]);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--sienna-dark)] via-[var(--sienna)] to-[var(--soft)] px-6 py-16 text-white md:px-12 md:py-20 lg:px-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.24))]" />
        <div className="relative mx-auto max-w-[1440px] space-y-6 text-center">
          <span className="text-body-xs type-bold uppercase tracking-token-wider text-white/75">
            {activeCampaign ? 'Limited Time' : 'Current Markdowns'}
          </span>
          <h1 className="font-heading text-display-xl type-medium leading-token-tight tracking-token-tight text-white">
            {activeCampaign?.name || 'Sale'}
          </h1>
          <p className="mx-auto max-w-xl text-body-lg leading-7 text-white/80">
            {activeCampaign?.description ||
              'Selected artisan pieces at special prices, powered by real product markdowns.'}
          </p>
          {timeLeft ? (
            <div className="mx-auto grid max-w-xl grid-cols-4 gap-3">
              {[
                ['Days', timeLeft.days],
                ['Hours', timeLeft.hours],
                ['Mins', timeLeft.minutes],
                ['Secs', timeLeft.seconds],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-white/20 bg-white/12 px-4 py-4 backdrop-blur-sm"
                >
                  <span className="block font-heading text-display-md leading-token-tight text-white">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="mt-2 block text-body-xs type-semibold uppercase tracking-token-wider text-white/70">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <a
            href="#saleGrid"
            className="inline-flex items-center justify-center bg-white px-8 py-4 text-body-xs type-semibold uppercase tracking-token-wider text-stone-950 transition-colors hover:bg-stone-100"
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

