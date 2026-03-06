"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const FeaturedProductsSection = dynamic(
  () => import('@/components/home/FeaturedProductsSection').then((m) => m.FeaturedProductsSection),
  { ssr: false }
);
const BestsellersSection = dynamic(
  () => import('@/components/home/BestsellersSection').then((m) => m.BestsellersSection),
  { ssr: false }
);
const EditorialSection = dynamic(
  () => import('@/components/home/EditorialSection').then((m) => m.EditorialSection),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import('@/components/home/TestimonialsSection').then((m) => m.TestimonialsSection),
  { ssr: false }
);
const CollectionsSection = dynamic(
  () => import('@/components/home/CollectionsSection').then((m) => m.CollectionsSection),
  { ssr: false }
);
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
      <FeaturedProductsSection products={products} featuredProductIds={featuredProductIds} />
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
