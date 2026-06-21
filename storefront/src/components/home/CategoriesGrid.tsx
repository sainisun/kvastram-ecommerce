import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageCategoryCard } from '@/types/homepage';

export function CategoriesGrid({ categories }: { categories: HomepageCategoryCard[] }) {
  const displayed = categories.slice(0, 4);
  if (displayed.length !== 4) return null;

  return (
    <section
      className="homepage-featured-categories"
      aria-label="Featured categories"
      data-home-section="3-featured-categories"
    >
      <div className="homepage-container homepage-featured-grid">
        {displayed.map((category) => (
          <Link key={category.id} href={category.link_url} className="homepage-featured-card">
            <OptimizedImage
              src={category.image_url}
              alt={category.name}
              fill
              sizes="(max-width: 767px) 50vw, 25vw"
              className="object-cover"
            />
            <span className="homepage-featured-overlay" />
            <span className="homepage-featured-name">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
