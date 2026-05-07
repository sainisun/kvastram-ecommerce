'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  Truck,
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

type FulfillmentTab =
  | 'new'
  | 'due_today'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'issues';

interface FulfillmentOrder {
  id: string;
  order_number: string;
  status: string;
  email: string;
  total: number;
  currency_code?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  created_at: string;
  tracking_number?: string | null;
  workflow?: {
    ship_by_date?: string | null;
    has_tracking?: boolean;
    needs_attention?: boolean;
    overdue_ship_by?: boolean;
    overdue_tracking?: boolean;
  };
}

interface FulfillmentMetrics {
  due_today: number;
  overdue: number;
  missing_tracking: number;
  delivered_awaiting_followup: number;
  delayed_orders: number;
  packaging_incomplete: number;
  tracking_coverage_percent: number;
  on_time_shipping_percent: number;
  average_processing_hours: number;
  alerts: Array<{
    key: string;
    label: string;
    count: number;
    severity: 'info' | 'warning' | 'danger';
  }>;
}

const tabLabels: Record<FulfillmentTab, string> = {
  new: 'New',
  due_today: 'Due Today',
  ready: 'Ready to Ship',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  issues: 'Issues',
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function customerName(order: FulfillmentOrder) {
  return order.customer_first_name && order.customer_last_name
    ? `${order.customer_first_name} ${order.customer_last_name}`
    : 'Guest customer';
}

function isDueToday(order: FulfillmentOrder) {
  const shipBy = parseDate(order.workflow?.ship_by_date);
  if (!shipBy) return false;
  return shipBy >= startOfToday() && shipBy <= endOfToday();
}

function isOverdue(order: FulfillmentOrder) {
  const shipBy = parseDate(order.workflow?.ship_by_date);
  if (!shipBy) return false;
  return shipBy < startOfToday() && ['pending', 'processing'].includes(order.status);
}

function belongsToTab(order: FulfillmentOrder, tab: FulfillmentTab) {
  const status = order.status.toLowerCase();
  const hasIssue =
    order.workflow?.needs_attention ||
    order.workflow?.overdue_ship_by ||
    order.workflow?.overdue_tracking ||
    isOverdue(order) ||
    status === 'cancelled' ||
    status === 'refunded';

  if (tab === 'issues') return !!hasIssue;
  if (tab === 'due_today') return isDueToday(order) && ['pending', 'processing'].includes(status);
  if (tab === 'new') return status === 'pending';
  if (tab === 'ready') return status === 'processing';
  if (tab === 'in_transit') return status === 'shipped';
  if (tab === 'delivered') return status === 'delivered';
  return false;
}

function nextAction(order: FulfillmentOrder) {
  const status = order.status.toLowerCase();
  if (status === 'pending') return 'Start processing';
  if (status === 'processing') return order.workflow?.has_tracking ? 'Review shipment' : 'Add tracking';
  if (status === 'shipped') return 'Track package';
  if (status === 'delivered') return 'Follow up';
  return 'Review order';
}

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [metrics, setMetrics] = useState<FulfillmentMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<FulfillmentTab>('new');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const [data, fulfillmentMetrics] = await Promise.all([
        api.getOrders(200, 0, '', 'all'),
        api.getFulfillmentMetrics(),
      ]);
      setOrders(data?.orders || data || []);
      setMetrics(fulfillmentMetrics || null);
    } catch (error) {
      console.error('Failed to fetch fulfillment queue:', error);
      setOrders([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const next: Record<FulfillmentTab, number> = {
      new: 0,
      due_today: 0,
      ready: 0,
      in_transit: 0,
      delivered: 0,
      issues: 0,
    };

    orders.forEach((order) => {
      (Object.keys(next) as FulfillmentTab[]).forEach((tab) => {
        if (belongsToTab(order, tab)) next[tab] += 1;
      });
    });

    return next;
  }, [orders]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => belongsToTab(order, activeTab)),
    [activeTab, orders]
  );

  const overdueCount = orders.filter(isOverdue).length;
  const missingTrackingCount = orders.filter(
    (order) => order.status === 'processing' && !order.workflow?.has_tracking
  ).length;
  const dueTodayCount = metrics?.due_today ?? counts.due_today;
  const overdueMetric = metrics?.overdue ?? overdueCount;
  const missingTrackingMetric =
    metrics?.missing_tracking ?? missingTrackingCount;

  return (
    <div className="space-y-6 px-4 pb-8 md:px-8">
      <PageHeader
        eyebrow="Fulfillment"
        title="Fulfillment Workspace"
        description="Scan the active post-order queue, catch overdue work, and move orders toward shipment without hunting through every order."
        actions={
          <ActionButton onClick={() => void fetchOrders()} icon={RefreshCw} variant="secondary">
            Refresh
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Due today"
          value={dueTodayCount}
          icon={CalendarDays}
          hint="Pending or processing orders with today's ship-by date."
          tone={dueTodayCount > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Overdue"
          value={overdueMetric}
          icon={AlertTriangle}
          hint="Ship-by date has passed."
          tone={overdueMetric > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          label="Missing tracking"
          value={missingTrackingMetric}
          icon={Truck}
          hint="Processing orders still need tracking details."
          tone={missingTrackingMetric > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="In transit"
          value={counts.in_transit}
          icon={PackageCheck}
          hint="Shipped orders awaiting delivery."
          tone="accent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Delivered follow-up"
          value={metrics?.delivered_awaiting_followup ?? 0}
          icon={MessageSquare}
          hint="Delivered orders that still need a buyer follow-up."
          tone={(metrics?.delivered_awaiting_followup ?? 0) > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Packaging incomplete"
          value={metrics?.packaging_incomplete ?? 0}
          icon={PackageCheck}
          hint="Processing orders missing personal-brand pack-out checks."
          tone={(metrics?.packaging_incomplete ?? 0) > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Tracking coverage"
          value={`${metrics?.tracking_coverage_percent ?? 0}%`}
          icon={Gauge}
          hint="Share of active non-cancelled orders that reached shipment."
          tone="accent"
        />
        <MetricCard
          label="On-time shipping"
          value={`${metrics?.on_time_shipping_percent ?? 0}%`}
          icon={BarChart3}
          hint="Orders shipped on or before their ship-by date."
          tone="accent"
        />
      </div>

      <Surface className="overflow-hidden">
        <div className="grid gap-4 px-5 py-5 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Processing time
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--kv-text)]">
                  {metrics?.average_processing_hours ?? 0}h
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
              Automation alerts
            </p>
            {metrics?.alerts?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {metrics.alerts.map((alert) => (
                  <div
                    key={alert.key}
                    className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--kv-text)]">
                        {alert.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          alert.severity === 'danger'
                            ? 'bg-[var(--kv-danger)]/10 text-[var(--kv-danger)]'
                            : alert.severity === 'warning'
                              ? 'bg-[var(--kv-warning)]/15 text-[var(--kv-text)]'
                              : 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                        }`}
                      >
                        {alert.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                No automation alerts right now.
              </p>
            )}
          </div>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-[var(--kv-border)] px-5 py-4 md:px-6">
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            options={(Object.keys(tabLabels) as FulfillmentTab[]).map((tab) => ({
              label: tabLabels[tab],
              value: tab,
              count: counts[tab],
            }))}
          />
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--kv-border)] bg-[var(--kv-soft)]/70">
                {['Order', 'Customer', 'Status', 'Ship By', 'Tracking', 'Total', 'Action'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[var(--kv-muted)]">
                    Loading fulfillment queue.
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[var(--kv-muted)]">
                    This queue is clear.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--kv-border)]/70 hover:bg-[var(--kv-soft)]/45"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-semibold text-[var(--kv-text)] hover:text-[var(--kv-accent-deep)]"
                      >
                        #{order.order_number}
                      </Link>
                      {isOverdue(order) ? (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kv-danger)]">
                          Overdue
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[var(--kv-text)]">{customerName(order)}</p>
                      <p className="mt-1 text-xs text-[var(--kv-muted)]">{order.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--kv-text)]">
                      {formatDate(order.workflow?.ship_by_date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--kv-text)]">
                        {order.workflow?.has_tracking ? (
                          <CheckCircle2 size={16} className="text-[var(--kv-success)]" />
                        ) : (
                          <Clock3 size={16} className="text-[var(--kv-warning)]" />
                        )}
                        {order.workflow?.has_tracking ? 'Added' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--kv-text)]">
                      {formatCurrency(order.total, order.currency_code || 'INR')}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex min-w-32 justify-center rounded-2xl bg-[var(--kv-text)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--kv-accent-deep)]"
                      >
                        {nextAction(order)}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[var(--kv-border)] md:hidden">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--kv-muted)]">
              Loading fulfillment queue.
            </p>
          ) : visibleOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--kv-muted)]">
              This queue is clear.
            </p>
          ) : (
            visibleOrders.map((order) => (
              <div key={order.id} className="space-y-3 px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-sm font-semibold text-[var(--kv-text)]"
                    >
                      #{order.order_number}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--kv-muted)]">{customerName(order)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.16em] text-[var(--kv-muted)]">
                      Ship by
                    </p>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {formatDate(order.workflow?.ship_by_date)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-[0.16em] text-[var(--kv-muted)]">
                      Tracking
                    </p>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {order.workflow?.has_tracking ? 'Added' : 'Pending'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="inline-flex w-full justify-center rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white"
                >
                  {nextAction(order)}
                </Link>
              </div>
            ))
          )}
        </div>
      </Surface>
    </div>
  );
}
