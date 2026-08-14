export type CheckoutDiscount = {
  type: string;
  value: number;
};

export type CheckoutShippingOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
};

export function calculateCheckoutDiscountAmount(
  cartTotal: number,
  discount: CheckoutDiscount
): number {
  let discountAmount = 0;

  if (discount.type === 'percentage') {
    discountAmount = Math.round((cartTotal * discount.value) / 100);
  } else if (discount.type === 'fixed_amount') {
    discountAmount = discount.value;
  } else if (discount.type === 'free_shipping') {
    discountAmount = 0;
  }

  return Math.min(discountAmount, cartTotal);
}

export function getDefaultCheckoutShippingOptions(input: {
  countryCode: string;
  currencyCode: string;
  domesticRate: number;
  intlRate: number;
  freeThreshold: number;
}): {
  options: CheckoutShippingOption[];
  free_shipping_threshold: number;
  currency_code: string;
} {
  const isDomestic = input.countryCode === 'IN';
  const baseRate = isDomestic ? input.domesticRate : input.intlRate;

  return {
    options: [
      {
        id: isDomestic ? 'domestic-standard' : 'international-standard',
        name: isDomestic ? 'Standard Shipping' : 'Standard International Shipping',
        description: isDomestic
          ? 'Final ETA confirmed at checkout'
          : 'Tracked delivery with final ETA at checkout',
        price: baseRate,
        estimated_days: isDomestic ? '3-7' : '7-14',
        currency_code: input.currencyCode,
      },
      {
        id: isDomestic ? 'domestic-priority' : 'international-priority',
        name: isDomestic ? 'Priority Shipping' : 'Priority International Shipping',
        description: isDomestic
          ? 'Faster dispatch when available'
          : 'Faster international processing when available',
        price: Math.round(baseRate * 1.45),
        estimated_days: isDomestic ? '2-5' : '5-10',
        currency_code: input.currencyCode,
      },
    ],
    free_shipping_threshold: input.freeThreshold,
    currency_code: input.currencyCode,
  };
}
