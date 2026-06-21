'use client';

import { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ButtonLink, UnstyledButton } from '@/components/ui/Button';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCurrency } from '@/context/currency-context';
import type { MoneyAmount } from '@/types';
import type { HomepageTrendingReel } from '@/types/homepage';

export function WatchBuyPreview({ reels }: { reels: HomepageTrendingReel[] }) {
  const [selectedId, setSelectedId] = useState(reels[0]?.id || '');
  const selected = reels.find((reel) => reel.id === selectedId) || reels[0];
  const { formatPrice } = useCurrency();
  const productHref = selected?.link_url || (
    selected ? `/products/${selected.product.handle || selected.product.id}` : '/products'
  );
  const price = useMemo(() => {
    const prices = selected?.product.variants?.[0]?.prices || [];
    const amount =
      prices.find((item: MoneyAmount) => item.currency_code?.toLowerCase() === 'inr') ||
      prices[0];
    return amount ? formatPrice(amount.amount) : null;
  }, [formatPrice, selected]);

  if (!selected) return null;

  return (
    <section className="homepage-watch" data-home-section="6-watch-shop">
      <div className="homepage-watch-layout">
        <div className="homepage-watch-video">
          <video
            key={selected.id}
            controls
            muted
            playsInline
            preload="none"
            poster={selected.thumbnail_url}
            aria-label={`Watch ${selected.product.title}`}
          >
            <source src={selected.video_url} />
          </video>
        </div>
        <div className="homepage-watch-copy">
          <p className="homepage-eyebrow">Watch &amp; Shop</p>
          <h2>See the craft in motion</h2>
          <div className="homepage-watch-product">
            <span className="homepage-watch-product-media">
              <OptimizedImage
                src={selected.product.thumbnail || selected.product.images?.[0]?.url || ''}
                alt={selected.product.title}
                fill
                sizes="160px"
                className="object-cover"
              />
            </span>
            <div>
              <h3>{selected.product.title}</h3>
              {price ? <PriceDisplay price={price} variant="inline" /> : null}
              <ButtonLink
                href={productHref}
                variant="primary"
                size="md"
              >
                Shop this piece
              </ButtonLink>
            </div>
          </div>
          {reels.length > 1 ? (
            <div className="homepage-watch-thumbnails" aria-label="Choose a video">
              {reels.map((reel) => (
                <UnstyledButton
                  key={reel.id}
                  type="button"
                  onClick={() => setSelectedId(reel.id)}
                  aria-label={`Show ${reel.product.title} video`}
                  aria-pressed={selected.id === reel.id}
                >
                  <OptimizedImage
                    src={reel.thumbnail_url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <Play aria-hidden="true" size={18} />
                </UnstyledButton>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
