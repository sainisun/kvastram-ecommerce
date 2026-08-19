'use client';

import Link from 'next/link';
import { Button } from '@/design-system';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import RazorpayButton from '@/components/checkout/RazorpayButton';
import PayPalButton from '@/components/checkout/PayPalButton';
import { storefrontTrust } from '@/config/storefront-trust';

interface CheckoutPaymentStepProps {
  currency: string;
  orderUUID: string;
  checkoutPaymentToken: string;
  finalTotal: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: () => void;
  onError: (message: string) => void;
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
  onSuccess,
  onError,
  onBackToShipping,
}: CheckoutPaymentStepProps) {
  const isIndianCurrency = currency.toLowerCase() === 'inr';

  return (
    <div>
      <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
        Payment
      </h3>
      <p className="mb-4 text-body-sm text-muted">
        {isIndianCurrency
          ? storefrontTrust.paymentMethodsIndia
          : storefrontTrust.paymentMethodsInternational}
      </p>

      {isIndianCurrency &&
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
        checkoutPaymentToken && (
          <ErrorBoundary
            fallback={
              <p className="text-body-sm text-error py-2">
                Payment failed to load. Please refresh.
              </p>
            }
          >
            <RazorpayButton
              orderId={orderUUID}
              checkoutToken={checkoutPaymentToken}
              amount={finalTotal}
              currency="INR"
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              onSuccess={onSuccess}
              onError={onError}
            />
          </ErrorBoundary>
        )}

      {!isIndianCurrency && process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
        <ErrorBoundary
          fallback={
            <p className="text-body-sm text-error py-2">
              PayPal failed to load. Please use card below.
            </p>
          }
        >
          <PayPalButton
            orderId={orderUUID}
            checkoutToken={checkoutPaymentToken}
            currency={currency.toUpperCase()}
            onSuccess={onSuccess}
            onError={onError}
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
          <Link
            href={storefrontTrust.policyRoutes.shipping}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Shipping
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.returns}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Returns
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.paymentHelp}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Payment Help
          </Link>
        </div>
      </div>
    </div>
  );
}
