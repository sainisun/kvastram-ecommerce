import Link from 'next/link';

const categories = [
  { name: 'New Arrivals', slug: '/collections/new-arrivals', gradient: 'from-rose-200 to-pink-300' },
  { name: 'Women', slug: '/collections/women', gradient: 'from-amber-200 to-orange-300' },
  { name: 'Men', slug: '/collections/men', gradient: 'from-sky-200 to-blue-300' },
  { name: 'Jackets', slug: '/collections/jackets', gradient: 'from-stone-300 to-stone-400' },
  { name: 'Kimono', slug: '/collections/kimono', gradient: 'from-purple-200 to-violet-300' },
  { name: 'Bags', slug: '/collections/bags', gradient: 'from-emerald-200 to-teal-300' },
  { name: 'Dresses', slug: '/collections/dresses', gradient: 'from-coral-200 to-rose-200' },
  { name: 'Velvet', slug: '/collections/velvet', gradient: 'from-indigo-300 to-purple-400' },
  { name: 'Accessories', slug: '/collections/accessories', gradient: 'from-yellow-200 to-amber-300' },
];

export function CategoryCircles() {
  return (
    <div className="bg-white px-4 py-4 border-b border-stone-100">
      <div className="flex gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-start">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.slug}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className={`h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br ${cat.gradient} ring-2 ring-transparent transition-all hover:ring-stone-300`} />
            <span className="font-body block w-[72px] whitespace-normal text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-stone-600">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
