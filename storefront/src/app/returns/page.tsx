'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { storefrontTrust } from '@/config/storefront-trust';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

type CustomerReturn = {
  id: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | string;
  refund_amount?: number | null;
  admin_notes?: string | null;
  created_at: string;
};

type CustomerOrder = {
  id: string;
  display_id: string;
  status: string;
  raw_status?: string | null;
  created_at: string;
  total: number;
  currency_code?: string | null;
};

function getReturnStatusClasses(status: string) {
  switch (status) {
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'refunded':
      return 'border-stone-200 bg-stone-900 text-white';
    case 'rejected':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

export default function ReturnsPage() {
  const { customer, loading } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [returns, setReturns] = useState<CustomerReturn[]>([]);

  useEffect(() => {
    if (loading || !customer) {
      return;
    }

    Promise.all([api.getCustomerOrders(), api.getCustomerReturns()])
      .then(([ordersData, returnsData]) => {
        setOrders(ordersData.orders || []);
        setReturns(returnsData.returns || []);
      })
      .catch(() => {
        setOrders([]);
        setReturns([]);
      });
  }, [customer, loading]);

  const eligibleOrders = useMemo(() => {
    const returnOrderIds = new Set(returns.map((item) => item.order_id));
    return orders.filter(
      (order) =>
        (order.status === 'delivered' || order.raw_status === 'completed') &&
        !returnOrderIds.has(order.id)
    );
  }, [orders, returns]);

  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
        <div className="mb-12 text-center">
          <span className="text-body-xs type-bold uppercase tracking-token-wider text-stone-500">
            Returns Support
          </span>
          <h1 className="mt-4 text-display-xl font-serif text-stone-900">
            Returns, Refunds, and Exchanges
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-stone-600">
            Use this page before or after purchase to understand how Kvastram
            handles eligible return, refund, and cancellation requests.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              Before delivery
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              If your order has not shipped yet, contact support as early as
              possible for cancellation help.
            </p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              After delivery
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              Returns and refunds depend on item condition, product type, and
              policy eligibility. Keep the product unworn and in original
              packaging.
            </p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-6">
            <h2 className="text-body-lg type-semibold text-stone-900">
              Need a response?
            </h2>
            <p className="mt-3 text-body-sm text-stone-600">
              Include your order reference, email, and reason for the request
              when you contact support.
            </p>
          </div>
        </div>

        <div className="mt-12 border border-stone-200 p-8">
          <h2 className="text-display-sm font-serif text-stone-900">
            How to start a request
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-body-md text-stone-700">
            <li>Keep your order number ready.</li>
            <li>Review the refund policy before opening a request.</li>
            <li>Contact support with your order details and product issue.</li>
            <li>Wait for eligibility confirmation before sending anything back.</li>
          </ol>
        </div>

        <div className="mt-12 border border-stone-200 p-8">
          <h2 className="text-display-sm font-serif text-stone-900">
            Self-serve returns
          </h2>
          <p className="mt-3 text-body-md text-stone-600">
            Signed-in customers can track existing return requests and open an
            eligible delivered order to request a new return.
          </p>

          {loading ? (
            <p className="mt-6 text-body-sm text-stone-500">
              Loading your return activity...
            </p>
          ) : !customer ? (
            <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-6">
              <p className="text-body-sm text-stone-700">
                Sign in to view your return requests and open eligible delivered
                orders without contacting support first.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="bg-stone-900 px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/account/orders"
                  className="border border-stone-300 px-5 py-3 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
                >
                  My Orders
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <div>
                <h3 className="text-body-lg type-semibold text-stone-900">
                  Your return requests
                </h3>
                {returns.length > 0 ? (
                  <div className="mt-4 grid gap-4">
                    {returns
                      .slice()
                      .reverse()
                      .map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-stone-200 p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-body-sm type-semibold text-stone-900">
                                Return for order #{item.order_id.slice(0, 8)}
                              </p>
                              <p className="mt-1 text-body-xs text-stone-500">
                                Submitted{' '}
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-body-xs type-bold uppercase tracking-token-wider ${getReturnStatusClasses(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-3 text-body-sm text-stone-700">
                            {item.reason}
                          </p>
                          {item.admin_notes ? (
                            <p className="mt-2 text-body-sm text-stone-500">
                              Team note: {item.admin_notes}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                              href={`/account/orders/${item.order_id}`}
                              className="border border-stone-300 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
                            >
                              View Order
                            </Link>
                            <Link
                              href={`${storefrontTrust.policyRoutes.contact}?reason=returns&order=${item.order_id}`}
                              className="border border-stone-300 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
                            >
                              Contact Support
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="mt-4 text-body-sm text-stone-500">
                    No return requests yet.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-body-lg type-semibold text-stone-900">
                  Eligible delivered orders
                </h3>
                {eligibleOrders.length > 0 ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {eligibleOrders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-stone-200 bg-stone-50 p-5"
                      >
                        <p className="text-body-sm type-semibold text-stone-900">
                          Order #{order.display_id}
                        </p>
                        <p className="mt-1 text-body-xs text-stone-500">
                          Delivered order placed{' '}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="bg-stone-900 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
                          >
                            Open Order
                          </Link>
                          <Link
                            href={storefrontTrust.policyRoutes.refundPolicy}
                            className="border border-stone-300 px-4 py-2 text-body-xs type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-white"
                          >
                            Review Policy
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-body-sm text-stone-500">
                    We could not find a delivered order that is still awaiting a
                    return request.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Link
            href={storefrontTrust.policyRoutes.help}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Help Center
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.refundPolicy}
            className="border border-stone-300 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-stone-900 transition-colors hover:bg-stone-50"
          >
            Read Refund Policy
          </Link>
          <Link
            href={`${storefrontTrust.policyRoutes.contact}?reason=returns`}
            className="bg-stone-900 px-6 py-4 text-center text-body-sm type-bold uppercase tracking-token-wider text-white transition-colors hover:bg-stone-800"
          >
            Contact Support
          </Link>
        </div>

        <p className="mt-8 text-body-sm text-stone-500">
          Support email: {storefrontTrust.supportEmail} | Phone/WhatsApp:{' '}
          {storefrontTrust.supportPhone}
        </p>
      </div>
    </div>
  );
}
