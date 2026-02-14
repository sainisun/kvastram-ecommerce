'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign, User, Edit } from 'lucide-react';
import { api } from '@/lib/api';

interface Customer {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    has_account: boolean;
    created_at: string;
    updated_at: string;
}

interface Address {
    id: string;
    first_name: string;
    last_name: string;
    company: string | null;
    address_1: string;
    address_2: string | null;
    city: string;
    province: string | null;
    postal_code: string;
    country_code: string;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
}

interface CustomerStats {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    last_order_date: string | null;
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomerDetails();
    }, [customerId]);

    const fetchCustomerDetails = async () => {
        try {
            setLoading(true);
            const data = await api.getCustomer(customerId);
            setCustomer(data.customer);
            setAddresses(data.addresses);
            setOrders(data.orders);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading customer details...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Customer not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    Back to Customers
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {customer.first_name && customer.last_name
                                ? `${customer.first_name} ${customer.last_name}`
                                : 'Customer Details'}
                        </h1>
                        <p className="text-gray-600">{customer.email}</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <Edit size={20} />
                        Edit Customer
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                            </div>
                            <ShoppingBag className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_spent)}</p>
                            </div>
                            <DollarSign className="text-green-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.average_order_value)}</p>
                            </div>
                            <DollarSign className="text-purple-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Last Order</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {stats.last_order_date ? formatDate(stats.last_order_date) : 'No orders'}
                                </p>
                            </div>
                            <Calendar className="text-amber-500" size={32} />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Customer Info & Addresses */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {customer.first_name && customer.last_name
                                            ? `${customer.first_name} ${customer.last_name}`
                                            : 'Not provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                                </div>
                            </div>

                            {customer.phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="text-gray-400 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <Calendar className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Customer Since</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(customer.created_at)}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <span
                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.has_account
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {customer.has_account ? 'Registered Account' : 'Guest Customer'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Addresses</h2>
                        {addresses.length === 0 ? (
                            <p className="text-sm text-gray-500">No addresses saved</p>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((address) => (
                                    <div key={address.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {address.first_name} {address.last_name}
                                                </p>
                                                {address.company && <p className="text-gray-600">{address.company}</p>}
                                                <p className="text-gray-600">{address.address_1}</p>
                                                {address.address_2 && <p className="text-gray-600">{address.address_2}</p>}
                                                <p className="text-gray-600">
                                                    {address.city}, {address.province} {address.postal_code}
                                                </p>
                                                <p className="text-gray-600">{address.country_code}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Orders */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Order History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                No orders yet
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                                                    >
                                                        #{order.order_number}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(order.total)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
