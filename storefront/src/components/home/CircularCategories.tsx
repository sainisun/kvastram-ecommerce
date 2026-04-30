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
      {
        id: 'placeholder-kantha',
        label: 'Kantha',
        link_url: '/products',
        image_url: null,
        sort_order: 0,
        is_active: true,
      },
      {
        id: 'placeholder-sarees',
        label: 'Sarees',
        link_url: '/products',
        image_url: null,
        sort_order: 1,
        is_active: true,
      },
      {
        id: 'placeholder-kurtas',
        label: 'Kurtas',
        link_url: '/products',
        image_url: null,
        sort_order: 2,
        is_active: true,
      },
      {
        id: 'placeholder-shawls',
        label: 'Shawls',
        link_url: '/products',
        image_url: null,
        sort_order: 3,
        is_active: true,
      },
      {
        id: 'placeholder-accessories',
        label: 'Accessories',
        link_url: '/products',
        image_url: null,
        sort_order: 4,
        is_active: true,
      },
    ];
  }

  return (
    <section className="flex gap-4 overflow-x-auto bg-white px-6 py-4 no-scrollbar">
      {circles.map((circle, i) => (
        <Link
          key={circle.id}
          href={circle.link_url}
          className="flex min-w-[80px] flex-col items-center"
        >
          <div
            className={`h-[72px] w-[72px] rounded-full p-[2px] ${
              i === 0 ? 'border border-black' : 'border border-transparent'
            }`}
          >
            {circle.image_url ? (
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <OptimizedImage
                  src={circle.image_url}
                  alt={circle.label}
                  fill
                  sizes="72px"
                  className="object-cover rounded-full"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#f4d4b8] to-[#a85d3a] font-heading text-2xl text-white">
                {circle.label.charAt(0)}
              </div>
            )}
          </div>
          <span className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-stone-600">
            {circle.label}
          </span>
        </Link>
      ))}
    </section>
  );
}
