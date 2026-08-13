import { afterEach, describe, expect, it, vi } from 'vitest';
import { authAccountApi } from '../api-auth-account';

describe('authAccountApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves registration validation messages and HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, errors: { email: 'Email is already registered' } }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(
      authAccountApi.register({
        email: 'buyer@example.com',
        password: 'Password123!',
        first_name: 'Buyer',
        last_name: 'One',
      })
    ).rejects.toMatchObject({
      message: 'Email is already registered',
      status: 409,
    });
  });

  it('keeps login backend payload errors intact', async () => {
    const backendError = { error: 'Invalid credentials', code: 'INVALID_LOGIN' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(backendError), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(
      authAccountApi.login({ email: 'buyer@example.com', password: 'incorrect' })
    ).rejects.toEqual(backendError);
  });

  it('posts customer addresses with the legacy payload and session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          address: {
            id: 'address-1',
            address_1: '1 Main Street',
            city: 'Jaipur',
            postal_code: '302001',
            country_code: 'in',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const address = {
      address_1: '1 Main Street',
      city: 'Jaipur',
      postal_code: '302001',
      country_code: 'in',
    };

    await expect(authAccountApi.createCustomerAddress(address)).resolves.toMatchObject({
      address: { id: 'address-1' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/store/customers/me/addresses'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(address),
      })
    );
  });

  it('preserves tracking error messages returned by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Order does not match email' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(
      authAccountApi.trackOrder('KV-1001', 'buyer@example.com')
    ).rejects.toThrow('Order does not match email');
  });
});
