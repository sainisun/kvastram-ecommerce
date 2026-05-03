'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useCurrency } from '@/context/currency-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
} from 'lucide-react';

interface CartDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalItems, cartTotal } =
    useCart();
  const { settings } = useShop();
  const { formatPrice } = useCurrency();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Free shipping threshold (in cents)
  const freeShippingThreshold = settings?.free_shipping_threshold || 25000;
  const shippingProgress = Math.min(
    (cartTotal / freeShippingThreshold) * 100,
    100
  );
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const hasFreeShipping = cartTotal >= freeShippingThreshold;


  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 z-[60] transition-all duration-300 border-none outline-none p-0 cursor-default ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        tabIndex={isOpen ? 0 : -1}
        style={{
          backgroundColor: 'rgba(8, 8, 8, 0.4)',
          backdropFilter: isOpen ? 'blur(4px)' : 'blur(0px)',
          WebkitBackdropFilter: isOpen ? 'blur(4px)' : 'blur(0px)',
        }}
        aria-label="Close cart overlay"
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:max-w-[400px] z-[61] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--soft)]">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="color-ink" />
            <h2 className="text-body-sm type-bold uppercase tracking-token-wider color-ink">
              Your Bag
            </h2>
            {totalItems > 0 && (
              <span className="w-5 h-5 bg-[var(--ink)] text-white text-body-xs type-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 color-muted hover:color-ink transition-colors rounded-full hover:bg-[var(--soft)]"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-[var(--cream)] border-b border-[var(--soft)]">
            {hasFreeShipping ? (
              <div className="flex items-center gap-2 text-body-xs text-green-700 type-medium">
                <Truck size={14} />
                <span>You&apos;ve unlocked FREE shipping! ✦</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-body-xs color-muted mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck size={12} />
                    {formatPrice(amountToFreeShipping)} away from free shipping
                  </span>
                  <span className="type-medium color-ink">
                    {Math.round(shippingProgress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${shippingProgress}%`,
                      background:
                        'linear-gradient(90deg, #b8965a, #d4b88a, #b8965a)',
                      backgroundSize: '200% auto',
                      animation: 'goldShimmer 3s linear infinite',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Cart Items — Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[var(--cream)] flex items-center justify-center mb-5">
                <ShoppingBag className="w-8 h-8 color-muted" />
              </div>
              <p className="text-body-md font-serif color-ink mb-2">
                Your bag is empty
              </p>
              <p className="text-body-xs color-muted mb-6 leading-token-relaxed">
                Discover our curated collection of handcrafted pieces
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-8 py-3 text-body-xs type-bold uppercase tracking-token-wider hover:opacity-90 transition-opacity"
              >
                Explore Collection <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--soft)]">
              {items.map((item, index) => (
                <li
                  key={item.variantId}
                  className="flex gap-4 px-6 py-4 group/item animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.handle || item.id}`}
                    onClick={onClose}
                    className="relative w-[72px] h-[90px] flex-shrink-0 bg-[var(--soft)] overflow-hidden rounded-[var(--radius-sm)]"
                  >
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center color-muted">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.handle || item.id}`}
                        onClick={onClose}
                        className="text-body-sm type-medium color-ink hover:color-muted transition-colors line-clamp-2 block leading-token-tight"
                      >
                        {item.title}
                      </Link>
                      {item.material && (
                        <p className="text-body-xs color-muted mt-0.5 uppercase tracking-token-wider">
                          {item.material}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[var(--line)] rounded-[var(--radius-sm)]">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center color-muted hover:color-ink transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-body-xs type-medium color-ink">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center color-muted hover:color-ink transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-body-sm type-medium color-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="self-start p-1 color-muted hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — Subtotal + Checkout */}
        {items.length > 0 && (
          <div className="border-t border-[var(--soft)] bg-white">
            {/* Subtotal */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-xs color-muted uppercase tracking-token-wider">
                  Subtotal
                </span>
                <span className="text-body-md type-medium color-ink">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-xs color-muted uppercase tracking-token-wider">
                  Shipping
                </span>
                <span className="text-body-xs color-muted">
                  {hasFreeShipping ? (
                    <span className="text-green-600 type-medium">FREE ✦</span>
                  ) : (
                    'Calculated at checkout'
                  )}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="px-6 pb-4 space-y-3">
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full bg-[var(--ink)] text-white py-3.5 text-body-xs type-bold uppercase tracking-token-wider hover:opacity-90 transition-opacity"
              >
                Checkout — {formatPrice(cartTotal)}
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full border border-[var(--line)] color-ink py-3 text-body-xs type-bold uppercase tracking-token-wider hover:bg-[var(--cream)] transition-colors"
              >
                View Full Cart
              </Link>
            </div>

            {/* Secure Checkout Badge */}
            <div className="flex items-center justify-center gap-2 pb-4 text-body-xs color-muted">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure checkout via Stripe</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

