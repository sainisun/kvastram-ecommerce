'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { OrderWithDetails } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, User, LogOut, MapPin } from 'lucide-react';
import { UserCard } from '@/components/account/UserCard';
import { QuickGrid } from '@/components/account/QuickGrid';
import { SettingsList } from '@/components/account/SettingsList';

export default function AccountPage() {
    const { customer, loading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!loading && !customer) {
            router.push('/login');
        }
    }, [loading, customer, router]);

    useEffect(() => {
        api.getCustomerOrders()
            .then(data => {
                setOrders(data.orders || []);
                setOrdersLoading(false);
            })
            .catch(() => {
                setOrders([]);
                setOrdersLoading(false);
            });
    }, []);

    if (loading || !customer) return null;

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Mobile Layout */}
            <div className="md:hidden">
                {/* Header */}
                <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
                    <div className="px-4 h-14 flex items-center justify-center">
                        <h1 className="text-lg font-medium text-stone-900">Profile</h1>
                    </div>
                </div>

                {/* User Card */}
                <UserCard 
                    firstName={customer.first_name || ''}
                    lastName={customer.last_name || ''}
                    email={customer.email || ''}
                />

                {/* Quick Access Grid */}
                <QuickGrid />

                {/* Settings List */}
                <div className="mt-4">
                    <SettingsList />
                </div>

                {/* Spacer for bottom nav */}
                <div className="h-20" />
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block pt-24 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <div className="lg:w-64 shrink-0">
                            <div className="bg-white border border-stone-200 shadow-sm overflow-hidden sticky top-24">
                                <div className="p-6 border-b border-stone-100">
                                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                                        <User size={24} className="text-stone-400" />
                                    </div>
                                    <p className="font-medium text-stone-900">{customer.first_name} {customer.last_name}</p>
                                    <p className="text-sm text-stone-500">{customer.email}</p>
                                </div>
                                <nav className="p-4">
                                    <Link href="/account" className="block px-4 py-2 text-sm font-medium bg-stone-50 text-stone-900 mb-1">
                                        Overview
                                    </Link>
                                    <Link href="/account/orders" className="block px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 mb-1">
                                        Orders
                                    </Link>
                                    <Link href="/account/profile" className="block px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 mb-1">
                                        Profile
                                    </Link>
                                    <Link href="/account/addresses" className="block px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 mb-1 flex items-center gap-2">
                                        <MapPin size={14} /> Addresses
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 mt-4"
                                    >
                                        <LogOut size={14} /> Sign Out
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-serif text-stone-900 mb-8">My Account</h1>

                            {/* Quick Stats */}
                            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white border border-stone-200 p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Package size={20} className="text-stone-400" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Total Orders</h3>
                                    </div>
                                    <p className="text-3xl font-serif text-stone-900">{orders.length}</p>
                                </div>
                                <div className="bg-white border border-stone-200 p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <User size={20} className="text-stone-400" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Member Since</h3>
                                    </div>
                                    <p className="text-lg font-serif text-stone-900">
                                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                                    <h2 className="text-lg font-serif text-stone-900">Recent Orders</h2>
                                    <Link href="/account/orders" className="text-sm text-stone-500 hover:text-stone-900">View All →</Link>
                                </div>

                                {ordersLoading ? (
                                    <div className="p-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mx-auto"></div>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Package size={48} className="mx-auto text-stone-300 mb-4" />
                                        <p className="text-stone-500 mb-4">No orders yet</p>
                                        <Link href="/" className="inline-block bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors">
                                            Start Shopping
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-stone-100">
                                        {orders.slice(0, 5).map(order => (
                                            <div key={order.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                                <div>
                                                    <Link href={`/account/orders/${order.id}`} className="font-medium text-stone-900 hover:text-stone-600">
                                                        Order #{order.display_id}
                                                    </Link>
                                                    <p className="text-sm text-stone-500 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium text-stone-900">
                                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: order.currency_code?.toUpperCase() || 'INR' }).format(order.total / 100)}
                                                    </span>
                                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${order.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        order.status === 'canceled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
