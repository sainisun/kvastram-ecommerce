'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';
import { useCurrency } from '@/context/currency-context';

interface WatchBuyPreviewProps {
  reels: HomepageTrendingReel[];
}

export function WatchBuyPreview({ reels }: WatchBuyPreviewProps) {
  const { formatPrice } = useCurrency();

  if (reels.length === 0) return null;

  const displayed = reels.slice(0, 4);

  return (
    <section className="bg-[#f8f1eb] py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="mb-8 text-center md:mb-12">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            In Motion
          </div>
          <h2 className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-medium leading-[0.96] tracking-[-0.02em] text-stone-950">
            Watch &amp; <em className="italic">Buy</em>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-stone-600">
            See our pieces in motion. Tap any reel to shop.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-16">
          {displayed.map((reel) => (
            <Link
              key={reel.id}
              href={`/reels?reel=${encodeURIComponent(reel.id)}`}
              className="group relative overflow-hidden bg-stone-100"
            >
              <div className="relative aspect-[4/5]">
                <OptimizedImage
                  src={reel.thumbnail_url || '/images/home/atelier-story.jpg'}
                  alt={reel.product_name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,transparent_52%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle
                    className="text-white/90 transition-transform duration-300 group-hover:scale-110"
                    size={52}
                    strokeWidth={1.4}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    Watch &amp; Buy
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-[18px] font-semibold leading-snug text-white">
                    {reel.product_name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <span className="line-clamp-1 text-[16px] font-semibold text-stone-950">
                  {reel.price_amount != null
                    ? formatPrice(reel.price_amount)
                    : reel.price || '₹ —'}
                </span>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700 transition-colors group-hover:text-stone-950">
                  View
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Link
            href="/reels"
            className="inline-flex items-center justify-center bg-stone-950 px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
          >
            View All Reels →
          </Link>
        </div>
      </div>
    </section>
  );
}
