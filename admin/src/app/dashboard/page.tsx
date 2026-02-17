'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
    Clock, CheckCircle, Truck, AlertCircle, XCircle, Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

interface DashboardStats {
    // Order stats
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    today_orders: number;
    today_revenue: number;
    month_orders: number;
    month_revenue: number;
    avg_order_value: number;

    // Product stats
    total_products: number;
    published_products: number;
    draft_products: number;
    low_stock_products: number;
    out_of_stock_products: number;

    // Customer stats
    total_customers: number;
    customers_with_accounts: number;
    new_this_month: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    status: string;
    total: number;
    currency_code: string;
    customer_first_name: string | null;
    customer_last_name: string | null;
    email: string;
    created_at: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all stats in parallel
            const [analyticsOverview, productStats, customerStats, ordersData, salesTrend] = await Promise.all([
                api.getAnalyticsOverview(),
                api.getProductStats(),
                api.getCustomerStats(),
                api.getOrders(5, 0),
                api.getSalesTrend(30),
            ]);

            setStats({
                ...analyticsOverview,
                // Map new analytics keys to existing interface or update interface
                total_revenue: analyticsOverview.total_sales,
                total_orders: analyticsOverview.total_orders,
                avg_order_value: analyticsOverview.average_order_value,
                // Fallback for missing/deprecated keys
                ...productStats,
                ...customerStats,
                // These might need separate endpoints if not in analytics overview often
                pending_orders: 0,
                processing_orders: 0,
                shipped_orders: 0,
                delivered_orders: 0,
                cancelled_orders: 0,
                today_orders: 0,
                today_revenue: 0,
                month_orders: 0,
                month_revenue: 0,
            });

            // Fetch status breakdown separately
            (async () => {
                try {
                    const statusData = await api.getOrdersByStatus();
                    const statusMap: any = {};
                    statusData.forEach((s: any) => statusMap[`${s.status}_orders`] = s.count);
                    setStats(prev => prev ? ({ ...prev, ...statusMap }) : null);
                } catch (error) {
                    console.error('Error fetching order status data:', error);
                }
            })();

            setRecentOrders(ordersData || []);
            setChartData((salesTrend || []).map((d: any) => ({ ...d, revenue: d.sales }))); // Map sales to revenue for chart
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            // If it's a timeout or network error, it will now be caught here
            alert(error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
            </div>

            {/* Revenue & Orders Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-75" />
                    </div>
                    <p className="text-sm opacity-90 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
                    <p className="text-xs opacity-75 mt-2">
                        Today: {formatCurrency(stats?.today_revenue || 0)}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                        <TrendingUp size={20} className="opacity-75" />
                    </div>
                    <p className="text-sm opacity-90 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold">{stats?.total_orders || 0}</p>
                    <p className="text-xs opacity-75 mt-2">
                        Today: {stats?.today_orders || 0} orders
                    </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Package size={24} />
                        </div>
                    </div>
                    <p className="text-sm opacity-90 mb-1">Total Products</p>
                    <p className="text-3xl font-bold">{stats?.total_products || 0}</p>
                    <p className="text-xs opacity-75 mt-2">
                        {stats?.published_products || 0} published
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-lg shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                    <p className="text-sm opacity-90 mb-1">Total Customers</p>
                    <p className="text-3xl font-bold">{stats?.total_customers || 0}</p>
                    <p className="text-xs opacity-75 mt-2">
                        {stats?.new_this_month || 0} new this month
                    </p>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sales Overview (Last 30 Days)</h2>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => {
                                    if (!str) return '';
                                    const d = new Date(str);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                            />
                            <YAxis />
                            <Tooltip
                                formatter={(value: any) => [`$${(value / 100).toFixed(2)}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* This Month Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">This Month Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(stats?.month_revenue || 0)}
                            </p>
                        </div>
                        <DollarSign className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">This Month Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.month_orders || 0}</p>
                        </div>
                        <ShoppingCart className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(stats?.avg_order_value || 0)}
                            </p>
                        </div>
                        <TrendingUp className="text-purple-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-yellow-500" size={20} />
                        <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.pending_orders || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-blue-500" size={20} />
                        <p className="text-sm text-gray-600">Processing</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.processing_orders || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Truck className="text-purple-500" size={20} />
                        <p className="text-sm text-gray-600">Shipped</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.shipped_orders || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="text-green-500" size={20} />
                        <p className="text-sm text-gray-600">Delivered</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.delivered_orders || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="text-red-500" size={20} />
                        <p className="text-sm text-gray-600">Cancelled</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.cancelled_orders || 0}</p>
                </div>
            </div>

            {/* Inventory Alerts */}
            {(stats?.low_stock_products || 0) > 0 || (stats?.out_of_stock_products || 0) > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-orange-500 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="font-semibold text-orange-900 mb-2">Inventory Alerts</h3>
                            <div className="space-y-1 text-sm text-orange-800">
                                {(stats?.low_stock_products || 0) > 0 && (
                                    <p>⚠️ {stats?.low_stock_products} products are low on stock</p>
                                )}
                                {(stats?.out_of_stock_products || 0) > 0 && (
                                    <p>🚫 {stats?.out_of_stock_products} products are out of stock</p>
                                )}
                            </div>
                            <Link
                                href="/dashboard/products"
                                className="text-orange-600 hover:text-orange-700 font-medium mt-2 inline-block"
                            >
                                View Products →
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                    <Link
                        href="/dashboard/orders"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
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
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No orders yet
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
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
                                            <Link
                                                href={`/dashboard/orders/${order.id}`}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                            >
                                                <Eye size={16} />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
