'use client';

import { useWishlist, WishlistItem } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useCurrency } from '@/context/currency-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { showNotification } = useNotification();
  const { formatPrice } = useCurrency();

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.variantId || item.productId,
      variantId: item.variantId || item.productId,
      quantity: 1,
      title: item.title,
      price: item.price,
      currency: item.currency,
      thumbnail: item.thumbnail,
    });
    showNotification('success', 'Added to cart');
    removeItem(item.productId);
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
    showNotification('info', 'Removed from wishlist');
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--ds-surface-paper)] py-12 md:py-16 lg:py-24">
        <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <EmptyState
            icon={<Heart size={56} />}
            title="Your Wishlist is Empty"
            description="Save items you love by clicking the heart icon on any product."
            actions={
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)] px-8 py-3 text-body-xs type-bold uppercase tracking-token-wider hover:bg-[var(--ds-text-secondary)] transition-colors"
            >
              Start Shopping
              <ArrowRight size={16} />
            </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)] py-12 md:py-16 lg:py-24">
      <div className="kv-page-container mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-display-lg font-display text-[var(--ds-text-primary)] mb-2">
              My Wishlist
            </h1>
            <p className="text-[var(--ds-text-muted)]">
              {items.length} saved item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button
            type="button"
            onClick={clearWishlist}
            variant="ghost"
            size="sm"
          >
            Clear All
          </Button>
        </div>

        <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group">
              <div className="relative aspect-[3/4] bg-[var(--ds-surface-soft)] mb-4 overflow-hidden rounded-sm">
                <Link href={`/products/${item.handle}`}>
                  {item.thumbnail ? (
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--ds-text-muted)] italic">
                      No Image
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <IconButton
                  type="button"
                  onClick={() => handleRemove(item.productId)}
                  className="absolute right-3 top-3 h-8 w-8 rounded-full border-0 bg-[var(--ds-surface-paper)]/90 text-[var(--ds-text-muted)] hover:text-[var(--ds-danger)]"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              <div className="space-y-2">
                <Link href={`/products/${item.handle}`}>
                  <h3 className="font-display text-[var(--ds-text-primary)] group-hover:text-[var(--ds-text-secondary)] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                <PriceDisplay price={formatPrice(item.price)} variant="inline" />
                <Button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  variant="secondary"
                  fullWidth
                  leadingIcon={<ShoppingBag size={14} />}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
