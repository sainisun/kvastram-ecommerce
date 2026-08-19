export interface CheckoutTotalsInput {
  subtotal: number;
  discountAmount?: number | null;
  shippingCost?: number | null;
  taxAmount?: number | null;
  giftWrappingCost?: number | null;
}

/**
 * Computes the provisional checkout total before the backend-confirmed order
 * totals are available. Backend-confirmed totals still take precedence in the
 * checkout page; this policy only preserves the existing local fallback.
 */
export function calculateCheckoutTotal({
  subtotal,
  discountAmount = 0,
  shippingCost = 0,
  taxAmount = 0,
  giftWrappingCost = 0,
}: CheckoutTotalsInput): number {
  return Math.max(
    0,
    subtotal - (discountAmount || 0) + (shippingCost || 0) + (taxAmount || 0) + (giftWrappingCost || 0)
  );
}

export function calculateCheckoutShippingCost({
  subtotal,
  freeShippingThreshold,
  selectedShippingPrice,
}: {
  subtotal: number;
  freeShippingThreshold: number;
  selectedShippingPrice?: number | null;
}): number {
  if (subtotal >= freeShippingThreshold) return 0;
  return selectedShippingPrice || 0;
}
