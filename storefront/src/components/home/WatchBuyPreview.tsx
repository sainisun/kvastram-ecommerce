'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

interface WatchBuyPreviewProps {
  reels: HomepageTrendingReel[];
}

export function WatchBuyPreview({ reels }: WatchBuyPreviewProps) {
  const displayed = reels.slice(0, 4);

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

        {displayed.length > 0 ? (
          <div className="reels-grid">
            {displayed.map((reel) => (
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
                      Watch &amp; Buy
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
        ) : (
          <div className="rounded-[12px] border border-dashed border-[var(--line)] bg-[var(--cream)] px-6 py-12 text-center">
            <p className="kv-tag">No reels live</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[var(--muted)]">
              Publish active reels from the backend to show Watch &amp; Buy previews here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
