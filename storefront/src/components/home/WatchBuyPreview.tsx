'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

interface WatchBuyPreviewProps {
  reels: HomepageTrendingReel[];
}

export function WatchBuyPreview({ reels }: WatchBuyPreviewProps) {
  const displayed = reels.slice(0, 12);

  if (displayed.length === 0) return null;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
      },
    },
  } as const;

  return (
    <section className="kv-section watch-buy-section bg-[var(--cream)] border-b border-[var(--ds-border-subtle)]">
      <div className="kv-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="kv-section-head"
        >
          <div>
            <div className="kv-tag">Watch &amp; Buy</div>
            <h2 className="watch-buy-heading text-[var(--ds-text-primary)]">Shop Kvastram in motion</h2>
            <p className="watch-buy-copy text-[var(--ds-text-secondary)]">
              See fabric, scale, and styling before you open the full reel.
            </p>
          </div>
          <Link href="/reels" className="kv-section-link text-[var(--ds-accent-primary)] hover:text-[var(--ds-accent-hover)] font-medium transition-colors">
            View All
          </Link>
        </motion.div>

        <motion.div
          className="kv-carousel watch-buy-carousel flex overflow-x-auto gap-6 py-4 scrollbar-none"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {displayed.map((reel) => (
            <motion.div
              key={reel.id}
              variants={itemVariants}
              className="kv-carousel-item flex-shrink-0 w-[200px] md:w-[240px]"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href={`/reels?reel=${encodeURIComponent(reel.id)}`}
                className="reel-card watch-buy-card relative block w-full aspect-[9/16] overflow-hidden rounded-lg group shadow-sm hover:shadow-md transition-shadow"
                aria-label={`Watch and shop ${reel.product_name}`}
              >
                <div className="reel-media absolute inset-0 bg-[var(--ds-surface-soft)]">
                  {reel.video_url ? (
                    <video
                      className="reel-video w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : null}
                  <div className="watch-buy-gradient absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-90 group-hover:scale-100">
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="reel-info absolute bottom-0 inset-x-0 p-4 text-white z-10">
                  <h3 className="reel-title text-sm font-semibold line-clamp-2 leading-snug text-white">
                    {reel.product_name}
                  </h3>
                  <p className="watch-buy-meta text-xs text-white/80 mt-1 flex items-center gap-1 font-medium">
                    {reel.price ? <span className="text-white">{reel.price}</span> : null}
                    {reel.price ? <span>•</span> : null}
                    <span>Tap to shop</span>
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
