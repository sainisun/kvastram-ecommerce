import { AlertCircle } from 'lucide-react';

export interface CartPricingSummaryProps {
  subtotal: number;
  discountAmount: number;
  shippingCost: number | null;
  countryCode: string;
  hasShippingOptions: boolean;
  hasSelectedShipping: boolean;
  freeShippingThreshold: number;
  formatPrice: (amount: number) => string;
}

export function CartPricingSummary({
  subtotal,
  discountAmount,
  shippingCost,
  countryCode,
  hasShippingOptions,
  hasSelectedShipping,
  freeShippingThreshold,
  formatPrice,
}: CartPricingSummaryProps) {
  const total = Math.max(0, subtotal - discountAmount + (shippingCost ?? 0));
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <>
      <div className="flow-root">
        <dl className="-my-4 divide-y divide-border-subtle">
          <div className="flex items-center justify-between py-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium text-primary">{formatPrice(subtotal)}</dd>
          </div>
          {discountAmount > 0 ? (
            <div className="flex items-center justify-between py-4">
              <dt className="text-muted">Discount</dt>
              <dd className="font-medium text-success">
                -{formatPrice(discountAmount)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between py-4">
            <dt className="text-muted">
              Shipping
              {shippingCost === 0 && qualifiesForFreeShipping ? (
                <span className="ml-2 text-body-xs text-success">
                  (Free over {formatPrice(freeShippingThreshold)})
                </span>
              ) : null}
            </dt>
            <dd className="font-medium text-primary">
              {!countryCode ? (
                <span className="text-body-sm text-muted">Calculated at checkout</span>
              ) : !hasShippingOptions ? (
                <span className="text-body-sm text-muted">Shipping unavailable</span>
              ) : !hasSelectedShipping ? (
                <span className="text-body-sm text-muted">Not available</span>
              ) : shippingCost === 0 ? (
                'Free'
              ) : (
                formatPrice(shippingCost ?? 0)
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between py-4">
            <dt className="text-body-md font-medium text-primary">Total</dt>
            <dd className="text-display-sm font-medium text-primary">
              {formatPrice(total)}
            </dd>
          </div>
        </dl>
      </div>

      {(shippingCost === null || shippingCost > 0) && !qualifiesForFreeShipping ? (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-surface p-3 text-body-sm text-muted">
          <AlertCircle size={16} />
          <span>
            Add {formatPrice(freeShippingThreshold - subtotal)} more for free shipping!
          </span>
        </div>
      ) : null}
    </>
  );
}
