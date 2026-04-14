'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Package,
  Printer,
  Truck,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/context/notification-context';
import {
  ActionButton,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

const timelineSteps = ['pending', 'processing', 'shipped', 'delivered'];

interface OrderDetails {
  id: string;
  order_number?: string;
  display_id?: string;
  status: string;
  created_at?: string;
  email: string;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_phone?: string | null;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency_code?: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string | null;
    city?: string;
    postal_code?: string;
    province?: string | null;
    country_code?: string | null;
  } | null;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  tracking_link?: string | null;
}

interface OrderItem {
  id: string;
  product_thumbnail?: string | null;
  product_title?: string | null;
  title?: string | null;
  variant_title?: string | null;
  total?: number;
  unit_price: number;
  quantity: number;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { showNotification } = useNotification();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await api.getOrder(id);
        const orderData = data?.order || data;
        setOrder(orderData);
        setItems(data?.items || orderData?.items || []);
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const timelineIndex = Math.max(
    timelineSteps.findIndex((step) => step === order?.status),
    order?.status === 'completed' ? timelineSteps.length - 1 : 0
  );

  const handleStatusChange = async (status: string) => {
    try {
      setUpdating(true);
      await api.updateOrderStatus(id, status);
      setOrder((current) => (current ? { ...current, status } : current));
      showNotification('success', `Order updated to ${status}`);
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update order'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoiceDownload = async () => {
    try {
      const blob = await api.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order?.order_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Invoice download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Orders"
          title="Order details"
          description="Loading the full order record."
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Orders"
          title="Order not found"
          description="This order could not be loaded."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <div className="pt-2">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow="Order detail"
        title={`Order #${order.order_number || order.display_id || id.slice(0, 8)}`}
        description={`Placed ${order.created_at ? new Date(order.created_at).toLocaleString() : 'recently'} by ${order.email}.`}
        actions={
          <>
            <ActionButton onClick={handleInvoiceDownload} icon={Printer} variant="secondary">
              Invoice
            </ActionButton>
            <ActionButton
              href={`mailto:${order.email}?subject=Update on your Kvastram order #${order.order_number || ''}`}
              icon={Mail}
              variant="secondary"
            >
              Send email
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <Surface className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  Order status
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge status={order.status} className="text-sm" />
                  <select
                    value={order.status}
                    onChange={(event) => void handleStatusChange(event.target.value)}
                    disabled={updating}
                    className="border px-4 py-3 text-sm"
                  >
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Total
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--kv-text)]">
                  {formatCurrency(order.total, order.currency_code || 'USD')}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {timelineSteps.map((step, index) => {
                const reached = index <= timelineIndex;
                return (
                  <div
                    key={step}
                    className={`rounded-[1.1rem] border px-4 py-4 ${
                      reached
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)]'
                        : 'border-[var(--kv-border)] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          reached
                            ? 'bg-[var(--kv-accent)] text-white'
                            : 'bg-[var(--kv-soft)] text-[var(--kv-muted)]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold capitalize text-[var(--kv-text)]">
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader
              title="Products ordered"
              description="Items, quantities, and line totals."
            />
            <div className="divide-y divide-[var(--kv-border)]">
              {items.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-[var(--kv-muted)]">
                  No line items available.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[var(--kv-soft)]">
                        {item.product_thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product_thumbnail}
                            alt={item.product_title || item.title || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-[var(--kv-muted)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--kv-text)]">
                          {item.product_title || item.title || 'Unknown product'}
                        </p>
                        {item.variant_title && item.variant_title !== 'Default' ? (
                          <p className="mt-1 text-sm text-[var(--kv-muted)]">
                            {item.variant_title}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="md:ml-auto md:text-right">
                      <p className="font-semibold text-[var(--kv-text)]">
                        {formatCurrency(
                          item.total || item.unit_price * item.quantity,
                          order.currency_code || 'USD'
                        )}
                      </p>
                      <p className="mt-1 text-sm text-[var(--kv-muted)]">
                        Qty {item.quantity} x{' '}
                        {formatCurrency(item.unit_price, order.currency_code || 'USD')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[var(--kv-border)] bg-[var(--kv-soft)] px-5 py-5 md:px-6">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--kv-muted)]">Subtotal</span>
                  <span className="font-medium text-[var(--kv-text)]">
                    {formatCurrency(order.subtotal, order.currency_code || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--kv-muted)]">Shipping</span>
                  <span className="font-medium text-[var(--kv-text)]">
                    {formatCurrency(
                      order.shipping_total,
                      order.currency_code || 'USD'
                    )}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--kv-border)] pt-4 text-base font-semibold text-[var(--kv-text)]">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency_code || 'USD')}</span>
              </div>
            </div>
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface className="overflow-hidden">
            <SectionHeader title="Customer" />
            <div className="space-y-5 px-5 py-5 md:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {order.customer_first_name && order.customer_last_name
                      ? `${order.customer_first_name} ${order.customer_last_name}`
                      : 'Guest customer'}
                  </p>
                  <p className="text-sm text-[var(--kv-muted)]">{order.email}</p>
                </div>
              </div>

              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">Contact</p>
                    <p className="mt-1 text-[var(--kv-muted)]">{order.email}</p>
                    <p className="text-[var(--kv-muted)]">
                      {order.customer_phone || 'No phone provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Shipping address" />
            <div className="px-5 py-5 md:px-6">
              {order.shipping_address ? (
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                    <div className="leading-6">
                      <p className="font-medium">
                        {order.shipping_address.first_name}{' '}
                        {order.shipping_address.last_name}
                      </p>
                      <p>{order.shipping_address.address_1}</p>
                      {order.shipping_address.address_2 ? (
                        <p>{order.shipping_address.address_2}</p>
                      ) : null}
                      <p>
                        {order.shipping_address.city},{' '}
                        {order.shipping_address.postal_code}
                      </p>
                      <p>
                        {(
                          order.shipping_address.province ||
                          order.shipping_address.country_code ||
                          ''
                        ).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--kv-muted)]">
                  No shipping address captured for this order.
                </p>
              )}
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Fulfillment and tracking" />
            <div className="px-5 py-5 md:px-6">
              {order.tracking_number ? (
                <div className="space-y-4 text-sm">
                  <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Tracking number
                    </p>
                    <p className="mt-2 font-semibold text-[var(--kv-text)]">
                      {order.tracking_number}
                    </p>
                    {order.shipping_carrier ? (
                      <p className="mt-2 text-[var(--kv-muted)]">
                        Carrier: {order.shipping_carrier}
                      </p>
                    ) : null}
                  </div>
                  {order.tracking_link ? (
                    <ActionButton
                      href={order.tracking_link}
                      icon={Truck}
                      variant="secondary"
                    >
                      Open tracking link
                    </ActionButton>
                  ) : null}
                </div>
              ) : (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const payload = {
                      tracking_number: formData.get('tracking_number') as string,
                      shipping_carrier:
                        (formData.get('shipping_carrier') as string) || undefined,
                      tracking_link:
                        (formData.get('tracking_link') as string) || undefined,
                    };

                    if (!payload.tracking_number) {
                      return;
                    }

                    try {
                      setUpdating(true);
                      await api.addOrderTracking(id, payload);
                      setOrder((current) =>
                        current
                          ? {
                              ...current,
                              ...payload,
                              status: 'shipped',
                            }
                          : current
                      );
                      showNotification('success', 'Tracking saved');
                    } catch (error: unknown) {
                      showNotification(
                        'error',
                        error instanceof Error
                          ? error.message
                          : 'Failed to save tracking'
                      );
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    name="tracking_number"
                    type="text"
                    required
                    placeholder="Tracking number"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <input
                    name="shipping_carrier"
                    type="text"
                    placeholder="Carrier"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <input
                    name="tracking_link"
                    type="url"
                    placeholder="Tracking URL"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {updating ? 'Saving…' : 'Add tracking number'}
                  </button>
                </form>
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
