// Centralized currency formatting utilities

const DEFAULT_LOCALE = 'en-US';

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount / 100);
  } catch (error) {
    // Fallback for unsupported currencies - use known-good locale
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  }
}

export function formatCurrencyRaw(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const normalizedCurrency = currency.toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies - use known-good locale
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: 'CN¥',
    KRW: '₩',
  };
  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  // Validate that we have a meaningful rate for different currencies
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid conversion rate: must be a positive number');
  }
  return Math.round(amount * rate);
}
