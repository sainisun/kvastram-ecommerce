import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import { cloudinaryUrlOrNull } from '@/lib/media';

interface CategoryCircle {
  id: string;
  label: string;
  link_url: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function CircularCategories() {
  let circles: CategoryCircle[] = [];
  try {
    const data = await api.getCategoryCircles();
    circles = (data.circles || [])
      .filter((c: CategoryCircle) => c.is_active && cloudinaryUrlOrNull(c.image_url))
      .map((c: CategoryCircle) => ({
        ...c,
        image_url: cloudinaryUrlOrNull(c.image_url),
      }));
  } catch {
    circles = [];
  }

  return (
    <section className="kv-section mobile-circle-categories bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <h2 className="kv-title">Craft-led discovery</h2>
        </div>

        {circles.length > 0 ? (
          <div className="circle-row">
            {circles.map((circle) => (
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
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-white px-6 py-10 text-center">
            <p className="text-body-sm color-muted">
              Add active category circles in admin to show this discovery row.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

