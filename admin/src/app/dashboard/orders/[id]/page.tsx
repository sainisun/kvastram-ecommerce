'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  CreditCard,
  ChevronDown,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/context/notification-context';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api
      .getOrder(id)
      .then((data) => {
        const orderData = data?.order || data;
        setOrder(orderData);
        setItems(data?.items || orderData?.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const { showNotification } = useNotification();

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Update order status to ${newStatus}?`)) return;
    setUpdating(true);

    try {
      await api.updateOrderStatus(id, newStatus);
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
      showNotification('success', `Order status updated to ${newStatus}`);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    try {
      const blob = await api.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.order_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Could not download invoice');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!order) return <div className="p-10 text-center">Order not found</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/orders"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Order #
              {order.order_number ||
                order.display_id ||
                (order.id ? order.id.split('-')[0] : 'Unknown')}
            </h1>
            <p className="text-gray-500 text-sm">
              Placed on{' '}
              {order.created_at
                ? new Date(order.created_at).toLocaleString()
                : 'Recent'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Invoice</span>
          </button>
          <div className="relative group">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <span className="capitalize">{order.status}</span>
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 hidden group-hover:block z-10">
              {['pending', 'processing', 'completed', 'canceled'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Package size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-700">Line Items</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No items found
                </div>
              ) : (
                items.map((item: any) => (
                  <div key={item.id} className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                      {item.product_thumbnail ? (
                        <img
                          src={item.product_thumbnail}
                          className="w-full h-full object-cover"
                          alt={item.product_title || ''}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.product_title || item.title || 'Unknown Product'}
                      </h3>
                      {item.variant_title &&
                        item.variant_title !== 'Default' && (
                          <p className="text-sm text-gray-500">
                            {item.variant_title}
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(
                          item.total || item.unit_price * item.quantity,
                          order.currency_code
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x{' '}
                        {formatCurrency(item.unit_price, order.currency_code)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(order.subtotal, order.currency_code)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">
                  {formatCurrency(order.shipping_total, order.currency_code)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency_code)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Address */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-700">Customer</h2>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {(
                  order.customer_first_name?.[0] ||
                  order.email?.[0] ||
                  '?'
                ).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {order.customer_first_name} {order.customer_last_name}
                </p>
                <p className="text-sm text-gray-500">{order.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Contact Info
              </h3>
              <p className="text-sm text-gray-600">
                {order.customer_phone || 'No phone provided'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-700">Shipping Address</h2>
            </div>
            {order.shipping_address ? (
              <address className="text-sm text-gray-600 not-italic leading-relaxed">
                {order.shipping_address.first_name}{' '}
                {order.shipping_address.last_name}
                <br />
                {order.shipping_address.address_1}
                <br />
                {order.shipping_address.address_2 && (
                  <>
                    {order.shipping_address.address_2}
                    <br />
                  </>
                )}
                {order.shipping_address.city},{' '}
                {order.shipping_address.postal_code}
                <br />
                {(
                  order.shipping_address.province ||
                  order.shipping_address.country_code ||
                  ''
                ).toUpperCase()}
                <br />
                <span className="text-gray-400 text-xs mt-1 block">
                  {order.shipping_address.phone}
                </span>
              </address>
            ) : (
              <p className="text-sm text-gray-400">No address details</p>
            )}
          </div>

          {/* Fulfillment & Tracking */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-700">Fulfillment</h2>
            </div>

            {order.tracking_number ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                    Tracking Number
                  </span>
                  <div className="font-mono bg-gray-50 px-3 py-2 rounded text-sm text-gray-800 border border-gray-200 flex justify-between items-center">
                    {order.tracking_number}
                    <button
                      className="text-blue-500 hover:text-blue-700 text-xs"
                      onClick={() =>
                        navigator.clipboard.writeText(order.tracking_number)
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
                {order.shipping_carrier && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                      Carrier
                    </span>
                    <p className="text-sm text-gray-800">
                      {order.shipping_carrier}
                    </p>
                  </div>
                )}
                {order.tracking_link && (
                  <div>
                    <a
                      href={order.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Track Shipment ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const trackingData = {
                    tracking_number: formData.get('tracking_number') as string,
                    shipping_carrier:
                      (formData.get('shipping_carrier') as string) || undefined,
                    tracking_link:
                      (formData.get('tracking_link') as string) || undefined,
                  };
                  if (!trackingData.tracking_number) return;

                  try {
                    setUpdating(true);
                    await api.addOrderTracking(id, trackingData);
                    setOrder((prev: any) => ({
                      ...prev,
                      ...trackingData,
                      status: 'shipped',
                    }));
                    showNotification('success', 'Tracking information added');
                  } catch (error: any) {
                    showNotification(
                      'error',
                      error.message || 'Failed to add tracking'
                    );
                  } finally {
                    setUpdating(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tracking Number *
                  </label>
                  <input
                    required
                    name="tracking_number"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. 1Z9999999999999999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Shipping Carrier
                  </label>
                  <input
                    name="shipping_carrier"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. UPS, FedEx, DHL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tracking Link URL
                  </label>
                  <input
                    name="tracking_link"
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    placeholder="https://"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition-colors text-sm disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Add Tracking'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
