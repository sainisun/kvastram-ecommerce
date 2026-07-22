import { describe, expect, it, vi } from 'vitest';
import {
  calculateTax,
  determineGstRegime,
  resolveIndianStateCode,
} from '../src/utils/tax-calculator';

describe('GST regime determination', () => {
  it('uses CGST/SGST for a Rajasthan delivery', () => {
    const result = calculateTax(
      10000,
      18,
      determineGstRegime('IN', 'RJ')
    );

    expect(result).toMatchObject({
      cgst: 900,
      sgst: 900,
      igst: 0,
      total: 1800,
    });
  });

  it('accepts legacy full-name Rajasthan values', () => {
    expect(resolveIndianStateCode('Rajasthan')).toBe('RJ');
    expect(determineGstRegime('IN', 'Rajasthan')).toBe('CGST_SGST');
  });

  it('uses IGST for an Indian interstate delivery', () => {
    const result = calculateTax(
      10000,
      18,
      determineGstRegime('IN', 'MH')
    );

    expect(result).toMatchObject({
      cgst: 0,
      sgst: 0,
      igst: 1800,
      total: 1800,
    });
  });

  it('uses IGST classification for an international delivery', () => {
    expect(determineGstRegime('US', 'California')).toBe('IGST');
  });

  it('refuses an Indian order with no destination state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => determineGstRegime('IN')).toThrow(
      'Select a valid Indian State/Union Territory'
    );
  });

  it('refuses an empty Indian destination state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => determineGstRegime('IN', '')).toThrow(
      'Select a valid Indian State/Union Territory'
    );
  });

  it('logs and refuses an unrecognized Indian destination state', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => determineGstRegime('IN', 'Rajsthan')).toThrow(
      'Select a valid Indian State/Union Territory'
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[GST] Unrecognized Indian destination state',
      { suppliedProvince: 'Rajsthan' }
    );
  });
});
