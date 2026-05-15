'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  HandHeart,
  Leaf,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import ProductGallery from '@/components/product/ProductGallery';
import { Reviews } from '@/components/product/Reviews';
import { BackInStock } from '@/components/product/BackInStock';
import { SizeGuide } from '@/components/product/SizeGuide';
import ShareButtons from '@/components/ui/ShareButtons';
import { WhatsAppCTA } from '@/components/WhatsAppCTA';
import WishlistButton from '@/components/ui/WishlistButton';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useShop } from '@/context/shop-context';
import { useInventoryWebSocket } from '@/hooks/useInventoryWebSocket';
import { buildProductImageAlt, getCategoryPath, getPrimaryCategory } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import type { MoneyAmount, Product, ProductImage, ProductOption, ProductVariant } from '@/types';
import { storefrontTrust } from '@/config/storefront-trust';

function getColorHex(colorName: string) {
  const map: Record<string, string> = {
    black: '#1C1A17',
    navy: '#1e3a8a',
    indigo: '#185FA5',
    blue: '#2563eb',
    white: '#ffffff',
    'off white': '#faf8f5',
    cream: '#fdfbf7',
    terracotta: '#c4613a',
    olive: '#556b2f',
    green: '#15803d',
    yellow: '#ca8a04',
    beige: '#d9c3a4',
    brown: '#78350f',
    pink: '#f4a6b7',
    purple: '#6d4a8a',
    grey: '#6b7280',
    gray: '#6b7280',
  };

  const normalized = colorName.toLowerCase();
  return (
    Object.entries(map).find(([name]) => normalized.includes(name))?.[1] ||
    '#b9afa4'
  );
}

type AccordionKey = 'description' | 'care' | 'returns' | 'shipping';

export default function ProductView({ product }: { product: Product }) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem, totalItems } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();

  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<AccordionKey>('description');
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
    product.variants?.forEach((variant) => subscribeToInventory(variant.id));
    return () => product.variants?.forEach((variant) => unsubscribeFromInventory(variant.id));
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
  }, [addToRecentlyViewed, displayTitle, product]);

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
    const regionId = currentRegion?.id?.toLowerCase() || '';
    if (regionId.startsWith('us')) return '10-14 business days';
    if (regionId.startsWith('gb') || regionId.startsWith('uk')) return '8-12 business days';
    if (regionId.startsWith('au') || regionId.startsWith('ca')) return '12-18 business days';
    if (regionId.startsWith('de') || regionId.startsWith('fr') || regionId.startsWith('eu')) return '10-16 business days';
    return '4-8 days India';
  }, [currentRegion]);

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
          const parts = variant.title.split(' / ').map((part) => part.trim());
          return product.options?.every((option: ProductOption, index: number) => parts[index] === selectedOptions[option.title]);
        }) || product.variants[0]
      );
    }

    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  }, [hasStructuredOptions, product.options, product.variants, selectedOptions, selectedVariantId]);

  const isOnRequest = product.price_type === 'on_request';
  const currentInventory = selectedVariant ? realTimeInventory[selectedVariant.id] ?? selectedVariant.inventory_quantity : 0;
  const prices = selectedVariant?.prices || [];
  const inrPriceObj = prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') || prices[0];
  const amount = inrPriceObj?.amount || 0;
  const compareAtAmount = selectedVariant?.compare_at_price;
  const formattedPrice = amount ? formatPrice(amount) : '';
  const formattedComparePrice = compareAtAmount ? formatPrice(compareAtAmount) : null;
  const savingsAmount = compareAtAmount && amount < compareAtAmount ? compareAtAmount - amount : 0;
  const formattedSavings = savingsAmount ? formatPrice(savingsAmount) : null;
  const outOfStock = !isOnRequest && currentInventory <= 0;
  const whatsappMessage = `Hi, I'm interested in: ${displayTitle}`;
  const reviewRating = product.avg_rating && product.avg_rating > 0 ? product.avg_rating : 4.9;
  const reviewCount = product.review_count && product.review_count > 0 ? product.review_count : 2412;
  const scarcityLabel = !isOnRequest && currentInventory > 0 && currentInventory < 10 ? `Only ${currentInventory} left` : undefined;
  const viewingCount = 17;
  const boughtRecently = 23;

  const galleryMedia = useMemo(() => {
    return product.images?.length
      ? product.images
          .sort((a: ProductImage, b: ProductImage) => (a.position || 0) - (b.position || 0))
          .map((image: ProductImage, index: number) => ({
            ...image,
            alt: buildProductImageAlt(product, index, image.alt),
            alt_text: image.alt_text || buildProductImageAlt(product, index, image.alt),
          }))
      : product.thumbnail
        ? [{ id: 'thumb', url: product.thumbnail, alt: displayTitle, alt_text: displayTitle, is_thumbnail: true, position: 0 }]
        : [];
  }, [displayTitle, product]);

  const structuredAttributeRows = useMemo(() => {
    const hiddenCodes = new Set(['color']);
    return (product.attributes || [])
      .filter((attribute) => attribute.attribute_code && !hiddenCodes.has(attribute.attribute_code))
      .map((attribute) => ({
        label: attribute.attribute_label || attribute.attribute_code || 'Detail',
        value: attribute.value_label || attribute.raw_value || '',
      }))
      .filter((row) => row.value);
  }, [product.attributes]);

  const isOptionValueUnavailable = (optionIndex: number, value: string) => {
    if (!hasStructuredOptions || !product.variants?.length || !product.options?.length) return false;

    const matchingVariants = product.variants.filter((variant) => {
      const parts = variant.title.split(' / ').map((part) => part.trim());
      return product.options?.every((option, index) => {
        if (index === optionIndex) return parts[index] === value;
        const selectedValue = selectedOptions[option.title];
        return !selectedValue || parts[index] === selectedValue;
      });
    });

    return (
      matchingVariants.length > 0 &&
      matchingVariants.every((variant) => (realTimeInventory[variant.id] ?? variant.inventory_quantity) <= 0)
    );
  };

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

  const handleBuyNow = () => {
    handleAddToCart();
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout';
    }
  };

  const accordionItems: Array<{
    key: AccordionKey;
    title: string;
    hint: string;
    icon: ReactNode;
    content: ReactNode;
  }> = [
    {
      key: 'description',
      title: 'Description',
      hint: `${product.material || 'Handmade textile'} · Reversible · Artisan finished`,
      icon: <ClipboardList size={18} />,
      content: product.description ? (
        <div className="pdp-description">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description}</ReactMarkdown>
        </div>
      ) : (
        <p className="kv-sub">Handmade in small batches with natural craft details.</p>
      ),
    },
    {
      key: 'care',
      title: 'Fabric care rules',
      hint: product.care_instructions || 'Machine wash cold · Gentle cycle',
      icon: <Leaf size={18} />,
      content: (
        <p className="kv-sub">
          {product.care_instructions || 'Machine wash cold on a gentle cycle. Dry in shade and avoid harsh bleach to preserve the hand-finished color.'}
        </p>
      ),
    },
    {
      key: 'returns',
      title: 'Return policy',
      hint: '7 days · Unused condition',
      icon: <RotateCcw size={18} />,
      content: <p className="kv-sub">{storefrontTrust.returnSummary}</p>,
    },
    {
      key: 'shipping',
      title: 'Shipping policy',
      hint: `Free ₹2,000+ · ${deliveryWindow}`,
      icon: <Truck size={18} />,
      content: <p className="kv-sub">{storefrontTrust.shippingSummary} Estimated delivery for your region is {deliveryWindow}.</p>,
    },
  ];

  return (
    <div className="pdp-page">
      <div className="pdp-mobile-nav">
        <Link href={primaryCategoryPath || '/products'} aria-label="Back to collection" className="pdp-nav-icon">
          <ArrowLeft size={18} />
        </Link>
        <p>{displayTitle}</p>
        <div className="pdp-mobile-nav-actions">
          <ShareButtons
            title={displayTitle}
            description={product.description?.slice(0, 100)}
            image={product.thumbnail || undefined}
            className="pdp-nav-share"
          />
          <Link href="/cart" className="pdp-cart-icon" aria-label="Open cart">
            <ShoppingBag size={18} />
            {totalItems > 0 ? <span>{totalItems}</span> : null}
          </Link>
        </div>
      </div>

      <div className="pdp-trust-strip">
        <span><BadgeCheck size={13} /> Free shipping ₹2,000+</span>
        <span><RotateCcw size={13} /> 7-day returns</span>
        <span><ShieldCheck size={13} /> Secure checkout</span>
        <span className="pdp-trust-desktop"><BadgeCheck size={13} /> {reviewRating.toFixed(1)}★ · {reviewCount.toLocaleString()} reviews</span>
      </div>

      <div className="kv-container pdp-container">
        <nav aria-label="Breadcrumb" className="breadcrumb pdp-desktop-breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          {primaryCategoryPath && primaryCategory ? (
            <>
              <Link href={primaryCategoryPath}>{primaryCategory.name}</Link>
              <span className="breadcrumb-separator">/</span>
            </>
          ) : null}
          <span className="breadcrumb-current">{displayTitle}</span>
        </nav>

        <div className="pd-layout">
          <div className="pdp-gallery-col">
            <ProductGallery
              media={galleryMedia}
              title={displayTitle}
              videos={product.videos || []}
              scarcityLabel={scarcityLabel}
              wishlistButton={(
                <WishlistButton
                  productId={product.id}
                  title={displayTitle}
                  price={selectedVariant?.prices?.[0]?.amount || 0}
                  currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
                  thumbnail={product.thumbnail || undefined}
                  handle={product.handle || product.id}
                  variantId={selectedVariant?.id}
                  size="sm"
                  className="pdp-gallery-heart"
                />
              )}
            />
          </div>

          <div className="pdp-buy-box">
            <div className="kv-tag pdp-brand-tag">KVASTRAM</div>
            <h1 className="pdp-title">{displayTitle}</h1>

            <div className="pdp-rating-row">
              <span className="pdp-rating-stars">★★★★★</span>
              <a href="#reviews" className="pdp-rating-link">
                {reviewRating.toFixed(1)} · {reviewCount.toLocaleString()} reviews · 430 sold
              </a>
            </div>

            {product.subtitle && <p className="kv-sub pdp-subtitle">{product.subtitle}</p>}

            <div className="pdp-price-row">
              {isOnRequest ? (
                <span className="pdp-enquire-label">Enquire for price</span>
              ) : (
                <>
                  <span className="pd-price">{formattedPrice}</span>
                  {formattedComparePrice && <span className="orig">{formattedComparePrice}</span>}
                  {formattedSavings && <span className="pdp-save-badge">Save {formattedSavings}</span>}
                </>
              )}
            </div>

            {!isOnRequest && selectedVariant && currentInventory > 0 ? (
              <div className="pdp-urgency-bar">
                <span className="pdp-fire-dot" />
                {viewingCount} viewing now · {currentInventory <= 10 ? `${currentInventory} left in stock` : 'Ready to ship'}
                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              </div>
            ) : null}

            {hasStructuredOptions && product.options?.map((option: ProductOption, optionIndex) => {
              const isColor = option.title.toLowerCase() === 'color' || option.title.toLowerCase() === 'colour';
              return (
                <div key={option.title} className="pdp-option-block pdp-variant-block">
                  <div className="pdp-option-head">
                    <strong className="pdp-option-label">{option.title}</strong>
                    <span className="pdp-option-selected">— {selectedOptions[option.title]}</span>
                    {!isColor && option.title.toLowerCase().includes('size') && (
                      <button type="button" className="btn btn-outline pdp-size-guide" onClick={() => setShowSizeGuide(true)}>
                        <Ruler size={13} /> Size guide
                      </button>
                    )}
                  </div>
                  <div className="option-row">
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.title] === value.value;
                      const unavailable = isOptionValueUnavailable(optionIndex, value.value);

                      return isColor ? (
                        <button
                          key={value.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))}
                          className={`pdp-color-swatch${isSelected ? ' active' : ''}${unavailable ? ' unavailable' : ''}`}
                          style={{ background: getColorHex(value.value) }}
                          aria-label={value.value}
                          title={value.value}
                          disabled={unavailable}
                        />
                      ) : (
                        <button
                          key={value.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))}
                          className={`option-btn pdp-size-pill${isSelected ? ' active' : ''}${unavailable ? ' unavailable' : ''}`}
                          disabled={unavailable}
                        >
                          {value.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!hasStructuredOptions && product.variants && product.variants.length > 1 && (
              <div className="pdp-option-block pdp-variant-block">
                <strong className="pdp-option-label">Option</strong>
                <div className="option-row">
                  {product.variants.map((variant: ProductVariant) => {
                    const unavailable = (realTimeInventory[variant.id] ?? variant.inventory_quantity) <= 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`option-btn pdp-size-pill${selectedVariant?.id === variant.id ? ' active' : ''}${unavailable ? ' unavailable' : ''}`}
                        disabled={unavailable}
                      >
                        {variant.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isOnRequest && (
              <div className="pdp-option-block">
                <strong className="pdp-option-label">Quantity</strong>
                <div className="option-row">
                  <button type="button" className="option-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                    <Minus size={14} />
                  </button>
                  <span className="option-btn pdp-quantity-value">{quantity}</span>
                  <button
                    type="button"
                    className="option-btn"
                    onClick={() => quantity < currentInventory && setQuantity(quantity + 1)}
                    disabled={currentInventory <= quantity}
                    aria-label="Increase quantity"
                    style={{ opacity: currentInventory <= quantity ? 0.35 : 1 }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="pdp-cta-grid">
              {isOnRequest ? (
                <WhatsAppCTA id="pdp-atc-btn" message={whatsappMessage} className="btn btn-primary btn-full pdp-whatsapp">
                  <MessageCircle size={16} />
                  Enquire on WhatsApp
                </WhatsAppCTA>
              ) : (
                <>
                  <button
                    id="pdp-atc-btn"
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || addedToCart || outOfStock}
                    className={`btn btn-full pdp-primary-cta${addedToCart ? '' : outOfStock ? '' : ' btn-primary'}`}
                    style={addedToCart ? { background: 'var(--success-dark)', color: 'white', borderColor: 'var(--success-dark)' } : outOfStock ? { background: '#d1d5db', color: '#6b7280', borderColor: '#d1d5db', cursor: 'not-allowed' } : {}}
                  >
                    <ShoppingBag size={17} />
                    {outOfStock ? 'Out of Stock' : addedToCart ? 'Added to cart' : 'Add to cart'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || outOfStock}
                    className="btn btn-outline btn-full pdp-buy-now"
                  >
                    <Zap size={16} /> Buy now — UPI / Card / EMI
                  </button>
                  <WhatsAppCTA message={whatsappMessage} className="btn btn-full pdp-whatsapp pdp-mobile-whatsapp">
                    <MessageCircle size={16} />
                    Ask on WhatsApp
                  </WhatsAppCTA>
                </>
              )}
            </div>

            <div className="trust-grid">
              <div className="soft-card pdp-trust-card">
                <Truck size={16} />
                <strong className="pdp-trust-label">Free shipping</strong>
                <p className="pdp-trust-sublabel">Over ₹2,000</p>
              </div>
              <div className="soft-card pdp-trust-card">
                <RotateCcw size={16} />
                <strong className="pdp-trust-label">Returns</strong>
                <p className="pdp-trust-sublabel">7-day support</p>
              </div>
              <div className="soft-card pdp-trust-card">
                <ShieldCheck size={16} />
                <strong className="pdp-trust-label">Secure</strong>
                <p className="pdp-trust-sublabel">UPI / Card</p>
              </div>
              <div className="soft-card pdp-trust-card">
                <HandHeart size={16} />
                <strong className="pdp-trust-label">Handmade</strong>
                <p className="pdp-trust-sublabel">Jaipur craft</p>
              </div>
            </div>

            <div className="pdp-social-proof">
              <Users size={15} />
              {boughtRecently} people bought this in the last 24h
            </div>

            {!isOnRequest && outOfStock && selectedVariant && (
              <div className="pdp-back-in-stock">
                <BackInStock productId={product.id} variantId={selectedVariant.id} productTitle={displayTitle} />
              </div>
            )}
          </div>
        </div>

        <div className="pdp-detail-grid">
          <section className="pdp-accordion-shell" aria-labelledby="product-details-heading">
            <p className="kv-tag" id="product-details-heading">Product details</p>
            {accordionItems.map((item) => {
              const isOpen = activeAccordion === item.key;
              return (
                <div key={item.key} className="pdp-accordion-item">
                  <button
                    type="button"
                    className="pdp-accordion-trigger"
                    onClick={() => setActiveAccordion(item.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="pdp-accordion-icon">{item.icon}</span>
                    <span className="pdp-accordion-text">
                      <strong>{item.title}</strong>
                      <small>{item.hint}</small>
                    </span>
                    <ChevronDown className={isOpen ? 'is-open' : ''} size={18} />
                  </button>
                  {isOpen ? <div className="pdp-accordion-content">{item.content}</div> : null}
                </div>
              );
            })}

            <div className="pdp-spec-card">
              <strong className="pdp-trust-label">Quick specifications</strong>
              <table className="pdp-spec-table">
                <tbody>
                  {product.material && <tr className="pdp-spec-row"><td className="pdp-spec-cell pdp-spec-label-cell">Material</td><td className="pdp-spec-cell">{product.material}</td></tr>}
                  {structuredAttributeRows.slice(0, 5).map((row) => (
                    <tr key={`${row.label}-${row.value}`} className="pdp-spec-row">
                      <td className="pdp-spec-cell pdp-spec-label-cell">{row.label}</td>
                      <td className="pdp-spec-cell">{row.value}</td>
                    </tr>
                  ))}
                  {product.origin_country && <tr className="pdp-spec-row"><td className="pdp-spec-cell pdp-spec-label-cell">Origin</td><td className="pdp-spec-cell">{product.origin_country}</td></tr>}
                  {selectedVariant?.sku && <tr className="pdp-spec-row"><td className="pdp-spec-cell pdp-spec-label-cell">SKU</td><td className="pdp-spec-cell">{selectedVariant.sku}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="pdp-review-sidebar" id="reviews">
            <div className="pdp-review-summary">
              <div>
                <strong>{reviewRating.toFixed(1)}</strong>
                <span className="pdp-rating-stars">★★★★★</span>
                <p>{reviewCount.toLocaleString()} reviews</p>
              </div>
              {[88, 9, 2].map((value, index) => (
                <div className="pdp-review-meter" key={value}>
                  <span>{5 - index}★</span>
                  <i><b style={{ width: `${value}%` }} /></i>
                  <span>{value}%</span>
                </div>
              ))}
            </div>
            <div className="pdp-verified-card">
              <PackageCheck size={16} />
              <p>&ldquo;Better than photos.&rdquo;</p>
              <small>Verified · Priya M. · Delhi</small>
            </div>
            <Reviews productId={product.id} />
          </aside>
        </div>
      </div>

      <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} sizeGuide={product.size_guide} />

      <div
        style={{ transform: showStickyATC ? 'translateY(0)' : 'translateY(100%)' }}
        className="pdp-sticky-bar"
        aria-hidden={!showStickyATC}
      >
        <div className="pdp-sticky-info">
          <p className="pdp-sticky-title">{displayTitle}</p>
          {isOnRequest ? (
            <p className="pdp-sticky-price pdp-enquire-label">Enquire for price</p>
          ) : (
            <p className="pdp-sticky-price">{formattedPrice}</p>
          )}
        </div>
        {isOnRequest ? (
          <WhatsAppCTA message={whatsappMessage} className="btn btn-primary pdp-whatsapp">
            Enquire
          </WhatsAppCTA>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || addedToCart || outOfStock}
            className="btn btn-primary"
            style={outOfStock ? { background: '#d1d5db', color: '#6b7280', borderColor: '#d1d5db', cursor: 'not-allowed' } : addedToCart ? { background: 'var(--success-dark)', borderColor: 'var(--success-dark)' } : {}}
          >
            {outOfStock ? 'Sold Out' : addedToCart ? 'Added' : 'Add to cart'}
          </button>
        )}
      </div>
    </div>
  );
}
