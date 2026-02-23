'use client';

import { useAuth } from '@/context/auth-context';
import { useWholesale } from '@/context/wholesale-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Tag,
  TrendingUp,
  Clock,
  Building2,
} from 'lucide-react';

interface WholesaleOrder {
  id: string;
  display_id?: string;
  total: number;
  currency_code?: string;
  status: string;
  payment_status?: string;
  created_at: string;
  metadata?: {
    po_number?: string;
    payment_terms?: string;
  };
}

export default function WholesaleDashboardPage() {
  const { customer, loading } = useAuth();
  const { wholesaleInfo, loading: wholesaleLoading } = useWholesale();
  const router = useRouter();
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    api
      .getCustomerOrders()
      .then((data) => {
        setOrders(data?.orders || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setOrdersLoading(false);
      });
  }, []);

  if (loading || wholesaleLoading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!wholesaleInfo?.hasWholesaleAccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Building2 size={48} className="mx-auto text-stone-400 mb-4" />
          <h2 className="text-xl font-serif text-stone-900 mb-2">
            No Wholesale Access
          </h2>
          <p className="text-stone-600 mb-6">
            You don&apos;t have wholesale access yet. Apply for a wholesale
            account to get started.
          </p>
          <Link
            href="/wholesale"
            className="inline-block bg-stone-900 text-white px-6 py-3 text-sm font-medium tracking-wider uppercase hover:bg-stone-800 transition-colors"
          >
            Apply for Wholesale
          </Link>
        </div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    starter: 'bg-blue-50 text-blue-700 border-blue-200',
    growth: 'bg-green-50 text-green-700 border-green-200',
    enterprise: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const tierColor =
    tierColors[wholesaleInfo.tier || ''] ||
    'bg-stone-50 text-stone-700 border-stone-200';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Account
          </Link>
        </div>

        <h1 className="text-2xl font-serif text-stone-900 mb-8">
          Wholesale Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Tag size={20} className="text-stone-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Your Tier
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border ${tierColor}`}
              >
                {wholesaleInfo.tier || 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={20} className="text-stone-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Discount
              </span>
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {wholesaleInfo.discountPercent}%
            </p>
            <p className="text-xs text-stone-500 mt-1">Off retail prices</p>
          </div>

          <div className="bg-white border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={20} className="text-stone-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Company
              </span>
            </div>
            <p className="text-lg font-medium text-stone-900">
              {wholesaleInfo.companyName || 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-stone-200">
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900 flex items-center gap-2">
                <Package size={16} /> Recent Orders
              </h2>
              <Link
                href="/account/orders"
                className="text-xs text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wider"
              >
                View All
              </Link>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-stone-900 mx-auto"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <p>No orders yet</p>
              <Link
                href="/collections"
                className="text-stone-900 underline text-sm mt-2 inline-block"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        Order #{order.display_id || order.id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-stone-400" />
                        <span className="text-xs text-stone-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {order.metadata?.po_number && (
                          <span className="text-xs text-stone-400">
                            PO: {order.metadata.po_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-stone-900">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: order.currency_code?.toUpperCase() || 'INR',
                      }).format(order.total / 100)}
                    </p>
                    <span
                      className={`text-xs uppercase tracking-wider ${order.status === 'completed' ? 'text-green-600' : order.status === 'canceled' ? 'text-red-600' : 'text-yellow-600'}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
