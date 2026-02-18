'use client';

import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import SecurityBadges, { PaymentIcons } from '@/components/ui/SecurityBadges';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import CountrySelect from '@/components/ui/CountrySelect';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

// Initialize Stripe
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

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

// Express Checkout Component (Apple Pay / Google Pay)
function ExpressCheckoutForm({
    orderId,
    onSuccess,
    onError
}: {
    orderId: string;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!stripe || !elements) return;
        
        setIsLoading(true);
        
        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout/success?order_id=${orderId}`,
                },
                redirect: 'if_required',
            });

            if (error) {
                onError(error.message || 'Express payment failed');
            } else {
                onSuccess();
            }
        } catch (err) {
            onError('An unexpected error occurred during payment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <ExpressCheckoutElement
                onConfirm={handleConfirm}
                options={{
                    paymentMethods: {
                        applePay: 'always',
                        googlePay: 'always',
                        link: 'auto',
                    },
                    buttonType: {
                        applePay: 'buy',
                        googlePay: 'buy',
                    },
                    buttonHeight: 44,
                }}
            />
            {isLoading && (
                <div className="mt-2 text-center text-sm text-stone-600">
                    Processing payment...
                </div>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    const { customer, loading: authLoading } = useAuth();
    const { items, cartTotal, clearCart } = useCart();
    const { currentRegion, settings } = useShop();
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

    // PHASE 1.3: Shipping Options State
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<any>(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000);

    // PHASE 1.4: Tax Calculation State
    const [taxAmount, setTaxAmount] = useState(0);
    const [taxLoading, setTaxLoading] = useState(false);
    const [taxName, setTaxName] = useState('Tax');

    // PHASE 1.5: Terms Acceptance State
    const [acceptTerms, setAcceptTerms] = useState(false);

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

    // PHASE 1.3: Fetch shipping options when country changes
    useEffect(() => {
        const fetchShippingOptions = async () => {
            if (!formData.country_code) {
                setShippingOptions([]);
                setSelectedShipping(null);
                return;
            }

            setShippingLoading(true);
            try {
                const data = await api.getShippingOptions(formData.country_code, currentRegion?.id);
                if (data.options && data.options.length > 0) {
                    setShippingOptions(data.options);
                    setFreeShippingThreshold(data.free_shipping_threshold || 25000);
                    // Auto-select first option
                    setSelectedShipping(data.options[0]);
                }
            } catch (error) {
                console.error('Failed to fetch shipping options:', error);
                setShippingOptions([]);
            } finally {
                setShippingLoading(false);
            }
        };

        // Debounce the fetch
        const timer = setTimeout(fetchShippingOptions, 300);
        return () => clearTimeout(timer);
    }, [formData.country_code, currentRegion?.id]);

    // PHASE 1.4: Fetch tax when country or cart total changes
    useEffect(() => {
        const fetchTax = async () => {
            if (!formData.country_code || cartTotal === 0) {
                setTaxAmount(0);
                return;
            }

            setTaxLoading(true);
            try {
                // Calculate subtotal after discount
                const subtotal = cartTotal - (discount?.amount || 0);
                // Pass settings to use dynamic tax rates from backend
                const data = await api.calculateTax(formData.country_code, subtotal, currentRegion?.id, settings || undefined);
                if (data.tax_amount) {
                    setTaxAmount(data.tax_amount);
                    setTaxName(data.tax_name || 'Tax');
                }
            } catch (error) {
                console.error('Failed to calculate tax:', error);
                setTaxAmount(0);
            } finally {
                setTaxLoading(false);
            }
        };

        const timer = setTimeout(fetchTax, 500);
        return () => clearTimeout(timer);
    }, [formData.country_code, cartTotal, discount?.amount, currentRegion?.id]);

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

    // PHASE 1.1: Allow guest checkout - removed login requirement
    // Guests can now checkout without creating an account
    
    // Show loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse text-stone-400">Loading...</div>
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

    const handleAddressSelect = (address: { address_1: string; city: string; postal_code: string; country: string }) => {
        setFormData(prev => ({
            ...prev,
            address_1: address.address_1 || prev.address_1,
            city: address.city || prev.city,
            postal_code: address.postal_code || prev.postal_code,
            country_code: address.country || prev.country_code
        }));
    };

    const handleShippingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!currentRegion) throw new Error('No region selected');
            
            // PHASE 1.5: Validate terms acceptance
            if (!acceptTerms) {
                throw new Error('Please accept the Terms & Conditions and Privacy Policy to continue');
            }

            // PHASE 1.3: Validate shipping method selection
            if (!selectedShipping) {
                throw new Error('Please select a shipping method');
            }

            // Calculate final shipping cost
            const shippingCost = cartTotal >= freeShippingThreshold ? 0 : (selectedShipping?.price || 0);

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
                shipping_method: selectedShipping.id,
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

        } catch (err: any) {
            console.error('Order creation error:', err);
            const errorMsg = err?.message || 'Failed to create order. Please try again.';
            setError(errorMsg);
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

    // PHASE 1.3: Calculate shipping cost
    const shippingCost = selectedShipping 
        ? (cartTotal >= freeShippingThreshold ? 0 : (selectedShipping.price || 0))
        : 0;
    
    // PHASE 1.4: Final total includes subtotal - discount + shipping + tax
    const finalTotal = cartTotal - (discount?.amount || 0) + shippingCost + taxAmount;

    // Currency for display
    const currency = currentRegion?.currency_code || items[0]?.currency?.toUpperCase() || 'USD';

    return (
        <div className="min-h-screen bg-white">
            {/* PHASE 3.2: Mobile-first responsive layout */}
            <div className="grid lg:grid-cols-2 min-h-screen">
                {/* Left: Form */}
                <div className="p-4 md:p-8 lg:p-20 lg:border-r border-stone-100 order-2 lg:order-1">
                    <div className="max-w-lg mx-auto">
                        <Link href="/" className="inline-flex items-center gap-2 text-stone-400 hover:text-black mb-6 md:mb-12 text-sm transition-colors">
                            <ArrowLeft size={16} />
                            <span className="hidden sm:inline">Back to Shop</span>
                            <span className="sm:hidden">Back</span>
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
                                    {/* PHASE 3.2: Mobile-first responsive grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
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
                                        <AddressAutocomplete
                                            value={formData.address_1}
                                            onChange={(value) => setFormData(prev => ({ ...prev, address_1: value }))}
                                            onAddressSelect={handleAddressSelect}
                                            className={inputClasses}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
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
                                        <label className={labelClasses}>Country</label>
                                        <CountrySelect
                                            name="country"
                                            value={formData.country_code}
                                            onChange={(code) => setFormData(prev => ({ ...prev, country_code: code }))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* PHASE 1.3: Shipping Method Selection */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-2">Shipping Method</h3>
                                    
                                    {shippingLoading ? (
                                        <div className="py-4 text-center text-stone-400">Loading shipping options...</div>
                                    ) : shippingOptions.length > 0 ? (
                                        <div className="space-y-3">
                                            {shippingOptions.map((option) => {
                                                const isFree = option.price === 0 || cartTotal >= freeShippingThreshold;
                                                const displayPrice = isFree ? 0 : option.price;
                                                
                                                return (
                                                    <label
                                                        key={option.id}
                                                        className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                                                            selectedShipping?.id === option.id
                                                                ? 'border-stone-900 bg-stone-50'
                                                                : 'border-stone-200 hover:border-stone-400'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="shipping_method"
                                                                value={option.id}
                                                                checked={selectedShipping?.id === option.id}
                                                                onChange={() => setSelectedShipping(option)}
                                                                className="w-4 h-4 text-stone-900 focus:ring-stone-900"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-stone-900">{option.name}</p>
                                                                <p className="text-sm text-stone-500">{option.description}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`font-medium ${isFree ? 'text-green-600' : 'text-stone-900'}`}>
                                                            {isFree ? 'FREE' : `$${(displayPrice / 100).toFixed(2)}`}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                            
                                            {cartTotal >= freeShippingThreshold && selectedShipping && (
                                                <p className="text-sm text-green-600 bg-green-50 p-3 border border-green-200">
                                                    🎉 You've unlocked FREE shipping!
                                                </p>
                                            )}
                                        </div>
                                    ) : formData.country_code ? (
                                        <div className="py-4 text-center text-stone-400">
                                            No shipping options available for this country
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-stone-400">
                                            Select your country to see available shipping methods
                                        </div>
                                    )}
                                </div>

                                {/* PHASE 1.5: Terms Acceptance */}
                                <div className="mt-8 pt-6 border-t border-stone-100">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptTerms}
                                            onChange={(e) => setAcceptTerms(e.target.checked)}
                                            className="w-5 h-5 mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                        />
                                        <span className="text-sm text-stone-600 group-hover:text-stone-900">
                                            I agree to the{' '}
                                            <Link href="/pages/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-900">Terms of Service</Link>
                                            {' '}and{' '}
                                            <Link href="/pages/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-900">Privacy Policy</Link>
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !acceptTerms}
                                    className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-live="polite"
                                    aria-busy={loading}
                                >
                                    {loading ? 'Processing...' : 'Continue to Payment'}
                                </button>
                            </form>
                        ) : (
                            <div>
                                <h3 className="text-lg font-serif text-stone-900 mb-6 border-b border-stone-100 pb-2">Payment</h3>
                                
                                {/* PHASE 7.3: Express Checkout Buttons */}
                                {clientSecret && (
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <ExpressCheckoutForm
                                            orderId={orderId}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                        />
                                    </Elements>
                                )}
                                
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-stone-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-stone-400">or pay with card</span>
                                    </div>
                                </div>

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

                {/* Right: Summary - Mobile on top, Desktop on right */}
                <div className="bg-stone-50 p-4 md:p-8 lg:p-20 order-1 lg:order-2">
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
                                        {(item.material || item.origin || item.sku) && (
                                            <div className="mt-1 text-[10px] text-stone-400">
                                                {item.material && <span>{item.material}</span>}
                                                {item.material && (item.origin || item.sku) && <span> · </span>}
                                                {item.origin && <span>{item.origin}</span>}
                                                {(item.origin && item.sku) && <span> · </span>}
                                                {item.sku && <span>{item.sku}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-medium text-stone-900">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency?.toUpperCase() || 'USD' }).format((item.price * item.quantity) / 100)}
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
                                <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cartTotal / 100)}</span>
                            </div>

                            {discount && (
                                <div className="flex justify-between text-green-600">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        <span className="text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-500">{discount.code}</span>
                                    </div>
                                    <span>-{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(discount.amount / 100)}</span>
                                </div>
                            )}

                            {/* PHASE 1.3: Shipping Cost Display */}
                            {step === 'payment' || selectedShipping ? (
                                <div className="flex justify-between text-stone-600">
                                    <span>Shipping{selectedShipping ? ` (${selectedShipping.name})` : ''}</span>
                                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                                        {shippingCost === 0 
                                            ? 'FREE' 
                                            : new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(shippingCost / 100)
                                        }
                                    </span>
                                </div>
                            ) : (
                                <div className="flex justify-between text-stone-400">
                                    <span>Shipping</span>
                                    <span>Calculated at next step</span>
                                </div>
                            )}

                            {/* PHASE 1.4: Tax Display */}
                            {(taxLoading || taxAmount > 0) && (
                                <div className="flex justify-between text-stone-600">
                                    <span>{taxName}</span>
                                    <span>
                                        {taxLoading ? (
                                            <span className="text-stone-400">Calculating...</span>
                                        ) : (
                                            new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(taxAmount / 100)
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-serif text-stone-900 pt-4 border-t border-stone-200">
                                <span>Total</span>
                                <span>
                                    {new Intl.NumberFormat(undefined, {
                                        style: 'currency',
                                        currency,
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

                        {/* PHASE 7.3: Payment Icons */}
                        <div className="mt-6">
                            <p className="text-xs text-stone-400 text-center mb-3 uppercase tracking-wider">Accepted Payment Methods</p>
                            <PaymentIcons />
                        </div>

                        {/* PHASE 7.3: Security Badges */}
                        <div className="mt-6 pt-6 border-t border-stone-100">
                            <SecurityBadges />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
