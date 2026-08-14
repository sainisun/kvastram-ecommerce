import { describe, expect, it } from 'vitest';
import {
  calculateCheckoutDiscountAmount,
  getDefaultCheckoutShippingOptions,
} from '../src/domain/checkout/checkout-pricing-policy';

describe('checkout pricing policy', () => {
  it('calculates percentage and fixed discounts while capping at the cart total', () => {
    expect(
      calculateCheckoutDiscountAmount(10_000, {
        type: 'percentage',
        value: 10,
      })
    ).toBe(1_000);
    expect(
      calculateCheckoutDiscountAmount(1_000, {
        type: 'fixed_amount',
        value: 2_500,
      })
    ).toBe(1_000);
  });

  it('preserves zero line-item discount for free-shipping campaigns', () => {
    expect(
      calculateCheckoutDiscountAmount(10_000, {
        type: 'free_shipping',
        value: 0,
      })
    ).toBe(0);
  });

  it('returns the established domestic shipping option identifiers and prices', () => {
    const result = getDefaultCheckoutShippingOptions({
      countryCode: 'IN',
      currencyCode: 'INR',
      domesticRate: 1_000,
      intlRate: 3_000,
      freeThreshold: 10_000,
    });

    expect(result).toEqual({
      options: [
        {
          id: 'domestic-standard',
          name: 'Standard Shipping',
          description: 'Final ETA confirmed at checkout',
          price: 1_000,
          estimated_days: '3-7',
          currency_code: 'INR',
        },
        {
          id: 'domestic-priority',
          name: 'Priority Shipping',
          description: 'Faster dispatch when available',
          price: 1_450,
          estimated_days: '2-5',
          currency_code: 'INR',
        },
      ],
      free_shipping_threshold: 10_000,
      currency_code: 'INR',
    });
  });

  it('returns the established international shipping identifiers and rates', () => {
    const result = getDefaultCheckoutShippingOptions({
      countryCode: 'US',
      currencyCode: 'USD',
      domesticRate: 1_000,
      intlRate: 3_000,
      freeThreshold: 10_000,
    });

    expect(result.options).toEqual([
      expect.objectContaining({
        id: 'international-standard',
        price: 3_000,
        estimated_days: '7-14',
        currency_code: 'USD',
      }),
      expect.objectContaining({
        id: 'international-priority',
        price: 4_350,
        estimated_days: '5-10',
        currency_code: 'USD',
      }),
    ]);
    expect(result.free_shipping_threshold).toBe(10_000);
  });
});
