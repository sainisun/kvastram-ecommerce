import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

interface CategoriesGridProps {
  categories: HomepageCategoryCard[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  if (categories.length === 0) return null;

  const featuredCategories = categories.slice(0, 8);

  return (
    <section className="kv-section shop-category-section bg-[var(--ds-surface-paper)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Guided category browsing</div>
            <h2 className="kv-title">Find your textile edit</h2>
            <p className="kv-sub mt-3">
              Shop Kvastram by the product families customers reach for first.
            </p>
          </div>
        </div>

        <div className="shop-category-grid">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link_url}
              className="shop-category-card group"
            >
              <div className="shop-category-media">
                <OptimizedImage
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
