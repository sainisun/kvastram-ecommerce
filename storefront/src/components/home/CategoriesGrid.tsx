'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (categories.length === 0) return null;

  const featuredCategories = categories.slice(0, 4);

  return (
    <>
      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                Shop by Category
              </p>
              <h2 className="mt-2 font-heading text-[30px] font-semibold leading-none text-stone-950 sm:text-[38px]">
                Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-700 transition-colors hover:text-stone-950"
            >
              View All
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
            {featuredCategories.map((cat, index) => (
              <Link
                key={cat.id}
                href={cat.link_url}
                className={`group relative overflow-hidden rounded-[28px] bg-stone-100 ${
                  index === 0
                    ? 'aspect-[4/5] md:col-span-2 md:row-span-2 md:min-h-[640px] md:aspect-auto'
                    : 'aspect-[4/5] md:min-h-[308px] md:aspect-auto'
                }`}
              >
                <OptimizedImage
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes={
                    index === 0
                      ? '(max-width: 768px) 100vw, 66vw'
                      : '(max-width: 768px) 100vw, 33vw'
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                      {index === 0 ? 'Featured Edit' : 'Category'}
                    </p>
                    <h3
                      className={`mt-2 font-heading font-semibold text-white ${
                        index === 0 ? 'text-3xl sm:text-4xl' : 'text-2xl'
                      }`}
                    >
                      {cat.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-stone-900">
                    Explore
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isSheetOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 sm:p-4"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:mx-auto sm:max-w-5xl sm:rounded-[32px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Browse Categories
                </p>
                <h3 className="mt-2 font-heading text-[28px] font-semibold text-stone-950">
                  Explore All Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="rounded-full border border-stone-200 p-2 text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.link_url}
                    className="group block"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-stone-100">
                      <OptimizedImage
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-1 pt-3">
                      <span className="line-clamp-1 text-[15px] font-semibold text-stone-900 sm:text-[17px]">
                        {cat.name}
                      </span>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-stone-500 transition-colors group-hover:text-stone-900"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
