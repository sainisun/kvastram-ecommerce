import { calculateCheckoutDiscountAmount } from '../../domain/checkout/checkout-pricing-policy';
import type { CheckoutDiscountRepository } from './discount-validation-contracts';

export async function validateCheckoutDiscountCommand(
  input: {
    code: string;
    cartTotal: number;
    customerId: string | null;
    now?: Date;
  },
  repository: CheckoutDiscountRepository
) {
  const discount = await repository.findByCode(input.code);
  const now = input.now ?? new Date();

  if (!discount) {
    throw new Error('Invalid discount code');
  }
  if (!discount.is_active) {
    throw new Error('Discount code is inactive');
  }
  if (discount.starts_at && discount.starts_at > now) {
    throw new Error('Discount code is not active yet');
  }
  if (discount.ends_at && discount.ends_at < now) {
    throw new Error('Discount code has expired');
  }
  if (
    discount.usage_limit !== null &&
    (discount.usage_count || 0) >= discount.usage_limit
  ) {
    throw new Error('Discount usage limit reached');
  }

  if (
    input.customerId &&
    (await repository.hasCustomerUsage(discount.id, input.customerId))
  ) {
    throw new Error('You have already used this discount code');
  }

  if (
    discount.min_purchase_amount &&
    input.cartTotal < discount.min_purchase_amount
  ) {
    throw new Error(
      `Minimum purchase of ${(discount.min_purchase_amount / 100).toFixed(2)} required`
    );
  }

  return {
    discount,
    discountAmount: calculateCheckoutDiscountAmount(input.cartTotal, discount),
  };
}
