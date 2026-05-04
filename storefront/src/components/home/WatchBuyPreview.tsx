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
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div className="kv-tag">Watch &amp; Buy</div>
          <Link href="/reels" className="kv-section-link">
            View All
          </Link>
        </div>

        {displayed.length > 0 ? (
          <div className="reels-grid">
            {displayed.map((reel) => (
              <Link
                key={reel.id}
                href="/reels"
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
                  <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="play z-[2]">
                    <Play size={34} fill="white" className="text-white" />
                  </div>
                  <div className="relative z-[3]">
                    <div className="text-body-xs type-bold uppercase tracking-token-wider text-white/75 sm:text-body-xs">
                      Watch &amp; Buy
                    </div>
                    <div className="reel-title mt-0.5 line-clamp-2 leading-token-tight text-white">
                      {reel.product_name}
                    </div>
                  </div>
                </div>
                <div className="reel-info">
                  <h3 className="reel-title line-clamp-2 leading-token-snug color-ink">
                    {reel.product_name}
                  </h3>
                  <p className="kv-sub mt-1 text-body-xs sm:text-body-sm">Tap to view and shop</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--cream)] px-6 py-12 text-center">
            <p className="kv-tag">No reels live</p>
            <p className="mx-auto mt-2 max-w-md text-body-sm leading-6 color-muted">
              Publish active reels from the backend to show Watch &amp; Buy previews here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

