'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

interface OrderStatus {
    id: string;
    status: string;
    created_at: string;
    tracking_number?: string;
    shipping_carrier?: string;
    items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>;
    shipping_address: {
        first_name: string;
        last_name: string;
        address_1: string;
        city: string;
        country: string;
        postal_code: string;
    };
}

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const data = await api.getOrder(orderId);
            setOrder(data.order);
        } catch (err: any) {
            setError(err.message || 'Order not found. Please check your order ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return <CheckCircle className="text-green-500" size={24} />;
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className="text-blue-500" size={24} />;
            case 'processing':
            case 'confirmed':
                return <Package className="text-amber-500" size={24} />;
            case 'cancelled':
                return <XCircle className="text-red-500" size={24} />;
            default:
                return <Clock className="text-stone-400" size={24} />;
        }
    };

    const getStatusSteps = (status: string) => {
        const steps = [
            { key: 'confirmed', label: 'Order Confirmed' },
            { key: 'processing', label: 'Processing' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'out_for_delivery', label: 'Out for Delivery' },
            { key: 'delivered', label: 'Delivered' },
        ];

        const currentIndex = steps.findIndex(s => s.key === status?.toLowerCase());
        
        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentIndex && currentIndex > -1,
            current: index === currentIndex,
        }));
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-100">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-900">Track Your Order</h1>
                    <p className="text-stone-600 font-light">
                        Enter your order ID to track your shipment
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4 mb-12">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Order ID</label>
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="e.g., ORD-12345"
                                className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Searching...' : (
                            <>
                                <Search size={16} /> Track Order
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 text-center text-red-600">
                        {error}
                    </div>
                )}

                {order && (
                    <div className="space-y-8">
                        {/* Order Info */}
                        <div className="bg-stone-50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-stone-500">Order ID</p>
                                    <p className="text-lg font-medium text-stone-900">{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase text-stone-500">Status</p>
                                    <p className="text-lg font-medium text-stone-900 capitalize">{order.status}</p>
                                </div>
                            </div>
                            
                            {order.tracking_number && (
                                <div className="pt-4 border-t border-stone-200">
                                    <p className="text-xs font-bold uppercase text-stone-500 mb-1">Tracking</p>
                                    <p className="text-stone-700">
                                        {order.shipping_carrier}: {order.tracking_number}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Progress Steps */}
                        <div>
                            <h3 className="text-lg font-serif text-stone-900 mb-6">Delivery Progress</h3>
                            <div className="relative">
                                <div className="absolute top-5 left-0 right-0 h-0.5 bg-stone-200">
                                    <div 
                                        className="h-full bg-stone-900 transition-all duration-500"
                                        style={{ 
                                            width: `${(getStatusSteps(order.status).filter(s => s.completed).length / 5) * 100}%` 
                                        }}
                                    />
                                </div>
                                <div className="relative flex justify-between">
                                    {getStatusSteps(order.status).map((step, index) => (
                                        <div key={step.key} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                                                step.completed ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'
                                            }`}>
                                                {step.completed ? <CheckCircle size={20} /> : <span className="text-sm">{index + 1}</span>}
                                            </div>
                                            <p className={`mt-2 text-xs text-center ${step.completed ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                            <h3 className="text-lg font-serif text-stone-900 mb-4">Shipping Address</h3>
                            <div className="flex items-start gap-3 text-stone-600">
                                <MapPin size={20} className="flex-shrink-0 mt-0.5" />
                                <div>
                                    <p>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                                    <p>{order.shipping_address?.address_1}</p>
                                    <p>{order.shipping_address?.city}, {order.shipping_address?.postal_code}</p>
                                    <p>{order.shipping_address?.country}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-lg font-serif text-stone-900 mb-4">Order Items</h3>
                            <div className="space-y-3">
                                {(order.items || []).map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 border-b border-stone-100">
                                        <div>
                                            <p className="font-medium text-stone-900">{item.title}</p>
                                            <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-stone-900">
                                            ${(item.price / 100).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
