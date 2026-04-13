'use client';

import { useEffect, useState } from 'react';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { BestsellersSection } from '@/components/home/BestsellersSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CollectionsSection } from '@/components/home/CollectionsSection';

interface Props {
  readonly products: any[];
  readonly featuredProductIds: string[];
  readonly testimonialsList: any[];
  readonly collections: any[];
}

export default function HomeSectionsClient({
  products: initialProducts,
  featuredProductIds,
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

    const fetchProducts = async () => {
      if (initialProducts.length > 0) return;
      try {
        const url =
          featuredProductIds.length > 0
            ? `/api/products/featured?ids=${featuredProductIds.join(',')}`
            : '/api/products?limit=8&sort=newest&status=published';
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const fetched = json.data || json.products || [];
        if (fetched.length > 0) setProducts(fetched);
      } catch (e: unknown) {
        console.error('[Home] Failed to fetch products:', e);
      }
    };

    const fetchTestimonials = async () => {
      if (initialTestimonials.length > 0) return;
      try {
        const res = await fetch('/api/testimonials/store');
        if (!res.ok) return;
        const json = await res.json();
        setTestimonialsList(json.testimonials || []);
      } catch (e: unknown) {
        console.error('[Home] Failed to fetch testimonials:', e);
      }
    };

    const fetchCollections = async () => {
      if (initialCollections.length > 0) return;
      try {
        const res = await fetch('/api/collections');
        if (!res.ok) return;
        const json = await res.json();
        const fetched = (json.collections || []).slice(0, 2);
        if (fetched.length > 0) setCollections(fetched);
      } catch (e: unknown) {
        console.error('[Home] Failed to fetch collections:', e);
      }
    };

    fetchProducts();
    fetchTestimonials();
    fetchCollections();
  }, [
    initialProducts,
    initialTestimonials,
    initialCollections,
    featuredProductIds,
  ]);

  return (
    <>
      <FeaturedProductsSection
        products={products}
        featuredProductIds={featuredProductIds}
      />
      <BestsellersSection products={products} />
      <TestimonialsSection testimonials={testimonialsList} />
      <CollectionsSection collections={collections} />
    </>
  );
}
