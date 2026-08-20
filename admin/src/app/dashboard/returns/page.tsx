'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  RotateCcw,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ReturnRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  reason: string;
  refund_amount: number;
  admin_notes: string | null;
  created_at: string;
  order_id: string;
  order_display_id: number;
  order_email: string;
  order_total: number;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
}

const STATUS_META = {
  pending: {
    label: 'Pending',
    color: 'bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-[var(--kv-danger)]/10 text-[var(--kv-danger)]',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-[var(--kv-success)]/10 text-[var(--kv-success)]',
    icon: RotateCcw,
  },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  );
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReturns();
      setReturns(data.returns || []);
    } catch {
      setError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleAction = async (
    returnId: string,
    action: 'approve' | 'reject' | 'process-refund'
  ) => {
    setActionLoading(returnId + action);
    setError(null);
    try {
      await api.post(`/admin/returns/${returnId}/${action}`, {
        admin_notes: adminNote,
      });
      setSuccessMsg(
        action === 'process-refund'
          ? 'Refund processed and inventory restocked!'
          : `Return ${action}d successfully`
      );
      setSelectedReturn(null);
      setAdminNote('');
      fetchReturns();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const filtered =
    activeFilter === 'all'
      ? returns
      : returns.filter((r) => r.status === activeFilter);

  const stats = {
    total: returns.length,
    pending: returns.filter((r) => r.status === 'pending').length,
    approved: returns.filter((r) => r.status === 'approved').length,
    refunded: returns.filter((r) => r.status === 'refunded').length,
    totalRefunded: returns
      .filter((r) => r.status === 'refunded')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">
            Returns & Refunds
          </h1>
          <p className="text-sm text-[var(--kv-muted)] mt-1">
            Manage return requests and process refunds
          </p>
        </div>
        <button
          onClick={fetchReturns}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--kv-card)] border border-[var(--kv-border)] rounded-lg hover:bg-[var(--kv-soft)] transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-[var(--kv-danger)]/10 border border-[var(--kv-danger)]/30 rounded-lg flex items-center gap-2 text-[var(--kv-danger)] text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-[var(--kv-success)]/10 border border-[var(--kv-success)]/30 rounded-lg flex items-center gap-2 text-[var(--kv-success)] text-sm">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Returns',
            value: stats.total,
            icon: Package,
            color: 'text-[var(--kv-text)]',
          },
          {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            color: 'text-[var(--kv-accent-deep)]',
          },
          {
            label: 'Approved',
            value: stats.approved,
            icon: CheckCircle,
            color: 'text-[var(--kv-accent-deep)]',
          },
          {
            label: 'Total Refunded',
            value: `$${(stats.totalRefunded / 100).toFixed(2)}`,
            icon: DollarSign,
            color: 'text-[var(--kv-success)]',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-[var(--kv-card)] border border-[var(--kv-border)] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-xs text-[var(--kv-muted)] font-medium uppercase tracking-wider">
                {label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--kv-border)]">
        {['all', 'pending', 'approved', 'rejected', 'refunded'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeFilter === tab
                ? 'border-[var(--kv-accent)] text-[var(--kv-accent-deep)]'
                : 'border-transparent text-[var(--kv-muted)] hover:text-[var(--kv-text)]'
            }`}
          >
            {tab}
            {tab === 'pending' && stats.pending > 0 && (
              <span className="ml-2 bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)] text-xs px-1.5 py-0.5 rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48 text-[var(--kv-muted)]">
          <RefreshCw size={24} className="animate-spin mr-2" />
          Loading returns...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[var(--kv-card)] border border-[var(--kv-border)] rounded-xl">
          <Package size={48} className="mx-auto text-[var(--kv-muted)] mb-3" />
          <p className="text-[var(--kv-muted)]">No returns found</p>
        </div>
      ) : (
        <div className="bg-[var(--kv-card)] border border-[var(--kv-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--kv-soft)] border-b border-[var(--kv-border)]">
              <tr>
                {[
                  'Order',
                  'Customer',
                  'Reason',
                  'Refund Amount',
                  'Status',
                  'Date',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[var(--kv-muted)] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((ret) => {
                const meta = STATUS_META[ret.status] || STATUS_META.pending;
                const StatusIcon = meta.icon;
                return (
                  <tr
                    key={ret.id}
                    className="hover:bg-[var(--kv-soft)] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--kv-accent-deep)]">
                      #{ret.order_display_id}
                    </td>
                    <td className="px-4 py-3 text-[var(--kv-text)]">
                      <div className="font-medium">
                        {ret.customer_name || '—'}
                      </div>
                      <div className="text-xs text-[var(--kv-muted)]">
                        {ret.order_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--kv-text)] max-w-xs truncate">
                      {ret.reason}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--kv-text)]">
                      ${((ret.refund_amount || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${meta.color}`}
                      >
                        <StatusIcon size={12} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--kv-muted)] text-xs">
                      {new Date(ret.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setAdminNote(ret.admin_notes || '');
                          }}
                          className="p-1.5 text-[var(--kv-muted)] hover:text-[var(--kv-accent-deep)] hover:bg-[var(--kv-accent)]/10 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {ret.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(ret.id, 'approve')}
                              disabled={!!actionLoading}
                              className="px-2 py-1 text-xs bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)] rounded hover:bg-[var(--kv-accent)]/10 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(ret.id, 'reject')}
                              disabled={!!actionLoading}
                              className="px-2 py-1 text-xs bg-[var(--kv-danger)]/10 text-[var(--kv-danger)] rounded hover:bg-[var(--kv-danger)]/10 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {ret.status === 'approved' && (
                          <button
                            onClick={() => setSelectedReturn(ret)}
                            className="px-2 py-1 text-xs bg-[var(--kv-success)]/10 text-[var(--kv-success)] rounded hover:bg-[var(--kv-success)]/10 transition-colors"
                          >
                            Process Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / Action Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-[var(--kv-text)]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--kv-card)] rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-[var(--kv-text)] mb-4">
              Return Request — Order #{selectedReturn.order_display_id}
            </h2>

            <div className="space-y-3 mb-5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--kv-soft)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--kv-muted)] mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[selectedReturn.status]?.color}`}
                  >
                    {selectedReturn.status}
                  </span>
                </div>
                <div className="bg-[var(--kv-soft)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--kv-muted)] mb-1">Refund Amount</p>
                  <p className="font-bold text-[var(--kv-success)]">
                    ${((selectedReturn.refund_amount || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-[var(--kv-soft)] p-3 rounded-lg">
                <p className="text-xs text-[var(--kv-muted)] mb-1">Customer</p>
                <p className="font-medium">
                  {selectedReturn.customer_name || 'Guest'}
                </p>
                <p className="text-[var(--kv-muted)]">{selectedReturn.order_email}</p>
              </div>
              <div className="bg-[var(--kv-soft)] p-3 rounded-lg">
                <p className="text-xs text-[var(--kv-muted)] mb-1">Reason</p>
                <p>{selectedReturn.reason}</p>
              </div>
              <div>
                <label
                  htmlFor="admin-note"
                  className="block text-xs text-[var(--kv-muted)] mb-1 font-medium"
                >
                  Admin Note
                </label>
                <textarea
                  id="admin-note"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="Add an internal note..."
                  className="w-full border border-[var(--kv-border)] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedReturn(null);
                  setAdminNote('');
                }}
                className="px-4 py-2 text-sm text-[var(--kv-text)] border border-[var(--kv-border)] rounded-lg hover:bg-[var(--kv-soft)] transition-colors"
              >
                Close
              </button>
              {selectedReturn.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAction(selectedReturn.id, 'reject')}
                    disabled={!!actionLoading}
                    className="px-4 py-2 text-sm bg-[var(--kv-danger)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-danger)] transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(selectedReturn.id, 'approve')}
                    disabled={!!actionLoading}
                    className="px-4 py-2 text-sm bg-[var(--kv-accent)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-accent-deep)] transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedReturn.status === 'approved' && (
                <button
                  onClick={() =>
                    handleAction(selectedReturn.id, 'process-refund')
                  }
                  disabled={!!actionLoading}
                  className="px-4 py-2 text-sm bg-[var(--kv-success)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-success)] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <DollarSign size={14} />
                  {actionLoading ? 'Processing...' : 'Process Refund & Restock'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
