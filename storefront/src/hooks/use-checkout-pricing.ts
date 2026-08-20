'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface CheckoutShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

type CheckoutSettings = Parameters<typeof api.calculateTax>[3];

interface UseCheckoutPricingOptions {
  countryCode: string;
  postalCode: string;
  cartTotal: number;
  discountAmount: number;
  currentRegionId?: string;
  settings?: CheckoutSettings;
}

export function useCheckoutPricing({
  countryCode,
  postalCode,
  cartTotal,
  discountAmount,
  currentRegionId,
  settings,
}: UseCheckoutPricingOptions) {
  const [shippingOptions, setShippingOptions] = useState<CheckoutShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<CheckoutShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000);
  const [shippingPreviewMessage, setShippingPreviewMessage] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxName, setTaxName] = useState('Tax');

  useEffect(() => {
    let active = true;

    const fetchShippingOptions = async () => {
      if (!countryCode) {
        if (active) {
          setShippingOptions([]);
          setSelectedShipping(null);
          setShippingPreviewMessage('');
        }
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(countryCode, currentRegionId, postalCode);
        if (!active) return;
        setShippingPreviewMessage(data.serviceability?.message || '');
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          setFreeShippingThreshold(data.free_shipping_threshold || 25000);
          setSelectedShipping(data.options[0]);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
        }
      } catch (error) {
        console.error('Failed to fetch shipping options:', error);
        if (active) {
          setShippingOptions([]);
          setSelectedShipping(null);
          setShippingPreviewMessage('');
        }
      } finally {
        if (active) setShippingLoading(false);
      }
    };

    const timer = setTimeout(() => void fetchShippingOptions(), 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [countryCode, currentRegionId, postalCode]);

  useEffect(() => {
    let active = true;

    const fetchTax = async () => {
      if (!countryCode || cartTotal === 0) {
        setTaxAmount(0);
        return;
      }

      setTaxLoading(true);
      try {
        const subtotal = cartTotal - discountAmount;
        const data = await api.calculateTax(countryCode, subtotal, currentRegionId, settings);
        if (!active) return;
        if (data.tax_amount) {
          setTaxAmount(data.tax_amount);
          setTaxName(data.tax_name || 'Tax');
        }
      } catch (error) {
        console.error('Failed to calculate tax:', error);
        if (active) setTaxAmount(0);
      } finally {
        if (active) setTaxLoading(false);
      }
    };

    const timer = setTimeout(() => void fetchTax(), 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [countryCode, cartTotal, discountAmount, currentRegionId, settings]);

  return {
    shippingOptions,
    selectedShipping,
    shippingLoading,
    freeShippingThreshold,
    shippingPreviewMessage,
    taxAmount,
    taxLoading,
    taxName,
    setSelectedShipping,
  };
}
