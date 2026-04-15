// Centralized currency formatting utilities

const DEFAULT_LOCALE = 'en-US';

// ─── Etsy-style local currency detection & conversion ─────────────────────────

// Browser locale → ISO 4217 currency code
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'hi': 'INR', 'hi-IN': 'INR', 'en-IN': 'INR',
  'en-US': 'USD',
  'en-GB': 'GBP',
  'de': 'EUR', 'de-DE': 'EUR', 'de-AT': 'EUR',
  'fr': 'EUR', 'fr-FR': 'EUR', 'fr-BE': 'EUR',
  'it': 'EUR', 'it-IT': 'EUR',
  'es': 'EUR', 'es-ES': 'EUR',
  'nl': 'EUR', 'nl-NL': 'EUR',
  'pt-PT': 'EUR',
  'el': 'EUR', 'fi': 'EUR',
  'ja': 'JPY', 'ja-JP': 'JPY',
  'zh': 'CNY', 'zh-CN': 'CNY',
  'ko': 'KRW', 'ko-KR': 'KRW',
  'en-AU': 'AUD',
  'en-CA': 'CAD', 'fr-CA': 'CAD',
  'en-SG': 'SGD',
  'ar-AE': 'AED',
  'ar-SA': 'SAR',
  'pt-BR': 'BRL',
  'es-MX': 'MXN',
  'en-ZA': 'ZAR',
  'de-CH': 'CHF', 'fr-CH': 'CHF',
  'sv': 'SEK', 'sv-SE': 'SEK',
  'nb': 'NOK', 'nb-NO': 'NOK',
  'da': 'DKK', 'da-DK': 'DKK',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'TWD', 'CLP']);

/**
 * Detect the user's preferred currency from browser locale.
 *
 * This is an Indian store (base currency INR). We intentionally do NOT map
 * generic 'en' or 'en-US' → USD because most Indian users have their browser
 * set to English (United States) — they should still see INR.
 * Only clearly non-Indian locales (en-GB, en-AU, de-DE, ja-JP, etc.) convert.
 * Falls back to INR.
 */
export function detectUserCurrency(): string {
  if (typeof navigator === 'undefined') return 'INR';
  const languages = navigator.languages?.length ? [...navigator.languages] : [navigator.language || 'en-IN'];

  for (const lang of languages) {
    // Full locale match (e.g. en-IN, en-GB, ja-JP) — these are reliable
    if (LOCALE_CURRENCY_MAP[lang]) return LOCALE_CURRENCY_MAP[lang];

    const base = lang.split('-')[0];
    // Skip base 'en' mapping: 'en' alone or 'en-US' should not force USD
    // because Indian users commonly have en-US as their browser language.
    // Non-English base locales (ja, de, fr, hi, etc.) are still matched.
    if (base !== 'en' && LOCALE_CURRENCY_MAP[base]) return LOCALE_CURRENCY_MAP[base];
  }

  return 'INR'; // Default: INR for this Indian store
}

/**
 * Convert INR paise (stored in DB, e.g. 199900 = ₹1999) to a target currency amount.
 * @param inrPaise - raw DB amount in paise
 * @param targetCurrency - ISO 4217 code e.g. 'USD'
 * @param rates - rate map from /api/exchange-rates (base = INR, e.g. { USD: 0.012 })
 */
export function convertFromINR(
  inrPaise: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  const inrAmount = inrPaise / 100;
  if (targetCurrency === 'INR') return inrAmount;
  const rate = rates[targetCurrency.toUpperCase()];
  if (!rate) return inrAmount;
  return inrAmount * rate;
}

/** One-shot: convert INR paise → formatted local currency string. */
export function formatPriceFromINR(
  inrPaise: number,
  targetCurrency: string,
  rates: Record<string, number>,
  locale?: string
): string {
  const converted = convertFromINR(inrPaise, targetCurrency, rates);
  const resolvedLocale = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-IN');
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(targetCurrency.toUpperCase());
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: targetCurrency.toUpperCase(),
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(converted);
  } catch {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inrPaise / 100);
  }
}

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
