'use client';

import { useEffect, useState } from 'react';
import {
  BarChart2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  MetricCard,
  PageHeader,
  SectionHeader,
  Surface,
} from '@/components/ui/admin-ui';

interface SalesPoint {
  date: string;
  sales?: number;
  revenue?: number;
  orders?: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface AnalyticsOverview {
  total_sales?: number;
  total_orders?: number;
  average_order_value?: number;
  total_customers?: number;
}

interface CustomerOverview {
  total_customers?: number;
  new_this_month?: number;
}

interface ProductPreview {
  id: string;
  title: string;
  thumbnail: string | null;
  total_inventory: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<SalesPoint[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<SalesPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusPoint[]>([]);
  const [productPreview, setProductPreview] = useState<ProductPreview[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerOverview | null>(
    null
  );

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [overviewData, weeklyData, monthlyData, statuses, products, customers] =
          await Promise.all([
            api.getAnalyticsOverview(),
            api.getSalesTrend(7),
            api.getSalesTrend(30),
            api.getOrdersByStatus(),
            api.getProducts(5, 0, '', 'published'),
            api.getCustomerStats(),
          ]);

        setOverview(overviewData || null);
        setWeeklyTrend(Array.isArray(weeklyData) ? weeklyData : []);
        setMonthlyTrend(Array.isArray(monthlyData) ? monthlyData : []);
        setStatusBreakdown(Array.isArray(statuses) ? statuses : []);
        setProductPreview(products?.data || products || []);
        setCustomerStats(customers || null);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const weekRevenue = weeklyTrend.reduce(
    (sum, point) => sum + (point.sales || point.revenue || 0),
    0
  );
  const monthRevenue = monthlyTrend.reduce(
    (sum, point) => sum + (point.sales || point.revenue || 0),
    0
  );
  const weekOrders = weeklyTrend.reduce((sum, point) => sum + (point.orders || 0), 0);
  const totalStatusOrders = statusBreakdown.reduce(
    (sum, point) => sum + point.count,
    0
  );

  const palette = ['#c97d4e', '#d4860b', '#4f7cac', '#2d7a4f', '#c0392b', '#6b6560'];

  const donutStops = statusBreakdown.reduce<string[]>(
    (segments, point, index) => {
      const start =
        statusBreakdown
          .slice(0, index)
          .reduce((sum, current) => sum + current.count, 0) / totalStatusOrders;
      const end =
        statusBreakdown
          .slice(0, index + 1)
          .reduce((sum, current) => sum + current.count, 0) / totalStatusOrders;
      segments.push(
        `${palette[index % palette.length]} ${start * 100}% ${end * 100}%`
      );
      return segments;
    },
    []
  );

  const maxTrendValue =
    Math.max(
      ...monthlyTrend.map((point) => point.sales || point.revenue || 0),
      1
    ) || 1;

  if (loading) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Performance"
          title="Analytics"
          description="Loading your revenue and order trends."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Revenue, status mix, recent customer momentum, and a clear view into what the current backend can measure today."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue this week"
          value={formatCurrency(weekRevenue)}
          icon={DollarSign}
          hint={`${weekOrders} orders in the last 7 days`}
          tone="accent"
        />
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(monthRevenue)}
          icon={BarChart2}
          hint="Trailing 30 days"
        />
        <MetricCard
          label="All-time revenue"
          value={formatCurrency(overview?.total_sales || 0)}
          icon={TrendingUp}
          hint={`${overview?.total_orders || 0} total orders`}
          tone="success"
        />
        <MetricCard
          label="Recent customers"
          value={customerStats?.new_this_month || 0}
          icon={Users}
          hint={`${customerStats?.total_customers || 0} total customers`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface className="p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                Sales trend
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--kv-text)]">
                Revenue over the last 30 days
              </h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]">
              <TrendingUp size={18} />
            </span>
          </div>

          <div className="mt-8 flex h-60 items-end gap-2">
            {monthlyTrend.map((point) => {
              const value = point.sales || point.revenue || 0;
              const height = Math.max((value / maxTrendValue) * 100, 8);
              return (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end rounded-2xl bg-[var(--kv-soft)] p-1.5">
                    <div
                      className="w-full rounded-[1rem] bg-[linear-gradient(180deg,#dca17c_0%,#c97d4e_100%)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--kv-muted)]">
                    {new Date(point.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </Surface>

        <Surface className="p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                Status mix
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--kv-text)]">
                Orders by status
              </h2>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
              <ShoppingBag size={18} />
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            <div
              className="relative h-48 w-48 rounded-full"
              style={{
                background:
                  totalStatusOrders > 0
                    ? `conic-gradient(${donutStops.join(', ')})`
                    : 'conic-gradient(#e8e3dc 0% 100%)',
              }}
            >
              <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-white text-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--kv-muted)]">
                    Orders
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                    {totalStatusOrders}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              {statusBreakdown.map((point, index) => (
                <div
                  key={point.status}
                  className="flex items-center justify-between rounded-[1rem] bg-[var(--kv-soft)] px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: palette[index % palette.length] }}
                    />
                    <span className="font-medium capitalize text-[var(--kv-text)]">
                      {point.status}
                    </span>
                  </div>
                  <span className="font-semibold text-[var(--kv-text)]">
                    {point.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="overflow-hidden">
          <SectionHeader
            title="Catalog spotlight"
            description="Using recent published products until a top-selling-products API is available."
          />
          <div className="space-y-3 p-5 md:p-6">
            {productPreview.length === 0 ? (
              <p className="text-sm text-[var(--kv-muted)]">
                No published products available for preview.
              </p>
            ) : (
              productPreview.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-[1.2rem] border border-[var(--kv-border)] bg-white px-4 py-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-sm font-semibold text-[var(--kv-accent-deep)]">
                    {index + 1}
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--kv-soft)]">
                    {product.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PackageFallback />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--kv-text)]">
                      {product.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--kv-muted)]">
                      Inventory {product.total_inventory}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface className="p-5 md:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                Customer momentum
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--kv-text)]">
                Growth snapshot
              </h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                  Total customers
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                  {customerStats?.total_customers || 0}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                  New this month
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                  {customerStats?.new_this_month || 0}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                  Average order value
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                  {formatCurrency(overview?.average_order_value || 0)}
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function PackageFallback() {
  return <ShoppingBag size={18} className="text-[var(--kv-muted)]" />;
}
