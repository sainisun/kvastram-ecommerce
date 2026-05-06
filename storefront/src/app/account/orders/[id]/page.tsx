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
import { getOrderStatusBadgeClass, getOrderStatusConfig } from '@/lib/order-status';

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
  tracking_link?: string | null;
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

  // Return Request state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});

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

  const handleRequestReturn = async () => {
    if (!order) return;
    const selectedItems = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ line_item_id: id, quantity, restock: true }));

    if (selectedItems.length === 0) {
      setReturnError('Please select at least one item to return.');
      return;
    }
    if (returnReason.trim().length < 10) {
      setReturnError(
        'Please describe your reason for returning (min 10 characters).'
      );
      return;
    }

    setReturnLoading(true);
    setReturnError(null);
    try {
      await api.requestReturn({
        order_id: order.id,
        reason: returnReason.trim(),
        items: selectedItems,
      });
      setReturnSuccess(
        'Your return request has been submitted. Our team will review it within 2-3 business days.'
      );
      setShowReturnModal(false);
    } catch (err: unknown) {
      setReturnError(
        err instanceof Error
          ? err.message
          : 'Failed to submit return request.'
      );
    } finally {
      setReturnLoading(false);
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
        <p className="account-error-copy mb-4">{error || 'Order not found'}</p>
        <Link href="/account" className="underline">
          Back to Account
        </Link>
      </div>
    );
  }

  const date = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const workflowTimeline = order.workflow?.timeline?.filter((step) =>
    ['pending', 'processing', 'shipped', 'delivered'].includes(step.key)
  ) || [
    { key: 'pending', label: 'Order placed', happened_at: null, completed: true, current: false },
    { key: 'processing', label: 'Processing', happened_at: null, completed: false, current: true },
    { key: 'shipped', label: 'Shipped', happened_at: null, completed: false, current: false },
    { key: 'delivered', label: 'Delivered', happened_at: null, completed: false, current: false },
  ];
  const workflowIndex = workflowTimeline.findIndex((step) => step.current);
  const completedWorkflowSteps = workflowTimeline.filter(
    (step) => step.completed || step.current
  ).length;
  const workflowProgressWidth = `${Math.max(
    25,
    Math.round((completedWorkflowSteps / workflowTimeline.length) * 100)
  )}%`;
  const canRequestReturn =
    order.status === 'delivered' || order.raw_status === 'completed';

  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
        <Link
          href="/account"
          className="account-muted mb-8 inline-flex items-center gap-2 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="account-detail-title mb-1">
                Order #{order.display_id}
              </h1>
              <p className="account-muted flex items-center gap-2">
                <Clock size={14} /> Placed on {date}
              </p>
            </div>
            <div
              className={`account-status-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${getOrderStatusBadgeClass(order.status)}`}
            >
              {order.status === 'delivered' && <CheckCircle size={14} />}
              {(order.status === 'canceled' || order.status === 'cancelled') && <XCircle size={14} />}
              {order.status === 'shipped' && <Truck size={14} />}
              {order.status === 'pending' && <Package size={14} />}
              {getOrderStatusConfig(order.status).label}
            </div>
          </div>

          <div className="bg-stone-50 p-6 border-b border-stone-100">
            <div className="account-progress-labels flex items-center justify-between">
              {workflowTimeline.map((step, index) => (
                <span
                  key={step.key}
                  className={step.completed || step.current || index === 0 ? 'text-stone-900' : ''}
                >
                  {step.label}
                </span>
              ))}
            </div>
            <div className="mt-3 h-1 bg-stone-200 rounded-full relative">
              <div
                className="absolute left-0 top-0 h-full bg-stone-900 rounded-full transition-all duration-500"
                style={{ width: workflowIndex >= 0 ? workflowProgressWidth : '25%' }}
              ></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100">
            <div className="md:col-span-2 p-6 md:p-8">
              <h3 className="account-kicker mb-6 flex items-center gap-2">
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
                        <div className="account-caption flex h-full items-center justify-center">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="account-name truncate">
                        {item.title}
                      </p>
                      <p className="account-caption mt-1">
                        Qty: {item.quantity} ×{' '}
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(item.unit_price / 100)}
                      </p>
                      {item.metadata?.variant && (
                        <p className="account-caption mt-1 uppercase">
                          {String(item.metadata.variant)}
                        </p>
                      )}
                    </div>
                    <p className="account-name">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency_code?.toUpperCase() || 'INR',
                      }).format((item.unit_price * item.quantity) / 100)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-2">
                <div className="account-muted flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: order.currency_code?.toUpperCase() || 'INR',
                    }).format(order.subtotal / 100)}
                  </span>
                </div>
                <div className="account-muted flex justify-between">
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
                <div className="account-total-row mt-4 flex justify-between border-t border-stone-100 pt-4">
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
                <h3 className="account-form-label mb-3 flex items-center gap-2">
                  <Truck size={14} /> Shipping Address
                </h3>
                <address className="account-body space-y-1 not-italic">
                  <p className="account-name">
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
                <h3 className="account-form-label mb-3">
                  Payment Status
                </h3>
                <div className="account-body">
                  <p className="capitalize mb-1">
                    {order.payment_status?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="account-mono-caption">
                    {order.payment_intent_id?.slice(-8)}...
                  </p>
                </div>
              </div>

              {(order.workflow?.estimated_delivery_start ||
                order.workflow?.estimated_delivery_end ||
                order.workflow?.customer_note) && (
                <div>
                  <h3 className="account-form-label mb-3">Delivery updates</h3>
                  <div className="account-body space-y-2">
                    {(order.workflow?.estimated_delivery_start ||
                      order.workflow?.estimated_delivery_end) && (
                      <p>
                        ETA: {order.workflow?.estimated_delivery_start || 'TBD'}
                        {order.workflow?.estimated_delivery_end
                          ? ` - ${order.workflow.estimated_delivery_end}`
                          : ''}
                      </p>
                    )}
                    {order.workflow?.customer_note && (
                      <p>{order.workflow.customer_note}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-stone-200 space-y-3">
                {reorderError && (
                  <div className="account-alert rounded border border-red-200 bg-red-50 px-4 py-2 text-red-700">
                    {reorderError}
                  </div>
                )}
                {returnSuccess && (
                  <div className="account-alert rounded border border-green-200 bg-green-50 px-4 py-2 text-green-700">
                    {returnSuccess}
                  </div>
                )}
                <button
                  onClick={handleReorder}
                  disabled={
                    reordering || !order.items || order.items.length === 0
                  }
                  className="account-secondary-action flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 transition-colors hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reordering ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} /> Reorder
                    </>
                  )}
                </button>
                {canRequestReturn && (
                  <button
                    onClick={() => {
                      setShowReturnModal(true);
                      setReturnError(null);
                      setReturnSuccess(null);
                      setReturnReason('');
                      setReturnItems({});
                    }}
                    className="account-secondary-action flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    <RotateCcw size={14} /> Request Return
                  </button>
                )}
                {order.tracking_link ? (
                  <a
                    href={order.tracking_link}
                    target="_blank"
                    rel="noreferrer"
                    className="account-secondary-action flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 transition-colors hover:bg-stone-900 hover:text-white"
                  >
                    <Truck size={14} /> Track Package
                  </a>
                ) : null}
                <Link
                  href={`/contact?order=${order.display_id}&email=${encodeURIComponent(order.email)}`}
                  className="account-secondary-action flex w-full items-center justify-center gap-2 border border-stone-300 bg-white py-3 transition-colors hover:bg-stone-900 hover:text-white"
                >
                  Need Help?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Return Request Modal */}
      {showReturnModal && order && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-auto max-h-[90vh]">
            <div className="p-6 border-b border-stone-100">
              <h2 className="account-section-title">
                Request Return
              </h2>
              <p className="account-caption mt-1">
                Order #{order.display_id}
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="account-form-label mb-3">
                  Select Items to Return
                </p>
                <div className="space-y-2">
                  {(order.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-stone-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="account-name truncate">
                          {item.title}
                        </p>
                        <p className="account-caption">
                          Qty ordered: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <label className="account-caption">
                          Return qty:
                        </label>
                        <select
                          value={returnItems[item.id] || 0}
                          onChange={(e) =>
                            setReturnItems((prev) => ({
                              ...prev,
                              [item.id]: Number(e.target.value),
                            }))
                          }
                          className="account-input w-16 rounded border border-stone-200 p-1"
                        >
                          {Array.from({ length: item.quantity + 1 }, (_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="account-form-label mb-2 block">
                  Reason for Return
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  placeholder="Please describe why you are returning this item(s)..."
                  className="account-input w-full rounded border border-stone-200 p-3 focus:outline-none focus:border-stone-900"
                />
              </div>
              {returnError && (
                <div className="account-alert rounded border border-red-200 bg-red-50 p-3 text-red-700">
                  {returnError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-stone-100 flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="account-secondary-action flex-1 border border-stone-300 py-3 transition-colors hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={returnLoading}
                className="account-primary-action flex-1 bg-stone-900 py-3 transition-colors hover:bg-stone-700 disabled:opacity-50"
              >
                {returnLoading ? 'Submitting...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
