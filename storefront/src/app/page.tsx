import ProductGrid from '@/components/ProductGrid';
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

const CATEGORIES = [
  { name: 'Sarees', slug: 'sarees', image: '/images/home/category-sarees.jpg', alt: 'Silk Sarees' },
  { name: 'Lehengas', slug: 'lehengas', image: '/images/home/category-lehengas.jpg', alt: 'Bridal Lehengas' },
  { name: 'Kurtas', slug: 'kurtas', image: '/images/home/category-kurtas.jpg', alt: 'Traditional Kurtas' },
  { name: 'Accessories', slug: 'accessories', image: '/images/home/category-accessories.jpg', alt: 'Accessories' },
];

const COLLECTIONS = [
  { name: 'Bridal Collection', slug: 'bridal', image: '/images/home/collection-bridal.jpg', tagline: 'Timeless Elegance' },
  { name: 'Festival Edit', slug: 'festival', image: '/images/home/collection-festival.jpg', tagline: 'Celebrate in Style' },
  { name: 'Summer Ready', slug: 'summer', image: '/images/home/collection-summer.jpg', tagline: 'Breezy & Beautiful' },
];

export default async function Home() {
  const productsData = await api.getProducts({ limit: 8, sort: 'newest' });
  const products = productsData.products || [];

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* 1. Announcement Bar - Like Spell */}
        <div className="bg-stone-900 text-white text-xs tracking-widest text-center py-2 uppercase">
          Complimentary Worldwide Shipping on Orders Over $250
        </div>

        {/* 2. Hero Section - Full Width Image */}
        <section className="relative h-[85vh] min-h-[600px]">
          <Image
            src="/images/home/hero-main.jpg"
            alt="Kvastram - Artisan Crafted Fashion"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-xl">
                <span className="text-white/80 text-sm font-medium tracking-[0.3em] uppercase mb-4 block">
                  Artisan Crafted Since 1985
                </span>
                <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
                  Where Tradition <br />
                  <span className="italic">Meets Modern</span>
                </h1>
                <p className="text-white/90 text-lg mb-8 font-light max-w-md">
                  Discover handcrafted elegance from master artisans in India and Italy. 
                  Each piece tells a story of generations of expertise.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/products" 
                    className="bg-white text-stone-900 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors"
                  >
                    Shop New Arrivals
                  </Link>
                  <Link 
                    href="/about" 
                    className="border border-white text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-colors"
                  >
                    Our Story
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Value Props - Minimal */}
        <section className="py-8 border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Globe size={20} strokeWidth={1.5} className="text-stone-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-stone-600">150+ Countries</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Star size={20} strokeWidth={1.5} className="text-stone-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-stone-600">Handcrafted</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={20} strokeWidth={1.5} className="text-stone-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-stone-600">Authentic</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Shop by Category - Visual Tiles Like Spell */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Curated For You</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mt-2">Shop by Category</h2>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <Link 
                key={category.slug} 
                href={`/products?category=${category.slug}`}
                className="group relative aspect-[3/4] overflow-hidden"
              >
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-end p-6">
                  <div>
                    <h3 className="text-white text-xl font-serif italic">{category.name}</h3>
                    <span className="text-white/80 text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Shop Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Featured Collections - Story Based */}
        <section className="py-20 bg-stone-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Discover</span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mt-2">Featured Collections</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLLECTIONS.map((collection) => (
              <Link 
                key={collection.slug} 
                href={`/collections/${collection.slug}`}
                className="group relative aspect-[4/5] overflow-hidden"
              >
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="text-white/70 text-xs uppercase tracking-widest">{collection.tagline}</span>
                  <h3 className="text-white text-2xl font-serif italic mt-1">{collection.name}</h3>
                  <span className="inline-flex items-center gap-2 text-white text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
            </div>
          </div>
        </section>

        {/* 6. New Arrivals - Product Grid */}
        <section className="py-20 max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Just Landed</span>
            <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mt-2">New Arrivals</h2>
          </div>
          <ProductGrid initialProducts={products} />
          <div className="text-center mt-12">
            <Link 
              href="/products" 
              className="inline-block bg-stone-900 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              Shop All Products
            </Link>
          </div>
        </section>

        {/* 7. Brand Story - Editorial Block */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square overflow-hidden">
              <Image
                src="/images/home/atelier-story.jpg"
                alt="Kvastram Artisan Workshop"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">Our Story</span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight">
                Crafted with <span className="italic text-stone-600">Soul</span>
              </h2>
              <p className="text-stone-600 leading-relaxed text-lg">
                Every Kvastram piece begins its journey in the workshops of master artisans in Varanasi, 
                India, and Florence, Italy. Our artisans have inherited skills passed down through generations, 
                creating garments that are not just clothing, but heirlooms.
              </p>
              <p className="text-stone-600 leading-relaxed">
                We believe in slow fashion - pieces designed to last a lifetime, crafted with 
                sustainable materials and time-honored techniques.
              </p>
              <div className="pt-4">
                <Link 
                  href="/about" 
                  className="inline-flex items-center gap-2 text-stone-900 font-semibold border-b-2 border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
                >
                  Meet Our Artisans <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Customer Love - Styled On You */}
        <section className="py-20 bg-stone-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Star size={24} className="mx-auto text-stone-400 mb-6" fill="currentColor" />
            <h2 className="text-2xl md:text-4xl font-serif italic leading-relaxed mb-8">
              "The craftsmanship is unlike anything I've seen in Europe. 
              The pashmina shawl is incredibly soft yet warm—a true heirloom piece."
            </h2>
            <div className="space-y-1">
              <p className="font-bold text-sm tracking-widest uppercase">Elena Rossi</p>
              <p className="text-stone-400 text-sm font-serif italic">Milan, Italy</p>
            </div>
          </div>
        </section>

        {/* 9. Newsletter - Like Spell */}
        <section className="py-24 bg-stone-100">
          <div className="max-w-xl mx-auto px-6 text-center">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] block mb-4">Join the Family</span>
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Unlock 10% Off</h2>
            <p className="text-stone-600 mb-8 font-light">
              Be the first to know about new collections, exclusive offers, and stories from our workshops.
            </p>
            <NewsletterForm />
            <p className="text-xs text-stone-400 mt-4">
              By subscribing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
