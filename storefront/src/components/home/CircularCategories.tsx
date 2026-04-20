import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';

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
    circles = (data.circles || []).filter((c: CategoryCircle) => c.is_active);
  } catch {
    return null;
  }

  if (circles.length === 0) return null;

  return (
    <section className="flex gap-4 overflow-x-auto bg-white px-4 py-4 no-scrollbar md:hidden">
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
              <div className="h-full w-full rounded-full bg-zinc-200" />
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
