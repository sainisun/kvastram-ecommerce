import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  const featuredCategories = categories.slice(0, 4);

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">
            Browse by Category
          </div>
          <h2 className="mt-3 font-heading text-[clamp(36px,4vw,54px)] font-medium leading-[0.98] tracking-[-0.02em] text-stone-950">
            Find your <em className="italic">silhouette</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link_url}
              className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
            >
              <OptimizedImage
                src={cat.image_url}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.12)_0%,transparent_52%)]" />
              <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
                <span className="inline-flex bg-white px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-stone-950 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
