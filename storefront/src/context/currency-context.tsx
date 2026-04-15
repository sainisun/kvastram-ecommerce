'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { detectUserCurrency, formatPriceFromINR } from '@/lib/currency';

interface CurrencyContextValue {
  /** Detected currency code e.g. 'USD', 'GBP', 'INR' */
  currency: string;
  /** Exchange rates from INR base e.g. { USD: 0.012, EUR: 0.011 } */
  rates: Record<string, number>;
  /** Whether rates are still loading */
  loading: boolean;
  /**
   * Format a price stored as INR paise (÷100 = ₹) into the user's local currency.
   * Falls back to showing INR if rates not yet loaded.
   */
  formatPrice: (inrPaise: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// Fallback rates so UI never shows broken prices while fetching
const FALLBACK_RATES: Record<string, number> = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095,
  JPY: 1.79, AUD: 0.018, CAD: 0.016, SGD: 0.016,
  AED: 0.044, CNY: 0.086, KRW: 16.2, CHF: 0.011,
  SEK: 0.12, NOK: 0.13, DKK: 0.082, BRL: 0.067,
  MXN: 0.23, ZAR: 0.22, SAR: 0.045,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState('INR');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect currency from browser locale
    const detected = detectUserCurrency();
    setCurrency(detected);

    // Fetch live rates from our cached API route
    fetch('/api/exchange-rates')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setRates(data.rates);
      })
      .catch(() => {
        // Keep fallback rates — never throw
      })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = useCallback(
    (inrPaise: number) => formatPriceFromINR(inrPaise, currency, rates),
    [currency, rates]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, rates, loading, formatPrice }),
    [currency, rates, loading, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
