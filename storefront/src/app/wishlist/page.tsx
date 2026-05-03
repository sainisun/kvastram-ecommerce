'use client';

import { useWishlist, WishlistItem } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useCurrency } from '@/context/currency-context';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
          <div className="text-center">
            <Heart size={64} className="mx-auto text-stone-200 mb-6" />
            <h1 className="text-display-lg font-serif text-stone-900 mb-4">
              Your Wishlist is Empty
            </h1>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Save items you love by clicking the heart icon on any product.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-3 text-body-xs type-bold uppercase tracking-token-wider hover:bg-stone-800 transition-colors"
            >
              Start Shopping
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-display-lg font-serif text-stone-900 mb-2">
              My Wishlist
            </h1>
            <p className="text-stone-500">
              {items.length} saved item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={clearWishlist}
            className="text-stone-500 hover:text-red-500 text-body-sm transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group">
              <div className="relative aspect-[3/4] bg-stone-100 mb-4 overflow-hidden rounded-sm">
                <Link href={`/products/${item.handle}`}>
                  {item.thumbnail ? (
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 italic">
                      No Image
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <Link href={`/products/${item.handle}`}>
                  <h3 className="font-serif text-stone-900 group-hover:text-stone-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-body-sm type-medium text-stone-900">
                  {formatPrice(item.price)}
                </p>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 text-body-xs type-bold uppercase tracking-token-wider hover:bg-stone-800 transition-colors"
                >
                  <ShoppingBag size={14} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

