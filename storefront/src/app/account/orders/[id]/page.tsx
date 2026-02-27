'use client';

import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { Order } from '@/types/backend';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

// Extended order interface for frontend display
interface OrderWithDetails extends Order {
  items: Array<{
    id: string;
    product_id?: string;
    variant_id?: string;
    title: string;
    thumbnail?: string | null;
    quantity: number;
    unit_price: number;
    metadata?: {
      variant?: string;
      original_variant_id?: string;
    } | null;
  }>;
  subtotal: number;
  shipping_total: number;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postal_code: string;
    country_code?: string;
  };
  payment_intent_id?: string;
}

export default function OrderDetailsPage() {
  const { customer, loading } = useAuth();
  const { addItem } = useCart();
  const { currentRegion } = useShop();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  // Handle reorder functionality
  const handleReorder = async () => {
    if (!order || !order.items || order.items.length === 0) {
      setReorderError('No items to reorder');
      return;
    }

    setReordering(true);
    setReorderError(null);

    try {
      let addedCount = 0;
      let failedCount = 0;

      // Add each item to cart
      for (const orderItem of order.items) {
        try {
          let product = null;

          // Prefer product_id for stable lookup, fall back to title search
          if (orderItem.product_id) {
            try {
              product = await api.getProduct(orderItem.product_id);
            } catch {
              // Product not found, try title search as fallback
              product = await api.searchProductsByTitle(orderItem.title);
            }
          } else {
            // Fallback: search by title
            product = await api.searchProductsByTitle(orderItem.title);
          }

          if (product) {
            // Find matching variant - prefer variant_id, then metadata.variant, then first variant
            const variant = orderItem.variant_id
              ? product.variants?.find(
                  (v: { id: string }) => v.id === orderItem.variant_id
                )
              : product.variants?.find(
                  (v: { metadata?: { variant?: string } }) =>
                    v.metadata?.variant === orderItem.metadata?.variant
                ) || product.variants?.[0];

            if (variant) {
              addItem({
                id: product.id,
                variantId: variant.id,
                quantity: orderItem.quantity,
                title: product.title,
                price:
                  variant.prices?.find(
                    (p: { currency_code: string }) =>
                      p.currency_code ===
                      (currentRegion?.currency_code || 'usd')
                  )?.amount || orderItem.unit_price,
                currency: currentRegion?.currency_code?.toUpperCase() || 'USD',
                thumbnail:
                  product.thumbnail || orderItem.thumbnail || undefined,
                sku: variant.sku,
              });
              addedCount++;
            } else {
              // No valid variant - skip this item
              console.warn(
                'No matching variant found for item:',
                orderItem.title
              );
              failedCount++;
            }
          } else {
            // Product not found - skip this item
            console.warn('Product not found for item:', orderItem.title);
            failedCount++;
          }
        } catch (err) {
          console.error('Failed to add item to cart:', orderItem.title, err);
          failedCount++;
        }
      }

      if (addedCount > 0) {
        // Show success message
        if (failedCount > 0) {
          alert(
            `${addedCount} items added to cart. ${failedCount} items could not be added.`
          );
        }
        router.push('/cart');
      } else {
        setReorderError('Could not add any items to cart. Please try again.');
      }
    } catch (err) {
      console.error('Reorder failed:', err);
      setReorderError('Failed to reorder items. Please try again.');
    } finally {
      setReordering(false);
    }
  };

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.id) return;

      try {
        const res = await api.getOrder(params.id as string);
        setOrder(res.order);
        setFetching(false);
      } catch {
        setError('Failed to load order');
        setFetching(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <Link href="/account" className="underline">
          Back to Account
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'canceled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  const date = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif text-stone-900 mb-1">
                Order #{order.display_id}
              </h1>
              <p className="text-stone-500 text-sm flex items-center gap-2">
                <Clock size={14} /> Placed on {date}
              </p>
            </div>
            <div
              className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 ${getStatusColor(order.status)}`}
            >
              {order.status === 'completed' && <CheckCircle size={14} />}
              {order.status === 'canceled' && <XCircle size={14} />}
              {order.status === 'pending' && <Package size={14} />}
              {order.status}
            </div>
          </div>

          <div className="bg-stone-50 p-6 border-b border-stone-100">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-stone-400">
              <span className="text-stone-900">Ordered</span>
              <span
                className={
                  order.fulfillment_status !== 'not_fulfilled'
                    ? 'text-stone-900'
                    : ''
                }
              >
                Processing
              </span>
              <span
                className={
                  order.fulfillment_status === 'fulfilled'
                    ? 'text-stone-900'
                    : ''
                }
              >
                Shipped
              </span>
              <span
                className={order.status === 'completed' ? 'text-stone-900' : ''}
              >
                Delivered
              </span>
            </div>
            <div className="mt-3 h-1 bg-stone-200 rounded-full relative">
              <div
                className="absolute left-0 top-0 h-full bg-stone-900 rounded-full transition-all duration-500"
                style={{
                  width:
                    order.status === 'completed'
                      ? '100%'
                      : order.fulfillment_status === 'fulfilled'
                        ? '75%'
                        : order.fulfillment_status !== 'not_fulfilled'
                          ? '50%'
                          : '25%',
                }}
              ></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100">
            <div className="md:col-span-2 p-6 md:p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-6 flex items-center gap-2">
                <Package size={16} /> Items ({(order.items || []).length})
              </h3>
              <div className="space-y-6">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 shrink-0">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-stone-300 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Qty: {item.quantity} ×{' '}
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(item.unit_price / 100)}
                      </p>
                      {item.metadata?.variant && (
                        <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">
                          {String(item.metadata.variant)}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-stone-900">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency_code?.toUpperCase() || 'INR',
                      }).format((item.unit_price * item.quantity) / 100)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-2">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: order.currency_code?.toUpperCase() || 'INR',
                    }).format(order.subtotal / 100)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Shipping</span>
                  <span>
                    {order.shipping_total
                      ? new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(order.shipping_total / 100)
                      : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-serif text-stone-900 pt-4 border-t border-stone-100 mt-4">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: order.currency_code?.toUpperCase() || 'INR',
                    }).format(order.total / 100)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-stone-50/50 space-y-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
                  <Truck size={14} /> Shipping Address
                </h3>
                <address className="not-italic text-sm text-stone-600 space-y-1">
                  <p className="font-medium text-stone-900">
                    {order.shipping_address?.first_name}{' '}
                    {order.shipping_address?.last_name}
                  </p>
                  <p>{order.shipping_address?.address_1}</p>
                  {order.shipping_address?.address_2 && (
                    <p>{order.shipping_address?.address_2}</p>
                  )}
                  <p>
                    {order.shipping_address?.city},{' '}
                    {order.shipping_address?.postal_code}
                  </p>
                  <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
                </address>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
                  Payment Status
                </h3>
                <div className="text-sm text-stone-600">
                  <p className="capitalize mb-1">
                    {order.payment_status?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="text-xs text-stone-400 font-mono">
                    {order.payment_intent_id?.slice(-8)}...
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-200 space-y-3">
                {reorderError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {reorderError}
                  </div>
                )}
                <button
                  onClick={handleReorder}
                  disabled={
                    reordering || !order.items || order.items.length === 0
                  }
                  className="w-full bg-white border border-stone-300 text-stone-900 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reordering ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Adding to
                      Cart...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} /> Reorder
                    </>
                  )}
                </button>
                <button className="w-full bg-white border border-stone-300 text-stone-900 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-colors">
                  Need Help?
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
