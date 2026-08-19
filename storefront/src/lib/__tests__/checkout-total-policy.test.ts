import { describe, expect, it } from 'vitest';

import {
  calculateCheckoutShippingCost,
  calculateCheckoutTotal,
} from '@/lib/checkout-total-policy';

describe('checkout total policy', () => {
  it('calculates the local fallback total with discount, shipping, tax and gift wrap', () => {
    expect(
      calculateCheckoutTotal({
        subtotal: 100000,
        discountAmount: 10000,
        shippingCost: 5000,
        taxAmount: 18000,
        giftWrappingCost: 29900,
      })
    ).toBe(142900);
  });

  it('never returns a negative checkout total', () => {
    expect(
      calculateCheckoutTotal({ subtotal: 1000, discountAmount: 5000 })
    ).toBe(0);
  });

  it('uses free shipping at or above the configured threshold', () => {
    expect(
      calculateCheckoutShippingCost({
        subtotal: 25000,
        freeShippingThreshold: 25000,
        selectedShippingPrice: 1200,
      })
    ).toBe(0);
  });

  it('falls back to the selected shipping price below the threshold', () => {
    expect(
      calculateCheckoutShippingCost({
        subtotal: 24000,
        freeShippingThreshold: 25000,
        selectedShippingPrice: 1200,
      })
    ).toBe(1200);
  });
});
