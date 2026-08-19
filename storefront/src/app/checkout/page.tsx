'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { getCountryName } from '@/config/countries';
import { CheckoutSkeleton } from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';
import { useCurrency } from '@/context/currency-context';
import { formatMoney } from '@/lib/currency';
import { resolveRegionForCountry } from '@/lib/regions';
import CheckoutAuthStep from '@/components/checkout/CheckoutAuthStep';
import CheckoutOrderSummary from '@/components/checkout/CheckoutOrderSummary';
import CheckoutPaymentStep from '@/components/checkout/CheckoutPaymentStep';
import CheckoutSuccess from '@/components/checkout/CheckoutSuccess';
import CheckoutShippingForm from '@/components/checkout/CheckoutShippingForm';

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

export default function CheckoutPage() {
  const { customer, loading: authLoading } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const { currentRegion, regions, setRegion, settings } = useShop();
  const { formatPrice } = useCurrency();

  // Initialize all hooks FIRST - before any conditionals
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'auth' | 'shipping' | 'payment' | 'success'>(
    'auth'
  );
  
  // Auth state for Step 0
  const [authEmail, setAuthEmail] = useState(customer?.email || '');
  const [authOtp, setAuthOtp] = useState('');
  const [authStage, setAuthStage] = useState<'email' | 'otp'>('email');
  const [authLoadingStep, setAuthLoadingStep] = useState(false);
  const [authError, setAuthError] = useState('');

  const [orderId, setOrderId] = useState('');         // display_id for UI
  const [orderUUID, setOrderUUID] = useState('');      // UUID for payment APIs
  const [checkoutPaymentToken, setCheckoutPaymentToken] = useState('');
  const [confirmedOrderTotals, setConfirmedOrderTotals] = useState<{
    total: number;
    shipping_total: number;
    tax_total: number;
    gift_wrapping_total: number;
    currency_code: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Discount State
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // PHASE 1.3: Shipping Options State
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000);
  const [shippingPreviewMessage, setShippingPreviewMessage] = useState('');

  // PHASE 1.4: Tax Calculation State
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxName, setTaxName] = useState('Tax');

  // PHASE 1.5: Terms Acceptance State
  const [acceptTerms, setAcceptTerms] = useState(false);

  // D3: Gift Wrapping State
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  // Form data hook moved BEFORE conditional return
  const [formData, setFormData] = useState({
    email: customer?.email || '',
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    address_1: '',
    address_2: '',
    city: '',
    province: '',
    country_code: '',
    postal_code: '',
    phone: customer?.phone || '',
  });

  // Update form data when customer data loads
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        email: customer.email || prev.email,
        first_name: customer.first_name || prev.first_name,
        last_name: customer.last_name || prev.last_name,
        phone: customer.phone || prev.phone,
      }));
      setAuthEmail(customer.email);
    }
  }, [customer]);

  // Skip auth step if user is already logged in
  useEffect(() => {
    if (!authLoading && step === 'auth') {
      if (customer) {
        setStep('shipping');
      }
    }
  }, [customer, authLoading, step]);

  // Shipping country is authoritative at checkout: exact country first,
  // then the configured five-market mapping, then Rest of World.
  useEffect(() => {
    if (!formData.country_code || regions.length === 0) return;

    const matchedRegion = resolveRegionForCountry(
      regions,
      formData.country_code
    );
    if (matchedRegion && matchedRegion.id !== currentRegion?.id) {
      setRegion(matchedRegion);
    }
  }, [formData.country_code, regions, currentRegion?.id, setRegion]);

  // PHASE 1.3: Fetch shipping options when country changes
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!formData.country_code) {
        setShippingOptions([]);
        setSelectedShipping(null);
        setShippingPreviewMessage('');
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(
          formData.country_code,
          currentRegion?.id,
          formData.postal_code
        );
        setShippingPreviewMessage(data.serviceability?.message || '');
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          setFreeShippingThreshold(data.free_shipping_threshold || 25000);
          // Auto-select first option
          setSelectedShipping(data.options[0]);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
        }
      } catch (error) {
        console.error('Failed to fetch shipping options:', error);
        setShippingOptions([]);
        setSelectedShipping(null);
        setShippingPreviewMessage('');
      } finally {
        setShippingLoading(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchShippingOptions, 300);
    return () => clearTimeout(timer);
  }, [formData.country_code, formData.postal_code, currentRegion?.id]);

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
        const data = await api.calculateTax(
          formData.country_code,
          subtotal,
          currentRegion?.id,
          settings || undefined
        );
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
  }, [formData.country_code, cartTotal, discount?.amount, currentRegion?.id, settings]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await api.validateCoupon(promoCode, cartTotal);
      setDiscount({ code: res.code, amount: res.discount_amount });
      setPromoMessage({
        type: 'success',
        text: `Coupon ${res.code} applied! -${formatPrice(res.discount_amount)}`,
      });
    } catch {
      setDiscount(null);
      setPromoMessage({ type: 'error', text: 'Invalid promo code' });
    } finally {
      setPromoLoading(false);
    }
  };


  const handleSendCheckoutOtp = async () => {
    if (!authEmail) return;
    setAuthLoadingStep(true);
    setAuthError('');
    try {
      await api.sendCheckoutOtp(authEmail);
      setAuthStage('otp');
    } catch (err: unknown) {
      const authRequestError = err as Error;
      setAuthError(authRequestError.message || 'Failed to send OTP');
    } finally {
      setAuthLoadingStep(false);
    }
  };

  const handleVerifyCheckoutOtp = async () => {
    if (authOtp.length !== 6) return;
    setAuthLoadingStep(true);
    setAuthError('');
    try {
      const res = await api.verifyCheckoutOtp(authEmail, authOtp);
      setFormData((prev) => ({
        ...prev,
        email: res.customer.email || prev.email,
        first_name: res.customer.first_name || prev.first_name,
        last_name: res.customer.last_name || prev.last_name,
        phone: res.customer.phone || prev.phone,
      }));
      setStep('shipping');
    } catch (err: unknown) {
      const verificationError = err as Error;
      setAuthError(verificationError.message || 'Invalid OTP');
    } finally {
      setAuthLoadingStep(false);
    }
  };

  // PHASE 1.1: Allow guest checkout - removed login requirement
  // Guests can now checkout without creating an account

  // Show loading state
  if (authLoading) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface-paper">
        <Heading role="page" className="mb-4 font-display text-display-lg text-primary">
          Your cart is empty
        </Heading>
        <Link
          href="/"
          className="border-b border-border-subtle pb-1 text-muted transition-colors hover:text-primary"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return <CheckoutSuccess orderId={orderId} />;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressSelect = (address: {
    address_1: string;
    city: string;
    postal_code: string;
    country: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      address_1: address.address_1 || prev.address_1,
      city: address.city || prev.city,
      postal_code: address.postal_code || prev.postal_code,
      country_code: address.country || prev.country_code,
    }));
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        formData.country_code.toUpperCase() === 'IN' &&
        !formData.province.trim()
      ) {
        throw new Error('Please select a State/Union Territory');
      }

      if (!currentRegion) {
        throw new Error(
          formData.country_code 
            ? `Shipping is not available for ${getCountryName(formData.country_code)} at this time.`
            : 'No shipping region selected.'
        );
      }

      // PHASE 1.5: Validate terms acceptance
      if (!acceptTerms) {
        throw new Error(
          'Please accept the Terms & Conditions and Privacy Policy to continue'
        );
      }

      // PHASE 1.3: Validate shipping method selection
      if (!selectedShipping) {
        throw new Error('Please select a shipping method');
      }

      const currencyCode = currentRegion.currency_code.toLowerCase();
      const hasRazorpay =
        currencyCode === 'inr' &&
        !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const hasPayPal =
        currencyCode !== 'inr' &&
        !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

      if (!hasRazorpay && !hasPayPal) {
        throw new Error(
          'Payment is not available for the region selected by your shipping country. Please contact support.'
        );
      }

      const payload = {
        region_id: currentRegion.id,
        email: formData.email,
        currency_code: currentRegion.currency_code,
        items: items.map((i) => ({
          variant_id: i.variantId,
          quantity: i.quantity,
        })),
        shipping_address: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address_1: formData.address_1,
          address_2: formData.address_2 || undefined,
          city: formData.city,
          province: formData.province || undefined,
          country_code: formData.country_code,
          postal_code: formData.postal_code,
          phone: formData.phone && /^\+?[1-9]\d{6,14}$/.test(formData.phone) 
            ? formData.phone 
            : undefined,
        },
        shipping_method: selectedShipping.id,
        discount_code: discount?.code,
        gift_wrapping: giftWrapping,
        gift_message: giftWrapping && giftMessage ? giftMessage : undefined,
      };

      // Create order
      const res = await api.createOrder(payload);
      const newOrderUUID = res.order.id;
      setOrderId(res.order.display_id);
      setOrderUUID(newOrderUUID);
      setCheckoutPaymentToken(res.checkout_payment_token || '');
      setConfirmedOrderTotals({
        total: Number(res.order.total),
        shipping_total: Number(res.order.shipping_total || 0),
        tax_total: Number(res.order.tax_total || 0),
        gift_wrapping_total: Number(
          res.order.metadata?.gift_wrapping_total || 0
        ),
        currency_code: res.order.currency_code || currentRegion.currency_code,
      });

      // Move to payment step
      setStep('payment');
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to create order. Please try again.';
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
  const shippingCost =
    confirmedOrderTotals?.shipping_total ??
    (selectedShipping
      ? cartTotal >= freeShippingThreshold
        ? 0
        : selectedShipping.price || 0
      : 0);

  // Gift wrapping is stored in INR paise to match cart totals.
  const giftWrappingFee = 29900;
  const giftWrappingCost =
    confirmedOrderTotals?.gift_wrapping_total ??
    (giftWrapping ? giftWrappingFee : 0);
  const displayedTaxAmount = confirmedOrderTotals?.tax_total ?? taxAmount;

  // PHASE 1.4: Final total includes subtotal - discount + shipping + tax + gift
  const finalTotal =
    confirmedOrderTotals?.total ??
    (cartTotal -
      (discount?.amount || 0) +
      shippingCost +
      displayedTaxAmount +
      giftWrappingCost);

  // Local cart amounts are INR paise and need conversion. Confirmed order totals
  // are already in the backend-selected regional currency and need formatting only.
  const currency =
    currentRegion?.currency_code || items[0]?.currency?.toUpperCase() || 'USD';
  const displayMoney = (amount: number) => formatPrice(amount);
  const displayConfirmedMoney = (amount: number) =>
    formatMoney(amount, confirmedOrderTotals?.currency_code || currency);

  return (
    <div className="min-h-screen bg-surface-paper">
      {/* PHASE 3.2: Mobile-first responsive layout */}
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left: Form */}
        <div className="order-2 border-border-subtle p-4 md:p-8 lg:order-1 lg:border-r lg:p-20">
          <div className="max-w-lg mx-auto">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-body-sm text-muted transition-colors hover:text-primary md:mb-12"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Shop</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div className="mb-12">
              <h2 className="mb-2 font-display text-display-lg text-primary">
                Checkout
              </h2>
              <p className="flex items-center gap-2 text-body-sm font-light text-muted">
                <Lock size={14} /> Secure Checkout
              </p>
            </div>

            {/* D1: Premium Progress Bar — 3 steps */}
            <div className="mb-10">
              <div className="flex items-center">
                {/* Step 1: Shipping */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 text-body-xs font-bold transition-all ${
                      step === 'shipping'
                        ? 'border-primary bg-surface-paper text-primary'
                        : 'border-border-subtle bg-surface-paper text-muted'
                    }`}
                  >
                    {step === 'payment' ? '✓' : '1'}
                  </div>
                  <span
                    className={`text-body-xs font-bold  tracking-token-wider mt-1 ${
                      step === 'shipping' ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    Shipping
                  </span>
                </div>
                {/* Connector 1-2 */}
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step === 'payment' ? 'bg-primary' : 'bg-border-subtle'
                  }`}
                />
                {/* Step 2: Payment */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 text-body-xs font-bold transition-all ${
                      step === 'payment'
                        ? 'border-primary bg-surface-paper text-primary'
                        : 'border-border-subtle bg-surface-paper text-muted'
                    }`}
                  >
                    {'2'}
                  </div>
                  <span
                    className={`text-body-xs font-bold  tracking-token-wider mt-1 ${
                      step === 'payment' ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    Payment
                  </span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-border-subtle" />
                {/* Step 3: Confirmation */}
                <div className="flex flex-col items-center">
                  <div className="flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 border-border-subtle bg-surface-paper text-body-xs font-bold text-muted">
                    3
                  </div>
                  <span className="text-body-xs font-bold  tracking-token-wider mt-1 text-muted">
                    Confirm
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 space-y-3">
                <div className="bg-danger-bg border border-danger text-error p-4 text-body-sm">
                  {error}
                </div>
                <div className="border border-border-subtle bg-surface p-4 text-body-xs text-muted">
                  <p className="font-medium text-primary">Need help completing payment?</p>
                  <p className="mt-2">
                    Do not retry blindly if you are unsure whether a payment was
                    charged. Use payment help or contact support with your order
                    reference.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={storefrontTrust.policyRoutes.paymentHelp}
                      className="underline underline-offset-4"
                    >
                      Payment Help
                    </Link>
                    <Link
                      href={`${storefrontTrust.policyRoutes.contact}?order=${orderId || orderUUID}&email=${encodeURIComponent(formData.email)}`}
                      className="underline underline-offset-4"
                    >
                      Contact Support
                    </Link>
                    <Link
                      href={storefrontTrust.policyRoutes.track}
                      className="underline underline-offset-4"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {step === 'auth' ? (
              <CheckoutAuthStep
                authEmail={authEmail}
                authOtp={authOtp}
                authStage={authStage}
                authLoading={authLoadingStep}
                authError={authError}
                onEmailChange={setAuthEmail}
                onOtpChange={setAuthOtp}
                onSendOtp={handleSendCheckoutOtp}
                onVerifyOtp={handleVerifyCheckoutOtp}
                onChangeEmail={() => setAuthStage('email')}
              />
            ) : step === 'shipping' ? (
              <CheckoutShippingForm
                formData={formData}
                shippingOptions={shippingOptions}
                selectedShipping={selectedShipping}
                shippingLoading={shippingLoading}
                freeShippingThreshold={freeShippingThreshold}
                shippingPreviewMessage={shippingPreviewMessage}
                cartTotal={cartTotal}
                giftWrapping={giftWrapping}
                giftMessage={giftMessage}
                acceptTerms={acceptTerms}
                loading={loading}
                policyRoutes={storefrontTrust.policyRoutes}
                onSubmit={handleShippingSubmit}
                onChange={handleChange}
                onAddressChange={(value) => setFormData((prev) => ({ ...prev, address_1: value }))}
                onAddressSelect={handleAddressSelect}
                onCountryChange={(code) => setFormData((prev) => ({
                  ...prev,
                  country_code: code,
                  province: code === prev.country_code ? prev.province : '',
                }))}
                onShippingChange={setSelectedShipping}
                onGiftWrappingChange={setGiftWrapping}
                onGiftMessageChange={setGiftMessage}
                onTermsChange={setAcceptTerms}
                displayMoney={displayMoney}
              />
            ) : (
              <CheckoutPaymentStep
                currency={currency}
                orderUUID={orderUUID}
                checkoutPaymentToken={checkoutPaymentToken}
                finalTotal={finalTotal}
                customerName={`${formData.first_name} ${formData.last_name}`.trim()}
                customerEmail={formData.email}
                customerPhone={formData.phone}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onBackToShipping={() => setStep('shipping')}
              />
            )}
          </div>
        </div>

        {/* Right: Summary - Mobile on top, Desktop on right */}
        <CheckoutOrderSummary
          items={items}
          step={step}
          cartTotal={cartTotal}
          discount={discount}
          promoCode={promoCode}
          promoLoading={promoLoading}
          promoMessage={promoMessage}
          selectedShipping={selectedShipping}
          shippingCost={shippingCost}
          taxLoading={taxLoading}
          taxName={taxName}
          displayedTaxAmount={displayedTaxAmount}
          giftWrapping={giftWrapping}
          giftWrappingCost={giftWrappingCost}
          finalTotal={finalTotal}
          confirmedOrderTotals={confirmedOrderTotals}
          onPromoCodeChange={setPromoCode}
          onApplyPromo={handleApplyPromo}
          displayMoney={displayMoney}
          displayConfirmedMoney={displayConfirmedMoney}
        />
      </div>
    </div>
  );
}
