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

  if (circles.length === 0) {
    circles = [
      { id: 'placeholder-kantha', label: 'Kantha', link_url: '/products', image_url: null, sort_order: 0, is_active: true },
      { id: 'placeholder-sarees', label: 'Sarees', link_url: '/products', image_url: null, sort_order: 1, is_active: true },
      { id: 'placeholder-kurtas', label: 'Kurtas', link_url: '/products', image_url: null, sort_order: 2, is_active: true },
      { id: 'placeholder-shawls', label: 'Shawls', link_url: '/products', image_url: null, sort_order: 3, is_active: true },
      { id: 'placeholder-accessories', label: 'Accessories', link_url: '/products', image_url: null, sort_order: 4, is_active: true },
    ];
  }

  return (
    <section className="kv-section bg-[var(--cream)]">
      <div className="kv-container">
        <div className="kv-section-head">
          <div>
            <div className="kv-tag">Shop by category</div>
            <h2 className="kv-title">Craft-led discovery</h2>
          </div>
          <p className="kv-sub max-w-xl">
            These circular categories stay as-is from the Kvastram direction and map to real categories/tags.
          </p>
        </div>

        <div className="circle-row">
          {circles.map((circle) => (
            <Link
              key={circle.id}
              href={circle.link_url}
              className="circle-cat"
            >
              <div className="circle-cat-art">
                {circle.image_url ? (
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <OptimizedImage
                      src={circle.image_url}
                      alt={circle.label}
                      fill
                      sizes="78px"
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg, #f4d4b8, #a85d3a)' }}
                  >
                    {circle.label.charAt(0)}
                  </div>
                )}
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
