import { describe, expect, it, vi } from 'vitest';
import {
  generateOrderInvoiceCommand,
  purchaseCarrierLabelCommand,
} from '../src/application/orders/fulfillment-commands';

describe('fulfillment commands', () => {
  it('generates an invoice through injected data and generator ports', async () => {
    const generate = vi.fn().mockResolvedValue(Buffer.from('invoice-pdf'));
    const result = await generateOrderInvoiceCommand('order-1', {
      invoiceData: {
        getInvoiceData: vi.fn().mockResolvedValue({
          order: { order_number: 42 },
          items: [{ title: 'Textile' }],
        }),
      },
      invoiceGenerator: { generate },
    });

    expect(generate).toHaveBeenCalledWith(
      { order_number: 42 },
      [{ title: 'Textile' }]
    );
    expect(result?.pdfBuffer.toString()).toBe('invoice-pdf');
  });

  it('returns null for an unknown invoice without invoking the generator', async () => {
    const generate = vi.fn();
    const result = await generateOrderInvoiceCommand('missing-order', {
      invoiceData: { getInvoiceData: vi.fn().mockResolvedValue(null) },
      invoiceGenerator: { generate },
    });

    expect(result).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });

  it('purchases a carrier label through a port then persists the mapped package update', async () => {
    const purchaseLabel = vi.fn().mockResolvedValue({
      provider: 'shiprocket',
      shipping_carrier: 'Shiprocket',
      tracking_number: 'AWB-101',
      tracking_url: 'https://tracking.example/AWB-101',
      label_status: 'purchased',
      label_url: 'https://labels.example/AWB-101.pdf',
      label_file_name: 'AWB-101.pdf',
      label_cost: 120,
      label_currency: 'INR',
      carrier_service: 'Express',
      shiprocket_order_id: 9,
      shiprocket_shipment_id: 10,
      shiprocket_courier_id: 11,
      shiprocket_pickup_id: 12,
    });
    const updatePackage = vi.fn().mockResolvedValue({ id: 'order-1' });

    const result = await purchaseCarrierLabelCommand(
      {
        context: {
          order: {
            workflow: {
              label: { package_weight_grams: 500, package_length_cm: 20 },
            },
          },
          items: [{ id: 'line-1' }],
          packageId: 'pkg-1',
        },
        options: { provider: 'shiprocket', packageId: 'pkg-1', courierId: 11 },
      },
      {
        carrierLabelProvider: { purchaseLabel },
        updatePackage,
      }
    );

    expect(purchaseLabel).toHaveBeenCalledWith(
      { order: expect.any(Object), items: [{ id: 'line-1' }] },
      { provider: 'shiprocket', package_id: 'pkg-1', courier_id: 11 }
    );
    expect(updatePackage).toHaveBeenCalledWith(
      'pkg-1',
      expect.objectContaining({
        label_provider: 'shiprocket',
        tracking_number: 'AWB-101',
        provider_shipment_id: '10',
        package_weight_grams: 500,
        notify_buyer: false,
      })
    );
    expect(result).toEqual({
      order: { id: 'order-1' },
      purchase: expect.objectContaining({ tracking_number: 'AWB-101' }),
    });
  });
});
