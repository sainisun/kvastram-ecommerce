import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface CategorySectionProps {
  categories: Category[];
  categoryImages: Record<string, string>;
}

export function CategorySection({ categories, categoryImages }: CategorySectionProps) {
  return (
    <section style={{ padding: '96px 64px' }}>
      <div className="section-header-prem reveal">
        <div>
          <p className="section-eyebrow-prem">Curated For You</p>
          <h2 className="section-title-prem">
            Shop by <em>Category</em>
          </h2>
        </div>
        <Link href="/products" className="link-all-prem">
          View All
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="category-grid-prem reveal reveal-delay-1">
          {categories.map((category: Category) => (
            <Link
              key={category.id}
              href={`/products?category_id=${category.id}`}
              className="cat-card-prem"
            >
              <OptimizedImage
                src={
                  category.image ||
                  categoryImages[category.slug] ||
                  '/images/home/category-sarees.jpg'
                }
                alt={category.name}
                fill
                className="cat-img object-cover"
                sizes="(max-width: 900px) 100vw, 33vw"
              />
              <div className="cat-overlay-prem" />
              <div className="cat-info-prem">
                <span className="cat-name-prem">{category.name}</span>
                <span className="cat-count-prem">Explore Collection</span>
              </div>
              <div className="cat-arrow-prem">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}