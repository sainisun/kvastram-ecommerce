'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Image,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  MetricCard,
  PageHeader,
  QuickActionCard,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

interface DashboardStats {
  total_sales?: number;
  total_orders?: number;
  total_customers?: number;
  average_order_value?: number;
}

interface ProductStats {
  total_products: number;
  published_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

interface CustomerStats {
  total_customers: number;
  new_this_month: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency_code: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  email: string;
  created_at: string;
}

interface SalesPoint {
  date: string;
  sales?: number;
  revenue?: number;
  orders?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(
    null
  );
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesPoint[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [
          analyticsOverview,
          productOverview,
          customerOverview,
          ordersData,
          trendData,
          orderStatuses,
        ] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getProductStats(),
          api.getCustomerStats(),
          api.getOrders(10, 0),
          api.getSalesTrend(7),
          api.getOrdersByStatus(),
        ]);

        setAnalytics(analyticsOverview || null);
        setProductStats(productOverview || null);
        setCustomerStats(customerOverview || null);
        setRecentOrders(ordersData?.orders || ordersData || []);
        setSalesTrend(Array.isArray(trendData) ? trendData : []);

        const nextStatusCounts: Record<string, number> = {};
        (Array.isArray(orderStatuses) ? orderStatuses : []).forEach(
          (item: { status: string; count: number }) => {
            nextStatusCounts[item.status] = item.count;
          }
        );
        setStatusCounts(nextStatusCounts);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const monthRevenue =
    salesTrend.reduce(
      (sum, point) => sum + (point.sales || point.revenue || 0),
      0
    ) || analytics?.total_sales || 0;
  const monthOrders =
    salesTrend.reduce((sum, point) => sum + (point.orders || 0), 0) ||
    analytics?.total_orders ||
    0;
  const pendingOrders = statusCounts.pending || 0;

  const maxBarValue =
    Math.max(
      ...salesTrend.map((point) => point.sales || point.revenue || 0),
      1
    ) || 1;

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
    });

  if (loading) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Seller dashboard"
          title="Dashboard"
          description="Loading your store overview."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Seller dashboard"
        title="Dashboard"
        description="A warm, Etsy-inspired control room for orders, listings, customers, and the pieces of your storefront that change every day."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(monthRevenue)}
          icon={DollarSign}
          hint="Last 7 days trend below"
          tone="accent"
        />
        <MetricCard
          label="Orders this month"
          value={monthOrders}
          icon={ShoppingBag}
          hint="Across all fulfillment states"
        />
        <MetricCard
          label="Pending orders"
          value={pendingOrders}
          icon={Sparkles}
          hint="Needs review or fulfillment"
          tone={pendingOrders > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Active listings"
          value={productStats?.published_products || 0}
          icon={Package}
          hint={`${productStats?.total_products || 0} total products`}
          tone="success"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          title="Add new product"
          subtitle="Launch a fresh listing"
          href="/dashboard/products/new"
          icon={Package}
        />
        <QuickActionCard
          title="Review orders"
          subtitle="Check today’s queue"
          href="/dashboard/orders"
          icon={ShoppingBag}
        />
        <QuickActionCard
          title="Upload hero banner"
          subtitle="Refresh the homepage lead"
          href="/dashboard/content/hero-banners"
          icon={Image}
        />
        <QuickActionCard
          title="Add trending reel"
          subtitle="Promote a visual bestseller"
          href="/dashboard/content/trending-reels"
          icon={Video}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Surface className="overflow-hidden">
          <SectionHeader
            title="Recent orders"
            description="Your latest 10 customer purchases."
            actionHref="/dashboard/orders"
            actionLabel="View all"
          />

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--kv-border)] text-left text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                    >
                      No orders have come in yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="cursor-pointer border-b border-[var(--kv-border)]/70 text-sm text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)]/55"
                    >
                      <td className="px-6 py-4 font-semibold">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">
                            {order.customer_first_name && order.customer_last_name
                              ? `${order.customer_first_name} ${order.customer_last_name}`
                              : 'Guest customer'}
                          </p>
                          <p className="text-xs text-[var(--kv-muted)]">
                            {order.email}
                          </p>
                        </div>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {recentOrders.length === 0 ? (
              <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
                No orders yet.
              </p>
            ) : (
              recentOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="w-full rounded-[1.2rem] border border-[var(--kv-border)] bg-white p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--kv-text)]">
                        #{order.order_number}
                      </p>
                      <p className="mt-1 text-xs text-[var(--kv-muted)]">
                        {order.customer_first_name && order.customer_last_name
                          ? `${order.customer_first_name} ${order.customer_last_name}`
                          : order.email}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--kv-text)]">
                      {formatCurrency(order.total, order.currency_code || 'USD')}
                    </span>
                    <span className="text-[var(--kv-muted)]">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  Revenue mini chart
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--kv-text)]">
                  Last 7 days
                </h2>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]">
                <TrendingUp size={18} />
              </span>
            </div>

            <div className="mt-6 flex h-52 items-end gap-3">
              {salesTrend.map((point) => {
                const value = point.sales || point.revenue || 0;
                const height = Math.max((value / maxBarValue) * 100, 10);

                return (
                  <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end rounded-2xl bg-[var(--kv-soft)] p-1.5">
                      <div
                        className="w-full rounded-[1rem] bg-[linear-gradient(180deg,#dca17c_0%,#c97d4e_100%)]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--kv-muted)]">
                        {formatDate(point.date)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[var(--kv-text)]">
                        {formatCurrency(value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>

          <Surface className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  Shop snapshot
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--kv-text)]">
                  This week at a glance
                </h2>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                <Users size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-[var(--kv-soft)] px-4 py-3">
                <span className="text-sm text-[var(--kv-muted)]">Customers</span>
                <span className="text-sm font-semibold text-[var(--kv-text)]">
                  {customerStats?.total_customers || analytics?.total_customers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--kv-soft)] px-4 py-3">
                <span className="text-sm text-[var(--kv-muted)]">New this month</span>
                <span className="text-sm font-semibold text-[var(--kv-text)]">
                  {customerStats?.new_this_month || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--kv-soft)] px-4 py-3">
                <span className="text-sm text-[var(--kv-muted)]">
                  Average order value
                </span>
                <span className="text-sm font-semibold text-[var(--kv-text)]">
                  {formatCurrency(analytics?.average_order_value || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--kv-soft)] px-4 py-3">
                <span className="text-sm text-[var(--kv-muted)]">Inventory alerts</span>
                <span className="text-sm font-semibold text-[var(--kv-text)]">
                  {(productStats?.low_stock_products || 0) +
                    (productStats?.out_of_stock_products || 0)}
                </span>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
