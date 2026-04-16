'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

interface ReelItem {
  id: string;
  thumbnail_url: string;
  product_name: string;
  link_url: string;
  is_active: boolean;
}

export function InstagramReels() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrendingReels()
      .then((res) => {
        if (!cancelled) {
          const active = (res.reels || []).filter((r: ReelItem) => r.is_active).slice(0, 3);
          setReels(active);
        }
      })
      .catch(() => { if (!cancelled) setReels([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && reels.length === 0) return null;

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="px-6 mb-8">
        <h3 className="font-heading italic text-2xl mb-1">@kvastram</h3>
        <p className="text-[11px] uppercase tracking-widest text-zinc-500">
          Follow us on Instagram
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[200px] aspect-[9/16] bg-zinc-200 animate-pulse rounded-xl"
              />
            ))
          : reels.map((reel, i) => (
              <Link
                key={reel.id}
                href={reel.link_url}
                className={`min-w-[200px] aspect-[9/16] rounded-xl relative overflow-hidden block ${
                  i === 0 ? 'border-2 border-black' : 'border-2 border-transparent'
                }`}
              >
                <OptimizedImage
                  src={reel.thumbnail_url}
                  alt={reel.product_name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="text-white" size={40} />
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
