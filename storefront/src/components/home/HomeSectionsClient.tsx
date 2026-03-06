'use client';

import { useEffect, useState } from 'react';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { BestsellersSection } from '@/components/home/BestsellersSection';
import { EditorialSection } from '@/components/home/EditorialSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CollectionsSection } from '@/components/home/CollectionsSection';

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
  products: initialProducts,
  featuredProductIds,
  homepageSettings,
  testimonialsList: initialTestimonials,
  collections: initialCollections,
}: Props) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [testimonialsList, setTestimonialsList] =
    useState<any[]>(initialTestimonials);
  const [collections, setCollections] = useState<any[]>(initialCollections);

  useEffect(() => {
    // If SSR returned empty products (backend unreachable on server), fetch from browser
    // The browser uses /api proxy which correctly routes to the backend
    const fetchIfEmpty = async () => {
      try {
        if (initialProducts.length === 0) {
          const url =
            featuredProductIds.length > 0
              ? `/api/products/featured?ids=${featuredProductIds.join(',')}`
              : '/api/products?limit=8&sort=newest&status=published';
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            // Handle both {data:[]} and {products:[]} formats
            const fetched = json.data || json.products || [];
            if (fetched.length > 0) setProducts(fetched);
          }
        }

        if (initialTestimonials.length === 0) {
          const res = await fetch('/api/testimonials/store');
          if (res.ok) {
            const json = await res.json();
            setTestimonialsList(json.testimonials || []);
          }
        }

        if (initialCollections.length === 0) {
          const res = await fetch('/api/collections');
          if (res.ok) {
            const json = await res.json();
            const fetched = (json.collections || []).slice(0, 2);
            if (fetched.length > 0) setCollections(fetched);
          }
        }
      } catch (e) {
        // Silently fail — sections will show loading state
      }
    };

    fetchIfEmpty();
  }, []);

  return (
    <>
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
