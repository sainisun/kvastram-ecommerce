'use client';

import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Payment Form Component
function PaymentForm({
    orderId,
    // clientSecret is passed for Stripe Elements but may be used by parent
    clientSecret: _clientSecret,
    onSuccess,
    onError
}: {
    orderId: string;
    clientSecret: string;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/success?order_id=${orderId}`,
            },
            redirect: 'if_required',
        });

        if (error) {
            onError(error.message || 'Payment failed');
            setIsProcessing(false);
        } else {
            // Payment succeeded without redirect
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-stone-50 p-6 border border-stone-200">
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4">
                    Payment Details
                </h4>
                <PaymentElement />
            </div>

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <CreditCard size={16} />
                {isProcessing ? 'Processing Payment...' : 'Pay Now'}
            </button>
        </form>
    );
}

export default function CheckoutPage() {
    const { customer, loading: authLoading } = useAuth();
    const { items, cartTotal, clearCart } = useCart();
    const { currentRegion } = useShop();
    const router = useRouter();

    // Initialize all hooks FIRST - before any conditionals
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
    const [orderId, setOrderId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Discount State
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form data hook moved BEFORE conditional return
    const [formData, setFormData] = useState({
        email: customer?.email || '',
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        address_1: '',
        address_2: '',
        city: '',
        country_code: '',
        postal_code: '',
        phone: customer?.phone || ''
    });

    // Update form data when customer data loads
    useEffect(() => {
        if (customer) {
            setFormData(prev => ({
                ...prev,
                email: customer.email || prev.email,
                first_name: customer.first_name || prev.first_name,
                last_name: customer.last_name || prev.last_name,
                phone: customer.phone || prev.phone
            }));
        }
    }, [customer]);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoMessage(null);
        try {
            const res = await api.validateCoupon(promoCode, cartTotal);
            setDiscount({ code: res.code, amount: res.discount_amount });
            setPromoMessage({ type: 'success', text: `Coupon ${res.code} applied! -$${(res.discount_amount / 100).toFixed(2)}` });
        } catch {
            setDiscount(null);
            setPromoMessage({ type: 'error', text: 'Invalid promo code' });
        } finally {
            setPromoLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !customer) {
            router.push('/login?redirect=/checkout');
        }
    }, [authLoading, customer, router]);

    // Show loading state instead of returning null
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse text-stone-400">Loading...</div>
            </div>
        );
    }

    // Redirect state
    if (!customer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-stone-500 mb-4">Please log in to continue</p>
                    <Link href="/login?redirect=/checkout" className="text-stone-900 underline">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    const inputClasses = "w-full bg-transparent border-b border-stone-200 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors font-light";
    const labelClasses = "block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1";

    if (items.length === 0 && step !== 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
                <h1 className="text-3xl font-serif mb-4 text-stone-900">Your cart is empty</h1>
                <Link href="/" className="text-stone-500 hover:text-black border-b border-stone-300 pb-1 transition-colors">
                    Return to Shop
                </Link>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
                <div className="w-20 h-20 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle size={32} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-serif mb-4 text-stone-900">Order Confirmed</h1>
                <p className="text-stone-500 mb-8 max-w-md font-light">
                    Thank you for choosing Kvastram. Your order #{orderId} has been confirmed and payment received. We will begin preparing it for shipment.
                </p>
                <Link href="/" className="bg-stone-900 text-white px-8 py-3 rounded-none uppercase tracking-widest text-xs font-bold hover:bg-stone-800 transition-colors">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleShippingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!currentRegion) throw new Error('No region selected');

            const payload = {
                region_id: currentRegion.id,
                email: formData.email,
                currency_code: currentRegion.currency_code,
                items: items.map(i => ({
                    variant_id: i.variantId,
                    quantity: i.quantity
                })),
                shipping_address: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    address_1: formData.address_1,
                    address_2: formData.address_2 || undefined,
                    city: formData.city,
                    country_code: formData.country_code,
                    postal_code: formData.postal_code,
                    phone: formData.phone || undefined
                },
                discount_code: discount?.code
            };

            // Create order
            const res = await api.createOrder(payload);
            const newOrderId = res.order.id;
            setOrderId(res.order.display_id);

            // Create payment intent
            const paymentRes = await api.createPaymentIntent(newOrderId);
            setClientSecret(paymentRes.client_secret);

            // Move to payment step
            setStep('payment');

        } catch {
            setError('Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setStep('success');
        clearCart();
    };

    const handlePaymentError = (msg: string) => {
        setError(msg);
    };

    const finalTotal = cartTotal - (discount?.amount || 0);

    return (
        <div className="min-h-screen bg-white">
            <div className="grid lg:grid-cols-2 min-h-screen">
                {/* Left: Form */}
                <div className="p-8 lg:p-20 lg:border-r border-stone-100 order-2 lg:order-1">
                    <div className="max-w-lg mx-auto">
                        <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-black mb-12 text-sm transition-colors">
                            <ArrowLeft size={16} />
                            Back to Shop
                        </Link>

                        <div className="mb-12">
                            <h2 className="text-3xl font-serif text-stone-900 mb-2">Checkout</h2>
                            <p className="text-stone-500 font-light text-sm flex items-center gap-2">
                                <Lock size={14} /> Secure Checkout
                            </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-stone-900' : 'text-stone-400'}`}>
                                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                                    1
                                </span>
                                <span className="text-sm font-medium">Shipping</span>
                            </div>
                            <div className="flex-1 h-px bg-stone-200"></div>
                            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-stone-900' : 'text-stone-400'}`}>
                                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                                    2
                                </span>
                                <span className="text-sm font-medium">Payment</span>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        {step === 'shipping' ? (
                            <form onSubmit={handleShippingSubmit} className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-2">Contact</h3>
                                    <div className="space-y-4">
                                        <label htmlFor="email" className={labelClasses}>Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={inputClasses}
                                            autoComplete="email"
                                            aria-required="true"
                                            aria-describedby="email-help"
                                        />
                                        <span id="email-help" className="sr-only">Enter your email address for order updates</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-2">Shipping Address</h3>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label htmlFor="first_name" className={labelClasses}>First Name</label>
                                            <input id="first_name" type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className={inputClasses} autoComplete="given-name" aria-required="true" />
                                        </div>
                                        <div>
                                            <label htmlFor="last_name" className={labelClasses}>Last Name</label>
                                            <input id="last_name" type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className={inputClasses} autoComplete="family-name" aria-required="true" />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="address_1" className={labelClasses}>Address (Line 1)</label>
                                        <input id="address_1" type="text" name="address_1" required value={formData.address_1} onChange={handleChange} className={inputClasses} autoComplete="street-address" aria-required="true" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label htmlFor="city" className={labelClasses}>City</label>
                                            <input id="city" type="text" name="city" required value={formData.city} onChange={handleChange} className={inputClasses} autoComplete="address-level2" aria-required="true" />
                                        </div>
                                        <div>
                                            <label htmlFor="postal_code" className={labelClasses}>Postal Code</label>
                                            <input id="postal_code" type="text" name="postal_code" required value={formData.postal_code} onChange={handleChange} className={inputClasses} autoComplete="postal-code" aria-required="true" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="country_code" className={labelClasses}>Country Code (ISO 2)</label>
                                        <input id="country_code" type="text" name="country_code" required maxLength={2} placeholder="e.g. US" value={formData.country_code} onChange={handleChange} className={`${inputClasses} uppercase`} autoComplete="country" aria-required="true" aria-describedby="country-help" />
                                        <span id="country-help" className="sr-only">Enter 2-letter country code (e.g., US, UK, IN)</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50"
                                    aria-live="polite"
                                    aria-busy={loading}
                                >
                                    {loading ? 'Processing...' : 'Continue to Payment'}
                                </button>
                            </form>
                        ) : (
                            <div>
                                <h3 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-2">Payment</h3>
                                {clientSecret && (
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <PaymentForm
                                            orderId={orderId}
                                            clientSecret={clientSecret}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                        />
                                    </Elements>
                                )}
                                <button
                                    onClick={() => setStep('shipping')}
                                    className="w-full mt-4 border border-stone-300 text-stone-600 py-3 font-medium text-sm hover:bg-stone-50 transition-colors"
                                >
                                    Back to Shipping
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="bg-stone-50 p-8 lg:p-20 order-1 lg:order-2">
                    <div className="max-w-lg mx-auto sticky top-24">
                        <h2 className="text-xl font-serif text-stone-900 mb-8">Order Summary</h2>

                        <div className="space-y-6 mb-8">
                            {items.map((item) => (
                                <div key={item.variantId} className="flex gap-4">
                                    <div className="relative w-20 h-24 bg-white border border-stone-200">
                                        {item.thumbnail ? (
                                            <Image
                                                src={item.thumbnail}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-xs text-center p-1">No Image</div>
                                        )}
                                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white text-[10px] flex items-center justify-center rounded-full">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-serif text-stone-900">{item.title}</p>
                                        <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-stone-900">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency.toUpperCase() }).format((item.price * item.quantity) / 100)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Promo Code Input */}
                        {step === 'shipping' && (
                            <div className="mb-6 pb-6 border-b border-stone-100">
                                <label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Promo Code</label>
                                <div className="flex gap-0 border-b border-stone-300 focus-within:border-stone-900 transition-colors">
                                    <input
                                        type="text"
                                        placeholder="ENTER CODE"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="flex-1 bg-transparent py-2 text-sm font-serif text-stone-900 placeholder-stone-400 focus:outline-none uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyPromo}
                                        disabled={promoLoading || !promoCode}
                                        className="text-stone-900 text-xs font-bold uppercase tracking-widest hover:text-stone-600 disabled:opacity-30 transition-colors px-2"
                                    >
                                        {promoLoading ? 'Adjusting...' : 'Apply'}
                                    </button>
                                </div>
                                {promoMessage && (
                                    <p className={`text-xs mt-2 ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                        {promoMessage.text}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="border-t border-stone-200 pt-6 space-y-3 text-sm">
                            <div className="flex justify-between text-stone-600">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency: items[0]?.currency.toUpperCase() || 'USD' }).format(cartTotal / 100)}</span>
                            </div>

                            {discount && (
                                <div className="flex justify-between text-green-600">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        <span className="text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-500">{discount.code}</span>
                                    </div>
                                    <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency: items[0]?.currency.toUpperCase() || 'USD' }).format(discount.amount / 100)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-stone-600">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between text-lg font-serif text-stone-900 pt-4 border-t border-stone-200">
                                <span>Total</span>
                                <span>
                                    {new Intl.NumberFormat(undefined, {
                                        style: 'currency',
                                        currency: items[0]?.currency.toUpperCase() || 'USD'
                                    }).format(finalTotal / 100)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 bg-white p-4 border border-stone-100 flex gap-3 text-stone-500 text-xs">
                            <ShieldCheck size={32} className="text-stone-300 shrink-0" />
                            <p>
                                Every purchase is backed by our Authenticity Guarantee.
                                We ensure the highest standards of craftsmanship.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
