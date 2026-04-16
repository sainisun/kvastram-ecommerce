'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

interface HomepageCategory {
  id: string;
  image_url: string;
  name: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

export function CategoriesGrid() {
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getHomepageCategories()
      .then((res) => {
        if (!cancelled) {
          const active = (res.categories || [])
            .filter((c: HomepageCategory) => c.is_active)
            .slice(0, 4);
          setCategories(active);
        }
      })
      .catch(() => { if (!cancelled) setCategories([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="py-16 bg-zinc-100 px-6">
      <h3 className="mb-8 text-[11px] font-bold tracking-[0.2em] uppercase text-black text-center">
        SHOP BY CATEGORY
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-zinc-200 animate-pulse" />
            ))
          : categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.link_url}
                className="relative aspect-[3/4] overflow-hidden group block"
              >
                <OptimizedImage
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <h4 className="font-heading text-xl text-white mb-1">{cat.name}</h4>
                  <span className="text-[8px] font-bold tracking-widest text-white/80 uppercase">
                    EXPLORE COLLECTION
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
