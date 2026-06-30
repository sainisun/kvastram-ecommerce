'use client';

import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useCurrency } from '@/context/currency-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { UnstyledButton } from '@/components/ui/Button';

interface CartDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalItems, cartTotal } =
    useCart();
  const { settings } = useShop();
  const { formatPrice } = useCurrency();

  // Free shipping threshold (in cents)
  const freeShippingThreshold = settings?.free_shipping_threshold || 25000;
  const shippingProgress = Math.min(
    (cartTotal / freeShippingThreshold) * 100,
    100
  );
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const hasFreeShipping = cartTotal >= freeShippingThreshold;
  const getItemHref = (item: { handle?: string; title: string }) =>
    item.handle
      ? `/products/${item.handle}`
      : `/search?q=${encodeURIComponent(item.title)}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[var(--ds-space-xs)]">
            <ShoppingBag size={18} className="color-ink" />
            <span className="text-body-sm font-bold  tracking-token-wider color-ink">
              Your Bag
            </span>
            {totalItems > 0 && (
              <span className="w-5 h-5 bg-[var(--ink)] text-inverse text-body-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
        </span>
      }
      className="sm:max-w-[400px]"
      bodyClassName="flex flex-col p-0"
    >

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="px-[var(--ds-space-md)] py-[var(--ds-space-xs)] bg-surface border-b border-[var(--soft)]">
            {hasFreeShipping ? (
              <div className="flex items-center gap-2 text-body-xs text-success font-medium">
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
                  <span className="font-medium color-ink">
                    {Math.round(shippingProgress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--ds-accent-gold),var(--ds-footer-highlight),var(--ds-accent-gold))] bg-[length:200%_auto] transition-all duration-500 ease-out animate-[goldShimmer_3s_linear_infinite]"
                    style={{ width: `${shippingProgress}%` }}
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
            <div className="flex flex-col items-center justify-center h-full px-[var(--ds-space-md)] text-center">
              <div className="w-20 h-20 rounded-[var(--ds-radius-pill)] bg-surface flex items-center justify-center mb-5">
                <ShoppingBag className="w-8 h-8 color-muted" />
              </div>
              <p className="text-body-md font-display color-ink mb-2">
                Your bag is empty
              </p>
              <p className="text-body-xs color-muted mb-6 leading-token-relaxed">
                Discover our curated collection of handcrafted pieces
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-[var(--ink)] text-inverse px-8 py-3 text-body-xs font-bold  tracking-token-wider hover:opacity-90 transition-opacity"
              >
                Explore Collection <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--soft)]">
              {items.map((item, index) => (
                <li
                  key={item.variantId}
                  className="flex gap-[var(--ds-space-sm)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] group/item animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <Link
                    href={getItemHref(item)}
                    onClick={onClose}
                    className="relative w-[72px] h-[90px] flex-shrink-0 bg-surface-soft overflow-hidden rounded-[var(--radius-sm)]"
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
                        href={getItemHref(item)}
                        onClick={onClose}
                        className="text-body-sm font-medium color-ink hover:color-muted transition-colors line-clamp-2 block leading-token-tight"
                      >
                        {item.title}
                      </Link>
                      {item.material && (
                        <p className="text-body-xs color-muted mt-0.5  tracking-token-wider">
                          {item.material}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-border-subtle rounded-[var(--radius-sm)]">
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center color-muted hover:color-ink transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </UnstyledButton>
                        <span className="w-7 text-center text-body-xs font-medium color-ink">
                          {item.quantity}
                        </span>
                        <UnstyledButton
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center color-muted hover:color-ink transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </UnstyledButton>
                      </div>

                      {/* Price */}
                      <span className="text-body-sm font-medium color-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <UnstyledButton
                    onClick={() => removeItem(item.variantId)}
                    className="self-start p-1 color-muted hover:text-error transition-colors opacity-0 group-hover/item:opacity-100"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </UnstyledButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — Subtotal + Checkout */}
        {items.length > 0 && (
          <div className="border-t border-[var(--soft)] bg-[var(--ds-surface-paper)]">
            {/* Subtotal */}
            <div className="px-[var(--ds-space-md)] py-[var(--ds-space-sm)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-xs color-muted  tracking-token-wider">
                  Subtotal
                </span>
                <span className="text-body-md font-medium color-ink">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-xs color-muted  tracking-token-wider">
                  Shipping
                </span>
                <span className="text-body-xs color-muted">
                  {hasFreeShipping ? (
                    <span className="text-[var(--ds-success)] font-medium">FREE ✦</span>
                  ) : (
                    'Calculated at checkout'
                  )}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="px-[var(--ds-space-md)] pb-[var(--ds-space-sm)] space-y-3">
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full bg-[var(--ink)] text-inverse py-3.5 text-body-xs font-bold  tracking-token-wider hover:opacity-90 transition-opacity"
              >
                Checkout — {formatPrice(cartTotal)}
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex items-center justify-center gap-[var(--ds-space-xs)] w-full border border-border-subtle color-ink py-3 text-body-xs font-bold  tracking-token-wider hover:bg-surface transition-colors"
              >
                View Full Cart
              </Link>
            </div>

            {/* Secure Checkout Badge */}
            <div className="flex items-center justify-center gap-[var(--ds-space-xs)] pb-[var(--ds-space-sm)] text-body-xs color-muted">
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
    </Drawer>
  );
}
