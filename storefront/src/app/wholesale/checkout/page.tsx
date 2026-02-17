'use client';

import { useAuth } from '@/context/auth-context';
import { useWholesaleCart } from '@/context/wholesale-cart-context';
import { useWholesale } from '@/context/wholesale-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, CheckCircle, FileText, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CountrySelect from '@/components/ui/CountrySelect';

const PAYMENT_TERMS = [
    { value: 'net_30', label: 'Net 30', description: 'Payment due within 30 days' },
    { value: 'net_45', label: 'Net 45', description: 'Payment due within 45 days' },
    { value: 'net_60', label: 'Net 60', description: 'Payment due within 60 days' },
];

export default function WholesaleCheckoutPage() {
    const { customer } = useAuth();
    const { items, cartSummary, validation, isWholesaleCart, validateCart } = useWholesaleCart();
    const { wholesaleInfo } = useWholesale();
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    
    const [formData, setFormData] = useState({
        po_number: '',
        payment_terms: 'net_30',
        notes: '',
        shipping_address: {
            first_name: '',
            last_name: '',
            company: '',
            address_1: '',
            address_2: '',
            city: '',
            postal_code: '',
            province: '',
            country_code: 'US',
            phone: '',
        },
    });

    // Redirect if not wholesale customer
    useEffect(() => {
        if (!isWholesaleCart && !loading) {
            router.push('/checkout');
        }
    }, [isWholesaleCart, router, loading]);

    // Validate cart on load
    useEffect(() => {
        validateCart();
    }, [validateCart]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate cart
        const validationResult = await validateCart();
        if (!validationResult.isValid) {
            setError('Please fix cart validation errors before proceeding');
            setLoading(false);
            return;
        }

        try {
            const orderData = {
                email: customer?.email,
                ...formData,
                items: items.map(item => ({
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    unit_price: item.finalPrice || item.price,
                })),
                is_wholesale: true,
                wholesale_tier: wholesaleInfo.tier,
                subtotal: cartSummary.subtotal,
                tier_discount: cartSummary.tierDiscount,
                bulk_discount: cartSummary.bulkDiscount,
                total: cartSummary.total,
            };

            const result = await api.createWholesaleOrder(orderData);
            
            if (result.success) {
                setOrderPlaced(true);
                setOrderId(result.order.id);
            } else {
                setError(result.error || 'Failed to place order');
            }
        } catch (err: any) {
            console.error('Order error:', err);
            setError(err?.message || 'An error occurred while placing your order');
        } finally {
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-stone-50 py-20">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-stone-900 mb-4">Order Submitted Successfully!</h1>
                        <p className="text-stone-600 mb-2">Your wholesale order has been received.</p>
                        <p className="text-stone-500 mb-6">Order ID: <span className="font-mono">{orderId}</span></p>
                        
                        <div className="bg-stone-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-stone-600">
                                Payment terms: <strong>{PAYMENT_TERMS.find(t => t.value === formData.payment_terms)?.label}</strong>
                            </p>
                            <p className="text-sm text-stone-500 mt-1">
                                An invoice will be sent to your email shortly.
                            </p>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Link href="/account/orders" className="bg-stone-900 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors">
                                View Orders
                            </Link>
                            <Link href="/products" className="border border-stone-900 text-stone-900 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-50 transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-stone-50 py-20">
                <div className="max-w-2xl mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-stone-900 mb-4">Your cart is empty</h1>
                    <Link href="/products" className="text-stone-600 hover:text-stone-900 underline">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/cart" className="flex items-center text-stone-600 hover:text-stone-900 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Cart
                    </Link>
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-stone-700" />
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900">Wholesale Checkout</h1>
                            <p className="text-stone-600 text-sm">{wholesaleInfo.companyName} - {wholesaleInfo.tier} tier</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Validation Errors */}
                            {validation.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-red-700 mb-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <h3 className="font-bold">Cart Validation Errors</h3>
                                    </div>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {validation.errors.map((error, idx) => (
                                            <li key={idx}>{error.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* PO Number */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2" />
                                    Purchase Order
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">
                                            PO Number <span className="text-stone-400">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.po_number}
                                            onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500 focus:border-stone-500"
                                            placeholder="Enter your PO number"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Terms */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Payment Terms
                                </h2>
                                <div className="space-y-3">
                                    {PAYMENT_TERMS.map((term) => (
                                        <label
                                            key={term.value}
                                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                                formData.payment_terms === term.value
                                                    ? 'border-stone-900 bg-stone-50'
                                                    : 'border-stone-200 hover:border-stone-400'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_terms"
                                                value={term.value}
                                                checked={formData.payment_terms === term.value}
                                                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                                className="w-4 h-4 text-stone-900 focus:ring-stone-500"
                                            />
                                            <div className="ml-3">
                                                <p className="font-medium text-stone-900">{term.label}</p>
                                                <p className="text-sm text-stone-500">{term.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-lg font-bold text-stone-900 mb-4">Shipping Address</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.shipping_address.first_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, first_name: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.shipping_address.last_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, last_name: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Company</label>
                                        <input
                                            type="text"
                                            value={formData.shipping_address.company}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, company: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                            placeholder="Company name (optional)"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.shipping_address.address_1}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, address_1: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                            placeholder="Street address"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            value={formData.shipping_address.address_2}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, address_2: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                            placeholder="Apartment, suite, etc. (optional)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.shipping_address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, city: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Postal Code</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.shipping_address.postal_code}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, postal_code: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Country</label>
                                        <CountrySelect
                                            name="shipping_country"
                                            value={formData.shipping_address.country_code}
                                            onChange={(value) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, country_code: value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.shipping_address.phone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shipping_address: { ...formData.shipping_address, phone: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order Notes */}
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-lg font-bold text-stone-900 mb-4">Order Notes</h2>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-stone-200 rounded-sm focus:ring-2 focus:ring-stone-500"
                                    placeholder="Any special instructions for your order..."
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || validation.errors.length > 0}
                                className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Submit Wholesale Order'}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
                            <h2 className="text-lg font-bold text-stone-900 mb-4">Order Summary</h2>
                            
                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.variantId} className="flex gap-4">
                                        {item.thumbnail && (
                                            <div className="relative w-16 h-16 flex-shrink-0">
                                                <Image
                                                    src={item.thumbnail}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover rounded-sm"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-stone-900 text-sm">{item.title}</p>
                                            <p className="text-xs text-stone-500">SKU: {item.sku}</p>
                                            <p className="text-xs text-stone-600 mt-1">
                                                Qty: {item.quantity} × ${((item.finalPrice || item.price) / 100).toFixed(2)}
                                            </p>
                                            {item.moq && item.moq > 1 && (
                                                <p className="text-xs text-amber-600">MOQ: {item.moq}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-stone-900">
                                                ${(((item.finalPrice || item.price) * item.quantity) / 100).toFixed(2)}
                                            </p>
                                            {(item.tierDiscount ?? 0) > 0 && (
                                                <p className="text-xs text-green-600">-{item.tierDiscount}% tier</p>
                                            )}
                                            {(item.bulkDiscount ?? 0) > 0 && (
                                                <p className="text-xs text-blue-600">-{item.bulkDiscount}% bulk</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-stone-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Subtotal</span>
                                    <span className="font-medium">${(cartSummary.subtotal / 100).toFixed(2)}</span>
                                </div>
                                {cartSummary.tierDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Tier Discount</span>
                                        <span>-${(cartSummary.tierDiscount / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                {cartSummary.bulkDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-blue-600">
                                        <span>Bulk Discount</span>
                                        <span>-${(cartSummary.bulkDiscount / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-200">
                                    <span>Total</span>
                                    <span>${(cartSummary.total / 100).toFixed(2)}</span>
                                </div>
                                {cartSummary.savings > 0 && (
                                    <p className="text-sm text-green-600 text-center">
                                        You saved ${(cartSummary.savings / 100).toFixed(2)}!
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-stone-50 rounded-lg">
                                <p className="text-xs text-stone-600 text-center">
                                    Payment terms: <strong>{PAYMENT_TERMS.find(t => t.value === formData.payment_terms)?.label}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
