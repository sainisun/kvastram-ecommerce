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

const FALLBACK_GRADIENTS = [
  'from-rose-200 to-pink-300',
  'from-amber-200 to-orange-300',
  'from-sky-200 to-blue-300',
  'from-stone-300 to-stone-400',
  'from-purple-200 to-violet-300',
  'from-emerald-200 to-teal-300',
  'from-indigo-300 to-purple-400',
  'from-yellow-200 to-amber-300',
  'from-red-200 to-rose-300',
];

export async function CategoryCircles() {
  const data = await api.getCategoryCircles();
  const circles: CategoryCircle[] = data.circles || [];

  if (circles.length === 0) return null;

  return (
    <div className="bg-white px-4 py-4 border-b border-stone-100">
      <div className="flex gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-start">
        {circles.map((circle, i) => (
          <Link
            key={circle.id}
            href={circle.link_url}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-stone-300">
              {circle.image_url ? (
                <OptimizedImage
                  src={circle.image_url}
                  alt={circle.label}
                  fill
                  className="object-cover"
                  sizes="68px"
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}`} />
              )}
            </div>
            <span className="font-body block w-[72px] whitespace-normal text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-stone-600">
              {circle.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
