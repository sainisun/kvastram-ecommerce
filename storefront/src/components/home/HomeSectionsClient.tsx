'use client';

import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { BestsellersSection } from '@/components/home/BestsellersSection';
import { EditorialSection } from '@/components/home/EditorialSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CollectionsSection } from '@/components/home/CollectionsSection';
// Community and Newsletter are rendered server-side in the page to preserve order

interface Props {
  products: any[];
  featuredProductIds: string[];
  homepageSettings: any;
  testimonialsList: any[];
  collections: any[];
  categories: any[];
  categoryImages: Record<string, string>;
}

export default function HomeSectionsClient({
  products,
  featuredProductIds,
  homepageSettings,
  testimonialsList,
  collections,
}: Props) {
  return (
    <>
      <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
        DEBUG: Products: {products?.length}, Collections: {collections?.length},
        Testimonials: {testimonialsList?.length}
      </div>
      <FeaturedProductsSection
        products={products}
        featuredProductIds={featuredProductIds}
      />
      <BestsellersSection products={products} />
      <EditorialSection
        brandStoryImage={homepageSettings.brand_story_image}
        brandStoryContent={homepageSettings.brand_story_content}
      />
      <TestimonialsSection testimonials={testimonialsList} />
      <CollectionsSection collections={collections} />
    </>
  );
}
