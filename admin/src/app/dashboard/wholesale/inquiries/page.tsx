'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  CheckCircle,
  Clock,
  Mail,
  XCircle,
} from 'lucide-react';

interface WholesaleInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  country: string;
  business_type: string;
  estimated_order_volume: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  discount_tier: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function WholesaleInquiriesPage() {
  const [inquiries, setInquiries] = useState<WholesaleInquiry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] =
    useState<WholesaleInquiry | null>(null);
  const [updating, setUpdating] = useState(false);
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const [inquiriesData, statsData] = await Promise.all([
        api.getWholesaleInquiries(
          filter === 'all' ? undefined : filter,
          searchRef.current
        ),
        api.getWholesaleStats(),
      ]);
      setInquiries(inquiriesData.inquiries || []);
      setStats(statsData || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchInquiries();
  }, [fetchInquiries]);

  const handleUpdateStatus = async (
    id: string,
    status: string,
    tier?: string
  ) => {
    try {
      setUpdating(true);
      await api.updateWholesaleInquiry(id, {
        status,
        discount_tier: tier,
      });
      await fetchInquiries();
      setSelectedInquiry(null);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      alert('Failed to update inquiry');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]',
      approved: 'bg-[var(--kv-success)]/10 text-[var(--kv-success)]',
      rejected: 'bg-[var(--kv-danger)]/10 text-[var(--kv-danger)]',
    };
    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-[var(--kv-text)]">
          Wholesale Inquiries
        </h1>
        <p className="text-[var(--kv-text)]">
          Manage B2B wholesale partnership requests
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-[var(--kv-text)]">Total Inquiries</p>
              <p className="text-3xl font-bold text-[var(--kv-text)]">{stats.total}</p>
            </div>
            <Building2 className="text-[var(--kv-muted)]" size={32} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-[var(--kv-text)]">Pending</p>
              <p className="text-3xl font-bold text-[var(--kv-accent-deep)]">
                {stats.pending}
              </p>
            </div>
            <Clock className="text-[var(--kv-accent)]" size={32} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-[var(--kv-text)]">Approved</p>
              <p className="text-3xl font-bold text-[var(--kv-success)]">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="text-[var(--kv-success)]" size={32} />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-[var(--kv-text)]">Rejected</p>
              <p className="text-3xl font-bold text-[var(--kv-danger)]">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="text-[var(--kv-danger)]" size={32} />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-[var(--kv-card)] p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-[var(--kv-accent)] text-[var(--kv-card)]'
                    : 'bg-[var(--kv-soft)] text-[var(--kv-text)] hover:bg-[var(--kv-border)]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInquiries()}
            className="flex-1 rounded-lg border border-[var(--kv-border)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchInquiries}
            className="rounded-lg bg-[var(--kv-accent)] px-6 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-accent-deep)]"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-[var(--kv-card)] shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--kv-accent)]" />
            <p className="mt-4 text-[var(--kv-text)]">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={48} className="mx-auto mb-4 text-[var(--kv-muted)]" />
            <p className="text-[var(--kv-text)]">No inquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--kv-border)] bg-[var(--kv-soft)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Business Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Order Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--kv-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--kv-border)] bg-[var(--kv-card)]">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-[var(--kv-soft)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[var(--kv-muted)]" />
                        <div>
                          <div className="text-sm font-medium text-[var(--kv-text)]">
                            {inquiry.company_name}
                          </div>
                          <div className="text-sm text-[var(--kv-muted)]">
                            {inquiry.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--kv-text)]">
                        {inquiry.contact_name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--kv-muted)]">
                        <Mail size={12} /> {inquiry.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize text-[var(--kv-text)]">
                        {inquiry.business_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[var(--kv-text)]">
                        {inquiry.estimated_order_volume || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inquiry.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--kv-text)]">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="text-sm font-medium text-[var(--kv-accent-deep)] hover:text-[var(--kv-accent-deep)]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--kv-text)] bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[var(--kv-card)]">
            <div className="border-b border-[var(--kv-border)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--kv-text)]">
                  Inquiry Details
                </h2>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
                >
                  X
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-[var(--kv-text)]">
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Company Name
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.company_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Business Type
                    </label>
                    <p className="mt-1 capitalize text-[var(--kv-text)]">
                      {selectedInquiry.business_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Country
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.country}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Estimated Order Volume
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.estimated_order_volume || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-[var(--kv-text)]">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Contact Name
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.contact_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Email
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--kv-muted)]">
                      Phone
                    </label>
                    <p className="mt-1 text-[var(--kv-text)]">
                      {selectedInquiry.phone}
                    </p>
                  </div>
                </div>
              </div>

              {selectedInquiry.message && (
                <div>
                  <label className="text-sm font-medium text-[var(--kv-muted)]">
                    Message
                  </label>
                  <p className="mt-1 rounded bg-[var(--kv-soft)] p-4 text-[var(--kv-text)]">
                    {selectedInquiry.message}
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--kv-muted)]">
                  Current Status
                </label>
                {getStatusBadge(selectedInquiry.status)}
              </div>

              {selectedInquiry.status === 'pending' && (
                <div className="border-t border-[var(--kv-border)] pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-[var(--kv-text)]">
                    Actions
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedInquiry.id,
                          'approved',
                          'starter'
                        )
                      }
                      disabled={updating}
                      className="rounded-lg bg-[var(--kv-success)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-success)] disabled:opacity-50"
                    >
                      Approve (Starter)
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedInquiry.id,
                          'approved',
                          'growth'
                        )
                      }
                      disabled={updating}
                      className="rounded-lg bg-[var(--kv-success)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-success)] disabled:opacity-50"
                    >
                      Approve (Growth)
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedInquiry.id,
                          'approved',
                          'enterprise'
                        )
                      }
                      disabled={updating}
                      className="rounded-lg bg-[var(--kv-success)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-success)] disabled:opacity-50"
                    >
                      Approve (Enterprise)
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedInquiry.id, 'rejected')
                    }
                    disabled={updating}
                    className="mt-4 w-full rounded-lg bg-[var(--kv-danger)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-danger)] disabled:opacity-50"
                  >
                    Reject Inquiry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
