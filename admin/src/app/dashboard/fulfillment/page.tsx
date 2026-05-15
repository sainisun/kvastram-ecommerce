'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Gauge,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  PageHeader,
  SegmentedTabs,
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
  issue_refund_rate_percent: number;
  repeat_after_followup_percent: number;
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
  const fullName = [order.customer_first_name, order.customer_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || 'Guest customer';
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

function getOrdersHref(tab: FulfillmentTab) {
  if (tab === 'due_today') {
    return '/dashboard/orders?queue=open&open_filter=due_today';
  }
  if (tab === 'new') {
    return '/dashboard/orders?queue=open&open_filter=new';
  }
  if (tab === 'ready') {
    return '/dashboard/orders?queue=open&open_filter=ready_to_ship';
  }
  if (tab === 'in_transit') {
    return '/dashboard/orders?queue=completed&status=shipped';
  }
  if (tab === 'delivered') {
    return '/dashboard/orders?queue=completed&status=delivered';
  }
  return '/dashboard/orders?queue=issues';
}

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [metrics, setMetrics] = useState<FulfillmentMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<FulfillmentTab>('new');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const [firstPage, fulfillmentMetrics] = await Promise.all([
        api.getOrders(200, 0, '', 'all'),
        api.getFulfillmentMetrics(),
      ]);
      let allOrders: FulfillmentOrder[] = firstPage?.orders || firstPage || [];
      const totalPages = firstPage?.pagination?.total_pages || 1;

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.getOrders(200, (index + 1) * 200, '', 'all')
          )
        );
        allOrders = [
          ...allOrders,
          ...remainingPages.flatMap((page) => page?.orders || page || []),
        ];
      }

      setOrders(allOrders);
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
  const openQueueCount = orders.filter((order) =>
    ['pending', 'processing'].includes(order.status.toLowerCase())
  ).length;

  return (
    <div className="space-y-6 px-4 pb-8 md:px-8">
      <PageHeader
        eyebrow="Fulfillment Analytics"
        title="Fulfillment Analytics"
        description="Keep this page for overdue work, coverage, and alerts. The live shipment workflow now belongs in Orders & Shipping."
        actions={
          <>
            <ActionButton href="/dashboard/orders" icon={ShoppingBag}>
              Open Orders & Shipping
            </ActionButton>
            <ActionButton
              onClick={() => void fetchOrders()}
              icon={RefreshCw}
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </>
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
          hint="Shipped or delivered orders that have tracking attached."
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Issue/refund rate"
          value={`${metrics?.issue_refund_rate_percent ?? 0}%`}
          icon={AlertTriangle}
          hint="Share of orders cancelled or refunded."
          tone={(metrics?.issue_refund_rate_percent ?? 0) > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Repeat after follow-up"
          value={`${metrics?.repeat_after_followup_percent ?? 0}%`}
          icon={MessageSquare}
          hint="Delivered follow-ups that were followed by another order."
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
        <div className="border-b border-[var(--kv-border)] px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                Workflow location
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                Complete shipping work happens in Orders & Shipping
              </h2>
              <p className="mt-2 text-sm text-[var(--kv-muted)]">
                Tracking link, no-tracking reason, complete order, add package, edit
                tracking, and label actions are all on the orders queue and the order detail.
                This page stays focused on monitoring and workload slices.
              </p>
            </div>
            <ActionButton href={getOrdersHref(activeTab)} icon={ArrowRight}>
              Open this queue in Orders
            </ActionButton>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            options={(Object.keys(tabLabels) as FulfillmentTab[]).map((tab) => ({
              label: tabLabels[tab],
              value: tab,
              count: counts[tab],
            }))}
          />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.1rem] border border-[var(--kv-border)] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                Current bucket
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-[var(--kv-text)]">
                    {tabLabels[activeTab]}
                  </p>
                  <p className="mt-1 text-sm text-[var(--kv-muted)]">
                    {counts[activeTab]} order{counts[activeTab] === 1 ? '' : 's'} in this slice.
                  </p>
                </div>
                <Link
                  href={getOrdersHref(activeTab)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
                >
                  Work this queue
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                    Loading fulfillment slice.
                  </p>
                ) : visibleOrders.length === 0 ? (
                  <p className="rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                    No orders are sitting in this slice right now.
                  </p>
                ) : (
                  visibleOrders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/dashboard/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--kv-border)] px-4 py-3 hover:bg-[var(--kv-soft)]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--kv-text)]">
                          #{order.order_number}
                        </p>
                        <p className="mt-1 text-xs text-[var(--kv-muted)]">
                          {customerName(order)} · {formatDate(order.workflow?.ship_by_date)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                        {nextAction(order)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-[var(--kv-border)] bg-[var(--kv-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                What belongs here
              </p>
              <div className="mt-3 space-y-3 text-sm text-[var(--kv-muted)]">
                <p>Use this page to monitor overdue work, coverage, and alerts.</p>
                <p>
                  Use Orders &amp; Shipping to actually fill tracking, mark no-tracking,
                  complete orders, buy labels, or add packages.
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/dashboard/orders?queue=open&open_filter=all"
                  className="flex items-center justify-between rounded-[1rem] bg-white px-4 py-3 text-sm font-medium text-[var(--kv-text)]"
                >
                  <span>Open queue</span>
                  <span>{openQueueCount}</span>
                </Link>
                <Link
                  href="/dashboard/orders?queue=completed"
                  className="flex items-center justify-between rounded-[1rem] bg-white px-4 py-3 text-sm font-medium text-[var(--kv-text)]"
                >
                  <span>Completed shipments</span>
                  <span>{counts.in_transit + counts.delivered}</span>
                </Link>
                <Link
                  href="/dashboard/orders?queue=issues"
                  className="flex items-center justify-between rounded-[1rem] bg-white px-4 py-3 text-sm font-medium text-[var(--kv-text)]"
                >
                  <span>Issues queue</span>
                  <span>{counts.issues}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
