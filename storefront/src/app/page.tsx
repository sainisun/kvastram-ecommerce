import ProductGrid from '@/components/ProductGrid';
import { Star, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import BannerCarousel from '@/components/BannerCarousel';
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
  other: {
    'script:ld+json': JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Kvastram',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: 'Premium clothing for the global citizen. Artisan-crafted fashion with worldwide shipping.',
        sameAs: [
          'https://instagram.com/kvastram',
          'https://facebook.com/kvastram',
          'https://pinterest.com/kvastram',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+1-800-KVASTRAM',
          contactType: 'Customer Service',
          availableLanguage: ['English'],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Kvastram',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ]),
  },
};

export default async function Home() {
  const bannersData = await api.getBanners();
  const banners = bannersData.banners || [];

  // Fetch New Arrivals (Server Side)
  const productsData = await api.getProducts({ limit: 4, sort: 'newest' });
  const products = productsData.products || [];

  // Structured Data for Organization and Website
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kvastram',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Premium clothing for the global citizen. Artisan-crafted fashion with worldwide shipping.',
    sameAs: [
      'https://instagram.com/kvastram',
      'https://facebook.com/kvastram',
      'https://pinterest.com/kvastram',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-800-KVASTRAM',
      contactType: 'Customer Service',
      availableLanguage: ['English'],
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kvastram',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* 1. Announcement Bar */}
        <div className="bg-stone-900 text-white text-xs tracking-widest text-center py-2 uppercase">
          Complimentary Worldwide Shipping on Orders Over $250
        </div>

        {/* 2. Editorial Hero Section */}
        {/* 2. Editorial Hero Section */}
        <BannerCarousel banners={banners} />

        {/* 3. Value Props (Trust Signals for International Customers) */}
        <section className="py-12 border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-stone-100">
              <div className="p-4 space-y-3">
                <div className="flex justify-center text-stone-900"><Globe size={24} strokeWidth={1.5} /></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Global Shipping</h3>
                <p className="text-xs text-stone-500 max-w-[200px] mx-auto">Seamless delivery to 150+ countries with duty-inclusive options.</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-center text-stone-900"><Star size={24} strokeWidth={1.5} /></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Artisan Craft</h3>
                <p className="text-xs text-stone-500 max-w-[200px] mx-auto">Hand-finished by master artisans in India and Italy.</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-center text-stone-900"><ShieldCheck size={24} strokeWidth={1.5} /></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Authenticity</h3>
                <p className="text-xs text-stone-500 max-w-[200px] mx-auto">Guaranteed authentic materials and sustainable sourcing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Brand Ticker (Social Proof) */}
        <div className="border-y border-stone-100 bg-stone-50 py-6 overflow-hidden">
          <div className="flex items-center justify-around opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-serif italic text-stone-400">Vogue</span>
            <span className="text-xl font-serif italic text-stone-400">Harper&apos;s Bazaar</span>
            <span className="text-xl font-serif italic text-stone-400">GQ India</span>
            <span className="text-xl font-serif italic text-stone-400">Elle Decor</span>
            <span className="text-xl font-serif italic text-stone-400">Architectural Digest</span>
          </div>
        </div>

        {/* 5. Curated Categories (The Mosaic) */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
            {/* Large Left Block */}
            <div className="relative group overflow-hidden bg-stone-100 cursor-pointer">
              <div className="absolute inset-0 bg-stone-300 group-hover:scale-105 transition-transform duration-1000"></div>
              {/* Image Placeholder: Men / Jackets */}
              <div className="absolute inset-0 flex flex-col justify-end p-12 bg-gradient-to-t from-black/50 to-transparent">
                <span className="text-white text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Heritage</span>
                <h3 className="text-white text-4xl font-serif italic mb-4">Outerwear</h3>
                <Link href="/products?category=jackets" className="text-white border-b border-white pb-1 inline-block w-max hover:opacity-80">View Collection</Link>
              </div>
            </div>

            {/* Right Column Stack */}
            <div className="flex flex-col gap-4 h-full">
              <div className="relative flex-1 group overflow-hidden bg-stone-100 cursor-pointer">
                <div className="absolute inset-0 bg-stone-200 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-10 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-white text-2xl font-serif italic mb-2">Fine Silk</h3>
                  <Link href="/products?category=sarees" className="text-white text-sm hover:underline">Shop Sarees</Link>
                </div>
              </div>
              <div className="relative flex-1 group overflow-hidden bg-stone-100 cursor-pointer">
                <div className="absolute inset-0 bg-stone-800 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-10 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-white text-2xl font-serif italic mb-2">Leather Goods</h3>
                  <Link href="/products?category=bags" className="text-white text-sm hover:underline">Shop Accessories</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. "The Atelier" Editorial Block */}
        <section className="py-24 bg-stone-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em]">The Atelier</span>
              <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight">
                Where Tradition Meets <br />
                <span className="italic text-stone-600">Global Design</span>
              </h2>
              <p className="text-stone-600 leading-relaxed font-light text-lg">
                Our studio collaborates directly with master craftsmen in Varanasi and Florence.
                Every thread tells a story of generations of skill, reimagined for the contemporary
                wardrobe of the global traveler.
              </p>
              <div className="pt-4">
                <Link href="/about" className="text-stone-900 font-semibold border-b-2 border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                  Read Our Story
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2 h-[500px] bg-stone-200 relative overflow-hidden">
              {/* Image Placeholder */}
              <div className="absolute inset-0 bg-stone-300"></div>
              <div className="absolute inset-0 flex items-center justify-center text-stone-400 font-serif italic text-2xl">Atelier Image</div>
            </div>
          </div>
        </section>

        {/* 7. Product Grid (New Arrivals) */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Curated New Arrivals</h2>
            <p className="text-stone-500 font-light">Fresh from the atelier. Limited quantities available.</p>
          </div>
          <ProductGrid initialProducts={products} />
          <div className="text-center mt-16">
            <Link href="/products" className="inline-block bg-stone-900 text-white px-8 py-3 rounded-none uppercase tracking-widest text-xs font-bold hover:bg-stone-800 transition-colors">
              View All Products
            </Link>
          </div>
        </section>

        {/* 8. Testimonials (Client Love) */}
        <section className="py-24 bg-stone-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Star size={24} className="mx-auto text-stone-400 mb-8" fill="currentColor" />
            <h2 className="text-2xl md:text-4xl font-serif italic text-stone-900 leading-relaxed mb-8">
              &quot;The craftsmanship is unlike anything I&apos;ve seen in Europe. The pashmina shawl is incredibly soft yet warm—a true heirloom piece.&quot;
            </h2>
            <div className="space-y-1">
              <p className="font-bold text-sm tracking-widest uppercase text-stone-900">Elena Rossi</p>
              <p className="text-xs text-stone-500 font-serif italic">Milan, Italy</p>
            </div>
          </div>
        </section>

        {/* 9. Newsletter */}
        <section className="py-24 bg-stone-900 text-white border-t border-stone-800">
          <div className="max-w-xl mx-auto px-6 text-center">
            <span className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] block mb-4">The Inner Circle</span>
            <h2 className="text-3xl font-serif mb-6">Unlock Early Access</h2>
            <p className="text-stone-400 mb-8 font-light leading-relaxed">
              Be the first to know about new artisan collaborations, private sales, and stories from our workshops.
            </p>
            <NewsletterForm />
            <p className="text-[10px] text-stone-600 mt-4">
              By subscribing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
