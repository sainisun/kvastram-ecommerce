import { API_URL, fetchWithTrace, getCsrfHeader } from './api-client-core';

export interface OrderCreateData {
  region_id: string;
  currency_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  shipping_address: {
    first_name?: string;
    last_name?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postal_code: string;
    province?: string;
    country_code: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  shipping_method: string;
  discount_code?: string;
  gift_wrapping?: boolean;
  gift_message?: string;
}

export interface TaxRate {
  country_code: string;
  rate: number;
  name: string;
}

export interface StoreSettings {
  free_shipping_threshold?: number;
  currency_code?: string;
  store_name?: string;
  tax_rates?: TaxRate[];
  default_tax_rate?: number;
}

interface ZodIssue {
  path: string[];
  message: string;
}

function getDefaultShippingOptions(countryCode: string) {
  const isInternational = countryCode !== 'US';

  const options = [
    {
      id: 'standard',
      name: isInternational ? 'Standard International Shipping' : 'Standard Shipping',
      description: isInternational ? '7-14 business days' : '5-7 business days',
      price: isInternational ? 2500 : 0,
      estimated_days: isInternational ? '7-14' : '5-7',
      currency_code: 'USD',
    },
    {
      id: 'express',
      name: isInternational ? 'Express International Shipping' : 'Express Shipping',
      description: isInternational ? '3-5 business days' : '2-3 business days',
      price: isInternational ? 4500 : 1500,
      estimated_days: isInternational ? '3-5' : '2-3',
      currency_code: 'USD',
    },
  ];

  return {
    options,
    free_shipping_threshold: 25000,
    currency_code: 'USD',
  };
}

function getDefaultTax(countryCode: string, subtotal: number, settings?: StoreSettings) {
  const defaultTaxRates: Record<string, { rate: number; name: string }> = {
    US: { rate: 0.08, name: 'Sales Tax' },
    GB: { rate: 0.2, name: 'VAT' },
    CA: { rate: 0.13, name: 'HST' },
    AU: { rate: 0.1, name: 'GST' },
    DE: { rate: 0.19, name: 'VAT' },
    FR: { rate: 0.2, name: 'VAT' },
    IN: { rate: 0.18, name: 'GST' },
    JP: { rate: 0.1, name: 'Consumption Tax' },
  };

  let rate: number;
  let taxName: string;

  if (settings?.tax_rates) {
    const settingRate = settings.tax_rates.find((tr) => tr.country_code === countryCode);
    if (settingRate) {
      rate = settingRate.rate;
      taxName = settingRate.name;
    } else {
      rate = settings.default_tax_rate ?? 0.1;
      taxName = countryCode === 'US' ? 'Sales Tax' : 'VAT';
    }
  } else {
    const defaultRate = defaultTaxRates[countryCode] ?? {
      rate: 0.1,
      name: countryCode === 'US' ? 'Sales Tax' : 'VAT',
    };
    rate = defaultRate.rate;
    taxName = defaultRate.name;
  }

  return {
    tax_amount: Math.round(subtotal * rate),
    tax_rate: rate,
    tax_name: taxName,
    currency_code: settings?.currency_code || 'USD',
  };
}

export const checkoutPaymentApi = {
  async sendCheckoutOtp(email: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  async verifyCheckoutOtp(email: string, otp: string) {
    const res = await fetchWithTrace(`${API_URL}/store/checkout/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    return data;
  },

  async createOrder(data: OrderCreateData) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/checkout/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      const errorMessage =
        typeof error.details === 'string' ? error.details :
        typeof error.error === 'string' ? error.error :
        Array.isArray(error.error?.issues)
          ? error.error.issues.map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
          : Array.isArray(error.details)
            ? error.details.map((issue: ZodIssue) => issue.message).join(', ')
            : 'Failed to place order';
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async validateCoupon(code: string, cartTotal: number) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/checkout/validate-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({ code, cart_total: cartTotal }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Invalid coupon');
    }
    return res.json();
  },

  async getShippingOptions(countryCode: string, regionId?: string, postalCode?: string) {
    try {
      const params = new URLSearchParams({ country_code: countryCode });
      if (regionId) params.append('region_id', regionId);
      if (postalCode?.trim()) params.append('postal_code', postalCode.trim());

      const res = await fetchWithTrace(
        `${API_URL}/store/checkout/shipping-options?${params}`,
        { credentials: 'include' }
      );
      if (!res.ok) return getDefaultShippingOptions(countryCode);
      return res.json();
    } catch {
      return getDefaultShippingOptions(countryCode);
    }
  },

  async calculateTax(
    countryCode: string,
    subtotal: number,
    regionId?: string,
    settings?: StoreSettings
  ) {
    try {
      const csrfHeader = await getCsrfHeader();
      const res = await fetchWithTrace(`${API_URL}/store/checkout/tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader,
        },
        body: JSON.stringify({
          country_code: countryCode,
          subtotal,
          region_id: regionId,
        }),
        credentials: 'include',
      });
      if (!res.ok) return getDefaultTax(countryCode, subtotal, settings);
      return res.json();
    } catch {
      return getDefaultTax(countryCode, subtotal, settings);
    }
  },

  async createPaymentIntent(orderId: string, checkoutToken: string) {
    const csrfHeader = await getCsrfHeader();
    const res = await fetchWithTrace(`${API_URL}/store/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
      },
      body: JSON.stringify({
        order_id: orderId,
        checkout_token: checkoutToken,
      }),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }
    return res.json();
  },

  async checkPaymentStatus(orderId: string) {
    const res = await fetchWithTrace(`${API_URL}/store/payments/status/${orderId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to check payment status');
    }
    return res.json();
  },
};
