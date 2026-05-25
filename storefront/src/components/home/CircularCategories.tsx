import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import { storefrontHrefOrNull } from '@/lib/links';
import { cloudinaryUrlOrNull } from '@/lib/media';
import type { HomepageCategoryCircle } from '@/types/homepage';

interface CircularCategoriesProps {
  circles?: HomepageCategoryCircle[];
}

function categoryImageOrNull(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return cloudinaryUrlOrNull(value);
}

function normalizeCircles(circles: HomepageCategoryCircle[]) {
  return circles
    .filter((c) => c.is_active && categoryImageOrNull(c.image_url) && storefrontHrefOrNull(c.link_url))
    .map((c) => ({
      ...c,
      image_url: categoryImageOrNull(c.image_url),
      link_url: storefrontHrefOrNull(c.link_url) || '/products',
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function CircularCategories({ circles: providedCircles }: CircularCategoriesProps) {
  let circles: HomepageCategoryCircle[] = providedCircles || [];
  try {
    if (!providedCircles) {
      const data = await api.getCategoryCircles();
      circles = data.circles || [];
    }
  } catch {
    circles = [];
  }

  const displayed = normalizeCircles(circles).slice(0, 10);

  if (displayed.length === 0) return null;

  return (
    <section className="mobile-story-categories bg-[var(--ds-surface-paper)]" aria-label="Quick category shortcuts">
      <div className="kv-container">
        <div className="circle-row">
          {displayed.map((circle) => (
            <Link
              key={circle.id}
              href={circle.link_url}
              className="circle-cat"
            >
              <div className="circle-cat-art">
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <OptimizedImage
                    src={circle.image_url || ''}
                    alt={circle.label}
                    fill
                    sizes="78px"
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="circle-cat-name">
                {circle.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

