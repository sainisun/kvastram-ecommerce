import PDFDocument from 'pdfkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateInvoice } from '../src/services/pdf-service';

describe('invoice GST labeling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders INR IGST and no CGST/SGST for an international order', async () => {
    const textSpy = vi.spyOn(PDFDocument.prototype, 'text');

    const invoice = await generateInvoice(
      {
        id: 'international-order',
        order_number: 1001,
        created_at: '2026-07-22T00:00:00.000Z',
        currency_code: 'USD',
        subtotal: 120,
        shipping_total: 0,
        tax_total: 22,
        total: 142,
        email: 'customer@example.com',
        metadata: {
          gst_regime: 'IGST',
          tax_breakdown: {
            currency_code: 'USD',
            cgst: 0,
            sgst: 0,
            igst: 22,
            total: 22,
          },
          tax_breakdown_inr: {
            currency_code: 'INR',
            cgst: 0,
            sgst: 0,
            igst: 1800,
            total: 1800,
          },
        },
      },
      [
        {
          product_title: 'International test item',
          unit_price: 120,
          quantity: 1,
          total: 120,
        },
      ]
    );

    expect(invoice.length).toBeGreaterThan(0);

    const renderedText = textSpy.mock.calls.map(([value]) => String(value));
    expect(renderedText).toContain('IGST:');
    expect(renderedText).toContain('₹18.00');
    expect(renderedText).not.toContain('CGST:');
    expect(renderedText).not.toContain('SGST:');
  });
});
