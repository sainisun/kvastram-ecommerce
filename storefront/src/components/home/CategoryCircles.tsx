import Link from 'next/link';

const categories = [
  { name: 'New Arrivals', slug: '/collections/new-arrivals' },
  { name: 'Women', slug: '/collections/women' },
  { name: 'Men', slug: '/collections/men' },
  { name: 'Jackets', slug: '/collections/jackets' },
  { name: 'Kimono', slug: '/collections/kimono' },
  { name: 'Bags', slug: '/collections/bags' },
  { name: 'Dresses', slug: '/collections/dresses' },
  { name: 'Velvet', slug: '/collections/velvet' },
  { name: 'Accessories', slug: '/collections/accessories' },
];

export function CategoryCircles() {
  return (
    <div className="bg-white px-4 py-3">
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
      <div className="flex gap-4 overflow-x-auto scrollbar-hide items-start">
        {categories.map((cat, i) => (
          <Link 
            key={i} 
            href={cat.slug}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
               {/* Placeholder background, ready for next/image */}
            </div>
            <span className="font-body block w-full whitespace-normal text-center text-[11px] font-medium uppercase leading-tight tracking-[0.05em] text-gray-700">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
