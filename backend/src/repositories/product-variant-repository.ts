import { eq } from 'drizzle-orm';
import { product_variants } from '../db/schema';
import { compactUndefined } from '../domain/products/product-write-input-policy';

export type DefaultVariantUpdateInput = {
  hs_code?: string | null;
  origin_country?: string | null;
  material?: string | null;
  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;
  inventory_quantity?: number | null;
};

export function buildDefaultVariantUpdateInput(data: DefaultVariantUpdateInput, updatedAt = new Date()) {
  return compactUndefined({
    hs_code: data.hs_code,
    origin_country: data.origin_country,
    material: data.material,
    weight: data.weight,
    length: data.length,
    height: data.height,
    width: data.width,
    inventory_quantity: data.inventory_quantity,
    updated_at: updatedAt,
  });
}

export class ProductVariantRepository {
  async updateDefault(tx: any, productId: string, data: DefaultVariantUpdateInput) {
    const variants = await tx.select().from(product_variants).where(eq(product_variants.product_id, productId));
    if (!variants.length) return null;

    await tx
      .update(product_variants)
      .set(buildDefaultVariantUpdateInput(data))
      .where(eq(product_variants.id, variants[0].id));
    return variants[0].id;
  }
}

export const productVariantRepository = new ProductVariantRepository();
