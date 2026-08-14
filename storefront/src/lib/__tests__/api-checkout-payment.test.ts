import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkoutPaymentApi } from '../api-checkout-payment';

describe('checkoutPaymentApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves checkout OTP backend error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'OTP rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(
      checkoutPaymentApi.sendCheckoutOtp('buyer@example.com')
    ).rejects.toThrow('OTP rate limit exceeded');
  });

  it('formats checkout validation issue paths when order creation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { issues: [{ path: ['items', '0', 'quantity'], message: 'Must be positive' }] },
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(
      checkoutPaymentApi.createOrder({
        region_id: 'region-1',
        currency_code: 'usd',
        email: 'buyer@example.com',
        shipping_address: {
          address_1: '1 Main Street',
          city: 'Jaipur',
          postal_code: '302001',
          country_code: 'in',
        },
        items: [{ variant_id: 'variant-1', quantity: 0 }],
        shipping_method: 'standard',
      })
    ).rejects.toThrow('items.0.quantity: Must be positive');
  });

  it('returns the legacy shipping fallback when the checkout endpoint is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(
      checkoutPaymentApi.getShippingOptions('IN', 'region-1', ' 302001 ')
    ).resolves.toEqual({
      options: [
        {
          id: 'standard',
          name: 'Standard International Shipping',
          description: '7-14 business days',
          price: 2500,
          estimated_days: '7-14',
          currency_code: 'USD',
        },
        {
          id: 'express',
          name: 'Express International Shipping',
          description: '3-5 business days',
          price: 4500,
          estimated_days: '3-5',
          currency_code: 'USD',
        },
      ],
      free_shipping_threshold: 25000,
      currency_code: 'USD',
    });
  });

  it('uses configured tax rates when tax calculation falls back', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(
      checkoutPaymentApi.calculateTax('IN', 12345, undefined, {
        currency_code: 'INR',
        tax_rates: [{ country_code: 'IN', rate: 0.05, name: 'GST' }],
      })
    ).resolves.toEqual({
      tax_amount: 617,
      tax_rate: 0.05,
      tax_name: 'GST',
      currency_code: 'INR',
    });
  });

  it('sends payment intent requests with the legacy payload and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ client_secret: 'secret-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      checkoutPaymentApi.createPaymentIntent('order-1', 'checkout-token-1')
    ).resolves.toEqual({ client_secret: 'secret-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/store/payments/create-intent'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ order_id: 'order-1', checkout_token: 'checkout-token-1' }),
      })
    );
  });

  it('preserves payment status errors returned by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Payment not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(checkoutPaymentApi.checkPaymentStatus('order-404')).rejects.toThrow(
      'Payment not found'
    );
  });
});
