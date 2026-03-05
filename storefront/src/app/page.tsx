import ProductCarousel from '@/components/ProductCarousel';
import HeroCarousel from '@/components/hero/HeroCarousel';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import NewsletterForm from '@/components/NewsletterForm';
import { api } from '@/lib/api';
import type { Metadata } from 'next';
import { MarqueeStrip } from '@/components/ui/MarqueeStrip';
import { RevealOnScroll, StatReveal } from '@/components/ui/RevealOnScroll';

interface Banner {
  id: string;
  section: string;
  is_active: boolean;
  image?: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Product {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string;
  collection?: { title: string };
  variants?: Array<{
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';

export const metadata: Metadata = {
  title: 'Kvastram | Artisanal Luxury Fashion',
  description:
    'Premium clothing for the global citizen. Discover artisan-crafted fashion with worldwide shipping.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Kvastram',
    title: 'Kvastram | Artisanal Luxury Fashion',
    description: 'Premium clothing for the global citizen.',
  },
};

export default async function Home() {
  // ─── All existing API calls preserved exactly ───
  const homepageData = await api.getHomepageSettings();
  const homepageSettings = homepageData.settings || {};

  const featuredProductIds = homepageSettings.featured_product_ids
    ? homepageSettings.featured_product_ids
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : [];

  let productsData;
  if (featuredProductIds.length > 0) {
    productsData = await api.getFeaturedProducts(featuredProductIds);
  } else {
    productsData = await api.getProducts({ limit: 8, sort: 'newest' });
  }

  const [categoriesData, collectionsData, testimonialsData, bannersData] =
    await Promise.all([
      api.getCategories(),
      api.getCollections(),
      api.getTestimonials(),
      api.getBanners(),
    ]);

  const products = productsData.products || [];
  const categories = (categoriesData.categories || []).slice(0, 3);
  const collections = (collectionsData.collections || []).slice(0, 2);
  const testimonialsList = testimonialsData.testimonials || [];
  // Hero banners: only 'hero' section banners passed to HeroCarousel
  const heroBanners = (bannersData.banners || []).filter(
    (b: Banner) => b.section === 'hero' && b.is_active
  );

  const categoryImages: Record<string, string> = {
    sarees: '/images/home/category-sarees.jpg',
    lehengas: '/images/home/category-lehengas.jpg',
    kurtas: '/images/home/category-kurtas.jpg',
    accessories: '/images/home/category-accessories.jpg',
  };

  const isAnnouncementEnabled = Boolean(
    homepageSettings.announcement_bar_enabled
  );
  const announcementText = homepageSettings.announcement_bar_text || '';

  // Ticker items for marquee
  const tickerItems = [
    announcementText ||
      'Complimentary Worldwide Shipping on Orders Over ₹10,000',
    'Handcrafted by Artisans Since 1987',
    '30-Day Returns & Exchanges',
    'Exclusive Artisan Collections',
  ];

  // Stats data — admin se configurable, defaults as fallback
  const statsData = [
    {
      num: homepageSettings.stat_customer_rating || '4.9★',
      label: 'Customer Rating',
    },
    {
      num: homepageSettings.stat_happy_customers || '15,000+',
      label: 'Happy Customers',
    },
    {
      num: homepageSettings.stat_countries_served || '150+',
      label: 'Countries Served',
    },
    {
      num: homepageSettings.stat_return_policy || '30-Day',
      label: 'Free Returns',
    },
  ];

  return (
    <>
      {/* Reveal observer — client component wrapper */}
      <RevealOnScroll>
        <div className="min-h-screen" style={{ background: 'var(--white)' }}>
          {/* ═══ 1. ANNOUNCEMENT TICKER ═══ */}
          {(isAnnouncementEnabled || true) && (
            <div
              style={{
                background: 'var(--black)',
                color: 'var(--white)',
                overflow: 'hidden',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  animation: 'ticker 35s linear infinite',
                  whiteSpace: 'nowrap',
                  gap: 0,
                }}
              >
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '0 48px',
                      opacity: 0.9,
                      display: 'inline-block',
                    }}
                  >
                    {item}
                    <span
                      style={{
                        display: 'inline-block',
                        width: '4px',
                        height: '4px',
                        background: 'rgba(248,246,243,0.3)',
                        borderRadius: '50%',
                        marginLeft: '48px',
                        verticalAlign: 'middle',
                      }}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 2. HERO ═══ */}
          <HeroCarousel banners={heroBanners} />

          {/* ═══ 3. STATS BAR ═══ */}
          <div className="stats-bar-prem">
            <StatReveal />
            {statsData.map((stat, i) => (
              <div
                key={i}
                className="stat-item-prem"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span className="stat-num-prem">{stat.num}</span>
                <span className="stat-label-prem">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* ═══ 4. SHOP BY CATEGORY ═══ */}
          <section style={{ padding: '96px 64px' }}>
            <div className="section-header-prem reveal">
              <div>
                <p className="section-eyebrow-prem">Curated For You</p>
                <h2 className="section-title-prem">
                  Shop by <em>Category</em>
                </h2>
              </div>
              <Link href="/products" className="link-all-prem">
                View All
              </Link>
            </div>

            {categories.length > 0 && (
              <div className="category-grid-prem reveal reveal-delay-1">
                {categories.map((category: Category) => (
                  <Link
                    key={category.id}
                    href={`/products?category_id=${category.id}`}
                    className="cat-card-prem"
                  >
                    <OptimizedImage
                      src={
                        category.image ||
                        categoryImages[category.slug] ||
                        '/images/home/category-sarees.jpg'
                      }
                      alt={category.name}
                      fill
                      className="cat-img object-cover"
                      sizes="(max-width: 900px) 100vw, 33vw"
                    />
                    <div className="cat-overlay-prem" />
                    <div className="cat-info-prem">
                      <span className="cat-name-prem">{category.name}</span>
                      <span className="cat-count-prem">Explore Collection</span>
                    </div>
                    <div className="cat-arrow-prem">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ═══ 5. MARQUEE STRIP ═══ */}
          <MarqueeStrip
            items={[
              'Kashmiri Weaves',
              'Artisanal Luxury',
              'Hand Embroidered',
              'Slow Fashion',
              'Florentine Leather',
              'Silk Road Heritage',
            ]}
            speed="22s"
          />

          {/* ═══ 6. NEW ARRIVALS / FEATURED ═══ */}
          <section
            style={{ padding: '96px 64px', background: 'var(--off-white)' }}
          >
            <div className="section-header-prem reveal">
              <div>
                <p className="section-eyebrow-prem">
                  {homepageSettings.featured_product_ids
                    ? 'Featured Collection'
                    : 'Just Landed'}
                </p>
                <h2 className="section-title-prem">
                  {homepageSettings.featured_product_ids ? (
                    <>
                      Curated <em>For You</em>
                    </>
                  ) : (
                    <>
                      New <em>Arrivals</em>
                    </>
                  )}
                </h2>
              </div>
              <Link href="/products" className="link-all-prem">
                Shop All
              </Link>
            </div>
            <ProductCarousel products={products} showNavigation={true} />
          </section>

          {/* ═══ 7. BESTSELLERS (Dark) ═══ */}
          {products.length > 0 && (
            <section
              style={{ padding: '96px 64px', background: 'var(--black)' }}
            >
              <div className="section-header-prem reveal">
                <div>
                  <p
                    className="section-eyebrow-prem"
                    style={{ color: 'rgba(248,246,243,0.4)' }}
                  >
                    Our Top Picks
                  </p>
                  <h2
                    className="section-title-prem"
                    style={{ color: 'var(--white)' }}
                  >
                    Best <em>Sellers</em>
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="link-all-prem"
                  style={{ color: 'var(--white)' }}
                >
                  View All
                </Link>
              </div>

              <div className="product-grid-prem">
                {products.slice(0, 4).map((product: Product) => {
                  const priceObj = product.variants?.[0]?.prices?.[0];
                  const price = priceObj
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency:
                          priceObj.currency_code?.toUpperCase() || 'USD',
                      }).format(priceObj.amount / 100)
                    : '';

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.handle || product.id}`}
                      className="prod-card-prem group"
                    >
                      <div className="prod-img-wrap-prem">
                        {product.thumbnail ? (
                          <OptimizedImage
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover"
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'var(--off-white)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          />
                        )}
                        <span className="prod-tag-prem">Bestseller</span>
                        <button className="prod-quick-add-prem" tabIndex={-1}>
                          Quick Add
                        </button>
                      </div>
                      <div className="prod-info-prem">
                        <p className="prod-collection-prem">
                          {product.collection?.title || 'Kvastram'}
                        </p>
                        <h3 className="prod-name-prem">{product.title}</h3>
                        {price && <p className="prod-price-prem">{price}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ 8. EDITORIAL SPLIT (Brand Story) ═══ */}
          <div className="editorial-prem reveal">
            <div className="editorial-img-prem">
              <OptimizedImage
                src={
                  homepageSettings.brand_story_image ||
                  '/images/home/atelier-story.jpg'
                }
                alt="Kvastram Artisan Workshop"
                fill
                className="object-cover"
              />
            </div>
            <div className="editorial-content-prem">
              <p className="editorial-eyebrow-prem">Our Heritage</p>
              <h2 className="editorial-title-prem">
                Crafted with
                <br />
                Soul & <em>Purpose</em>
              </h2>
              <p className="editorial-body-prem">
                {homepageSettings.brand_story_content ||
                  'Every Kvastram piece begins its journey in the workshops of master artisans in Varanasi, India. Our artisans have inherited skills passed down through generations, creating garments that are not just clothing, but heirlooms.'}
              </p>
              <Link href="/about" className="btn-outline-prem">
                Meet Our Artisans
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ═══ 9. TESTIMONIALS ═══ */}
          <section
            className="testimonial-section-prem"
            style={{ background: 'var(--white)' }}
          >
            {testimonialsList.length > 0 ? (
              <TestimonialsCarousel testimonials={testimonialsList} />
            ) : (
              <>
                {/* Stars */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                    marginBottom: '40px',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#080808"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="testimonial-text-prem reveal">
                  &ldquo;The craftsmanship is unlike anything I&apos;ve
                  encountered in Europe. The pashmina shawl is incredibly soft
                  yet warm — a true heirloom piece.&rdquo;
                </p>
                <div className="testimonial-author-prem reveal reveal-delay-1">
                  <span className="author-line-prem" />
                  <div>
                    <p className="author-name-prem">Elena Rossi</p>
                    <p className="author-loc-prem">Milan, Italy</p>
                  </div>
                  <span className="author-line-prem" />
                </div>
              </>
            )}
          </section>

          {/* ═══ 10. FEATURED COLLECTIONS ═══ */}
          {collections.length > 0 && (
            <section
              style={{ padding: '96px 64px', background: 'var(--off-white)' }}
            >
              <div className="section-header-prem reveal">
                <div>
                  <p className="section-eyebrow-prem">Exclusive</p>
                  <h2 className="section-title-prem">
                    Featured <em>Collections</em>
                  </h2>
                </div>
              </div>
              <div className="collections-grid-prem reveal reveal-delay-1">
                {collections.map((collection: Collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.handle}`}
                    className="coll-card-prem group"
                  >
                    <OptimizedImage
                      src={
                        collection.image || '/images/home/collection-bridal.jpg'
                      }
                      alt={collection.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 900px) 100vw, 50vw"
                    />
                    <div className="coll-content-prem">
                      <p className="coll-label-prem">Exclusively For</p>
                      <h3 className="coll-name-prem">{collection.title}</h3>
                      <span className="coll-cta-prem">View Collection</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ═══ DIVIDER ═══ */}
          <div className="divider-text-prem">
            <span>The Community</span>
          </div>

          {/* ═══ 11. UGC / Community Section ═══ */}
          <section style={{ padding: '80px 64px', background: 'var(--white)' }}>
            <div
              className="section-header-prem reveal"
              style={{ marginBottom: '48px' }}
            >
              <div>
                <p className="section-eyebrow-prem">#WearKvastram</p>
                <h2 className="section-title-prem">
                  Styled by Our <em>Community</em>
                </h2>
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--mid)',
                  maxWidth: '280px',
                  textAlign: 'right',
                  lineHeight: 1.7,
                }}
                className="hidden md:block"
              >
                Real people. Real style. Tag us to be featured.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
                marginBottom: '40px',
              }}
              className="grid-cols-2 md:grid-cols-3"
            >
              {[
                {
                  gradient: 'from-stone-200 to-stone-300',
                  user: '@aria.styles',
                  caption: 'This pashmina is everything ❤️✨',
                  tag: 'New Arrival',
                },
                {
                  gradient: 'from-amber-100 to-amber-200',
                  user: '@luxe.by.nina',
                  caption: "Wearing the silk kurta to my sister's wedding 💛",
                  tag: 'Wedding Season',
                },
                {
                  gradient: 'from-rose-100 to-rose-200',
                  user: '@mira.edits',
                  caption: 'The quality is unmatched — worth every penny',
                  tag: null,
                },
                {
                  gradient: 'from-stone-300 to-stone-400',
                  user: '@fatima.looks',
                  caption: 'So soft, so elegant. My new favourite piece!',
                  tag: 'Bestseller',
                },
                {
                  gradient: 'from-teal-100 to-teal-200',
                  user: '@style.by.aisha',
                  caption: 'Gifted this to my mum — she cried happy tears 😭',
                  tag: null,
                },
                {
                  gradient: 'from-purple-100 to-purple-200',
                  user: '@priya.ootd',
                  caption: 'The cashmere cardigan is pure luxury, obsessed!',
                  tag: 'Most Loved',
                },
              ].map(({ gradient, user, caption, tag }, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden"
                  style={{ aspectRatio: '1/1' }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${gradient} flex items-end`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span style={{ fontSize: '40px', opacity: 0.3 }}>👗</span>
                    </div>
                    {tag && (
                      <span
                        className="absolute top-3 left-3"
                        style={{
                          background: 'rgba(248,246,243,0.9)',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          padding: '5px 10px',
                          color: 'var(--black)',
                        }}
                      >
                        {tag}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-[var(--black)] bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-500" />
                    <div
                      className="absolute inset-x-0 bottom-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(8,8,8,0.8), transparent)',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--white)',
                          marginBottom: '4px',
                        }}
                      >
                        {user}
                      </p>
                      <p
                        style={{
                          fontSize: '10px',
                          color: 'rgba(248,246,243,0.8)',
                          lineHeight: 1.4,
                        }}
                      >
                        {caption}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <a
                href="https://instagram.com/kvastram"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-prem"
              >
                📸 Follow Us @kvastram
              </a>
            </div>
          </section>

          {/* ═══ MARQUEE 2 ═══ */}
          <MarqueeStrip
            items={[
              'Authentic Craftsmanship',
              'Sustainably Made',
              'Worldwide Shipping',
              'Premium Materials',
              'Artisan Heritage',
            ]}
            speed="25s"
          />

          {/* ═══ 12. NEWSLETTER ═══ */}
          <section className="newsletter-prem">
            <p className="newsletter-eyebrow-prem">Join the Inner Circle</p>
            <h2 className="newsletter-title-prem">
              {homepageSettings.newsletter_title || (
                <>
                  Be First <em>to Know</em>
                </>
              )}
            </h2>
            <p className="newsletter-sub-prem">
              {homepageSettings.newsletter_subtitle ||
                'Exclusive offers, new artisan collections, early access to limited pieces. No spam — ever.'}
            </p>
            <div className="newsletter-form-prem">
              <NewsletterForm />
            </div>
            <p className="newsletter-note-prem">
              15,000+ subscribers · Unsubscribe anytime
            </p>
          </section>
        </div>
      </RevealOnScroll>
    </>
  );
}
