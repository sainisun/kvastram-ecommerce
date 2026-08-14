import { describe, expect, it, vi } from 'vitest';
import { validateCheckoutDiscountCommand } from '../src/application/checkout/discount-validation-command';
import type {
  CheckoutDiscountRecord,
  CheckoutDiscountRepository,
} from '../src/application/checkout/discount-validation-contracts';

const baseDiscount: CheckoutDiscountRecord = {
  id: 'discount-1',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  starts_at: null,
  ends_at: null,
  usage_limit: null,
  usage_count: 0,
  min_purchase_amount: null,
  is_active: true,
};

function repositoryFor(
  discount: CheckoutDiscountRecord | null,
  hasCustomerUsage = false
): CheckoutDiscountRepository {
  return {
    findByCode: vi.fn().mockResolvedValue(discount),
    hasCustomerUsage: vi.fn().mockResolvedValue(hasCustomerUsage),
  };
}

describe('validateCheckoutDiscountCommand', () => {
  it('returns the validated discount and capped calculated amount', async () => {
    const repository = repositoryFor({
      ...baseDiscount,
      type: 'fixed_amount',
      value: 2_500,
    });

    await expect(
      validateCheckoutDiscountCommand(
        { code: 'SAVE10', cartTotal: 1_000, customerId: null },
        repository
      )
    ).resolves.toMatchObject({
      discount: expect.objectContaining({ id: 'discount-1' }),
      discountAmount: 1_000,
    });
    expect(repository.hasCustomerUsage).not.toHaveBeenCalled();
  });

  it('preserves inactive and temporal eligibility errors', async () => {
    await expect(
      validateCheckoutDiscountCommand(
        { code: 'SAVE10', cartTotal: 10_000, customerId: null },
        repositoryFor({ ...baseDiscount, is_active: false })
      )
    ).rejects.toThrow('Discount code is inactive');

    await expect(
      validateCheckoutDiscountCommand(
        {
          code: 'SAVE10',
          cartTotal: 10_000,
          customerId: null,
          now: new Date('2026-08-01T00:00:00.000Z'),
        },
        repositoryFor({
          ...baseDiscount,
          starts_at: new Date('2026-08-02T00:00:00.000Z'),
        })
      )
    ).rejects.toThrow('Discount code is not active yet');
  });

  it('enforces one-use-per-customer through the injected usage repository', async () => {
    const repository = repositoryFor(baseDiscount, true);

    await expect(
      validateCheckoutDiscountCommand(
        { code: 'SAVE10', cartTotal: 10_000, customerId: 'customer-1' },
        repository
      )
    ).rejects.toThrow('You have already used this discount code');
    expect(repository.hasCustomerUsage).toHaveBeenCalledWith(
      'discount-1',
      'customer-1'
    );
  });

  it('preserves minimum purchase and usage-limit validation messages', async () => {
    await expect(
      validateCheckoutDiscountCommand(
        { code: 'SAVE10', cartTotal: 999, customerId: null },
        repositoryFor({ ...baseDiscount, min_purchase_amount: 1_000 })
      )
    ).rejects.toThrow('Minimum purchase of 10.00 required');

    await expect(
      validateCheckoutDiscountCommand(
        { code: 'SAVE10', cartTotal: 10_000, customerId: null },
        repositoryFor({ ...baseDiscount, usage_limit: 2, usage_count: 2 })
      )
    ).rejects.toThrow('Discount usage limit reached');
  });
});
