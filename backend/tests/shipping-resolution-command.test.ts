import { describe, expect, it, vi } from 'vitest';
import { resolveCheckoutShippingOption } from '../src/application/checkout/shipping-resolution-command';
import type { CheckoutCarrierRateProvider } from '../src/application/checkout/shipping-resolution-contracts';

const input = {
  shippingMethod: 'domestic-standard',
  countryCode: 'IN',
  postalCode: '400001',
  currencyCode: 'INR',
  domesticRate: 1_000,
  intlRate: 3_000,
  freeThreshold: 10_000,
  shippingAddress: {
    first_name: 'Asha',
    address_1: '1 Market Road',
    city: 'Mumbai',
    postal_code: '400001',
    country_code: 'IN',
    phone: '9999999999',
  },
};

function providerWithRates(rates: Array<{ id: string; service: string; amount: number; currency: string; estimated_delivery_days?: number | null }>): CheckoutCarrierRateProvider {
  return { getRates: vi.fn().mockResolvedValue({ rates }) };
}

describe('resolveCheckoutShippingOption', () => {
  it('uses a matching live domestic carrier rate when one is available', async () => {
    const provider = providerWithRates([
      { id: 'shiprocket-express', service: 'Shiprocket Express', amount: 850, currency: 'INR', estimated_delivery_days: 2 },
    ]);
    await expect(resolveCheckoutShippingOption({ ...input, shippingMethod: 'shiprocket-express' }, provider)).resolves.toEqual({
      id: 'shiprocket-express', name: 'Shiprocket Express', description: 'Estimated 2 day delivery', price: 850, estimated_days: '2', currency_code: 'INR',
    });
  });

  it('preserves deterministic fallback when live carrier lookup fails', async () => {
    const provider: CheckoutCarrierRateProvider = { getRates: vi.fn().mockRejectedValue(new Error('Carrier unavailable')) };
    await expect(resolveCheckoutShippingOption(input, provider)).resolves.toMatchObject({ id: 'domestic-standard', price: 1_000, currency_code: 'INR' });
  });

  it('does not call the live carrier provider for international fallback selection', async () => {
    const provider = providerWithRates([]);
    await expect(resolveCheckoutShippingOption({ ...input, countryCode: 'US', shippingMethod: 'international-priority' }, provider)).resolves.toMatchObject({ id: 'international-priority', price: 4_350 });
    expect(provider.getRates).not.toHaveBeenCalled();
  });
});
