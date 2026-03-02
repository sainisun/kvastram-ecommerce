'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useInventoryWebSocket } from '@/hooks/useInventoryWebSocket';
import {
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Wifi,
  WifiOff,
  Star,
} from 'lucide-react';
import { SizeGuide } from '@/components/product/SizeGuide';
import { Reviews } from '@/components/product/Reviews';
import { BackInStock } from '@/components/product/BackInStock';
import ProductGallery from './ProductGallery';
import WishlistButton from '@/components/ui/WishlistButton';
import ShareButtons from '@/components/ui/ShareButtons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { RecentlyViewedRow } from '@/components/product/RecentlyViewedRow';

import type {
  Product,
  ProductVariant,
  ProductOption,
  MoneyAmount,
  ProductImage,
} from '@/types';

export default function ProductView({ product }: { product: Product }) {
  const { currentRegion } = useShop();
  const { addItem } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  // A2: Accordion state — description open by default
  const [activeAccordion, setActiveAccordion] = useState<string | null>(
    'description'
  );
  // A1: Sticky ATC state
  const [showStickyATC, setShowStickyATC] = useState(false);

  // Real-time inventory state (key: variantId, value: quantity)
  const [realTimeInventory, setRealTimeInventory] = useState<
    Record<string, number>
  >({});

  // WebSocket for real-time inventory updates
  const { isConnected, subscribeToInventory, unsubscribeFromInventory } =
    useInventoryWebSocket({
      onInventoryUpdate: (update) => {
        setRealTimeInventory((prev) => ({
          ...prev,
          [update.variantId]: update.quantity,
        }));
      },
    });

  // Subscribe to all variant inventory updates
  useEffect(() => {
    if (product.variants) {
      product.variants.forEach((variant) => {
        subscribeToInventory(variant.id);
      });
    }

    return () => {
      if (product.variants) {
        product.variants.forEach((variant) => {
          unsubscribeFromInventory(variant.id);
        });
      }
    };
  }, [product.variants, subscribeToInventory, unsubscribeFromInventory]);

  // Delivery estimate based on region (simplified)
  useEffect(() => {
    if (currentRegion) {
      const isUSRegion =
        currentRegion.id === 'us' ||
        currentRegion.id === 'us-east' ||
        currentRegion.id === 'us-west' ||
        currentRegion.id.toLowerCase().startsWith('us');
      const minDays = isUSRegion ? 3 : 7;
      const maxDays = isUSRegion ? 5 : 14;
      const minDate = new Date(Date.now() + minDays * 24 * 60 * 60 * 1000);
      const maxDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
      const formatOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };

      const timer = setTimeout(() => {
        setDeliveryDate(
          `${minDate.toLocaleDateString('en-US', formatOptions)} - ${maxDate.toLocaleDateString('en-US', formatOptions)}`
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentRegion]);

  // Track recently viewed products
  useEffect(() => {
    if (product?.id) {
      const priceObj = product.variants?.[0]?.prices?.[0];
      addToRecentlyViewed({
        id: product.id,
        handle: product.handle || product.id,
        title: product.title,
        thumbnail: product.thumbnail || undefined,
        price: priceObj?.amount || 0,
        currency: priceObj?.currency_code?.toUpperCase() || 'USD',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // A1: Observe the main ATC button; show sticky when it leaves viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyATC(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );
    const atcBtn = document.getElementById('add-to-cart-btn');
    if (atcBtn) observer.observe(atcBtn);
    return () => observer.disconnect();
  }, []);

  // Check if product has structured options (Size, Color, etc.)
  const hasStructuredOptions = product.options && product.options.length > 0;

  // Initialize selected options from product options
  const defaultOptions = useMemo(() => {
    if (!hasStructuredOptions) return {};
    const defaults: Record<string, string> = {};
    product.options?.forEach((opt: ProductOption) => {
      if (opt.values && opt.values.length > 0) {
        defaults[opt.title] = opt.values[0].value;
      }
    });
    return defaults;
  }, [product, hasStructuredOptions]);

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(defaultOptions);

  // Initialize selected variant ID
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].id;
    }
    return '';
  });

  // Find the selected variant based on options or direct selection
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    if (product.variants.length === 1) return product.variants[0];

    if (hasStructuredOptions && Object.keys(selectedOptions).length > 0) {
      return (
        product.variants.find((v: ProductVariant) => {
          const variantOptions = v.title
            .split(' / ')
            .map((t: string) => t.trim());
          return product.options?.every((opt: ProductOption, index: number) => {
            return variantOptions[index] === selectedOptions[opt.title];
          });
        }) || product.variants[0]
      );
    } else {
      return (
        product.variants.find(
          (v: ProductVariant) => v.id === selectedVariantId
        ) || product.variants[0]
      );
    }
  }, [
    product.variants,
    product.options,
    selectedOptions,
    selectedVariantId,
    hasStructuredOptions,
  ]);

  // Clamp quantity when variant or inventory changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!selectedVariant) return;

    const available =
      realTimeInventory[selectedVariant.id] !== undefined
        ? realTimeInventory[selectedVariant.id]
        : selectedVariant.inventory_quantity;

    if (available !== undefined && available > 0) {
      if (quantity > available) {
        setQuantity(available);
      }
    } else if (available === 0) {
      setQuantity(1);
    }
  }, [selectedVariant?.id, realTimeInventory]);

  const prices = selectedVariant?.prices || [];
  const priceObj =
    prices.find(
      (p: MoneyAmount) =>
        p.currency_code ===
        (currentRegion?.currency_code || 'usd').toLowerCase()
    ) || prices[0];

  const currency = priceObj?.currency_code || 'USD';
  const amount = priceObj?.amount || 0;

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const compareAtAmount = selectedVariant?.compare_at_price;
  const formattedComparePrice = compareAtAmount
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(compareAtAmount / 100)
    : null;

  // Derived: current inventory for selected variant
  const currentInventory = selectedVariant
    ? realTimeInventory[selectedVariant.id] !== undefined
      ? realTimeInventory[selectedVariant.id]
      : selectedVariant.inventory_quantity
    : 0;

  const outOfStock = currentInventory <= 0;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      id: selectedVariant.id,
      variantId: selectedVariant.id,
      quantity: quantity,
      title:
        product.title +
        (selectedVariant.title !== 'Default Variant'
          ? ` - ${selectedVariant.title}`
          : ''),
      price: amount,
      currency: currency,
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

  const images =
    product.images && product.images.length > 0
      ? product.images
          .sort(
            (a: ProductImage, b: ProductImage) =>
              (a.position || 0) - (b.position || 0)
          )
          .map((img: ProductImage) => img.url)
      : product.thumbnail
        ? [product.thumbnail]
        : [];

  const videos = product.videos || [];

  // A2: Build accordion list dynamically based on available product data
  const accordions = [
    { key: 'description', label: 'Description', show: !!product.description },
    {
      key: 'materials',
      label: 'Materials & Care',
      show: !!(
        product.material ||
        product.care_instructions ||
        product.origin_country
      ),
    },
    { key: 'shipping', label: 'Shipping & Returns', show: true },
    { key: 'sizeguide', label: 'Size Guide', show: !!product.size_guide },
  ].filter((a) => a.show);

  const toggleAccordion = (key: string) =>
    setActiveAccordion((prev) => (prev === key ? null : key));

  return (
    <div
      className="pdp-prem"
      style={{ background: 'var(--white)', minHeight: '100vh' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 64px' }}>
        {/* W2: Linked Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-stone-400 mb-8"
        >
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          {product.categories && product.categories.length > 0 && (
            <>
              <Link
                href={`/products?category_id=${product.categories[0].id}`}
                className="hover:text-stone-900 transition-colors capitalize"
              >
                {product.categories[0].name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-stone-700 font-medium truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        <div className="pdp-grid-prem">
          {/* Left: Image Gallery */}
          <div className="pdp-gallery-prem">
            <ProductGallery
              images={images}
              title={product.title}
              videos={videos}
            />
          </div>

          {/* Right: Details */}
          <div className="pdp-info-prem">
            {/* Collection + Title + Price */}
            <div
              style={{
                paddingBottom: '28px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span className="pdp-brand-prem">
                {product.collection?.title || 'Kvastram Collection'}
              </span>
              <h1
                className="pdp-name-prem"
                style={{ marginTop: '8px', marginBottom: '16px' }}
              >
                {product.title}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <p className="pdp-price-prem">{formattedPrice}</p>
                {formattedComparePrice && (
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: 300,
                      color: 'var(--mid)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formattedComparePrice}
                  </p>
                )}
                {formattedComparePrice && amount < compareAtAmount! && (
                  <span
                    style={{
                      padding: '4px 10px',
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: '#2a7a2a',
                      background: 'rgba(42,122,42,0.08)',
                    }}
                  >
                    Save {Math.round((1 - amount / compareAtAmount!) * 100)}%
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <WishlistButton
                  productId={product.id}
                  title={product.title}
                  price={selectedVariant?.prices?.[0]?.amount || 0}
                  currency={
                    currentRegion?.currency_code?.toUpperCase() || 'USD'
                  }
                  thumbnail={product.thumbnail || undefined}
                  handle={product.handle || product.id}
                  variantId={selectedVariant?.id}
                  showLabel
                />
                <ShareButtons
                  title={product.title}
                  description={product.description?.slice(0, 100)}
                  image={product.thumbnail || undefined}
                />
              </div>
            </div>

            {/* Variant Selector - Structured Options */}
            {hasStructuredOptions &&
              product.options?.map((option: ProductOption) => {
                const isColor =
                  option.title.toLowerCase() === 'color' ||
                  option.title.toLowerCase() === 'colour';

                return (
                  <div
                    key={option.title}
                    style={{
                      marginBottom: '20px',
                      paddingBottom: '20px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '9px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--mid)',
                        marginBottom: '12px',
                      }}
                    >
                      {option.title}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {option.values.map((value: { value: string }) => {
                        const isSelected =
                          selectedOptions[option.title] === value.value;

                        // Helper for color hex
                        const getHex = (colorName: string) => {
                          const map: Record<string, string> = {
                            black: '#000000',
                            navy: '#1e3a8a',
                            white: '#ffffff',
                            'off white': '#faf8f5',
                            cream: '#fdfbf7',
                            terracotta: '#c5523f',
                            olive: '#556b2f',
                            taupe: '#8b8589',
                            red: '#991b1b',
                            blue: '#2563eb',
                            green: '#15803d',
                            yellow: '#ca8a04',
                            beige: '#f5f5dc',
                            brown: '#78350f',
                            pink: '#fbcfe8',
                            grey: '#6b7280',
                            gray: '#6b7280',
                          };
                          return map[colorName.toLowerCase()] || '#cccccc';
                        };

                        if (isColor) {
                          const hex = getHex(value.value);
                          return (
                            <button
                              key={value.value}
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [option.title]: value.value,
                                }))
                              }
                              title={value.value}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: hex,
                                border: isSelected
                                  ? '2px solid var(--black)'
                                  : '1px solid var(--border)',
                                cursor: 'pointer',
                                outline: isSelected
                                  ? '2px solid var(--black)'
                                  : 'none',
                                outlineOffset: '2px',
                                transform: isSelected
                                  ? 'scale(1.15)'
                                  : 'scale(1)',
                                transition: 'transform 0.2s',
                              }}
                              aria-label={`Select color ${value.value}`}
                              aria-pressed={isSelected}
                            />
                          );
                        }

                        // Default button (Size) — SQUARE, no rounding
                        return (
                          <button
                            key={value.value}
                            onClick={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [option.title]: value.value,
                              }))
                            }
                            className="size-btn-prem"
                            style={{
                              background: isSelected ? 'var(--black)' : 'none',
                              color: isSelected
                                ? 'var(--white)'
                                : 'var(--black)',
                              borderColor: isSelected
                                ? 'var(--black)'
                                : 'var(--border)',
                            }}
                            aria-label={`Select ${value.value} for ${option.title}`}
                            aria-pressed={isSelected}
                          >
                            {value.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Variant Selector - Simple List */}
            {!hasStructuredOptions &&
              product.variants &&
              product.variants.length > 1 && (
                <div className="mb-8 border-b border-stone-100 pb-8 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
                    Select Option
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v: ProductVariant) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className="size-btn-prem"
                          style={{
                            padding: '0 20px',
                            width: 'auto',
                            minWidth: '48px',
                            background: isSelected ? 'var(--black)' : 'none',
                            color: isSelected ? 'var(--white)' : 'var(--black)',
                            borderColor: isSelected
                              ? 'var(--black)'
                              : 'var(--border)',
                          }}
                          aria-label={`Select ${v.title}`}
                          aria-pressed={isSelected}
                        >
                          {v.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-6 mb-10">
              {/* Low stock alert */}
              {selectedVariant &&
                currentInventory > 0 &&
                currentInventory <= 10 && (
                  <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Only {currentInventory} left in stock
                    {isConnected && (
                      <span title="Live updates enabled">
                        <Wifi size={12} className="ml-1 text-green-600" />
                      </span>
                    )}
                  </div>
                )}

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    width: '120px',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    height: '56px',
                  }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--mid)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    style={{ fontSize: '14px', fontWeight: 400 }}
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (quantity < currentInventory)
                        setQuantity(quantity + 1);
                    }}
                    disabled={currentInventory <= quantity}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--mid)',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: currentInventory <= quantity ? 0.3 : 1,
                    }}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || addedToCart || outOfStock}
                  className={`add-btn-prem ${
                    addedToCart ? '' : outOfStock ? 'cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: addedToCart
                      ? '#2a7a2a'
                      : outOfStock
                        ? 'rgba(8,8,8,0.3)'
                        : 'var(--black)',
                    opacity:
                      (!selectedVariant || outOfStock) && !addedToCart
                        ? 0.6
                        : 1,
                  }}
                >
                  {outOfStock
                    ? 'Out of Stock'
                    : addedToCart
                      ? '✓ Added to Bag'
                      : 'Add to Bag'}
                </button>
              </div>

              {/* Trust Strip */}
              <div className="trust-strip-prem">
                <div className="trust-item-prem">
                  <Truck size={16} strokeWidth={1.5} />
                  <span className="trust-text-prem">
                    Free
                    <br />
                    Shipping
                  </span>
                </div>
                <div className="trust-item-prem">
                  <RotateCcw size={16} strokeWidth={1.5} />
                  <span className="trust-text-prem">
                    30-Day
                    <br />
                    Returns
                  </span>
                </div>
                <div className="trust-item-prem">
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  <span className="trust-text-prem">
                    Secure
                    <br />
                    Payment
                  </span>
                </div>
                <div className="trust-item-prem">
                  <Star size={16} strokeWidth={1.5} />
                  <span className="trust-text-prem">
                    Artisan
                    <br />
                    Authentic
                  </span>
                </div>
              </div>

              {/* Stock Status & Size Guide link */}
              <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-6">
                <span className="flex items-center gap-1">
                  {selectedVariant && currentInventory > 0 ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      {currentInventory <= 5
                        ? `Only ${currentInventory} left`
                        : 'In Stock, Ready to Ship'}
                      {isConnected ? (
                        <span title="Live updates">
                          <Wifi size={10} className="ml-1 text-green-600" />
                        </span>
                      ) : (
                        <span title="Live updates unavailable">
                          <WifiOff size={10} className="ml-1 text-stone-400" />
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Out of Stock
                      {isConnected ? (
                        <span title="Live updates">
                          <Wifi size={10} className="ml-1 text-green-600" />
                        </span>
                      ) : (
                        <span title="Live updates unavailable">
                          <WifiOff size={10} className="ml-1 text-stone-400" />
                        </span>
                      )}
                      <BackInStock
                        productId={product.id}
                        variantId={selectedVariant?.id}
                        productTitle={product.title}
                      />
                    </>
                  )}
                </span>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="underline hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Size Guide
                </button>
              </div>

              {/* Estimated Delivery */}
              <div className="bg-stone-50 p-4 text-xs space-y-2">
                <p className="font-bold text-stone-900">Estimated Delivery</p>
                <p className="text-stone-600">
                  Order now to receive by{' '}
                  <span className="font-medium text-stone-900">
                    {deliveryDate}
                  </span>
                  .
                </p>
                <p className="text-stone-400 text-[10px] mt-1">
                  Free express shipping on orders over $250
                </p>
              </div>
            </div>

            {/* Accordions */}
            <div
              className=""
              style={{
                borderTop: '1px solid var(--border)',
                marginBottom: '24px',
              }}
            >
              {accordions.map((accordion) => (
                <div key={accordion.key} className="accordion-item-prem">
                  <button
                    onClick={() => toggleAccordion(accordion.key)}
                    className="accordion-trigger-prem"
                    aria-expanded={activeAccordion === accordion.key}
                  >
                    <span className="font-bold uppercase tracking-widest text-xs text-stone-800">
                      {accordion.label}
                    </span>
                    <span className="text-stone-400 text-xl leading-none select-none">
                      {activeAccordion === accordion.key ? '−' : '+'}
                    </span>
                  </button>

                  {activeAccordion === accordion.key && (
                    <div className="pb-6 text-sm text-stone-600 leading-relaxed animate-fade-in">
                      {accordion.key === 'description' && (
                        <div className="prose prose-stone prose-sm font-light max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {product.description || ''}
                          </ReactMarkdown>
                        </div>
                      )}

                      {accordion.key === 'materials' && (
                        <div className="space-y-4">
                          {product.material && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                                Material
                              </p>
                              <p className="text-stone-700">
                                {product.material}
                              </p>
                            </div>
                          )}
                          {product.origin_country && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                                Origin
                              </p>
                              <p className="text-stone-700">
                                {product.origin_country}
                              </p>
                            </div>
                          )}
                          {product.care_instructions && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                                Care Instructions
                              </p>
                              <div className="prose prose-stone prose-sm font-light max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {product.care_instructions}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {product.variants?.[0]?.sku && (
                            <p className="text-xs text-stone-400 pt-2 border-t border-stone-100">
                              SKU: {product.variants[0].sku}
                            </p>
                          )}
                        </div>
                      )}

                      {accordion.key === 'shipping' && (
                        <div className="space-y-4">
                          <div className="flex gap-3 items-start">
                            <Truck
                              size={16}
                              className="text-stone-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-stone-800 text-[10px] uppercase tracking-wider mb-1">
                                Free Shipping
                              </p>
                              <p className="text-stone-500 text-xs">
                                Complimentary worldwide shipping on orders over
                                $250. Delivery in{' '}
                                {deliveryDate || '5–14 business days'}.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 items-start">
                            <RotateCcw
                              size={16}
                              className="text-stone-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-stone-800 text-[10px] uppercase tracking-wider mb-1">
                                30-Day Returns
                              </p>
                              <p className="text-stone-500 text-xs">
                                Returns and exchanges accepted within 30 days.
                                Items must be unworn and in original packaging.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 items-start">
                            <ShieldCheck
                              size={16}
                              className="text-stone-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-stone-800 text-[10px] uppercase tracking-wider mb-1">
                                Authenticity Guarantee
                              </p>
                              <p className="text-stone-500 text-xs">
                                Every piece is handcrafted and verified by our
                                quality team before dispatch.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {accordion.key === 'sizeguide' && (
                        <div>
                          {typeof product.size_guide === 'string' ? (
                            <div className="prose prose-stone prose-sm font-light max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {product.size_guide}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowSizeGuide(true)}
                              className="text-stone-900 underline text-sm font-medium hover:text-stone-600"
                            >
                              View Full Size Guide →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* W2: Recently Viewed Row */}
      <RecentlyViewedRow currentProductId={product.id} />

      <Reviews productId={product.id} />
      <SizeGuide
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        sizeGuide={product.size_guide}
      />

      {/* A1: Sticky Mobile Add to Cart — slides up when main ATC scrolls off screen */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-stone-200 px-4 py-3 flex items-center gap-3 shadow-2xl transition-transform duration-300 ${
          showStickyATC ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showStickyATC}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-stone-500 font-medium truncate">
            {product.title}
          </p>
          <p className="text-base font-bold text-stone-900">{formattedPrice}</p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || addedToCart || outOfStock}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
            addedToCart
              ? 'bg-green-600 text-white'
              : outOfStock
                ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-stone-800'
          }`}
          aria-label={
            outOfStock
              ? 'Out of stock'
              : addedToCart
                ? 'Added to cart'
                : 'Add to cart'
          }
        >
          {outOfStock ? 'Sold Out' : addedToCart ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
