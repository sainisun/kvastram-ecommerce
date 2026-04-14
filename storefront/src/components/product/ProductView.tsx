'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  const { addItem } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | null>('description');
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

  useEffect(() => {
    if (!currentRegion) return;
    const usRegion = currentRegion.id.toLowerCase().startsWith('us');
    const minDate = new Date(Date.now() + (usRegion ? 3 : 7) * 86400000);
    const maxDate = new Date(Date.now() + (usRegion ? 5 : 14) * 86400000);
    const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    setDeliveryDate(`${minDate.toLocaleDateString('en-US', formatOptions)} - ${maxDate.toLocaleDateString('en-US', formatOptions)}`);
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
  const priceObj = prices.find((price: MoneyAmount) => price.currency_code === (currentRegion?.currency_code || 'usd').toLowerCase()) || prices[0];
  const currency = priceObj?.currency_code || 'USD';
  const amount = priceObj?.amount || 0;
  const compareAtAmount = selectedVariant?.compare_at_price;
  const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
  const formattedComparePrice = compareAtAmount
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency.toUpperCase() }).format(compareAtAmount / 100)
    : null;
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
    { key: 'description', label: 'Description', show: true },
    { key: 'materials', label: 'Materials & Care', show: Boolean(product.material || product.care_instructions || product.origin_country) },
    { key: 'shipping', label: 'Shipping & Returns', show: true },
    { key: 'sizeguide', label: 'Size Guide', show: Boolean(product.size_guide) },
  ].filter((accordion) => accordion.show);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-0 sm:px-6 sm:pt-4 lg:px-8 lg:pt-6">
        <nav aria-label="Breadcrumb" className="mb-6 hidden items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400 lg:flex">
          <Link href="/" className="transition-colors hover:text-stone-900">Home</Link>
          <span>/</span>
          {primaryCategoryPath && primaryCategory ? (
            <>
              <Link href={primaryCategoryPath} className="transition-colors hover:text-stone-900">{primaryCategory.name}</Link>
              <span>/</span>
            </>
          ) : null}
          <span className="truncate text-stone-700">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,460px)] lg:gap-12">
          <div className="-mx-4 sm:-mx-6 lg:mx-0">
            <ProductGallery media={galleryMedia} title={product.title} videos={product.videos || []} />
          </div>

          <div className="space-y-6">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-stone-400 lg:hidden">
              <Link href="/" className="transition-colors hover:text-stone-900">Home</Link>
              <span>/</span>
              {primaryCategoryPath && primaryCategory ? (
                <>
                  <Link href={primaryCategoryPath} className="transition-colors hover:text-stone-900">{primaryCategory.name}</Link>
                  <span>/</span>
                </>
              ) : null}
              <span className="truncate text-stone-700">{product.title}</span>
            </nav>

            <section className="space-y-4 border-b border-stone-200 pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">{product.collection?.title || 'Kvastram Collection'}</p>
              <h1 className="text-[22px] font-semibold leading-tight text-stone-950 lg:text-[34px]">{product.title}</h1>
              {product.subtitle && <p className="text-[15px] leading-7 text-stone-600">{product.subtitle}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[20px] font-semibold text-stone-950 lg:text-[28px]">{formattedPrice}</p>
                {formattedComparePrice && <p className="text-[15px] text-stone-400 line-through">{formattedComparePrice}</p>}
                {formattedComparePrice && compareAtAmount && amount < compareAtAmount && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Save {Math.round((1 - amount / compareAtAmount) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <WishlistButton productId={product.id} title={product.title} price={selectedVariant?.prices?.[0]?.amount || 0} currency={currentRegion?.currency_code?.toUpperCase() || 'USD'} thumbnail={product.thumbnail || undefined} handle={product.handle || product.id} variantId={selectedVariant?.id} showLabel className="rounded-full border border-stone-200 px-4" />
                <ShareButtons title={product.title} description={product.description?.slice(0, 100)} image={product.thumbnail || undefined} />
              </div>
            </section>

            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
              {[{ icon: Truck, label: 'Free Shipping' }, { icon: RotateCcw, label: '30-Day Returns' }, { icon: ShieldCheck, label: 'Secure Payment' }, { icon: Star, label: 'Artisan Authentic' }].map((badge) => (
                <div key={badge.label} className="flex min-w-[170px] items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                  <badge.icon size={18} className="text-stone-700" />
                  <span className="text-[13px] font-medium text-stone-700">{badge.label}</span>
                </div>
              ))}
            </div>

            <section className="space-y-5 rounded-[28px] border border-stone-200 bg-white p-5">
              {hasStructuredOptions &&
                product.options?.map((option: ProductOption) => {
                  const isColor = option.title.toLowerCase() === 'color' || option.title.toLowerCase() === 'colour';
                  return (
                    <div key={option.title} className="space-y-3">
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

              <div className="space-y-5 border-t border-stone-200 pt-5">
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
                <div className="flex items-center justify-between border-b border-stone-100 pb-4 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">
                  <span className="flex items-center gap-1">
                    {selectedVariant && currentInventory > 0 ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {currentInventory <= 5 ? `Only ${currentInventory} left` : 'In Stock, Ready to Ship'}
                        {isConnected ? <Wifi size={10} className="text-green-600" /> : <WifiOff size={10} className="text-stone-400" />}
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Out of Stock
                        {isConnected ? <Wifi size={10} className="text-green-600" /> : <WifiOff size={10} className="text-stone-400" />}
                        <BackInStock productId={product.id} variantId={selectedVariant?.id} productTitle={product.title} />
                      </>
                    )}
                  </span>
                  <button type="button" onClick={() => setShowSizeGuide(true)} className="underline transition-colors hover:text-stone-900">Size Guide</button>
                </div>
                <div className="space-y-2 bg-stone-50 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-900">Estimated Delivery</p>
                  <p className="text-[15px] font-[300] leading-[1.7] text-stone-600">Order now to receive by <span className="font-medium text-stone-900">{deliveryDate}</span>.</p>
                  <p className="text-[12px] text-stone-400">Free express shipping on orders over $250.</p>
                </div>
              </div>
            </section>

            <section className="space-y-8 rounded-[28px] border border-stone-200 bg-white p-5">
              <div className="space-y-4">
                <h2 className="text-[18px] font-semibold uppercase tracking-[0.08em] text-stone-900">Product Details</h2>
                <p className="text-[15px] leading-[1.8] text-stone-700">{seoContent.intro}</p>
                <ul className="space-y-3 border-t border-stone-100 pt-4">
                  {seoContent.bullets.map((item) => (
                    <li key={item.label} className="flex items-start justify-between gap-6 border-b border-stone-100 pb-3 last:border-b-0">
                      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-stone-400">{item.label}</span>
                      <span className="text-right text-stone-700">{item.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[15px] leading-[1.8] text-stone-700">{seoContent.styling}</p>
                <div className="flex flex-wrap gap-3">
                  {primaryCategoryPath && primaryCategory && <Link href={primaryCategoryPath} className="border border-stone-200 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900">Shop More {primaryCategory.name}</Link>}
                  <Link href={seoContent.collectionLink || '/collections'} className="border border-stone-200 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900">{product.collection?.title ? `Explore ${product.collection.title}` : 'Explore More Collections'}</Link>
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-[18px] font-semibold uppercase tracking-[0.08em] text-stone-900">Fabric & Care Instructions</h2>
                {product.material && <p className="text-[15px] leading-[1.8] text-stone-700"><span className="font-medium text-stone-900">Fabric:</span> {product.material}</p>}
                {product.care_instructions && <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.care_instructions}</ReactMarkdown></div>}
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200 bg-white p-5">
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
                      {accordion.key === 'description' && <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description || ''}</ReactMarkdown></div>}
                      {accordion.key === 'materials' && <div className="space-y-4">{product.material && <p><span className="font-medium text-stone-900">Fabric:</span> {product.material}</p>}{product.origin_country && <p><span className="font-medium text-stone-900">Origin:</span> {product.origin_country}</p>}{product.care_instructions && <div className="prose prose-stone prose-sm max-w-none font-[300]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{product.care_instructions}</ReactMarkdown></div>}</div>}
                      {accordion.key === 'shipping' && <div className="space-y-4"><p>Free express shipping on orders over $250, with delivery in {deliveryDate || '5-14 business days'}.</p><p>Returns and exchanges are accepted within 30 days when items are unworn and in original packaging.</p></div>}
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

      <div className={`fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t border-stone-200 bg-white px-4 py-3 shadow-2xl transition-transform duration-300 md:hidden ${showStickyATC ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!showStickyATC}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium uppercase tracking-[0.08em] text-stone-500">{product.title}</p>
          <p className="text-[14px] font-medium text-stone-900">{formattedPrice}</p>
        </div>
        <button type="button" onClick={handleAddToCart} disabled={!selectedVariant || addedToCart || outOfStock} className={`min-h-12 whitespace-nowrap rounded-full px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${addedToCart ? 'bg-green-600 text-white' : outOfStock ? 'cursor-not-allowed bg-stone-300 text-stone-600' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>{outOfStock ? 'Sold Out' : addedToCart ? 'Added' : 'Add to Bag'}</button>
      </div>
    </div>
  );
}
