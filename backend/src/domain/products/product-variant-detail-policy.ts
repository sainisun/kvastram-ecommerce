export type ProductVariantDetailPrice = {
  id: string;
  amount: number;
  currency_code: string;
};

export type ProductVariantDetailSource = {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  inventory_quantity: number | null;
  prices: ProductVariantDetailPrice[];
};

export type ProductVariantDetail = {
  id: string;
  title: string;
  sku: string | null;
  inventory_quantity: number;
  prices: ProductVariantDetailPrice[];
};

/**
 * Groups variant details by product while preserving database order and the
 * historical null-inventory-to-zero fallback used by detailed product lists.
 */
export function groupProductVariantDetails(
  variants: ProductVariantDetailSource[],
): Record<string, ProductVariantDetail[]> {
  const variantsByProduct: Record<string, ProductVariantDetail[]> = {};

  for (const variant of variants) {
    if (!variantsByProduct[variant.product_id]) {
      variantsByProduct[variant.product_id] = [];
    }
    variantsByProduct[variant.product_id].push({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      inventory_quantity: variant.inventory_quantity ?? 0,
      prices: variant.prices,
    });
  }

  return variantsByProduct;
}
