'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, Mail, Phone, Globe, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

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

export default function WholesalePage() {
    const router = useRouter();
    const [inquiries, setInquiries] = useState<WholesaleInquiry[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState<WholesaleInquiry | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, [filter]);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const [inquiriesData, statsData] = await Promise.all([
                api.getWholesaleInquiries(filter === 'all' ? undefined : filter, search),
                api.getWholesaleStats()
            ]);
            setInquiries(inquiriesData.inquiries || []);
            setStats(statsData || { total: 0, pending: 0, approved: 0, rejected: 0 });
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string, tier?: string) => {
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
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const icons = {
            pending: Clock,
            approved: CheckCircle,
            rejected: XCircle,
        };
        const Icon = icons[status as keyof typeof icons];
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
                <Icon size={14} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Wholesale Inquiries</h1>
                <p className="text-gray-600">Manage B2B wholesale partnership requests</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Inquiries</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Building2 className="text-gray-400" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="text-yellow-400" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Approved</p>
                            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <CheckCircle className="text-green-400" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Rejected</p>
                            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <XCircle className="text-red-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={fetchInquiries}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading inquiries...</p>
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">No inquiries found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Volume</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{inquiry.company_name}</div>
                                                    <div className="text-sm text-gray-500">{inquiry.country}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{inquiry.contact_name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Mail size={12} /> {inquiry.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900 capitalize">{inquiry.business_type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">{inquiry.estimated_order_volume || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(inquiry.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{new Date(inquiry.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedInquiry(inquiry)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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

            {/* Detail Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Inquiry Details</h2>
                                <button
                                    onClick={() => setSelectedInquiry(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Company Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Company Name</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.company_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Business Type</label>
                                        <p className="mt-1 text-gray-900 capitalize">{selectedInquiry.business_type}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Country</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.country}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Estimated Order Volume</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.estimated_order_volume || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Contact Name</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.contact_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Phone</label>
                                        <p className="mt-1 text-gray-900">{selectedInquiry.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            {selectedInquiry.message && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Message</label>
                                    <p className="mt-1 text-gray-900 bg-gray-50 p-4 rounded">{selectedInquiry.message}</p>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Current Status</label>
                                {getStatusBadge(selectedInquiry.status)}
                            </div>

                            {/* Actions */}
                            {selectedInquiry.status === 'pending' && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedInquiry.id, 'approved', 'starter')}
                                            disabled={updating}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve (Starter)
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedInquiry.id, 'approved', 'growth')}
                                            disabled={updating}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve (Growth)
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedInquiry.id, 'approved', 'enterprise')}
                                            disabled={updating}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve (Enterprise)
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedInquiry.id, 'rejected')}
                                        disabled={updating}
                                        className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
