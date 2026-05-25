'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

interface WatchBuyPreviewProps {
  reels: HomepageTrendingReel[];
}

export function WatchBuyPreview({ reels }: WatchBuyPreviewProps) {
  const displayed = reels.slice(0, 12);

  if (displayed.length === 0) return null;

  return (
    <section className="kv-section watch-buy-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Watch &amp; Buy</div>
            <h2 className="watch-buy-heading">Shop Kvastram in motion</h2>
            <p className="watch-buy-copy">
              See fabric, scale, and styling before you open the full reel.
            </p>
          </div>
          <Link href="/reels" className="kv-section-link">
            View All
          </Link>
        </div>

        <div className="kv-carousel watch-buy-carousel">
          {displayed.map((reel) => (
            <Link
              key={reel.id}
              href={`/reels?reel=${encodeURIComponent(reel.id)}`}
              className="reel-card watch-buy-card kv-carousel-item"
              aria-label={`Watch and shop ${reel.product_name}`}
            >
              <div className="reel-media">
                {reel.video_url ? (
                  <video
                    className="reel-video"
                    src={reel.video_url}
                    poster={reel.thumbnail_url || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={reel.product_name}
                  />
                ) : reel.thumbnail_url ? (
                  <OptimizedImage
                    src={reel.thumbnail_url}
                    alt={reel.product_name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="watch-buy-gradient" />
              </div>
              <div className="reel-info">
                <h3 className="reel-title line-clamp-2 leading-token-snug">
                  {reel.product_name}
                </h3>
                <p className="watch-buy-meta">
                  {reel.price ? `${reel.price} - ` : ''}Tap to view and shop
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

