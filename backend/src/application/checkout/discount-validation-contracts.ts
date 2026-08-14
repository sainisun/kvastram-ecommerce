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
