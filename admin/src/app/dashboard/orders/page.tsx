'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

type OrderFilter =
  | 'all'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  status: string;
  email: string;
  total: number;
  currency_code: string;
  customer_id: string | null;
  customer_first_name: string | null;
  customer_last_name: string | null;
  created_at: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  avg_order_value: number;
}

const filters: Array<{ label: string; value: OrderFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 20;
      const offset = (page - 1) * limit;
      const data = await api.getOrders(limit, offset, search, statusFilter);
      setOrders(data?.orders || data || []);
      setTotalPages(data?.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getOrderStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to load order stats:', error);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getCustomerName = (order: Order) =>
    order.customer_first_name && order.customer_last_name
      ? `${order.customer_first_name} ${order.customer_last_name}`
      : 'Guest customer';

  const toggleOrderSelection = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedOrders(next);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
      return;
    }
    setSelectedOrders(new Set(orders.map((order) => order.id)));
  };

  const handleBulkStatusUpdate = async (nextStatus: OrderFilter) => {
    if (selectedOrders.size === 0 || nextStatus === 'all') {
      return;
    }

    try {
      await api.updateOrdersBulk(Array.from(selectedOrders), nextStatus);
      setSelectedOrders(new Set());
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleSingleStatusUpdate = async (orderId: string, nextStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.exportOrders(search, statusFilter);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Delete order #${orderNumber}?`)) {
      return;
    }

    try {
      await api.deleteOrder(id);
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const filterOptions = filters.map((filter) => ({
    ...filter,
    count:
      {
        all: stats?.total_orders,
        pending: stats?.pending_orders,
        processing: stats?.processing_orders,
        shipped: stats?.shipped_orders,
        delivered: stats?.delivered_orders,
        cancelled: stats?.cancelled_orders,
      }[filter.value] || 0,
  }));

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description="Filter the queue, update fulfillment states, export reports, and jump into each order’s full detail."
        actions={
          <>
            <ActionButton onClick={() => void Promise.all([fetchOrders(), fetchStats()])} icon={RefreshCw} variant="secondary">
              Refresh
            </ActionButton>
            <ActionButton onClick={handleExport} icon={Download}>
              Export CSV
            </ActionButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total orders"
          value={stats?.total_orders || 0}
          icon={ShoppingBag}
          hint="Across every status"
        />
        <MetricCard
          label="Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          icon={ShoppingBag}
          hint="All processed order value"
          tone="accent"
        />
        <MetricCard
          label="Pending"
          value={stats?.pending_orders || 0}
          icon={ShoppingBag}
          hint="Needs immediate attention"
          tone={(stats?.pending_orders || 0) > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Average order value"
          value={formatCurrency(stats?.avg_order_value || 0)}
          icon={ShoppingBag}
          hint="Based on completed revenue"
        />
      </div>

      <Surface className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <SegmentedTabs
            value={statusFilter}
            options={filterOptions}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
              />
              <input
                type="search"
                placeholder="Search by order ID or customer name"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full border px-11 py-3 text-sm"
              />
            </div>

            {selectedOrders.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(['processing', 'shipped', 'delivered', 'cancelled'] as const).map(
                  (nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => void handleBulkStatusUpdate(nextStatus)}
                      className="rounded-full border border-[var(--kv-border)] bg-white px-4 py-2 text-sm font-medium capitalize text-[var(--kv-text)]"
                    >
                      Mark {nextStatus}
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--kv-border)] text-left text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                    onChange={toggleAllOrders}
                    className="h-4 w-4 rounded border-[var(--kv-border)]"
                  />
                </th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                  >
                    Loading orders…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                  >
                    No orders match the current filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--kv-border)]/70 align-top text-sm text-[var(--kv-text)]"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="h-4 w-4 rounded border-[var(--kv-border)]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-semibold text-[var(--kv-text)] hover:text-[var(--kv-accent-deep)]"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{getCustomerName(order)}</p>
                      <p className="mt-1 text-xs text-[var(--kv-muted)]">
                        {order.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(order.total, order.currency_code || 'USD')}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-[var(--kv-muted)]">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={order.status}
                          onChange={(event) =>
                            void handleSingleStatusUpdate(order.id, event.target.value)
                          }
                          className="border px-3 py-2 text-xs"
                        >
                          {filters
                            .filter((filter) => filter.value !== 'all')
                            .map((filter) => (
                              <option key={filter.value} value={filter.value}>
                                {filter.label}
                              </option>
                            ))}
                        </select>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="rounded-full border border-[var(--kv-border)] px-3 py-2 text-xs font-semibold text-[var(--kv-text)]"
                        >
                          View details
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDeleteOrder(order.id, order.order_number)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 text-[var(--kv-danger)]"
                          aria-label={`Delete order ${order.order_number}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
              No orders match the current filters.
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-[1.25rem] border border-[var(--kv-border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-sm font-semibold text-[var(--kv-text)]"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--kv-muted)]">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">
                      {getCustomerName(order)}
                    </p>
                    <p className="text-[var(--kv-muted)]">{order.email}</p>
                  </div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {formatCurrency(order.total, order.currency_code || 'USD')}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="flex-1 rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--kv-text)]"
                  >
                    View details
                  </Link>
                  <select
                    value={order.status}
                    onChange={(event) =>
                      void handleSingleStatusUpdate(order.id, event.target.value)
                    }
                    className="min-w-[130px] border px-3 py-3 text-sm"
                  >
                    {filters
                      .filter((filter) => filter.value !== 'all')
                      .map((filter) => (
                        <option key={filter.value} value={filter.value}>
                          {filter.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[var(--kv-border)] px-4 py-4 text-sm md:px-6">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-full border border-[var(--kv-border)] px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[var(--kv-muted)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="rounded-full border border-[var(--kv-border)] px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </Surface>
    </div>
  );
}
