'use client';

import { Button } from '@/design-system';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PayPalButton from '@/components/checkout/PayPalButton';
import RazorpayButton from '@/components/checkout/RazorpayButton';
import { storefrontTrust } from '@/config/storefront-trust';
import Link from 'next/link';

interface CheckoutPaymentStepProps {
  currency: string;
  orderUUID: string;
  checkoutPaymentToken: string;
  finalTotal: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess: () => void;
  onPaymentError: (message: string) => void;
  onBackToShipping: () => void;
}

export default function CheckoutPaymentStep({
  currency,
  orderUUID,
  checkoutPaymentToken,
  finalTotal,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentError,
  onBackToShipping,
}: CheckoutPaymentStepProps) {
  const isInr = currency.toLowerCase() === 'inr';

  return (
    <div>
      <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
        Payment
      </h3>
      <p className="mb-4 text-body-sm text-muted">
        {isInr
          ? storefrontTrust.paymentMethodsIndia
          : storefrontTrust.paymentMethodsInternational}
      </p>

      {isInr && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && checkoutPaymentToken && (
        <ErrorBoundary
          fallback={<p className="text-body-sm text-error py-2">Payment failed to load. Please refresh.</p>}
        >
          <RazorpayButton
            orderId={orderUUID}
            checkoutToken={checkoutPaymentToken}
            amount={finalTotal}
            currency="INR"
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        </ErrorBoundary>
      )}

      {!isInr && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <ErrorBoundary
          fallback={<p className="text-body-sm text-error py-2">PayPal failed to load. Please use card below.</p>}
        >
          <PayPalButton
            orderId={orderUUID}
            checkoutToken={checkoutPaymentToken}
            currency={currency.toUpperCase()}
            onSuccess={onPaymentSuccess}
            onError={onPaymentError}
          />
        </ErrorBoundary>
      )}

      <Button
        type="button"
        onClick={onBackToShipping}
        variant="outline"
        size="md"
        fullWidth
        className="mt-4"
      >
        Back to Shipping
      </Button>

      <div className="mt-6 border border-border-subtle bg-surface p-4 text-body-xs text-muted">
        <p className="font-medium text-primary">Payment and policy help</p>
        <p className="mt-2">{storefrontTrust.paymentSummary}</p>
        <p className="mt-2">{storefrontTrust.shippingSummary}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={storefrontTrust.policyRoutes.shipping} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Shipping
          </Link>
          <Link href={storefrontTrust.policyRoutes.returns} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Returns
          </Link>
          <Link href={storefrontTrust.policyRoutes.paymentHelp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Payment Help
          </Link>
        </div>
      </div>
    </div>
  );
}
