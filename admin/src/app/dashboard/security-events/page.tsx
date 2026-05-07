'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  PageHeader,
  Surface,
} from '@/components/ui/admin-ui';

type SeverityFilter = 'all' | 'warn' | 'error' | 'info';

interface SecurityEventRow {
  id: string;
  source: string;
  severity: 'info' | 'warn' | 'error';
  event: string;
  ip_address: string | null;
  method: string | null;
  path: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface SecurityEventStats {
  total: number;
  warn: number;
  error: number;
  last_1h: number;
  last_24h: number;
  top_event_24h: string | null;
  top_event_count_24h: number;
}

interface SecurityEventAlert {
  event: string;
  title: string;
  description: string;
  severity: 'warn' | 'error';
  count: number;
  threshold: number;
  window_hours: number;
}

const SEVERITY_FILTERS: Array<{ label: string; value: SeverityFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Info', value: 'info' },
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

function severityTone(severity: SecurityEventRow['severity']) {
  if (severity === 'error') {
    return 'bg-[#fff0ed] text-[var(--kv-danger)]';
  }

  if (severity === 'warn') {
    return 'bg-[#fbf3e0] text-[var(--kv-warning)]';
  }

  return 'bg-[var(--kv-soft)] text-[var(--kv-muted)]';
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [stats, setStats] = useState<SecurityEventStats>({
    total: 0,
    warn: 0,
    error: 0,
    last_1h: 0,
    last_24h: 0,
    top_event_24h: null,
    top_event_count_24h: 0,
  });
  const [alerts, setAlerts] = useState<SecurityEventAlert[]>([]);
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSecurityEvents(activeFilter, search);
      const nextEvents = (data.events || []) as SecurityEventRow[];
      setEvents(nextEvents);
      setStats(
        data.stats || {
          total: 0,
          warn: 0,
          error: 0,
          last_1h: 0,
          last_24h: 0,
          top_event_24h: null,
          top_event_count_24h: 0,
        }
      );
      setAlerts((data.alerts || []) as SecurityEventAlert[]);
      setSelectedEvent((current) => {
        if (!current) return nextEvents[0] || null;
        return nextEvents.find((item) => item.id === current.id) || nextEvents[0] || null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const detailsJson = useMemo(() => {
    if (!selectedEvent?.details) return null;
    return JSON.stringify(selectedEvent.details, null, 2);
  }, [selectedEvent]);

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Security"
        title="Security Events"
        description="Recent abuse, lookup, and validation signals captured by the backend so the team can triage suspicious behavior quickly."
        actions={
          <ActionButton
            onClick={() => void fetchEvents()}
            icon={RefreshCw}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="All Events"
          value={stats.total}
          icon={ShieldAlert}
          hint="Persisted security records."
        />
        <MetricCard
          label="Warnings"
          value={stats.warn}
          icon={AlertTriangle}
          tone="warning"
          hint="Rate-limit and validation warnings."
        />
        <MetricCard
          label="Errors"
          value={stats.error}
          icon={Siren}
          tone="danger"
          hint="Higher-severity security signals."
        />
        <MetricCard
          label="Last Hour"
          value={stats.last_1h}
          icon={RefreshCw}
          hint={
            stats.last_1h > 0
              ? 'Fresh signal window for abuse spikes.'
              : 'No fresh signal in the last hour'
          }
        />
      </div>

      <Surface className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
              Active Alerts
            </p>
            <p className="mt-1 text-sm text-[var(--kv-muted)]">
              Threshold-based spikes from the past hour so the team can react before abuse spreads.
            </p>
          </div>
          <span className="rounded-full bg-[var(--kv-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
            {alerts.length} active
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {alerts.map((alert) => (
              <div
                key={`${alert.event}-${alert.severity}`}
                className={`rounded-[1.2rem] border px-4 py-4 ${
                  alert.severity === 'error'
                    ? 'border-[rgba(208,76,52,0.24)] bg-[#fff3ef]'
                    : 'border-[rgba(184,123,39,0.24)] bg-[#fff8eb]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--kv-text)]">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--kv-muted)]">
                      {alert.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      alert.severity === 'error'
                        ? 'bg-[#fff0ed] text-[var(--kv-danger)]'
                        : 'bg-[#fbf3e0] text-[var(--kv-warning)]'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                  <span className="rounded-full bg-white px-3 py-1">
                    {alert.count} events / {alert.window_hours}h
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    Threshold {alert.threshold}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {alert.event}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
            No threshold-based spikes are active right now.
          </div>
        )}
      </Surface>

      <div className="grid gap-4 md:grid-cols-1">
        <MetricCard
          label="Last 24h"
          value={stats.last_24h}
          icon={ShieldAlert}
          hint={
            stats.top_event_24h
              ? `${stats.top_event_24h} (${stats.top_event_count_24h})`
              : 'No standout event yet'
          }
        />
      </div>

      <Surface className="p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {SEVERITY_FILTERS.map((filter) => (
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
              placeholder="Search by event, path, IP, detail"
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
              Event Stream
            </p>
          </div>
          <div className="divide-y divide-[var(--kv-border)]">
            {loading ? (
              <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
                Loading security events...
              </div>
            ) : events.length === 0 ? (
              <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
                No security events match the current filters.
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-[var(--kv-soft)] ${
                    selectedEvent?.id === event.id ? 'bg-[var(--kv-accent-soft)]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--kv-text)]">
                        {event.event}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--kv-muted)]">
                        {(event.method || 'GET').toUpperCase()} {event.path || 'Unknown path'}
                      </p>
                      <p className="mt-2 truncate text-xs text-[var(--kv-muted)]">
                        {event.ip_address || 'Unknown IP'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${severityTone(
                          event.severity
                        )}`}
                      >
                        {event.severity}
                      </span>
                      <p className="mt-2 text-[11px] text-[var(--kv-muted)]">
                        {formatDate(event.created_at)}
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
              Event Detail
            </p>
          </div>
          {selectedEvent ? (
            <div className="space-y-6 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--kv-text)]">
                    {selectedEvent.event}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--kv-muted)]">
                    {(selectedEvent.method || 'GET').toUpperCase()} {selectedEvent.path || 'Unknown path'}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${severityTone(
                    selectedEvent.severity
                  )}`}
                >
                  {selectedEvent.severity}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Source
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--kv-text)]">
                    {selectedEvent.source}
                  </p>
                </div>
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    IP
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-[var(--kv-text)]">
                    {selectedEvent.ip_address || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.1rem] border border-[var(--kv-border)] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Details
                </p>
                {detailsJson ? (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[var(--kv-text)]">
                    {detailsJson}
                  </pre>
                ) : (
                  <p className="mt-3 text-sm text-[var(--kv-muted)]">
                    No additional details were stored for this event.
                  </p>
                )}
              </div>

              <p className="text-sm text-[var(--kv-muted)]">
                Recorded {formatDate(selectedEvent.created_at)}. Use the event name and path to
                correlate with support spikes, rate-limit hits, or checkout/report anomalies.
              </p>
            </div>
          ) : (
            <div className="px-5 py-12 text-sm text-[var(--kv-muted)]">
              Select an event to inspect its details.
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
