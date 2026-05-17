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
import { storefrontTrust } from '@/config/storefront-trust';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    primary_package?: {
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
    } | null;
    packages?: Array<{
      id: string;
      sequence: number;
      ship_date?: string | null;
      carrier?: string | null;
      service?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
    }>;
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
        return <CheckCircle className="text-[var(--ds-success)]" size={24} />;
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="text-[var(--ds-info)]" size={24} />;
      case 'processing':
      case 'confirmed':
        return <Package className="text-[var(--ds-warning)]" size={24} />;
      case 'cancelled':
        return <XCircle className="text-[var(--ds-danger)]" size={24} />;
      default:
        return <Clock className="text-[var(--ds-text-muted)]" size={24} />;
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
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
      <section className="kv-page-gutter bg-[var(--ds-surface-soft)] px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-[860px]">
          <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] md:p-10">
            <div className="text-body-xs type-semibold uppercase tracking-token-wider text-[var(--ds-text-muted)]">
              Order tracking
            </div>
            <h1 className="mt-3 font-display text-display-xl type-medium leading-token-tight tracking-token-tight text-[var(--ds-text-primary)]">
              Track your order
            </h1>
            <p className="mt-4 max-w-2xl text-body-md leading-7 text-[var(--ds-text-secondary)]">
              Enter your order ID to load real shipment details and see the visual delivery timeline.
            </p>

        <form onSubmit={handleSearch} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Input
                type="text"
                label="Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-12345"
                required
              />
            </div>
            <div>
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={!loading ? <Search size={16} /> : null}
          >
            {loading ? 'Searching...' : 'Track Order'}
          </Button>
        </form>

        {error && (
          <div className="mt-6 space-y-4">
            <div className="border border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] p-4 text-center text-[var(--ds-danger)]">
              {error}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
              >
                Payment Help
              </Link>
              <Link
                href={`${storefrontTrust.policyRoutes.contact}?reason=tracking`}
                className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
              >
                Contact Support
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.returns}
                className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
              >
                Returns Help
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-x-auto">
          <div className="grid w-full min-w-0 grid-cols-5 gap-2">
            {getStatusSteps(order).map((step, index) => (
              <div key={step.key} className={`text-center text-body-xs ${step.completed || step.current ? 'text-[var(--ds-text-primary)]' : 'text-[var(--ds-text-muted)]'}`}>
                <div
                  className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border-2 ${
                    step.completed
                      ? 'border-[var(--ds-accent-primary)] bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)]'
                      : step.current
                        ? 'border-[var(--ds-accent-primary)] bg-[var(--ds-surface-paper)] color-accent shadow-[0_0_0_4px_rgba(168,93,58,0.12)]'
                        : 'border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] text-[var(--ds-text-muted)]'
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
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-muted)]">
                    Order ID
                  </p>
                  <p className="text-body-xl type-medium text-[var(--ds-text-primary)]">
                    #{order.display_id || order.id}
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-2 flex justify-end">{getStatusIcon(order.status)}</div>
                  <p className="text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-muted)]">
                    Status
                  </p>
                  <p className="text-body-xl type-medium text-[var(--ds-text-primary)] capitalize">
                    {order.workflow?.status_label || order.status}
                  </p>
                </div>
              </div>

              {(order.workflow?.primary_package?.tracking_number || order.tracking_number) && (
                <div className="pt-4 border-t border-[var(--ds-border-subtle)]">
                  <p className="text-body-xs type-bold uppercase text-[var(--ds-text-muted)] mb-1">
                    Tracking
                  </p>
                  {(order.workflow?.primary_package?.tracking_url || order.tracking_link) ? (
                    <a href={order.workflow?.primary_package?.tracking_url || order.tracking_link} target="_blank" rel="noreferrer" className="text-[var(--ds-text-secondary)] underline">
                      {order.workflow?.primary_package?.carrier || order.shipping_carrier}: {order.workflow?.primary_package?.tracking_number || order.tracking_number}
                    </a>
                  ) : (
                    <p className="text-[var(--ds-text-secondary)]">
                      {order.workflow?.primary_package?.carrier || order.shipping_carrier}: {order.workflow?.primary_package?.tracking_number || order.tracking_number}
                    </p>
                  )}
                </div>
              )}

              {(order.workflow?.packages || []).length > 0 && (
                <div className="pt-4 border-t border-[var(--ds-border-subtle)]">
                  <p className="text-body-xs type-bold uppercase text-[var(--ds-text-muted)] mb-3">
                    Shipment packages
                  </p>
                  <div className="space-y-3">
                    {(order.workflow?.packages || []).map((pkg) => (
                      <div key={pkg.id} className="rounded border border-[var(--ds-border-subtle)] px-4 py-3 text-sm text-[var(--ds-text-secondary)]">
                        <p className="text-body-xs type-bold uppercase text-[var(--ds-text-muted)]">
                          Package #{pkg.sequence}
                        </p>
                        <p className="mt-1">
                          {pkg.no_tracking
                            ? 'No tracking attached'
                            : pkg.tracking_number || 'Tracking pending'}
                        </p>
                        <p className="mt-1 text-[var(--ds-text-muted)]">
                          {[pkg.carrier, pkg.service].filter(Boolean).join(' • ') ||
                            'Carrier details pending'}
                        </p>
                        {pkg.no_tracking_reason ? (
                          <p className="mt-1 text-[var(--ds-text-muted)]">
                            Reason: {pkg.no_tracking_reason}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(order.workflow?.estimated_delivery_start || order.workflow?.estimated_delivery_end) && (
                <div className="pt-4 border-t border-[var(--ds-border-subtle)]">
                  <p className="text-body-xs type-bold uppercase text-[var(--ds-text-muted)] mb-1">
                    Estimated delivery
                  </p>
                  <p className="text-[var(--ds-text-secondary)]">
                    {order.workflow?.estimated_delivery_start || 'TBD'}
                    {order.workflow?.estimated_delivery_end
                      ? ` - ${order.workflow.estimated_delivery_end}`
                      : ''}
                  </p>
                </div>
              )}

              {order.workflow?.customer_note && (
                <div className="pt-4 border-t border-[var(--ds-border-subtle)]">
                  <p className="text-body-xs type-bold uppercase text-[var(--ds-text-muted)] mb-1">
                    Update from Kvastram
                  </p>
                  <p className="text-[var(--ds-text-secondary)]">{order.workflow.customer_note}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--ds-border-subtle)]">
                <Link
                  href={`/contact?order=${order.display_id || order.id}&email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center justify-center border border-[var(--ds-border-strong)] px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-text-primary)] hover:text-[var(--ds-text-inverse)]"
                >
                  Need Help With This Order?
                </Link>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-5">
              <h3 className="mb-4 font-display text-display-sm text-[var(--ds-text-primary)]">
                Shipping Address
              </h3>
              <div className="flex items-start gap-3 text-[var(--ds-text-secondary)]">
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
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-paper)] p-5">
              <h3 className="mb-4 font-display text-display-sm text-[var(--ds-text-primary)]">
                Order Items
              </h3>
              <div className="space-y-3">
                {(order.items || []).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-[var(--ds-border-subtle)]"
                  >
                    <div>
                      <p className="type-medium text-[var(--ds-text-primary)]">{item.title}</p>
                      <p className="text-body-sm text-[var(--ds-text-muted)]">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="type-medium text-[var(--ds-text-primary)]">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] p-5">
              <h3 className="mb-4 font-display text-display-sm text-[var(--ds-text-primary)]">
                More help for this order
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <Link
                  href={storefrontTrust.policyRoutes.paymentHelp}
                  className="border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
                >
                  Payment Help
                </Link>
                <Link
                  href={storefrontTrust.policyRoutes.returns}
                  className="border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
                >
                  Returns Help
                </Link>
                <Link
                  href={`${storefrontTrust.policyRoutes.contact}?reason=order-support&order=${order.display_id || order.id}&email=${encodeURIComponent(email)}`}
                  className="border border-[var(--ds-border-strong)] bg-[var(--ds-surface-paper)] px-4 py-3 text-center text-body-xs type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:bg-[var(--ds-surface-parchment)]"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] p-5">
              <strong className="text-[var(--ds-text-primary)]">Out for Delivery</strong>
              <p className="mt-1 text-body-sm leading-6 text-[var(--ds-text-secondary)]">
                Your live package status will appear here after a successful lookup.
              </p>
            </div>
            <div className="border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] p-5">
              <strong className="text-[var(--ds-text-primary)]">Arrived at Jaipur Hub</strong>
              <p className="mt-1 text-body-sm leading-6 text-[var(--ds-text-secondary)]">
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
