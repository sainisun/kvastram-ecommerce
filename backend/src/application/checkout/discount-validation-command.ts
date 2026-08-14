import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { discounts, discount_usage } from '../../db/schema';
import { calculateCheckoutDiscountAmount } from '../../domain/checkout/checkout-pricing-policy';

export type CheckoutDiscountRecord = {
  id: string;
  code: string;
  type: string;
  value: number;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  usage_count: number | null;
  min_purchase_amount: number | null;
  is_active: boolean | null;
};

export type CheckoutDiscountRepository = {
  findByCode(code: string): Promise<CheckoutDiscountRecord | null>;
  hasCustomerUsage(discountId: string, customerId: string): Promise<boolean>;
};

const databaseDiscountRepository: CheckoutDiscountRepository = {
  async findByCode(code) {
    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.code, code.toUpperCase()))
      .limit(1);

    return (discount as CheckoutDiscountRecord | undefined) ?? null;
  },

  async hasCustomerUsage(discountId, customerId) {
    const [existingUsage] = await db
      .select({ discount_id: discount_usage.discount_id })
      .from(discount_usage)
      .where(
        and(
          eq(discount_usage.discount_id, discountId),
          eq(discount_usage.customer_id, customerId)
        )
      )
      .limit(1);

    return Boolean(existingUsage);
  },
};

export async function validateCheckoutDiscountCommand(
  input: {
    code: string;
    cartTotal: number;
    customerId: string | null;
    now?: Date;
  },
  repository: CheckoutDiscountRepository = databaseDiscountRepository
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
