'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
type OrderFilter = 'all' | WorkflowStatus;
type QueueTab = 'open' | 'completed' | 'issues';
type OpenFilter =
  | 'all'
  | 'new'
  | 'processing'
  | 'due_today'
  | 'ready_to_ship'
  | 'missing_tracking';
type SortOption = 'newest' | 'oldest' | 'ship_by' | 'destination';

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
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_country_code?: string | null;
  workflow?: {
    status?: WorkflowStatus;
    status_label?: string;
    ship_by_date?: string | null;
    has_tracking?: boolean;
    needs_attention?: boolean;
    overdue_ship_by?: boolean;
    overdue_tracking?: boolean;
    label?: {
      url?: string | null;
    };
    primary_package?: {
      id: string;
      sequence: number;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
      label_url?: string | null;
    } | null;
    packages?: Array<{
      id: string;
      sequence: number;
      tracking_number?: string | null;
      tracking_url?: string | null;
      no_tracking?: boolean;
    }>;
  };
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  refunded_orders?: number;
  avg_order_value: number;
}

const FILTERS: Array<{ label: string; value: OrderFilter }> = [
  { label: 'All',        value: 'all' },
  { label: 'Pending',    value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped',    value: 'shipped' },
  { label: 'Delivered',  value: 'delivered' },
  { label: 'Cancelled',  value: 'cancelled' },
  { label: 'Refunded',   value: 'refunded' },
];

const QUEUE_TABS: Array<{ label: string; value: QueueTab }> = [
  { label: 'Open', value: 'open' },
  { label: 'Completed', value: 'completed' },
  { label: 'Issues', value: 'issues' },
];

const OPEN_FILTERS: Array<{ label: string; value: OpenFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Processing', value: 'processing' },
  { label: 'Due Today', value: 'due_today' },
  { label: 'Ready to Ship', value: 'ready_to_ship' },
  { label: 'Missing Tracking', value: 'missing_tracking' },
];

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'cancelled', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

function normalizeStatus(status: string): WorkflowStatus {
  const normalized = status.toLowerCase() === 'canceled' ? 'cancelled' : status.toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, normalized)
    ? (normalized as WorkflowStatus)
    : 'pending';
}

function getStatusOptions(status: string) {
  const current = normalizeStatus(status);
  return [current, ...VALID_TRANSITIONS[current]];
}

const STATUS_STYLE: Record<string, { badge: string; border: string }> = {
  paid:       { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  completed:  { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  delivered:  { badge: 'bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]', border: 'border-[var(--tertiary-container)]' },
  pending:    { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  processing: { badge: 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]', border: 'border-[var(--secondary-container)]' },
  shipped:    { badge: 'bg-[var(--primary-fixed)] text-[var(--on-primary-fixed-variant)]', border: 'border-[var(--primary-fixed)]' },
  cancelled:  { badge: 'bg-[var(--error-container)] text-[var(--on-error-container)]', border: 'border-[var(--error-container)]' },
  refunded:   { badge: 'bg-[var(--error-container)] text-[var(--on-error-container)]', border: 'border-[var(--error-container)]' },
};
function ss(status: string) { return STATUS_STYLE[status.toLowerCase()] ?? STATUS_STYLE.pending; }

function fmtCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100);
}
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWorkflowStatus(order: Order): WorkflowStatus {
  return normalizeStatus(order.workflow?.status || order.status);
}

function getDestinationLabel(order: Order) {
  const name = [order.shipping_first_name, order.shipping_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const location = [order.shipping_city, order.shipping_postal_code, order.shipping_country_code]
    .filter(Boolean)
    .join(', ')
    .trim();

  return {
    name: name || 'Destination pending',
    location: location || 'Address not filled yet',
  };
}

function getPrimaryPackage(order: Order) {
  return order.workflow?.primary_package || order.workflow?.packages?.[0] || null;
}

function canCompleteOrder(order: Order) {
  const workflowStatus = getWorkflowStatus(order);
  return workflowStatus === 'pending' || workflowStatus === 'processing';
}

function getQueueCount(stats: OrderStats | null, queue: QueueTab) {
  if (!stats) return 0;
  if (queue === 'open') {
    return (stats.pending_orders || 0) + (stats.processing_orders || 0);
  }
  if (queue === 'completed') {
    return (stats.shipped_orders || 0) + (stats.delivered_orders || 0);
  }
  return (stats.cancelled_orders || 0) + (stats.refunded_orders || 0);
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]           = useState<Order[]>([]);
  const [stats, setStats]             = useState<OrderStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');
  const [queueTab, setQueueTab] = useState<QueueTab>('open');
  const [openFilter, setOpenFilter] = useState<OpenFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('ship_by');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getOrders(
        20,
        (page - 1) * 20,
        search,
        statusFilter,
        queueTab,
        queueTab === 'open' ? openFilter : 'all',
        sortBy
      );
      setOrders(data?.orders || data || []);
      setTotalPages(data?.pagination?.total_pages || 1);
    } catch { setOrders([]); setTotalPages(1); }
    finally { setLoading(false); }
  }, [openFilter, page, queueTab, search, sortBy, statusFilter]);

  const fetchStats = async () => {
    try {
      const d = await api.getOrderStats();
      setStats(d || null);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      setStats(null);
    }
  };

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);
  useEffect(() => { void fetchStats(); }, []);

  const filteredOpenCount = useMemo(() => {
    if (queueTab !== 'open') return 0;
    return openFilter === 'all'
      ? orders.length
      : orders.filter((order) => {
          const workflowStatus = getWorkflowStatus(order);
          if (openFilter === 'new') return workflowStatus === 'pending';
          if (openFilter === 'processing') return workflowStatus === 'processing';
          if (openFilter === 'due_today') {
            const shipBy = order.workflow?.ship_by_date?.slice(0, 10);
            return shipBy === new Date().toISOString().slice(0, 10);
          }
          if (openFilter === 'ready_to_ship') {
            return workflowStatus === 'processing' && !order.workflow?.has_tracking;
          }
          if (openFilter === 'missing_tracking') {
            return workflowStatus === 'processing' && !order.workflow?.has_tracking;
          }
          return true;
        }).length;
  }, [openFilter, orders, queueTab]);

  const getName = (o: Order) =>
    o.customer_first_name && o.customer_last_name
      ? `${o.customer_first_name} ${o.customer_last_name}`
      : 'Guest customer';

  const toggleOne = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedOrders(next);
  };
  const toggleAll = () =>
    setSelectedOrders(selectedOrders.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));

  const bulkUpdate = async (nextStatus: OrderFilter) => {
    if (!selectedOrders.size || nextStatus === 'all') return;
    await api.updateOrdersBulk(Array.from(selectedOrders), nextStatus);
    setSelectedOrders(new Set());
    await Promise.all([fetchOrders(), fetchStats()]);
  };

  const singleUpdate = async (id: string, nextStatus: string) => {
    await api.updateOrderStatus(id, nextStatus);
    await Promise.all([fetchOrders(), fetchStats()]);
  };

  const handleExport = async () => {
    const blob = await api.exportOrders(search, statusFilter);
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `orders-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleDelete = async (id: string, num: string) => {
    if (!window.confirm(`Delete order #${num}?`)) return;
    await api.deleteOrder(id);
    await Promise.all([fetchOrders(), fetchStats()]);
  };

  const statCount = (v: OrderFilter) => ({ all: stats?.total_orders, pending: stats?.pending_orders, processing: stats?.processing_orders, shipped: stats?.shipped_orders, delivered: stats?.delivered_orders, cancelled: stats?.cancelled_orders, refunded: stats?.refunded_orders })[v] || 0;
  const attentionCount = orders.filter((order) => order.workflow?.needs_attention).length;
  const overdueCount = orders.filter((order) => order.workflow?.overdue_ship_by).length;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">Orders &amp; Shipping</h2>
          <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">Work the shipping queue, complete packages, and keep buyer updates moving.</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => void Promise.all([fetchOrders(), fetchStats()])} className="flex items-center gap-2 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] text-[var(--on-surface)] px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--surface-container-low)] transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => void handleExport()} className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Orders', value: stats?.total_orders ?? 0 },
          { label: 'Revenue',      value: fmtCurrency(stats?.total_revenue || 0) },
          { label: 'Pending',      value: stats?.pending_orders ?? 0, warn: (stats?.pending_orders || 0) > 0 },
          { label: 'Avg Value',    value: fmtCurrency(stats?.avg_order_value || 0) },
        ].map(c => (
          <div key={c.label} className={`bg-[var(--surface-container-lowest)] p-5 rounded-xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] ${c.warn ? 'ring-1 ring-[var(--error)]/30' : ''}`}>
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{c.label}</p>
            <p className={`text-xl font-black mt-1 ${c.warn ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {(attentionCount > 0 || overdueCount > 0) && (
        <div className="rounded-xl border border-[var(--error-container)] bg-[var(--error-container)]/20 px-5 py-4 text-sm text-[var(--on-surface)]">
          <p className="font-bold uppercase tracking-widest text-[10px] text-[var(--error)]">
            Needs Attention
          </p>
          <p className="mt-2">
            {attentionCount} orders need review.
            {overdueCount > 0 ? ` ${overdueCount} are past their ship-by date.` : ''}
          </p>
        </div>
      )}

      {/* ── Filter tabs + search ── */}
      <div className="bg-[var(--surface-container-lowest)] rounded-xl p-4 shadow-[0_4px_12px_rgba(25,28,30,0.04)] space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUEUE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setQueueTab(tab.value);
                setPage(1);
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                queueTab === tab.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
              }`}
            >
              {tab.label}
              {getQueueCount(stats, tab.value) > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${queueTab === tab.value ? 'bg-white/20 text-white' : 'bg-[var(--outline-variant)]/50 text-[var(--on-surface-variant)]'}`}>
                  {getQueueCount(stats, tab.value)}
                </span>
              )}
            </button>
          ))}
        </div>

        {queueTab === 'open' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {OPEN_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setOpenFilter(filter.value);
                  setPage(1);
                }}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  openFilter === filter.value
                    ? 'bg-[var(--surface-container-high)] text-[var(--on-surface)] ring-1 ring-[var(--primary)]/20'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
                }`}
              >
                {filter.label}
                {openFilter === filter.value && filteredOpenCount > 0 ? ` (${filteredOpenCount})` : ''}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" />
            <input
              type="search"
              placeholder="Search order #, buyer, email, address, item, notes..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-full pl-9 pr-4 py-2.5 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:border-[var(--on-tertiary-container)] focus:ring-2 focus:ring-[var(--on-tertiary-container)]/10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortOption);
              setPage(1);
            }}
            className="min-w-[180px] rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-2.5 text-sm font-medium text-[var(--on-surface)] focus:outline-none"
          >
            <option value="ship_by">Sort: Ship By</option>
            <option value="destination">Sort: Destination</option>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
          {selectedOrders.size > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(['processing','shipped','delivered','cancelled'] as const).map(s => (
                <button key={s} onClick={() => void bulkUpdate(s)} className="px-4 py-2 rounded-full bg-[var(--surface-container)] border border-[var(--outline-variant)] text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-colors capitalize">
                  Mark {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                statusFilter === f.value
                  ? 'bg-[var(--secondary-container)] text-[var(--on-secondary-container)]'
                  : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
              }`}
            >
              {f.label}
              {statCount(f.value) > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${statusFilter === f.value ? 'bg-black/10 text-[var(--on-secondary-container)]' : 'bg-[var(--outline-variant)]/50 text-[var(--on-surface-variant)]'}`}>
                  {statCount(f.value)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders list ── */}
      <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--outline-variant)]/40">
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" checked={orders.length > 0 && selectedOrders.size === orders.length} onChange={toggleAll} className="h-4 w-4 rounded" />
                </th>
                {['Order','Buyer','Destination','Amount','Status','Ship By','Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-14 text-center text-sm text-[var(--on-surface-variant)]">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-14 text-center text-sm text-[var(--on-surface-variant)]">No orders match the current queue.</td></tr>
              ) : orders.map(order => {
                const workflowStatus = getWorkflowStatus(order);
                const workflowLabel = order.workflow?.status_label || STATUS_LABELS[workflowStatus];
                const s = ss(workflowStatus);
                const destination = getDestinationLabel(order);
                const primaryPackage = getPrimaryPackage(order);
                const hasLabel = Boolean(order.workflow?.label?.url);
                return (
                  <tr key={order.id} className={`border-b border-[var(--surface-container-low)] border-l-4 ${s.border} hover:bg-[var(--surface-container-low)]/40 transition-colors`}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedOrders.has(order.id)} onChange={() => toggleOne(order.id)} className="h-4 w-4 rounded" /></td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-bold text-[var(--on-surface)] hover:text-[var(--on-tertiary-container)]">#{order.order_number}</Link>
                      <p className="mt-1 text-[10px] text-[var(--on-surface-variant)]">
                        {order.workflow?.has_tracking ? 'Tracking added' : 'Tracking pending'}
                      </p>
                      {primaryPackage?.tracking_number ? (
                        <p className="mt-1 text-[10px] text-[var(--on-surface-variant)]">
                          Package #{primaryPackage.sequence} · {primaryPackage.tracking_number}
                        </p>
                      ) : null}
                      {order.workflow?.needs_attention ? (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--error)]">
                          {order.workflow?.overdue_ship_by ? 'Ship-by overdue' : order.workflow?.overdue_tracking ? 'Missing tracking' : 'Review required'}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4"><p className="text-xs font-medium text-[var(--on-surface)]">{getName(order)}</p><p className="text-[10px] text-[var(--on-surface-variant)]">{order.email}</p></td>
                    <td className="px-6 py-4"><p className="text-xs font-medium text-[var(--on-surface)]">{destination.name}</p><p className="text-[10px] text-[var(--on-surface-variant)]">{destination.location}</p></td>
                    <td className="px-6 py-4 text-xs font-black text-[var(--on-surface)]">{fmtCurrency(order.total, order.currency_code || 'INR')}</td>
                    <td className="px-6 py-4"><span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase`}>{workflowLabel}</span></td>
                    <td className="px-6 py-4 text-[10px] text-[var(--on-surface-variant)]">
                      {order.workflow?.ship_by_date ? fmtDate(order.workflow.ship_by_date) : 'Not set'}
                      <p className="mt-1">{fmtDate(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-[340px] flex-wrap items-center justify-end gap-2">
                        {canCompleteOrder(order) ? (
                          <button
                            onClick={() => router.push(`/dashboard/orders/${order.id}?action=complete`)}
                            className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90"
                          >
                            Complete order
                          </button>
                        ) : null}
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=add-package`)}
                          className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"
                        >
                          Add package
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=edit-tracking`)}
                          className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"
                        >
                          Edit tracking
                        </button>
                        {hasLabel ? (
                          <a
                            href={order.workflow?.label?.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"
                          >
                            Open label
                          </a>
                        ) : null}
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}?action=message-buyer`)}
                          className="rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]"
                        >
                          Message buyer
                        </button>
                        <select value={workflowStatus} onChange={e => void singleUpdate(order.id, e.target.value)} className="bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-full px-3 py-1.5 text-[10px] font-bold text-[var(--on-surface)] focus:outline-none">
                          {getStatusOptions(workflowStatus).map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                        </select>
                        <Link href={`/dashboard/orders/${order.id}`} className="px-3 py-1.5 rounded-full border border-[var(--outline-variant)] text-[10px] font-bold text-[var(--on-surface)] hover:bg-[var(--surface-container-low)]">Open order</Link>
                        <button onClick={() => void handleDelete(order.id, order.order_number)} className="w-8 h-8 rounded-full border border-[var(--error-container)] bg-[var(--error-container)]/30 text-[var(--error)] flex items-center justify-center hover:bg-[var(--error-container)] transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-[var(--surface-container-low)]">
          {loading ? (
            <p className="p-6 text-center text-sm text-[var(--on-surface-variant)]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--on-surface-variant)]">No orders match the current queue.</p>
          ) : orders.map(order => {
            const workflowStatus = getWorkflowStatus(order);
            const s = ss(workflowStatus);
            const destination = getDestinationLabel(order);
            return (
              <div key={order.id} className={`p-4 border-l-4 ${s.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-bold text-[var(--on-surface)]">#{order.order_number}</Link>
                    <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{fmtDate(order.created_at)}</p>
                  </div>
                  <span className={`${s.badge} px-2 py-0.5 rounded-full text-[9px] font-bold uppercase`}>{order.workflow?.status_label || STATUS_LABELS[workflowStatus]}</span>
                </div>
                <p className="text-xs font-medium text-[var(--on-surface)] mt-2">{getName(order)}</p>
                <p className="text-[10px] text-[var(--on-surface-variant)] mt-1">{destination.location}</p>
                <p className="text-xs font-black text-[var(--on-surface)] mt-1">{fmtCurrency(order.total, order.currency_code || 'INR')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canCompleteOrder(order) ? (
                    <button onClick={() => router.push(`/dashboard/orders/${order.id}?action=complete`)} className="flex-1 rounded-full bg-[var(--primary)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
                      Complete
                    </button>
                  ) : null}
                  <Link href={`/dashboard/orders/${order.id}`} className="flex-1 text-center px-4 py-2 rounded-full border border-[var(--outline-variant)] text-[10px] font-bold text-[var(--on-surface)]">Open order</Link>
                  <select value={workflowStatus} onChange={e => void singleUpdate(order.id, e.target.value)} className="flex-1 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-full px-3 py-2 text-[10px] font-bold text-[var(--on-surface)] focus:outline-none">
                    {getStatusOptions(workflowStatus).map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--surface-container-low)] px-6 py-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-full border border-[var(--outline-variant)] text-[10px] font-bold text-[var(--on-surface)] disabled:opacity-40 hover:bg-[var(--surface-container-low)] transition-colors">Previous</button>
            <span className="text-[10px] font-medium text-[var(--on-surface-variant)]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-full border border-[var(--outline-variant)] text-[10px] font-bold text-[var(--on-surface)] disabled:opacity-40 hover:bg-[var(--surface-container-low)] transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
