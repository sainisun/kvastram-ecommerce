/**
 * Tax Calculator Utility
 *
 * Calculates GST for domestic and international orders.
 * Domestic intra-state: CGST + SGST
 * Domestic inter-state/international: IGST
 */

export interface TaxBreakdown {
  rate: number; // GST rate (e.g., 18)
  subtotal: number; // Pre-tax amount in cents
  cgst: number; // Central GST in cents (rate/2)
  sgst: number; // State GST in cents (rate/2)
  igst: number; // Integrated GST in cents (combined rate)
  total: number; // Total tax in cents
}

export type GstRegime = 'CGST_SGST' | 'IGST';

const INDIAN_STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DH', 'DL',
  'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'LA',
  'LD', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PY',
  'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB',
]);

const INDIAN_STATE_NAMES: Record<string, string> = {
  andamanandnicobarislands: 'AN',
  andhrapradesh: 'AP',
  arunachalpradesh: 'AR',
  assam: 'AS',
  bihar: 'BR',
  chandigarh: 'CH',
  chhattisgarh: 'CG',
  dadraandnagarhavelianddamananddiu: 'DH',
  delhi: 'DL',
  goa: 'GA',
  gujarat: 'GJ',
  haryana: 'HR',
  himachalpradesh: 'HP',
  jammuandkashmir: 'JK',
  jharkhand: 'JH',
  karnataka: 'KA',
  kerala: 'KL',
  ladakh: 'LA',
  lakshadweep: 'LD',
  madhyapradesh: 'MP',
  maharashtra: 'MH',
  manipur: 'MN',
  meghalaya: 'ML',
  mizoram: 'MZ',
  nagaland: 'NL',
  odisha: 'OD',
  orissa: 'OD',
  puducherry: 'PY',
  pondicherry: 'PY',
  punjab: 'PB',
  rajasthan: 'RJ',
  sikkim: 'SK',
  tamilnadu: 'TN',
  telangana: 'TS',
  tripura: 'TR',
  uttarpradesh: 'UP',
  uttarakhand: 'UK',
  uttaranchal: 'UK',
  westbengal: 'WB',
};

export function resolveIndianStateCode(province?: string): string | null {
  const trimmed = province?.trim();
  if (!trimmed) return null;

  const uppercase = trimmed.toUpperCase();
  if (INDIAN_STATE_CODES.has(uppercase)) return uppercase;

  const normalizedName = trimmed.toLowerCase().replace(/[^a-z]/g, '');
  return INDIAN_STATE_NAMES[normalizedName] ?? null;
}

/**
 * GST origin is intentionally fixed to Rajasthan (RJ).
 * The admin shipping-origin state setting in
 * admin/src/app/dashboard/settings/page.tsx does not affect this calculation.
 * Do not make that setting authoritative without validated tax-origin design.
 */
export function determineGstRegime(
  destinationCountry: string,
  destinationProvince?: string
): GstRegime {
  if (destinationCountry.trim().toUpperCase() !== 'IN') return 'IGST';

  const destinationStateCode = resolveIndianStateCode(destinationProvince);
  if (!destinationStateCode) {
    console.error('[GST] Unrecognized Indian destination state', {
      suppliedProvince: destinationProvince || null,
    });
    throw new Error('Select a valid Indian State/Union Territory');
  }

  return destinationStateCode === 'RJ' ? 'CGST_SGST' : 'IGST';
}

/**
 * Calculate GST tax breakdown
 *
 * @param subtotal - Pre-tax amount in cents
 * @param rate - GST rate percentage (default: 18)
 * @param regime - CGST/SGST for intra-state or IGST for inter-state/export
 * @returns TaxBreakdown with cgst, sgst, igst, and total
 */
export function calculateTax(
  subtotal: number,
  rate: number = 18,
  regime: GstRegime = 'CGST_SGST'
): TaxBreakdown {
  const totalTax = Math.round(subtotal * (rate / 100));

  if (regime === 'IGST') {
    return { rate, subtotal, cgst: 0, sgst: 0, igst: totalTax, total: totalTax };
  }

  const halfRate = rate / 2;
  const cgst = Math.round(subtotal * (halfRate / 100));
  const sgst = totalTax - cgst; // Ensure exact split

  return {
    rate,
    subtotal,
    cgst,
    sgst,
    igst: 0,
    total: cgst + sgst,
  };
}

/**
 * Calculate tax with custom rate
 */
export function calculateTaxWithRate(
  subtotal: number,
  rate: number,
  regime: GstRegime = 'CGST_SGST'
): TaxBreakdown {
  return calculateTax(subtotal, rate, regime);
}
