import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import OptimizedImage from '@/components/ui/OptimizedImage';
import PageHero from '@/components/hero/PageHero';
import ProductGrid from '@/components/ProductGrid';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${handle}`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) {
      return { title: 'Collection Not Found' };
    }
    
    const { collection } = await res.json();
    
    return {
      title: `${collection.title} | Kvastram`,
      description: collection.metadata?.description || `Shop our ${collection.title} collection`,
    };
  } catch {
    return { title: 'Collection | Kvastram' };
  }
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/collections/${handle}`,
      { next: { revalidate: 60 } }
    );
    
    if (!res.ok) {
      notFound();
    }
    
    const { collection } = await res.json();
    
    const productsRes = await api.getProducts({
      collection_id: collection.id,
      limit: 50,
    });
    
    const products = productsRes.products || [];
    
    return (
      <div className="min-h-screen bg-white">
        <PageHero
          title={collection.title}
          subtitle="Collection"
          description={collection.metadata?.description || `Explore our ${collection.title} collection`}
          image={collection.image || '/images/home/collection-bridal.jpg'}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-16">
          {products.length > 0 ? (
            <ProductGrid initialProducts={products} />
          ) : (
            <div className="text-center py-24">
              <p className="text-stone-500 text-lg">
                No products found in this collection. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
