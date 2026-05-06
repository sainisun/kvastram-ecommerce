'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';

interface OrderStatus {
  id: string;
  display_id?: number;
  status: string;
  created_at: string;
  tracking_number?: string;
  tracking_link?: string;
  shipping_carrier?: string;
  workflow?: {
    status: string;
    status_label: string;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    customer_note?: string | null;
    timeline: Array<{
      key: string;
      label: string;
      happened_at: string | null;
      completed: boolean;
      current: boolean;
    }>;
  };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    country: string;
    postal_code: string;
  };
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const data = await api.trackOrder(orderId, email);
      setOrder(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Order not found. Please check your order ID and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="text-blue-500" size={24} />;
      case 'processing':
      case 'confirmed':
        return <Package className="text-amber-500" size={24} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <Clock className="text-stone-400" size={24} />;
    }
  };

  const getStatusSteps = (currentOrder: OrderStatus | null) => {
    if (currentOrder?.workflow?.timeline?.length) {
      return currentOrder.workflow.timeline;
    }

    return [
      { key: 'pending', label: 'Order Placed', completed: true, current: false, happened_at: null },
      { key: 'processing', label: 'Processing', completed: false, current: true, happened_at: null },
      { key: 'shipped', label: 'Shipped', completed: false, current: false, happened_at: null },
      { key: 'delivered', label: 'Delivered', completed: false, current: false, happened_at: null },
    ];
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#f8f1eb] px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-[860px]">
          <div className="border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] md:p-10">
            <div className="text-body-xs type-semibold uppercase tracking-token-wider text-stone-500">
              Order tracking
            </div>
            <h1 className="mt-3 font-heading text-display-xl type-medium leading-token-tight tracking-token-tight text-stone-950">
              Track your order
            </h1>
            <p className="mt-4 max-w-2xl text-body-md leading-7 text-stone-600">
              Enter your order ID to load real shipment details and see the visual delivery timeline.
            </p>

        <form onSubmit={handleSearch} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-12345"
                className="w-full border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-900"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-stone-900"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Searching...'
            ) : (
              <>
                <Search size={16} /> Track Order
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8 overflow-x-auto">
          <div className="grid w-full min-w-0 grid-cols-5 gap-2">
            {getStatusSteps(order).map((step, index) => (
              <div key={step.key} className={`text-center text-body-xs ${step.completed || step.current ? 'text-stone-900' : 'text-stone-400'}`}>
                <div
                  className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border-2 ${
                    step.completed
                      ? 'border-[#a85d3a] bg-[#a85d3a] text-white'
                      : step.current
                        ? 'border-[#a85d3a] bg-white color-sienna shadow-[0_0_0_4px_rgba(168,93,58,0.12)]'
                        : 'border-stone-200 bg-white text-stone-400'
                  }`}
                >
                  {step.completed ? <CheckCircle size={18} /> : index + 1}
                </div>
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {order ? (
          <div className="mt-8 space-y-6">
            {/* Order Info */}
            <div className="border border-stone-100 bg-stone-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
                    Order ID
                  </p>
                  <p className="text-body-xl type-medium text-stone-900">
                    #{order.display_id || order.id}
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-2 flex justify-end">{getStatusIcon(order.status)}</div>
                  <p className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
                    Status
                  </p>
                  <p className="text-body-xl type-medium text-stone-900 capitalize">
                    {order.workflow?.status_label || order.status}
                  </p>
                </div>
              </div>

              {order.tracking_number && (
                <div className="pt-4 border-t border-stone-200">
                  <p className="text-body-xs type-bold uppercase text-stone-500 mb-1">
                    Tracking
                  </p>
                  {order.tracking_link ? (
                    <a href={order.tracking_link} target="_blank" rel="noreferrer" className="text-stone-700 underline">
                      {order.shipping_carrier}: {order.tracking_number}
                    </a>
                  ) : (
                    <p className="text-stone-700">
                      {order.shipping_carrier}: {order.tracking_number}
                    </p>
                  )}
                </div>
              )}

              {(order.workflow?.estimated_delivery_start || order.workflow?.estimated_delivery_end) && (
                <div className="pt-4 border-t border-stone-200">
                  <p className="text-body-xs type-bold uppercase text-stone-500 mb-1">
                    Estimated delivery
                  </p>
                  <p className="text-stone-700">
                    {order.workflow?.estimated_delivery_start || 'TBD'}
                    {order.workflow?.estimated_delivery_end
                      ? ` - ${order.workflow.estimated_delivery_end}`
                      : ''}
                  </p>
                </div>
              )}

              {order.workflow?.customer_note && (
                <div className="pt-4 border-t border-stone-200">
                  <p className="text-body-xs type-bold uppercase text-stone-500 mb-1">
                    Update from Kvastram
                  </p>
                  <p className="text-stone-700">{order.workflow.customer_note}</p>
                </div>
              )}

              <div className="pt-4 border-t border-stone-200">
                <Link
                  href={`/contact?order=${order.display_id || order.id}&email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center justify-center border border-stone-300 px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
                >
                  Need Help With This Order?
                </Link>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-stone-100 bg-white p-5">
              <h3 className="mb-4 font-heading text-display-sm text-stone-900">
                Shipping Address
              </h3>
              <div className="flex items-start gap-3 text-stone-600">
                <MapPin size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p>
                    {order.shipping_address?.first_name}{' '}
                    {order.shipping_address?.last_name}
                  </p>
                  <p>{order.shipping_address?.address_1}</p>
                  <p>
                    {order.shipping_address?.city},{' '}
                    {order.shipping_address?.postal_code}
                  </p>
                  <p>{order.shipping_address?.country}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-stone-100 bg-white p-5">
              <h3 className="mb-4 font-heading text-display-sm text-stone-900">
                Order Items
              </h3>
              <div className="space-y-3">
                {(order.items || []).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-stone-100"
                  >
                    <div>
                      <p className="type-medium text-stone-900">{item.title}</p>
                      <p className="text-body-sm text-stone-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="type-medium text-stone-900">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <div className="border border-stone-100 bg-stone-50 p-5">
              <strong className="text-stone-950">Out for Delivery</strong>
              <p className="mt-1 text-body-sm leading-6 text-stone-600">
                Your live package status will appear here after a successful lookup.
              </p>
            </div>
            <div className="border border-stone-100 bg-stone-50 p-5">
              <strong className="text-stone-950">Arrived at Jaipur Hub</strong>
              <p className="mt-1 text-body-sm leading-6 text-stone-600">
                Prototype-style milestone cards stay visible as a helpful empty state.
              </p>
            </div>
          </div>
        )}
          </div>
        </div>
      </section>
      </div>
  );
}

