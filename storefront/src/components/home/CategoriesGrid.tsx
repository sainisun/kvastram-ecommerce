import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  const featuredCategories = categories.slice(0, 12);

  return (
    <section className="bg-[var(--ds-surface-paper)] py-12 md:py-16 lg:py-24">
      <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="mb-8 text-center md:mb-12">
          <div className="text-body-xs uppercase tracking-token-wider text-[var(--ds-text-muted)]">
            Shop by Category
          </div>
          <h2 className="mt-3 font-display text-display-xl type-medium leading-token-tight tracking-token-tight text-[var(--ds-text-primary)]">
            Find your <em className="italic">silhouette</em>
          </h2>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:gap-6 lg:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link_url}
              className="group relative aspect-[4/5] min-w-[72%] snap-start overflow-hidden bg-[var(--ds-surface-soft)] sm:min-w-[42%] lg:min-w-[24%]"
            >
              <OptimizedImage
                src={cat.image_url}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.44)_0%,transparent_58%)]" />
              <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
                <span className="inline-flex px-4 py-2 text-body-xs type-medium uppercase tracking-token-wider text-[var(--ds-text-inverse)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
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

