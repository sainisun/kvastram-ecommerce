import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 text-center sm:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
            Shop by Category
          </p>
          <div className="space-y-3">
            <h2 className="font-heading text-[38px] font-semibold leading-[0.98] text-stone-950 sm:text-[50px]">
              A modern wardrobe, one story at a time
            </h2>
            <p className="mx-auto max-w-2xl text-[15px] font-[300] leading-7 text-stone-600">
              Inspired by retail-first category storytelling, but curated for
              Kvastram&apos;s handcrafted collections.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {categories.map((cat, index) => (
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
  );
}
