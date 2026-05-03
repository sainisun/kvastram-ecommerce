'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Minus, Plus, Wifi, WifiOff } from 'lucide-react';

import ProductGallery from '@/components/product/ProductGallery';
import { Reviews } from '@/components/product/Reviews';
import { BackInStock } from '@/components/product/BackInStock';
import { SizeGuide } from '@/components/product/SizeGuide';
import ShareButtons from '@/components/ui/ShareButtons';
import WishlistButton from '@/components/ui/WishlistButton';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useShop } from '@/context/shop-context';
import { useInventoryWebSocket } from '@/hooks/useInventoryWebSocket';
import { buildProductImageAlt, getCategoryPath, getPrimaryCategory } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import type { MoneyAmount, Product, ProductImage, ProductOption, ProductVariant } from '@/types';

function getColorHex(colorName: string) {
  const map: Record<string, string> = { black: '#000000', navy: '#1e3a8a', white: '#ffffff', 'off white': '#faf8f5', cream: '#fdfbf7', terracotta: '#c5523f', olive: '#556b2f', taupe: '#8b8589', red: '#991b1b', blue: '#2563eb', green: '#15803d', yellow: '#ca8a04', beige: '#f5f5dc', brown: '#78350f', pink: '#fbcfe8', grey: '#6b7280', gray: '#6b7280' };
  return map[colorName.toLowerCase()] || '#cccccc';
}

type TabKey = 'description' | 'specs' | 'shipping' | 'returns' | 'reviews';

export default function ProductView({ product }: { product: Product }) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();

  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [showStickyATC, setShowStickyATC] = useState(false);
  const [realTimeInventory, setRealTimeInventory] = useState<Record<string, number>>({});

  const primaryCategory = getPrimaryCategory(product);
  const primaryCategoryPath = primaryCategory ? getCategoryPath(primaryCategory) : null;
  const displayTitle = getProductDisplayTitle(product.title);

  const { isConnected, subscribeToInventory, unsubscribeFromInventory } = useInventoryWebSocket({
    onInventoryUpdate: (update) =>
      setRealTimeInventory((prev) => ({ ...prev, [update.variantId]: update.quantity })),
  });

  useEffect(() => {
    product.variants?.forEach((v) => subscribeToInventory(v.id));
    return () => product.variants?.forEach((v) => unsubscribeFromInventory(v.id));
  }, [product.variants, subscribeToInventory, unsubscribeFromInventory]);

  useEffect(() => {
    const price = product.variants?.[0]?.prices?.[0];
    if (!product.id) return;
    addToRecentlyViewed({
      id: product.id,
      handle: product.handle || product.id,
      title: displayTitle,
      thumbnail: product.thumbnail || undefined,
      price: price?.amount || 0,
      currency: price?.currency_code?.toUpperCase() || 'USD',
    });
  }, [addToRecentlyViewed, product]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowStickyATC(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: '0px 0px -80px 0px',
    });
    const button = document.getElementById('pdp-atc-btn');
    if (button) observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const deliveryWindow = useMemo(() => {
    const r = currentRegion?.id?.toLowerCase() || '';
    if (r.startsWith('us')) return '10–14 business days';
    if (r.startsWith('gb') || r.startsWith('uk')) return '8–12 business days';
    if (r.startsWith('au') || r.startsWith('ca')) return '12–18 business days';
    if (r.startsWith('de') || r.startsWith('fr') || r.startsWith('eu')) return '10–16 business days';
    return '10–18 business days';
  }, [currentRegion]);

  const hasStructuredOptions = Boolean(product.options?.length);
  const defaultOptions = useMemo(() => {
    const d: Record<string, string> = {};
    product.options?.forEach((o: ProductOption) => { if (o.values?.length) d[o.title] = o.values[0].value; });
    return d;
  }, [product.options]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(defaultOptions);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || '');

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    if (product.variants.length === 1) return product.variants[0];
    if (hasStructuredOptions) {
      return (
        product.variants.find((v: ProductVariant) => {
          const parts = v.title.split(' / ').map((s) => s.trim());
          return product.options?.every((o: ProductOption, i: number) => parts[i] === selectedOptions[o.title]);
        }) || product.variants[0]
      );
    }
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  }, [hasStructuredOptions, product.options, product.variants, selectedOptions, selectedVariantId]);

  const currentInventory = selectedVariant ? realTimeInventory[selectedVariant.id] ?? selectedVariant.inventory_quantity : 0;
  const prices = selectedVariant?.prices || [];
  const inrPriceObj = prices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') || prices[0];
  const amount = inrPriceObj?.amount || 0;
  const compareAtAmount = selectedVariant?.compare_at_price;
  const formattedPrice = amount ? formatPrice(amount) : '';
  const formattedComparePrice = compareAtAmount ? formatPrice(compareAtAmount) : null;
  const outOfStock = currentInventory <= 0;

  const galleryMedia = useMemo(() => {
    return product.images?.length
      ? product.images
          .sort((a: ProductImage, b: ProductImage) => (a.position || 0) - (b.position || 0))
          .map((img: ProductImage, i: number) => ({
            ...img,
            alt: buildProductImageAlt(product, i, img.alt),
            alt_text: img.alt_text || buildProductImageAlt(product, i, img.alt),
          }))
      : product.thumbnail
        ? [{ id: 'thumb', url: product.thumbnail, alt: displayTitle, alt_text: displayTitle, is_thumbnail: true, position: 0 }]
        : [];
  }, [displayTitle, product]);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      id: selectedVariant.id,
      variantId: selectedVariant.id,
      quantity,
      title: `${displayTitle}${selectedVariant.title !== 'Default Variant' ? ` - ${selectedVariant.title}` : ''}`,
      price: amount,
      currency: 'INR',
      thumbnail: product.thumbnail || undefined,
      material: product.material || undefined,
      origin: product.origin_country || undefined,
      sku: selectedVariant.sku || undefined,
      description: product.description || undefined,
      handle: product.handle || product.id,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'specs', label: 'Specifications' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'returns', label: 'Returns' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="kv-container" style={{ paddingTop: 32, paddingBottom: 80 }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 24 }}>
          <a href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }} className="hover:text-stone-900">Home</a>
          <span>/</span>
          {primaryCategoryPath && primaryCategory ? (
            <>
              <a href={primaryCategoryPath} style={{ color: 'var(--muted)', textDecoration: 'none' }} className="hover:text-stone-900">{primaryCategory.name}</a>
              <span>/</span>
            </>
          ) : null}
          <span style={{ color: 'var(--ink)' }}>{displayTitle}</span>
        </nav>

        {/* Main PD layout */}
        <div className="pd-layout">

          {/* LEFT — Gallery */}
          <div>
            {/* Main image */}
            <ProductGallery
              media={galleryMedia}
              title={displayTitle}
              videos={product.videos || []}
            />
          </div>

          {/* RIGHT — Product info */}
          <div>
            {/* Category tag */}
            <div className="kv-tag" style={{ marginBottom: 10 }}>
              {product.collection?.title || 'Kvastram Collection'}
            </div>

            {/* Title */}
            <h1 className="section-title" style={{ marginBottom: 12 }}>{displayTitle}</h1>

            {/* Rating */}
            {product.avg_rating != null && product.avg_rating > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ color: '#f6ad55' }}>{'★★★★★'.slice(0, Math.round(product.avg_rating))}</span>
                <span className="kv-sub" style={{ margin: 0 }}>
                  {product.avg_rating.toFixed(1)} / 5
                  {product.review_count ? ` · ${product.review_count} reviews` : ''}
                </span>
                <button type="button" className="btn btn-outline" style={{ minHeight: 30, padding: '0 12px', fontSize: 11 }} onClick={() => setActiveTab('reviews')}>
                  Write Review
                </button>
              </div>
            ) : null}

            {/* Short description */}
            {product.subtitle && <p className="kv-sub" style={{ marginBottom: 12 }}>{product.subtitle}</p>}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '18px 0' }}>
              <span className="pd-price">{formattedPrice}</span>
              {formattedComparePrice && <span className="orig">{formattedComparePrice}</span>}
              {formattedComparePrice && compareAtAmount && amount < compareAtAmount && (
                <span style={{ background: '#f0fdf4', color: '#166534', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Save {Math.round((1 - amount / compareAtAmount) * 100)}%
                </span>
              )}
            </div>

            {/* Structured options (Size / Color) */}
            {hasStructuredOptions && product.options?.map((option: ProductOption) => {
              const isColor = option.title.toLowerCase() === 'color' || option.title.toLowerCase() === 'colour';
              return (
                <div key={option.title} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <strong style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{option.title}</strong>
                    {!isColor && option.title.toLowerCase().includes('size') && (
                      <button type="button" className="btn btn-outline" style={{ minHeight: 28, padding: '0 10px', fontSize: 11 }} onClick={() => setShowSizeGuide(true)}>
                        Size Guide
                      </button>
                    )}
                  </div>
                  <div className="option-row">
                    {option.values.map((val) => {
                      const isSelected = selectedOptions[option.title] === val.value;
                      return isColor ? (
                        <button
                          key={val.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: val.value }))}
                          className={`option-btn${isSelected ? ' active' : ''}`}
                          style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', background: getColorHex(val.value), borderColor: isSelected ? 'var(--sienna)' : 'var(--line)' }}
                          aria-label={val.value}
                          title={val.value}
                        />
                      ) : (
                        <button
                          key={val.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: val.value }))}
                          className={`option-btn${isSelected ? ' active' : ''}`}
                        >
                          {val.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Variant list (non-structured) */}
            {!hasStructuredOptions && product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: 4 }}>
                <strong style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Option</strong>
                <div className="option-row">
                  {product.variants.map((v: ProductVariant) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`option-btn${selectedVariant?.id === v.id ? ' active' : ''}`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: 4 }}>
              <strong style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quantity</strong>
              <div className="option-row">
                <button type="button" className="option-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span className="option-btn" style={{ display: 'grid', placeItems: 'center', cursor: 'default', minWidth: 44 }}>{quantity}</span>
                <button type="button" className="option-btn" onClick={() => quantity < currentInventory && setQuantity(quantity + 1)} disabled={currentInventory <= quantity} aria-label="Increase" style={{ opacity: currentInventory <= quantity ? 0.35 : 1 }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Low stock warning */}
            {selectedVariant && currentInventory > 0 && currentInventory <= 10 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                Only {currentInventory} left
                {isConnected ? <Wifi size={11} style={{ color: '#16a34a' }} /> : <WifiOff size={11} style={{ color: 'var(--muted)' }} />}
              </div>
            )}

            {/* CTA Buttons */}
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <button
                id="pdp-atc-btn"
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant || addedToCart || outOfStock}
                className={`btn btn-full${addedToCart ? '' : outOfStock ? '' : ' btn-primary'}`}
                style={addedToCart ? { background: '#15803d', color: 'white', borderColor: '#15803d' } : outOfStock ? { background: '#d1d5db', color: '#6b7280', borderColor: '#d1d5db', cursor: 'not-allowed' } : {}}
              >
                {outOfStock ? 'Out of Stock' : addedToCart ? 'Added to Bag ✓' : 'Add to Bag'}
              </button>
              <a
                href={`https://wa.me/message/kvastram?text=${encodeURIComponent(`Hi, I'm interested in: ${displayTitle}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-full"
                style={{ color: '#16a34a', borderColor: '#16a34a', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }} aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.83L.057 23.486a.5.5 0 0 0 .614.612l5.579-1.453A11.942 11.942 0 0 0 12 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 21.818a9.818 9.818 0 0 1-4.992-1.364l-.358-.213-3.714.968.993-3.601-.233-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
                </svg>
                Ask on WhatsApp
              </a>
            </div>

            {/* Wishlist + Share */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <WishlistButton
                productId={product.id}
                title={displayTitle}
                price={selectedVariant?.prices?.[0]?.amount || 0}
                currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
                thumbnail={product.thumbnail || undefined}
                handle={product.handle || product.id}
                variantId={selectedVariant?.id}
                showLabel
                className="btn btn-outline"
              />
              <ShareButtons title={displayTitle} description={product.description?.slice(0, 100)} image={product.thumbnail || undefined} />
            </div>

            {/* Trust grid */}
            <div className="trust-grid">
              <div className="soft-card" style={{ padding: '12px 14px', fontSize: 13 }}>
                <strong>Free shipping</strong>
                <p className="kv-sub" style={{ margin: '4px 0 0', fontSize: 12 }}>Above Rs. 999 in India</p>
              </div>
              <div className="soft-card" style={{ padding: '12px 14px', fontSize: 13 }}>
                <strong>Easy returns</strong>
                <p className="kv-sub" style={{ margin: '4px 0 0', fontSize: 12 }}>30-day return window</p>
              </div>
              <div className="soft-card" style={{ padding: '12px 14px', fontSize: 13 }}>
                <strong>Secure payment</strong>
                <p className="kv-sub" style={{ margin: '4px 0 0', fontSize: 12 }}>UPI, Card, COD</p>
              </div>
              <div className="soft-card" style={{ padding: '12px 14px', fontSize: 13 }}>
                <strong>Handmade</strong>
                <p className="kv-sub" style={{ margin: '4px 0 0', fontSize: 12 }}>Made in Jaipur, India</p>
              </div>
            </div>

            {/* Delivery info */}
            <div className="soft-card" style={{ marginTop: 12, padding: '12px 14px', fontSize: 13 }}>
              <p style={{ color: 'var(--ink)' }}>Estimated delivery: <strong>{deliveryWindow}</strong></p>
              {selectedVariant?.sku && <p className="kv-sub" style={{ margin: '4px 0 0', fontSize: 12 }}>SKU: {selectedVariant.sku}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                {selectedVariant && currentInventory > 0 ? (
                  <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />{currentInventory <= 5 ? `Only ${currentInventory} left` : 'In Stock, Ready to Ship'}</>
                ) : (
                  <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />Out of Stock</>
                )}
                {isConnected ? <Wifi size={10} style={{ color: '#16a34a' }} /> : <WifiOff size={10} style={{ color: 'var(--muted)' }} />}
              </div>
            </div>

            {outOfStock && selectedVariant && (
              <div style={{ marginTop: 12 }}>
                <BackInStock productId={product.id} variantId={selectedVariant.id} productTitle={displayTitle} />
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="pd-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`pd-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className={`pd-tab-panel${activeTab === 'description' ? ' active' : ''}`}>
          {product.description ? (
            <div className="prose prose-stone prose-sm max-w-none" style={{ fontWeight: 300, lineHeight: 1.8 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description}</ReactMarkdown>
            </div>
          ) : (
            <p className="kv-sub">No description available.</p>
          )}
        </div>

        {/* Specifications */}
        <div className={`pd-tab-panel${activeTab === 'specs' ? ' active' : ''}`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {product.material && <tr style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '10px 0', color: 'var(--muted)', width: '40%', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Material</td><td style={{ padding: '10px 0' }}>{product.material}</td></tr>}
              {product.origin_country && <tr style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '10px 0', color: 'var(--muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Origin</td><td style={{ padding: '10px 0' }}>{product.origin_country}</td></tr>}
              {product.care_instructions && <tr style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '10px 0', color: 'var(--muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Care</td><td style={{ padding: '10px 0' }}>{product.care_instructions}</td></tr>}
              {selectedVariant?.sku && <tr style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '10px 0', color: 'var(--muted)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SKU</td><td style={{ padding: '10px 0' }}>{selectedVariant.sku}</td></tr>}
              {!product.material && !product.origin_country && !product.care_instructions && !selectedVariant?.sku && (
                <tr><td colSpan={2}><p className="kv-sub">No specifications available.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Shipping */}
        <div className={`pd-tab-panel${activeTab === 'shipping' ? ' active' : ''}`}>
          <div className="trust-grid">
            <div className="soft-card">
              <strong>Standard Shipping</strong>
              <p className="kv-sub" style={{ marginTop: 6 }}>3–5 business days within India. Free above Rs. 999.</p>
            </div>
            <div className="soft-card">
              <strong>International Shipping</strong>
              <p className="kv-sub" style={{ marginTop: 6 }}>Estimated {deliveryWindow}. Tracked courier.</p>
            </div>
          </div>
        </div>

        {/* Returns */}
        <div className={`pd-tab-panel${activeTab === 'returns' ? ' active' : ''}`}>
          <div className="soft-card">
            <strong>30-day return window</strong>
            <p className="kv-sub" style={{ marginTop: 8 }}>Items must be unworn and in original packaging. Sale items are not eligible for returns. Contact us at support@kvastram.com for return requests.</p>
          </div>
        </div>

        {/* Reviews */}
        <div className={`pd-tab-panel${activeTab === 'reviews' ? ' active' : ''}`} id="reviews">
          <Reviews productId={product.id} />
        </div>

      </div>

      <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} sizeGuide={product.size_guide} />

      {/* Sticky ATC bar (mobile) */}
      <div
        style={{
          position: 'fixed',
          bottom: 72,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderTop: '1px solid var(--line)',
          background: 'rgba(252,248,243,0.97)',
          padding: '10px 16px',
          boxShadow: '0 -4px 24px rgba(0,0,0,.08)',
          backdropFilter: 'blur(8px)',
          transform: showStickyATC ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .3s ease',
        }}
        className="md:hidden"
        aria-hidden={!showStickyATC}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</p>
          <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--sienna)' }}>{formattedPrice}</p>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || addedToCart || outOfStock}
          className="btn btn-primary"
          style={outOfStock ? { background: '#d1d5db', color: '#6b7280', borderColor: '#d1d5db', cursor: 'not-allowed' } : addedToCart ? { background: '#15803d', borderColor: '#15803d' } : {}}
        >
          {outOfStock ? 'Sold Out' : addedToCart ? 'Added ✓' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
