import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import PageHero from '@/components/hero/PageHero';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const data = await api.getCollections();
  const collections = data.collections || [];

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <PageHero
          title="Collections"
          subtitle="Curated Series"
          image="/images/home/collection-bridal.jpg"
        />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <p className="text-stone-500 text-lg">
            No collections found. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title="Collections"
        subtitle="Curated Series"
        description="Curated selections for the modern connoisseur, blending heritage with contemporary style."
        image="/images/home/collection-bridal.jpg"
      />

      <div className="max-w-7xl mx-auto px-6 pb-24 space-y-24">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {collections.map((col: any, idx: number) => (
          <div
            key={col.id}
            className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
          >
            <div className="w-full md:w-1/2 aspect-[4/3] bg-stone-100 relative group overflow-hidden cursor-pointer">
              {col.image ? (
                <OptimizedImage
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-stone-200 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
                  <span className="text-stone-400 font-serif italic text-xl">
                    {col.title}
                  </span>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
              <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-stone-400 uppercase">
                0{idx + 1}
              </span>
              <h2 className="text-4xl font-serif text-stone-900">
                {col.title}
              </h2>
              <p className="text-lg text-stone-600 font-light leading-relaxed max-w-md mx-auto md:mx-0">
                {col.metadata?.description ||
                  `Explore our ${col.title} collection`}
              </p>
              <div className="pt-4">
                <Link
                  href={`/products?collection_id=${col.id}`}
                  className="inline-flex items-center gap-2 text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
                >
                  Explore Collection <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
