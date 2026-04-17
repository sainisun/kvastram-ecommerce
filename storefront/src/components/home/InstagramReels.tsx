import Link from 'next/link';
import { ArrowUpRight, PlayCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageTrendingReel } from '@/types/homepage';

interface InstagramReelsProps {
  reels: HomepageTrendingReel[];
}

export function InstagramReels({ reels }: InstagramReelsProps) {
  if (reels.length === 0) return null;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              @kvastram
            </p>
            <h2 className="font-heading text-[32px] font-semibold leading-[0.98] text-stone-950 sm:text-[40px] lg:text-[48px]">
              Follow the feed
            </h2>
            <p className="max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
              A cleaner social-follow section built from the same reel content
              already available to the storefront today.
            </p>
          </div>
          <a
            href="https://www.instagram.com/kvastram/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-800 transition-colors hover:border-stone-950 hover:text-stone-950 sm:w-auto"
          >
            Follow on Instagram
            <ArrowUpRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((reel, index) => (
            <Link
              key={reel.id}
              href={reel.link_url}
              className="group relative overflow-hidden rounded-[28px] bg-stone-100"
            >
              <div className="relative aspect-[4/5]">
                <OptimizedImage
                  src={reel.thumbnail_url}
                  alt={reel.product_name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                  <PlayCircle size={22} />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    Feed Edit {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-[22px] font-semibold leading-tight text-white">
                    {reel.product_name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
