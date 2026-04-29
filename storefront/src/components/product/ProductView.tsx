'use client';
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, Minus, Plus, RotateCcw, ShieldCheck, Star, Truck, Wifi, WifiOff } from 'lucide-react';

import ProductGallery from './ProductGallery';
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
import { buildProductImageAlt, buildProductSeoContent, getCategoryPath, getPrimaryCategory } from '@/lib/seo';
import type { MoneyAmount, Product, ProductImage, ProductOption, ProductVariant } from '@/types';

function getColorHex(colorName: string) {
  const map: Record<string, string> = { black: '#000000', navy: '#1e3a8a', white: '#ffffff', 'off white': '#faf8f5', cream: '#fdfbf7', terracotta: '#c5523f', olive: '#556b2f', taupe: '#8b8589', red: '#991b1b', blue: '#2563eb', green: '#15803d', yellow: '#ca8a04', beige: '#f5f5dc', brown: '#78350f', pink: '#fbcfe8', grey: '#6b7280', gray: '#6b7280' };
  return map[colorName.toLowerCase()] || '#cccccc';
}

export default function ProductView({ product }: { product: Product }) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('productDetails');
  const [showStickyATC, setShowStickyATC] = useState(false);
  const [realTimeInventory, setRealTimeInventory] = useState<Record<string, number>>({});
  const primaryCategory = getPrimaryCategory(product);
  const primaryCategoryPath = primaryCategory ? getCategoryPath(primaryCategory) : null;
  const seoContent = buildProductSeoContent(product);

  const { isConnected, subscribeToInventory, unsubscribeFromInventory } = useInventoryWebSocket({
    onInventoryUpdate: (update) =>
      setRealTimeInventory((prev) => ({ ...prev, [update.variantId]: update.quantity })),
  });

  useEffect(() => {
    product.variants?.forEach((variant) => subscribeToInventory(variant.id));
    return () => product.variants?.forEach((variant) => unsubscribeFromInventory(variant.id));
  }, [product.variants, subscribeToInventory, unsubscribeFromInventory]);

  const deliveryWindow = useMemo(() => {
    const regionId = currentRegion?.id?.toLowerCase() || '';
    if (regionId.startsWith('us')) return '10–14 business days';
    if (regionId.startsWith('gb') || regionId.startsWith('uk')) return '8–12 business days';
    if (regionId.startsWith('au') || regionId.startsWith('ca')) return '12–18 business days';
    if (regionId.startsWith('de') || regionId.startsWith('fr') || regionId.startsWith('eu')) return '10–16 business days';
    return '10–18 business days';
  }, [currentRegion]);

  useEffect(() => {
    const price = product.variants?.[0]?.prices?.[0];
    if (!product.id) return;
    addToRecentlyViewed({
      id: product.id,
      handle: product.handle || product.id,
      title: product.title,
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
    const button = document.getElementById('add-to-cart-btn');
    if (button) observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const hasStructuredOptions = Boolean(product.options?.length);
  const defaultOptions = useMemo(() => {
    const defaults: Record<string, string> = {};
    product.options?.forEach((option: ProductOption) => {
      if (option.values?.length) defaults[option.title] = option.values[0].value;
    });
    return defaults;
  }, [product.options]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(defaultOptions);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || '');

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    if (product.variants.length === 1) return product.variants[0];
    if (hasStructuredOptions) {
      return (
        product.variants.find((variant: ProductVariant) => {
          const parts = variant.title.split(' / ').map((value) => value.trim());
          return product.options?.every((option: ProductOption, index: number) => parts[index] === selectedOptions[option.title]);
        }) || product.variants[0]
      );
    }
    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  }, [hasStructuredOptions, product.options, product.variants, selectedOptions, selectedVariantId]);

  const currentInventory = selectedVariant ? realTimeInventory[selectedVariant.id] ?? selectedVariant.inventory_quantity : 0;
  const prices = selectedVariant?.prices || [];
  // Always use INR price as base for currency conversion
  const inrPriceObj = prices.find((p: MoneyAmount) => p.currency_code?.toLowerCase() === 'inr') || prices[0];
  const amount = inrPriceObj?.amount || 0;
  const compareAtAmount = selectedVariant?.compare_at_price;
  // Format in user's detected local currency
  const formattedPrice = amount ? formatPrice(amount) : '';
  const formattedComparePrice = compareAtAmount ? formatPrice(compareAtAmount) : null;
  const currency = 'INR';
  const outOfStock = currentInventory <= 0;

  const galleryMedia =
    product.images?.length
      ? product.images
          .sort((a: ProductImage, b: ProductImage) => (a.position || 0) - (b.position || 0))
          .map((image: ProductImage, index: number) => ({
            ...image,
            alt: buildProductImageAlt(product, index, image.alt),
            alt_text: image.alt_text || buildProductImageAlt(product, index, image.alt),
          }))
      : product.thumbnail
        ? [
            {
              id: 'legacy-thumbnail',
              url: product.thumbnail,
              alt: buildProductImageAlt(product, 0),
              alt_text: buildProductImageAlt(product, 0),
              is_thumbnail: true,
              position: 0,
            },
          ]
        : [];

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      id: selectedVariant.id,
      variantId: selectedVariant.id,
      quantity,
      title: `${product.title}${selectedVariant.title !== 'Default Variant' ? ` - ${selectedVariant.title}` : ''}`,
      price: amount,
      currency,
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

  const accordions = [
    { key: 'productDetails', label: 'Product Details', show: true },
    { key: 'description', label: 'Description', show: true },
    { key: 'fabricCare', label: 'Fabric & Care Instructions', show: Boolean(product.material || product.care_instructions || product.origin_country) },
    { key: 'shipping', label: 'Shipping & Returns', show: true },
    { key: 'sizeguide', label: 'Size Guide', show: Boolean(product.size_guide) },
  ].filter((accordion) => accordion.show);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-12 md:px-12 lg:px-20">
        <nav aria-label="Breadcrumb" className="mb-6 hidden items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400 lg:flex">
          <a href="/" className="transition-colors hover:text-stone-900">Home</a>
          <span>/</span>
          {primaryCategoryPath && primaryCategory ? (
            <>
              <a href={primaryCategoryPath} className="transition-colors hover:text-stone-900">{primaryCategory.name}</a>
              <span>/</span>
            </>
          ) : null}
          <span className="truncate text-stone-700">{product.title}</span>
        </nav>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,460px)] lg:gap-16">
          <div className="-mx-6 min-w-0 md:-mx-12 lg:mx-0">
            <ProductGallery media={galleryMedia} title={product.title} videos={product.videos || []} />
          </div>

          <div className="min-w-0 space-y-8">
            <nav aria-label="Breadcrumb" className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-stone-400 lg:hidden">
              <a href="/" className="transition-colors hover:text-stone-900">Home</a>
              <span>/</span>
              {primaryCategoryPath && primaryCategory ? (
                <>
                  <a href={primaryCategoryPath} className="transition-colors hover:text-stone-900">{primaryCategory.name}</a>
                  <span>/</span>
                </>
              ) : null}
              <span className="truncate text-stone-700">{product.title}</span>
            </nav>

            <section className="space-y-4 border-b border-stone-200 pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">{product.collection?.title || 'Kvastram Collection'}</p>
              <h1 className="font-heading text-[20px] font-normal leading-[1.1] tracking-[-0.03em] text-stone-950">{product.title}</h1>
              {product.subtitle && <p className="text-[15px] leading-7 text-stone-600">{product.subtitle}</p>}
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                One of a kind — handmade in Jaipur, India
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-body text-[18px] font-normal text-stone-950">{formattedPrice}</p>
                {formattedComparePrice && <p className="text-[15px] text-stone-400 line-through">{formattedComparePrice}</p>}
                {formattedComparePrice && compareAtAmount && amount < compareAtAmount && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Save {Math.round((1 - amount / compareAtAmount) * 100)}%
                  </span>
                )}
              </div>
              {selectedVariant?.sku && (
                <p className="text-[11px] tracking-[0.12em] text-stone-400">SKU: {selectedVariant.sku}</p>
              )}
            </section>

            <div className="grid grid-cols-2 gap-4">
              {[{ icon: Truck, label: 'Free Shipping' }, { icon: RotateCcw, label: '30-Day Returns' }, { icon: ShieldCheck, label: 'Secure Payment' }, { icon: Star, label: 'Artisan Authentic' }].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <badge.icon size={16} className="shrink-0 text-stone-700" />
                  <span className="text-[12px] font-medium leading-tight text-stone-700">{badge.label}</span>
                </div>
              ))}
            </div>

            <section className="space-y-6 rounded-[28px] border border-stone-200 bg-white p-4 md:p-6">
              {hasStructuredOptions &&
                product.options?.map((option: ProductOption) => {
                  const isColor = option.title.toLowerCase() === 'color' || option.title.toLowerCase() === 'colour';
                  return (
                    <div key={option.title} className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{option.title}</p>
                        {selectedOptions[option.title] && <p className="text-[13px] text-stone-500">{selectedOptions[option.title]}</p>}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {option.values.map((value) => {
                          const isSelected = selectedOptions[option.title] === value.value;
                          return isColor ? (
                            <button key={value.value} type="button" onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))} className={`h-12 w-12 rounded-full border-2 transition ${isSelected ? 'scale-105 border-stone-900 ring-4 ring-stone-200' : 'border-stone-200'}`} style={{ backgroundColor: getColorHex(value.value) }} aria-label={value.value} />
                          ) : (
                            <button key={value.value} type="button" onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))} className={`min-h-12 rounded-2xl border px-4 text-[13px] font-medium transition ${isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'}`}>{value.value}</button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {!hasStructuredOptions && product.variants && product.variants.length > 1 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Option</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((variant: ProductVariant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      return (
                        <button key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} className={`min-h-12 rounded-2xl border px-4 text-[13px] font-medium transition ${isSelected ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'}`}>{variant.title}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-6 border-t border-stone-200 pt-6">
                {selectedVariant && currentInventory > 0 && currentInventory <= 10 && (
                  <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-red-700">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Only {currentInventory} left in stock
                    {isConnected && <Wifi size={12} className="text-green-600" />}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-[120px] items-center justify-between border border-stone-200 px-4">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={14} /></button>
                    <span aria-live="polite">{quantity}</span>
                    <button type="button" onClick={() => quantity < currentInventory && setQuantity(quantity + 1)} disabled={currentInventory <= quantity} aria-label="Increase quantity" className="disabled:opacity-30"><Plus size={14} /></button>
                  </div>
                  <button id="add-to-cart-btn" type="button" onClick={handleAddToCart} disabled={!selectedVariant || addedToCart || outOfStock} className={`min-h-12 flex-1 rounded-full px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition ${addedToCart ? 'bg-green-700 text-white' : outOfStock ? 'cursor-not-allowed bg-stone-300 text-stone-600' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>{outOfStock ? 'Out of Stock' : addedToCart ? 'Added to Bag' : 'Add to Bag'}</button>
                </div>
                <div className="flex items-center gap-4">
                  <WishlistButton productId={product.id} title={product.title} price={selectedVariant?.prices?.[0]?.amount || 0} currency={currentRegion?.currency_code?.toUpperCase() || 'USD'} thumbnail={product.thumbnail || undefined} handle={product.handle || product.id} variantId={selectedVariant?.id} showLabel className="rounded-full border border-stone-200 px-4" />
                  <ShareButtons title={product.title} description={product.description?.slice(0, 100)} image={product.thumbnail || undefined} />
                </div>
                <a
                  href={`https://wa.me/message/kvastram?text=${encodeURIComponent(`Hi, I'm interested in: ${product.title} — ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366] bg-white py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.83L.057 23.486a.5.5 0 0 0 .614.612l5.579-1.453A11.942 11.942 0 0 0 12 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 21.818a9.818 9.818 0 0 1-4.992-1.364l-.358-.213-3.714.968.993-3.601-.233-.371A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
                  </svg>
                  Ask on WhatsApp
                </a>
                <div className="flex items-center justify-between text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                  <span className="flex items-center gap-1.5">
                    {selectedVariant && currentInventory > 0 ? (
                      <>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        {currentInventory <= 5 ? `Only ${currentInventory} left` : 'In Stock, Ready to Ship'}
                        {isConnected ? <Wifi size={10} className="text-green-600" /> : <WifiOff size={10} className="text-stone-400" />}
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        Out of Stock
                        {isConnected ? <Wifi size={10} className="text-green-600" /> : <WifiOff size={10} className="text-stone-400" />}
                      </>
                    )}
                  </span>
                  <button type="button" onClick={() => setShowSizeGuide(true)} className="underline transition-colors hover:text-stone-900">Size Guide</button>
                </div>
                {outOfStock && selectedVariant && (
                  <div className="pt-1">
                    <BackInStock productId={product.id} variantId={selectedVariant.id} productTitle={product.title} />
                  </div>
                )}
                <div className="space-y-2 bg-stone-50 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-900">Shipping from Jaipur, India</p>
                  <p className="text-[15px] font-[300] leading-[1.7] text-stone-600">Estimated delivery: <span className="font-medium text-stone-900">{deliveryWindow || '10–18 business days'}</span>.</p>
                  <p className="text-[12px] text-stone-400">Free worldwide shipping on orders over $75. Tracked courier, signature on delivery.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200 bg-white p-4 md:p-6">
              {accordions.map((accordion) => (
                <div key={accordion.key} className="border-b border-stone-100 last:border-b-0">
                  <button type="button" onClick={() => setActiveAccordion((prev) => (prev === accordion.key ? null : accordion.key))} className="flex w-full items-center justify-between py-5 text-left" aria-expanded={activeAccordion === accordion.key}>
                    <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-stone-800">{accordion.label}</h3>
                    <ChevronDown
                      size={18}
                      className={`text-stone-400 transition-transform ${
                        activeAccordion === accordion.key ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {activeAccordion === accordion.key && (
                    <div className="pb-5 text-[15px] leading-[1.8] text-stone-600">
                      {accordion.key === 'productDetails' && (
                        <div className="space-y-4">
                          <p className="leading-[1.8]">{seoContent.intro}</p>
                          <ul className="space-y-3 border-t border-stone-100 pt-4">
                            {seoContent.bullets.map((item) => (
                              <li key={item.label} className="flex items-start justify-between gap-6 border-b border-stone-100 pb-3 last:border-b-0">
                                <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400">{item.label}</span>
                                <span className="text-right text-stone-700">{item.value}</span>
                              </li>
                            ))}
                          </ul>
                          {seoContent.styling && <p className="leading-[1.8]">{seoContent.styling}</p>}
                        <div className="flex flex-wrap gap-3 pt-1">
                            {primaryCategoryPath && primaryCategory && <a href={primaryCategoryPath} className="border border-stone-200 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900">Shop More {primaryCategory.name}</a>}
                            <a href={seoContent.collectionLink || '/collections'} className="border border-stone-200 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900">{product.collection?.title ? `Explore ${product.collection.title}` : 'Explore More Collections'}</a>
                          </div>
                        </div>
                      )}
                      {accordion.key === 'description' && <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description || ''}</ReactMarkdown></div>}
                      {accordion.key === 'fabricCare' && (
                        <div className="space-y-4">
                          {product.material && <p><span className="font-medium text-stone-900">Fabric:</span> {product.material}</p>}
                          {product.origin_country && <p><span className="font-medium text-stone-900">Origin:</span> {product.origin_country}</p>}
                          {product.care_instructions && <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.care_instructions}</ReactMarkdown></div>}
                        </div>
                      )}
                      {accordion.key === 'shipping' && <div className="space-y-4"><p>Free express shipping on orders over $250, with delivery in {deliveryWindow || '5-14 business days'}.</p><p>Returns and exchanges are accepted within 30 days when items are unworn and in original packaging.</p></div>}
                      {accordion.key === 'sizeguide' && <div>{typeof product.size_guide === 'string' ? <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.size_guide}</ReactMarkdown></div> : <button type="button" onClick={() => setShowSizeGuide(true)} className="font-medium text-stone-900 underline">View Full Size Guide</button>}</div>}
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>

      <Reviews productId={product.id} />
      <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} sizeGuide={product.size_guide} />

      {/* Sticky ATC: leaves clear room for the mobile bottom nav on small screens */}
      <div className={`fixed bottom-20 left-0 right-0 z-40 flex items-center gap-3 border-t border-stone-200 bg-white px-4 py-3 shadow-2xl transition-transform duration-300 md:bottom-0 md:hidden ${showStickyATC ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!showStickyATC}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">{product.title}</p>
          <p className="text-[14px] font-medium text-stone-900">{formattedPrice}</p>
        </div>
        <button type="button" onClick={handleAddToCart} disabled={!selectedVariant || addedToCart || outOfStock} className={`min-h-12 whitespace-nowrap rounded-full px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${addedToCart ? 'bg-green-600 text-white' : outOfStock ? 'cursor-not-allowed bg-stone-300 text-stone-600' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>{outOfStock ? 'Sold Out' : addedToCart ? 'Added' : 'Add to Bag'}</button>
      </div>
    </div>
  );
}
