'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Clock3,
  Mail,
  Mailbox,
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
  Surface,
} from '@/components/ui/admin-ui';

type SupportFilter = 'all' | 'order' | 'general';

interface SupportRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  raw_message: string;
  order_reference: string | null;
  is_order_tagged: boolean;
  created_at: string;
}

interface SupportStats {
  total: number;
  order_tagged: number;
  general: number;
}

const FILTERS: Array<{ label: string; value: SupportFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Order Linked', value: 'order' },
  { label: 'General', value: 'general' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupportInboxPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [stats, setStats] = useState<SupportStats>({
    total: 0,
    order_tagged: 0,
    general: 0,
  });
  const [activeFilter, setActiveFilter] = useState<SupportFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSupportRequests(activeFilter, search);
      setRequests(data.requests || []);
      setStats(
        data.stats || {
          total: 0,
          order_tagged: 0,
          general: 0,
        }
      );

      setSelectedRequest((current) => {
        if (!current) return data.requests?.[0] || null;
        return (
          data.requests?.find((item: SupportRequest) => item.id === current.id) ||
          data.requests?.[0] ||
          null
        );
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load support inbox'
      );
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleSelect = async (id: string) => {
    try {
      const data = await api.getSupportRequest(id);
      setSelectedRequest(data.request || null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load support request'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this support request?')) return;

    try {
      setDeletingId(id);
      await api.deleteSupportRequest(id);
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
      await fetchRequests();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete support request'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Support"
        title="Support Inbox"
        description="Contact requests from shoppers, with order-linked support requests highlighted for faster resolution."
        actions={
          <ActionButton
            onClick={() => void fetchRequests()}
            icon={RefreshCw}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="All Requests"
          value={stats.total}
          icon={Mailbox}
          hint="Latest concierge and support messages."
        />
        <MetricCard
          label="Order Linked"
          value={stats.order_tagged}
          icon={ShoppingBag}
          tone="warning"
          hint="Requests that include an order reference."
        />
        <MetricCard
          label="General"
          value={stats.general}
          icon={Mail}
          hint="General pre-sale and brand questions."
        />
      </div>

      <Surface className="p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors ${
                  activeFilter === filter.value
                    ? 'bg-[var(--kv-accent)] text-white'
                    : 'bg-[var(--kv-soft)] text-[var(--kv-muted)] hover:bg-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="relative block min-w-[260px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, order, message"
              className="w-full rounded-2xl border border-[var(--kv-border)] bg-white py-3 pl-10 pr-4 text-sm text-[var(--kv-text)] outline-none"
            />
          </label>
        </div>
      </Surface>

      {error ? (
        <Surface className="px-5 py-4 text-sm text-[var(--kv-danger)]">
          {error}
        </Surface>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--kv-border)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
              Request Queue
            </p>
          </div>
          <div className="divide-y divide-[var(--kv-border)]">
            {loading ? (
              <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
                Loading support requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
                No support requests match the current filters.
              </div>
            ) : (
              requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => void handleSelect(request.id)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-[var(--kv-soft)] ${
                    selectedRequest?.id === request.id ? 'bg-[var(--kv-accent-soft)]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--kv-text)]">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--kv-muted)]">
                        {request.email}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--kv-text)]">
                        {request.message}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {request.is_order_tagged ? (
                        <span className="inline-flex rounded-full bg-[#fbf3e0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kv-warning)]">
                          Order #{request.order_reference}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[var(--kv-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                          General
                        </span>
                      )}
                      <p className="mt-2 text-[11px] text-[var(--kv-muted)]">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Surface>

        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--kv-border)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
              Request Detail
            </p>
          </div>
          {selectedRequest ? (
            <div className="space-y-6 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--kv-text)]">
                    {selectedRequest.first_name} {selectedRequest.last_name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--kv-muted)]">
                    {selectedRequest.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(selectedRequest.id)}
                  disabled={deletingId === selectedRequest.id}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--kv-border)] text-[var(--kv-danger)] transition-colors hover:bg-[var(--kv-soft)] disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Type
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--kv-text)]">
                    {selectedRequest.is_order_tagged
                      ? `Order support #${selectedRequest.order_reference}`
                      : 'General support request'}
                  </p>
                </div>
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Received
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--kv-text)]">
                    <Clock3 size={15} />
                    {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.1rem] bg-white px-4 py-4 border border-[var(--kv-border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Message
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--kv-text)]">
                  {selectedRequest.message}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <ActionButton
                  href={`mailto:${selectedRequest.email}?subject=${encodeURIComponent(
                    selectedRequest.is_order_tagged && selectedRequest.order_reference
                      ? `Update on your Kvastram order #${selectedRequest.order_reference}`
                      : 'Update from Kvastram Support'
                  )}`}
                  icon={Mail}
                  variant="secondary"
                >
                  Reply by Email
                </ActionButton>
                {selectedRequest.order_reference ? (
                  <ActionButton
                    href={`/dashboard/orders`}
                    icon={ShoppingBag}
                    variant="secondary"
                  >
                    Open Orders Queue
                  </ActionButton>
                ) : null}
              </div>

              {selectedRequest.order_reference ? (
                <p className="text-sm text-[var(--kv-muted)]">
                  Order reference found: <strong>#{selectedRequest.order_reference}</strong>. Search
                  this number in the orders queue to continue fulfillment or issue resolution.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
              Select a support request to see the full message.
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
