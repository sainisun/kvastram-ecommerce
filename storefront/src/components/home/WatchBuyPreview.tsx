'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

interface WatchBuyPreviewProps {
  reels: HomepageTrendingReel[];
}

const placeholderReels: HomepageTrendingReel[] = [
  {
    id: 'placeholder-style',
    video_url: '',
    thumbnail_url: '',
    product_name: 'Three ways to drape Kantha',
    price: 'Tap to view and shop',
    price_amount: null,
    link_url: '/reels',
    view_count: 0,
    is_active: true,
    sort_order: 0,
  },
  {
    id: 'placeholder-occasion',
    video_url: '',
    thumbnail_url: '',
    product_name: 'Wedding guest saree try-on',
    price: 'Tap to view and shop',
    price_amount: null,
    link_url: '/reels',
    view_count: 0,
    is_active: true,
    sort_order: 1,
  },
];

export function WatchBuyPreview({ reels }: WatchBuyPreviewProps) {
  const displayed = reels.length > 0 ? reels.slice(0, 4) : placeholderReels;

  return (
    <section className="kv-section bg-white">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Watch &amp; Buy</div>
            <h2 className="kv-title">Reels that sell the story</h2>
          </div>
          <Link href="/reels" className="kv-btn">
            View All Reels
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {displayed.map((reel, index) => (
            <Link
              key={reel.id}
              href={`/reels?reel=${encodeURIComponent(reel.id)}`}
              className="group overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm"
            >
              <div className="relative aspect-[3/5] overflow-hidden rounded-t-[var(--radius-lg)] bg-gradient-to-br from-[#a85d3a] via-[#c4956a] to-[#f4d4b8]">
                {reel.thumbnail_url ? (
                  <OptimizedImage
                    src={reel.thumbnail_url}
                    alt={reel.product_name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,28,20,.55),transparent_56%)]" />
                <div className="absolute inset-0 grid place-items-center">
                  <Play size={42} fill="white" className="text-white" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
                    {index % 2 === 0 ? 'Styling' : 'Occasion'}
                  </div>
                  <div className="mt-1 line-clamp-2 font-heading text-[19px] font-bold leading-tight">
                    {reel.product_name}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-heading text-[18px] font-bold leading-snug text-[var(--ink)]">
                  {reel.product_name}
                </h3>
                <p className="kv-sub mt-1 text-sm">Tap to view and shop</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
