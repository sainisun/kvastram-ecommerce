export type CheckoutShippingAddress = {
  first_name?: string;
  last_name?: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  province?: string;
  country_code: string;
  phone?: string;
};

export type CheckoutCarrierRate = {
  id: string;
  service: string;
  amount: number;
  currency: string;
  estimated_delivery_days?: number | null;
};

export type CheckoutCarrierRateProvider = {
  getRates(input: {
    email: string;
    payment_status: string;
    shipping_address: CheckoutShippingAddress;
    workflow: {
      label: {
        package_weight_grams: number;
        package_length_cm: number;
        package_width_cm: number;
        package_height_cm: number;
      };
    };
  }): Promise<{ rates: CheckoutCarrierRate[]; message?: string }>;
};
