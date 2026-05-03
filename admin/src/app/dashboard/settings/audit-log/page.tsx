'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditEntry {
  id: string;
  user_id: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  status_change: 'bg-amber-100 text-amber-700',
  category_change: 'bg-purple-100 text-purple-700',
};

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) => action.includes(k));
  return key ? ACTION_COLORS[key] : 'bg-gray-100 text-gray-600';
}

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (entityTypeFilter) params.set('entity_type', entityTypeFilter);
      const data = await api.request(`/audit-log?${params}`);
      setEntries(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={22} className="text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">All admin actions — read-only</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={entityTypeFilter}
          onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All entity types</option>
          <option value="category">Category</option>
          <option value="collection">Collection</option>
          <option value="product">Product</option>
          <option value="nav">Navigation</option>
          <option value="role">Role</option>
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">{total} total entries</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[1fr,120px,100px,140px,160px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div>Entity</div>
          <div>Action</div>
          <div>Role</div>
          <div>IP</div>
          <div>Date</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2" />
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Shield size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No audit entries found.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border-b border-gray-100 last:border-0">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full grid grid-cols-[1fr,120px,100px,140px,160px] gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm text-gray-900 truncate">
                  <span className="font-medium">{entry.entity_type}</span>
                  {entry.entity_id && <span className="ml-2 text-gray-400 font-mono text-xs">{entry.entity_id.slice(0, 8)}…</span>}
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{entry.user_role || '—'}</div>
                <div className="text-sm text-gray-500 font-mono">{entry.ip_address || '—'}</div>
                <div className="text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
              {expandedId === entry.id && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {entry.old_value && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Before</p>
                        <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-40 text-gray-700">
                          {JSON.stringify(entry.old_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {entry.new_value && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">After</p>
                        <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-40 text-gray-700">
                          {JSON.stringify(entry.new_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
