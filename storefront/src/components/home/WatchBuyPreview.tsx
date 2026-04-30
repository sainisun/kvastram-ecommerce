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
          <Link href="/reels" className="kv-btn kv-btn-outline">
            View All Reels
          </Link>
        </div>

        <div className="reels-grid">
          {displayed.map((reel, index) => (
            <Link
              key={reel.id}
              href={`/reels?reel=${encodeURIComponent(reel.id)}`}
              className="reel-card"
            >
              <div className="reel-media">
                {reel.thumbnail_url ? (
                  <OptimizedImage
                    src={reel.thumbnail_url}
                    alt={reel.product_name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="play">
                  <Play size={34} fill="white" className="text-white" />
                </div>
                <div className="relative z-[3]">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
                    {index % 2 === 0 ? 'Styling' : 'Occasion'}
                  </div>
                  <div className="mt-1 line-clamp-2 font-heading text-[17px] font-bold leading-tight">
                    {reel.product_name}
                  </div>
                </div>
              </div>
              <div className="reel-info">
                <h3 className="reel-title line-clamp-2 text-[16px] leading-snug text-[var(--ink)]">
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
