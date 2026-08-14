import {
  getDefaultCheckoutShippingOptions,
  type CheckoutShippingOption,
} from '../../domain/checkout/checkout-pricing-policy';
import type {
  CheckoutCarrierRate,
  CheckoutCarrierRateProvider,
  CheckoutShippingAddress,
} from './shipping-resolution-contracts';

function mapCarrierRate(rate: CheckoutCarrierRate): CheckoutShippingOption {
  return {
    id: rate.id,
    name: rate.service,
    description: rate.estimated_delivery_days
      ? `Estimated ${rate.estimated_delivery_days} day delivery`
      : 'Courier ETA confirmed at checkout',
    price: rate.amount,
    estimated_days: rate.estimated_delivery_days
      ? String(rate.estimated_delivery_days)
      : '',
    currency_code: rate.currency,
  };
}

export async function resolveCheckoutShippingOption(
  input: {
    shippingMethod: string;
    countryCode: string;
    postalCode: string;
    currencyCode: string;
    domesticRate: number;
    intlRate: number;
    freeThreshold: number;
    shippingAddress: CheckoutShippingAddress;
  },
  carrierRateProvider: CheckoutCarrierRateProvider
): Promise<CheckoutShippingOption | null> {
  const fallback = getDefaultCheckoutShippingOptions(input);
  let options = fallback.options;

  if (input.countryCode === 'IN' && input.postalCode) {
    try {
      const liveRates = await carrierRateProvider.getRates({
        email: 'checkout@odhvica.com',
        payment_status: 'awaiting',
        shipping_address: input.shippingAddress,
        workflow: {
          label: {
            package_weight_grams: 500,
            package_length_cm: 25,
            package_width_cm: 20,
            package_height_cm: 4,
          },
        },
      });

      if (liveRates.rates.length > 0) {
        options = liveRates.rates.map(mapCarrierRate);
      }
    } catch {
      // Preserve the deterministic fallback behavior when live carrier lookup fails.
    }
  }

  return options.find((option) => option.id === input.shippingMethod) ?? null;
}
