import ProductGrid from '@/components/ProductGrid';
import ProductCarousel from '@/components/ProductCarousel';
import HeroCarousel from '@/components/hero/HeroCarousel';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { Star, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterForm from '@/components/NewsletterForm';
import { api } from '@/lib/api';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';

export const metadata: Metadata = {
  title: 'Kvastram | Modern International Fashion',
  description: 'Premium clothing for the global citizen. Discover artisan-crafted fashion with worldwide shipping.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Kvastram',
    title: 'Kvastram | Modern International Fashion',
    description: 'Premium clothing for the global citizen.',
  },
};

export default async function Home() {
  // First fetch homepage settings to check for featured products
  const homepageData = await api.getHomepageSettings();
  const homepageSettings = homepageData.settings || {};

  // Check if featured products are configured
  const featuredProductIds = homepageSettings.featured_product_ids
    ? homepageSettings.featured_product_ids.split(',').map((id: string) => id.trim()).filter(Boolean)
    : [];

  // Fetch featured products if IDs are configured, otherwise fetch newest
  let productsData;
  if (featuredProductIds.length > 0) {
    productsData = await api.getFeaturedProducts(featuredProductIds);
  } else {
    productsData = await api.getProducts({ limit: 8, sort: 'newest' });
  }

  // Fetch other data in parallel
  const [categoriesData, collectionsData, testimonialsData] = await Promise.all([
    api.getCategories(),
    api.getCollections(),
    api.getTestimonials()
  ]);

  const products = productsData.products || [];
  const categories = (categoriesData.categories || []).slice(0, 4);
  const collections = (collectionsData.collections || []).slice(0, 3);
  const testimonialsList = testimonialsData.testimonials || [];

    // Fallback images if not set
  const categoryImages: Record<string, string> = {
    'sarees': '/images/home/category-sarees.jpg',
    'lehengas': '/images/home/category-lehengas.jpg',
    'kurtas': '/images/home/category-kurtas.jpg',
    'accessories': '/images/home/category-accessories.jpg',
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* 1. Announcement Bar */}
        {(homepageSettings.announcement_bar_enabled === 'true' || homepageSettings.announcement_bar_enabled === true) && homepageSettings.announcement_bar_text && (
          <div className="bg-stone-900 text-white text-[10px] md:text-xs tracking-widest text-center py-3 uppercase font-medium">
            {homepageSettings.announcement_bar_text}
          </div>
        )}
        {!homepageSettings.announcement_bar_enabled && (
          <div className="bg-stone-900 text-white text-[10px] md:text-xs tracking-widest text-center py-3 uppercase font-medium">
            Complimentary Worldwide Shipping on Orders Over $250
          </div>
        )}

        {/* 2. Hero Section */}
        {/* 2. Hero Section */}
        <HeroCarousel />

        {/* 3. Value Props - Desktop style on all screens */}
        <section className="py-8 md:py-16 border-b border-stone-100 bg-stone-50/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-row justify-center items-stretch gap-4 md:gap-8 text-center divide-x divide-stone-200 overflow-x-auto">
              <div className="flex-1 min-w-[100px] flex flex-col items-center gap-2 md:gap-3 py-2 px-2 md:px-4 hover:scale-105 transition-transform duration-300">
                <Globe size={24} strokeWidth={1} className="text-stone-800" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-stone-900">Global Shipping</span>
                <p className="text-[10px] md:text-sm text-stone-500 font-light hidden sm:block">To over 150+ countries worldwide</p>
              </div>
              <div className="flex-1 min-w-[100px] flex flex-col items-center gap-2 md:gap-3 py-2 px-2 md:px-4 hover:scale-105 transition-transform duration-300">
                <Star size={24} strokeWidth={1} className="text-stone-800" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-stone-900">Premium Quality</span>
                <p className="text-[10px] md:text-sm text-stone-500 font-light hidden sm:block">Handcrafted by master artisans</p>
              </div>
              <div className="flex-1 min-w-[100px] flex flex-col items-center gap-2 md:gap-3 py-2 px-2 md:px-4 hover:scale-105 transition-transform duration-300">
                <ShieldCheck size={24} strokeWidth={1} className="text-stone-800" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-stone-900">Authenticity Guaranteed</span>
                <p className="text-[10px] md:text-sm text-stone-500 font-light hidden sm:block">Every piece is verified original</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Shop by Category */}
        <section className="py-24 max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-16 px-2">
            <div>
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Curated For You</span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900">Shop by Category</h2>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors border-b border-stone-900 pb-1 hover:border-stone-600">
              View All Categories <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {categories.length > 0 ? categories.map((category: any, index: number) => (
              <Link 
                key={category.id} 
                href={`/products?category_id=${category.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-sm shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <Image
                  src={category.image || categoryImages[category.slug] || '/images/home/category-sarees.jpg'}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-white text-2xl font-serif italic mb-2">{category.name}</h3>
                    <span className="inline-flex items-center text-white/90 text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-1 group-hover:border-white transition-colors">
                      Explore Collection <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            )) : null}
          </div>
        </section>

        {/* 5. Featured Collections */}
        <section className="py-24 bg-stone-50 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 block">Discover</span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6">Featured Collections</h2>
              <p className="text-stone-600 font-light text-lg">Curated selections for the modern connoisseur, blending heritage with contemporary style.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {collections.length > 0 ? collections.map((collection: any) => (
              <Link 
                key={collection.id} 
                href={`/collections/${collection.handle}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-sm shadow-md hover:shadow-2xl transition-all duration-500"
              >
                <Image
                  src={collection.image || "/images/home/collection-bridal.jpg"}
                  alt={collection.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-500" />
                
                {/* Floating Content Card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 shadow-lg border border-white/20">
                  <span className="text-stone-500 text-[10px] uppercase tracking-widest mb-1 block">Collection</span>
                  <h3 className="text-stone-900 text-2xl font-serif italic mb-4">{collection.title}</h3>
                  <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-900 group-hover:text-stone-600 transition-colors">View Collection</span>
                    <ArrowRight size={16} className="text-stone-900 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )) : null}
            </div>
          </div>
        </section>

        {/* 6. Featured Products / New Arrivals - Carousel */}
        <section className="py-24 max-w-7xl mx-auto px-6 md:px-12 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 text-center md:text-left gap-6 px-2">
            <div>
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 block">
                {homepageSettings.featured_product_ids ? 'Featured Collection' : 'Just Landed'}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900">
                {homepageSettings.featured_product_ids ? 'Curated For You' : 'New Arrivals'}
              </h2>
            </div>
            <Link 
              href="/products" 
              className="px-8 py-3 border border-stone-200 text-sm font-bold uppercase tracking-widest hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300"
            >
              Shop All Products
            </Link>
          </div>
          <ProductCarousel products={products} showNavigation={true} />
        </section>

        {/* 7. Brand Story */}
        <section className="py-32 overflow-hidden bg-stone-50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative aspect-[4/5] md:aspect-square overflow-hidden rounded-sm shadow-2xl group">
              <Image
                src={homepageSettings.brand_story_image || "/images/home/atelier-story.jpg"}
                alt="Kvastram Artisan Workshop"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
            <div className="space-y-8 lg:pr-12">
              <div className="inline-block border-b border-stone-300 pb-2">
                 <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Our Heritage</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[1.1]">
                {homepageSettings.brand_story_title || 'Crafted with Soul & Purpose'}
              </h2>
              <div className="space-y-6 text-lg text-stone-600 font-light leading-relaxed">
                <p>
                  {homepageSettings.brand_story_content || 'Every Kvastram piece begins its journey in the workshops of master artisans in Varanasi, India, and Florence, Italy. Our artisans have inherited skills passed down through generations, creating garments that are not just clothing, but heirlooms.'}
                </p>
              </div>
              <div className="pt-6">
                <Link 
                  href="/about" 
                  className="inline-flex items-center gap-3 text-stone-900 font-bold uppercase tracking-widest border-b-2 border-stone-900 pb-2 hover:text-stone-600 hover:border-stone-600 transition-all text-sm group"
                >
                  Meet Our Artisans <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Customer Love / Testimonials */}
        <section className="py-32 bg-stone-900 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            {testimonialsList.length > 0 ? (
              <TestimonialsCarousel testimonials={testimonialsList} />
            ) : (
              // Default testimonial when none in database
              <>
                <div className="mb-10 flex justify-center gap-1 animate-fade-in">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={24} fill="currentColor" className="text-amber-400" />
                  ))}
                </div>
                <h2 className="text-3xl md:text-5xl font-serif italic leading-tight mb-12 max-w-4xl mx-auto">
                  &quot;The craftsmanship is unlike anything I&apos;ve seen in Europe.
                  The pashmina shawl is incredibly soft yet warm—a true heirloom piece.&quot;
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-stone-700/50 backdrop-blur-sm rounded-full mb-2 overflow-hidden relative flex items-center justify-center border border-stone-600">
                    <span className="text-stone-300 font-serif text-xl italic">ER</span>
                  </div>
                  <p className="font-bold text-sm tracking-widest uppercase">Elena Rossi</p>
                  <p className="text-stone-400 text-sm font-serif italic">Milan, Italy</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 9. Newsletter */}
        <section className="py-32 bg-white relative">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] block mb-6">Join the Family</span>
            <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6">{homepageSettings.newsletter_title || 'Unlock 10% Off'}</h2>
            <p className="text-stone-600 mb-10 font-light text-lg">
              {homepageSettings.newsletter_subtitle || 'Be the first to know about new collections, exclusive offers, and stories from our workshops.'}
            </p>
            <div className="bg-stone-50 p-8 rounded-sm">
                <NewsletterForm />
            </div>
            <p className="text-xs text-stone-400 mt-6">
              By subscribing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
