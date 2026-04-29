'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MessageCircleQuestion,
  Phone,
  RefreshCw,
  Ruler,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';

type InquiryStatus = 'new' | 'in_progress' | 'replied' | 'closed';

interface StudioInquiry {
  id: string;
  product_id: string | null;
  product_title: string;
  product_handle: string | null;
  product_url: string | null;
  inquiry_type: 'question' | 'custom_size' | 'shipping';
  customer_name: string;
  email: string | null;
  phone: string | null;
  message: string;
  measurements: Record<string, string> | null;
  status: InquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  product_thumbnail: string | null;
}

interface StudioInquiryResponse {
  inquiries: StudioInquiry[];
  stats: {
    total: number;
    new: number;
    in_progress: number;
    replied: number;
    custom_size: number;
  };
}

const STATUS_META: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  replied: { label: 'Replied', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700' },
};

const TYPE_META = {
  question: 'Product Question',
  custom_size: 'Custom Size',
  shipping: 'Shipping Help',
};

export default function StudioInquiriesPage() {
  const [inquiries, setInquiries] = useState<StudioInquiry[]>([]);
  const [stats, setStats] = useState<StudioInquiryResponse['stats']>({
    total: 0,
    new: 0,
    in_progress: 0,
    replied: 0,
    custom_size: 0,
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<StudioInquiry | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get('/admin/studio-inquiries')) as StudioInquiryResponse;
      setInquiries(data.inquiries || []);
      setStats(
        data.stats || {
          total: 0,
          new: 0,
          in_progress: 0,
          replied: 0,
          custom_size: 0,
        }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load studio inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInquiries();
  }, [fetchInquiries]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return inquiries;
    if (activeFilter === 'custom_size') return inquiries.filter((inquiry) => inquiry.inquiry_type === 'custom_size');
    return inquiries.filter((inquiry) => inquiry.status === activeFilter);
  }, [activeFilter, inquiries]);

  const handleSelectInquiry = (inquiry: StudioInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNote(inquiry.admin_notes || '');
  };

  const updateInquiry = async (id: string, status: InquiryStatus) => {
    setActionLoading(`${id}-${status}`);
    setError(null);
    try {
      await api.patch(`/admin/studio-inquiries/${id}`, {
        status,
        admin_notes: adminNote,
      });
      setSuccessMsg('Studio inquiry updated');
      setSelectedInquiry(null);
      setAdminNote('');
      await fetchInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update inquiry');
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!window.confirm('Delete this studio inquiry?')) return;
    setActionLoading(`${id}-delete`);
    setError(null);
    try {
      await api.delete(`/admin/studio-inquiries/${id}`);
      setSuccessMsg('Studio inquiry deleted');
      setSelectedInquiry(null);
      await fetchInquiries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not delete inquiry');
    } finally {
      setActionLoading(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Product questions, custom size requests, and shipping help from storefront shoppers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchInquiries()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: MessageCircleQuestion, color: 'text-gray-700' },
          { label: 'New', value: stats.new, icon: Clock, color: 'text-yellow-700' },
          { label: 'In Progress', value: stats.in_progress, icon: RefreshCw, color: 'text-blue-700' },
          { label: 'Custom Size', value: stats.custom_size, icon: Ruler, color: 'text-purple-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon size={16} className={color} />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {['all', 'new', 'in_progress', 'replied', 'closed', 'custom_size'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeFilter === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.replace('_', ' ')}
            {tab === 'new' && stats.new > 0 && (
              <span className="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                {stats.new}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          <RefreshCw size={24} className="mr-2 animate-spin" />
          Loading studio inquiries...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MessageCircleQuestion size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No studio inquiries found</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['Customer', 'Product', 'Type', 'Status', 'Date', 'Actions'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => handleSelectInquiry(inquiry)} className="text-left">
                        <p className="font-medium text-gray-900">{inquiry.customer_name}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">{inquiry.email || inquiry.phone || 'No contact'}</p>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-1 font-medium text-gray-900">{inquiry.product_title}</p>
                      {inquiry.product_handle && <p className="mt-1 text-xs text-gray-500">/{inquiry.product_handle}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {TYPE_META[inquiry.inquiry_type]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[inquiry.status].className}`}>
                        {STATUS_META[inquiry.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectInquiry(inquiry)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteInquiry(inquiry.id)}
                          disabled={actionLoading === `${inquiry.id}-delete`}
                          className="rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          aria-label="Delete inquiry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-white p-5">
            {selectedInquiry ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {TYPE_META[selectedInquiry.inquiry_type]}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900">{selectedInquiry.customer_name}</h2>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_META[selectedInquiry.status].className}`}>
                    {STATUS_META[selectedInquiry.status].label}
                  </span>
                </div>

                <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">{selectedInquiry.product_title}</p>
                  {selectedInquiry.product_url && (
                    <a href={selectedInquiry.product_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                      Open storefront product
                    </a>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  {selectedInquiry.email && (
                    <a href={`mailto:${selectedInquiry.email}`} className="flex items-center gap-2 hover:text-gray-900">
                      <Mail size={15} />
                      {selectedInquiry.email}
                    </a>
                  )}
                  {selectedInquiry.phone && (
                    <a href={`tel:${selectedInquiry.phone}`} className="flex items-center gap-2 hover:text-gray-900">
                      <Phone size={15} />
                      {selectedInquiry.phone}
                    </a>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer Message</p>
                  <p className="whitespace-pre-wrap rounded-lg border border-gray-200 p-4 text-sm leading-6 text-gray-700">
                    {selectedInquiry.message}
                  </p>
                </div>

                {selectedInquiry.inquiry_type === 'custom_size' && selectedInquiry.measurements && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Measurements</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedInquiry.measurements)
                        .filter(([, value]) => Boolean(value))
                        .map(([key, value]) => (
                          <div key={key} className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="mt-1 font-medium text-gray-900">{value}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Admin Notes</span>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Reply summary, sizing advice, or follow-up notes..."
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {(['in_progress', 'replied', 'closed', 'new'] as InquiryStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void updateInquiry(selectedInquiry.id, status)}
                      disabled={actionLoading === `${selectedInquiry.id}-${status}`}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark {STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-gray-400">
                <MessageCircleQuestion size={42} className="mb-3" />
                <p className="text-sm">Select an inquiry to view the full conversation context.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
