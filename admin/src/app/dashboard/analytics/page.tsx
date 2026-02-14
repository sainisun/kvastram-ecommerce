'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3, TrendingUp, DollarSign, ShoppingCart,
    Users, Package, Calendar, ArrowUp, ArrowDown
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { api } from '@/lib/api';

interface TrendData {
    date: string;
    value: number;
}

interface AnalyticsData {
    revenue: { current: number; growth: number };
    orders: { current: number; growth: number };
    customers: { current: number; growth: number };
    revenueTrend: TrendData[];
    ordersTrend: TrendData[];
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const days = getDaysForPeriod(period);
            const previousDays = days * 2; // Fetch double to get previous period data

            // Use existing APIs that are available in backend
            const [overviewData, salesTrendData, ordersByStatus, previousSalesTrend] = await Promise.all([
                api.getAnalyticsOverview(),
                api.getSalesTrend(days),
                api.getOrdersByStatus(),
                api.getSalesTrend(previousDays)
            ]);

            // Calculate totals from orders by status
            // Backend returns array directly, not wrapped in data property
            const ordersByStatusArray = Array.isArray(ordersByStatus) ? ordersByStatus : ordersByStatus?.data || [];
            const totalOrders = ordersByStatusArray.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;

            // Calculate growth by comparing current period with previous period
            const safeSalesTrend = Array.isArray(salesTrendData) ? salesTrendData : [];
            const safePreviousTrend = Array.isArray(previousSalesTrend) ? previousSalesTrend : [];
            
            const currentRevenue = safeSalesTrend.reduce((sum: number, item: any) => sum + (item.sales || item.revenue || 0), 0);
            const previousRevenue = safePreviousTrend.slice(0, -days).reduce((sum: number, item: any) => sum + (item.sales || item.revenue || 0), 0);
            const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

            const currentOrders = safeSalesTrend.reduce((sum: number, item: any) => sum + (item.orders || 0), 0);
            const previousOrders = safePreviousTrend.slice(0, -days).reduce((sum: number, item: any) => sum + (item.orders || 0), 0);
            const ordersGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

            // For customers, we'll use a simplified calculation based on available data
            const customerGrowth = overviewData.customer_growth || 0;

            setData({
                revenue: {
                    current: currentRevenue || overviewData.total_sales || 0,
                    growth: Math.round(revenueGrowth * 10) / 10
                },
                orders: {
                    current: currentOrders || totalOrders,
                    growth: Math.round(ordersGrowth * 10) / 10
                },
                customers: {
                    current: overviewData.total_customers || 0,
                    growth: customerGrowth
                },
                revenueTrend: safeSalesTrend.map((item: any) => ({
                    date: item.date,
                    value: item.sales || item.revenue || 0
                })),
                ordersTrend: safeSalesTrend.map((item: any) => ({
                    date: item.date,
                    value: item.orders || 0
                }))
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysForPeriod = (period: string): number => {
        switch (period) {
            case 'week': return 7;
            case 'month': return 30;
            case 'year': return 365;
            default: return 30;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    };

    const formatPercent = (val: number) => {
        return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading analytics for {period}...</p>
                </div>
            </div>
        );
    }

    // Default data if null
    const safeData = data || {
        revenue: { current: 0, growth: 0 },
        orders: { current: 0, growth: 0 },
        customers: { current: 0, growth: 0 },
        revenueTrend: [],
        ordersTrend: []
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
                        <p className="text-gray-600">Track your store's performance and growth</p>
                    </div>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p as any)}
                                className={`px-4 py-2 rounded-lg font-medium capitalize ${period === p
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${safeData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {safeData.revenue.growth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            {formatPercent(safeData.revenue.growth)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue ({period})</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeData.revenue.current)}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <ShoppingCart className="text-blue-600" size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${safeData.orders.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {safeData.orders.growth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            {formatPercent(safeData.orders.growth)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders ({period})</p>
                    <p className="text-2xl font-bold text-gray-900">{safeData.orders.current}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${safeData.customers.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {safeData.customers.growth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                            {formatPercent(safeData.customers.growth)}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">New Customers ({period})</p>
                    <p className="text-2xl font-bold text-gray-900">{safeData.customers.current}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} />
                        Revenue Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={safeData.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    fontSize={12}
                                />
                                <YAxis
                                    fontSize={12}
                                    tickFormatter={(val) => `$${val / 100}`}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Orders Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safeData.ordersTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    fontSize={12}
                                />
                                <YAxis allowDecimals={false} fontSize={12} />
                                <Tooltip
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Performance Summary</h2>
                        <p className="text-gray-300">
                            You've made <span className="text-white font-bold">{formatCurrency(safeData.revenue.current)}</span> in revenue
                            from <span className="text-white font-bold">{safeData.orders.current}</span> orders this {period}.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center px-6 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Avg Order Value</p>
                            <p className="text-xl font-bold">
                                {safeData.orders.current > 0
                                    ? formatCurrency(safeData.revenue.current / safeData.orders.current)
                                    : '$0.00'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
