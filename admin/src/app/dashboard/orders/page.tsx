'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    Search, Download, Eye, Clock, Package, Truck,
    CheckCircle, XCircle, AlertCircle, CheckSquare, Square, RefreshCw, Trash2
} from 'lucide-react';


interface Order {
    id: string;
    order_number: string;
    status: string;
    email: string;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
    total: number;
    currency_code: string;
    customer_id: string | null;
    customer_first_name: string | null;
    customer_last_name: string | null;
    created_at: string;
}

interface OrderStats {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    today_orders: number;
    today_revenue: number;
    avg_order_value: number;
}

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [page, search, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            if (!token) return;

            // Using limit 20, offset derived from page
            const limit = 20;
            const offset = (page - 1) * limit;

            const data = await api.getOrders(token, limit, offset, search, statusFilter);
            setOrders(data.orders);
            setTotalPages(data.pagination.total_pages);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            alert(error.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;
            const data = await api.getOrderStats(token);
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleBulkStatusUpdate = async (status: string) => {
        if (selectedOrders.size === 0) return;

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;

            await api.updateOrdersBulk(token, Array.from(selectedOrders), status);

            fetchOrders();
            fetchStats();
            setSelectedOrders(new Set());
        } catch (error) {
            alert('Failed to update orders');
        }
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(orders.map(o => o.id)));
        }
    };

    const toggleSelectOrder = (id: string) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrders(newSelected);
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;
            const blob = await api.exportOrders(token, search, statusFilter);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed');
        }
    };

    const handleDeleteOrder = async (id: string, orderNumber: string) => {
        if (!confirm(`Are you sure you want to delete order #${orderNumber}? This action cannot be undone.`)) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;

            await api.deleteOrder(token, id);
            fetchOrders();
            fetchStats();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete order');
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, any> = {
            pending: Clock,
            processing: Package,
            shipped: Truck,
            delivered: CheckCircle,
            cancelled: XCircle,
            refunded: AlertCircle,
        };
        const Icon = icons[status] || Clock;
        return <Icon size={16} />;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <button
                        onClick={() => { fetchOrders(); fetchStats(); }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
                <p className="text-gray-600">Manage and track all customer orders</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                            </div>
                            <Package className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                            </div>
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                            </div>
                            <Clock className="text-yellow-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Processing</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.processing_orders}</p>
                            </div>
                            <Package className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avg_order_value)}</p>
                            </div>
                            <CheckCircle className="text-purple-500" size={32} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by order number or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-900">
                            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkStatusUpdate('processing')}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                                Mark Processing
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('shipped')}
                                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                            >
                                Mark Shipped
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('delivered')}
                                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                                Mark Delivered
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('cancelled')}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <button onClick={toggleSelectAll}>
                                        {selectedOrders.size === orders.length ? (
                                            <CheckSquare className="text-blue-500" size={20} />
                                        ) : (
                                            <Square className="text-gray-400" size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelectOrder(order.id)}>
                                                {selectedOrders.has(order.id) ? (
                                                    <CheckSquare className="text-blue-500" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                #{order.order_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {order.customer_first_name && order.customer_last_name
                                                    ? `${order.customer_first_name} ${order.customer_last_name}`
                                                    : 'Guest'}
                                            </div>
                                            <div className="text-sm text-gray-500">{order.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total, order.currency_code)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id, order.order_number)}
                                                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
