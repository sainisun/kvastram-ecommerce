import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { discounts, discount_usage } from '../db/schema';
import type {
  CheckoutDiscountRecord,
  CheckoutDiscountRepository,
} from '../application/checkout/discount-validation-contracts';

type DatabaseDiscount = typeof discounts.$inferSelect;

function toCheckoutDiscountRecord(
  record: DatabaseDiscount
): CheckoutDiscountRecord {
  return {
    id: record.id,
    code: record.code,
    type: record.type,
    value: record.value,
    starts_at: record.starts_at,
    ends_at: record.ends_at,
    usage_limit: record.usage_limit,
    usage_count: record.usage_count,
    min_purchase_amount: record.min_purchase_amount,
    is_active: record.is_active,
  };
}

export class DrizzleCheckoutDiscountRepository
  implements CheckoutDiscountRepository
{
  async findByCode(code: string): Promise<CheckoutDiscountRecord | null> {
    const [discount] = await db
      .select()
      .from(discounts)
      .where(eq(discounts.code, code.toUpperCase()))
      .limit(1);

    return discount ? toCheckoutDiscountRecord(discount) : null;
  }

  async hasCustomerUsage(
    discountId: string,
    customerId: string
  ): Promise<boolean> {
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
  }
}
