'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { OrderWithDetails } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { OrdersListSkeleton } from '@/components/ui/Skeleton';
import { getOrderStatusBadgeClass, getOrderStatusConfig } from '@/lib/order-status';

const ORDERS_PER_PAGE = 10;

export default function OrdersListPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [loading, customer, router]);

  useEffect(() => {
    // Wait until auth is resolved and customer exists
    if (loading || !customer) {
      return;
    }

    api
      .getCustomerOrders()
      .then((data) => {
        setOrders(data.orders || []);
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setOrdersLoading(false);
      });
  }, [customer, loading]);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(
    startIndex,
    startIndex + ORDERS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of orders list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || !customer) return <OrdersListSkeleton />;

  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="account-muted flex items-center gap-2 transition-colors hover:text-stone-900"
          >
            <ChevronLeft size={20} />
            <span>Back to Account</span>
          </Link>
        </div>

        <h1 className="account-page-title mb-8">My Orders</h1>

        {/* Orders List */}
        <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
          {ordersLoading ? (
            <div className="divide-y divide-stone-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-stone-200 animate-pulse rounded" />
                    <div className="h-3 w-24 bg-stone-200 animate-pulse rounded" />
                  </div>
                  <div className="h-8 w-24 bg-stone-200 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="account-empty-copy mb-4">No orders yet</p>
              <Link
                href="/"
                className="account-primary-action inline-block bg-stone-900 px-6 py-3 transition-colors hover:bg-stone-800"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-stone-100">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="account-name hover:text-stone-600"
                      >
                        Order #{order.display_id}
                      </Link>
                      <p className="account-muted mt-1">
                        {new Date(order.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </p>
                      <p className="account-caption mt-1">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="account-name">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: order.currency_code?.toUpperCase() || 'INR',
                        }).format(order.total / 100)}
                      </span>
                      <span
                        className={`account-status-badge px-3 py-1 ${getOrderStatusBadgeClass(order.status)}`}
                      >
                        {getOrderStatusConfig(order.status).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between">
                  <p className="account-muted">
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + ORDERS_PER_PAGE, orders.length)} of{' '}
                    {orders.length} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`account-page-button h-10 w-10 transition-colors ${
                            currentPage === page
                              ? 'bg-stone-900 text-white'
                              : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
