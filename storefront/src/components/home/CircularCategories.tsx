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
    <section className="py-8 bg-white overflow-x-auto no-scrollbar flex gap-6 px-6">
      {circles.map((circle, i) => (
        <Link
          key={circle.id}
          href={circle.link_url}
          className="flex flex-col items-center gap-2 min-w-[72px]"
        >
          <div
            className={`w-[72px] h-[72px] rounded-full p-[2px] ${
              i === 0 ? 'border border-black' : 'border border-transparent'
            }`}
          >
            {circle.image_url ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <OptimizedImage
                  src={circle.image_url}
                  alt={circle.label}
                  fill
                  sizes="72px"
                  className="object-cover rounded-full"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-200" />
            )}
          </div>
          <span
            className={`text-[10px] font-medium tracking-wider uppercase ${
              i === 0 ? 'text-black' : 'text-zinc-500'
            }`}
          >
            {circle.label}
          </span>
        </Link>
      ))}
    </section>
  );
}
