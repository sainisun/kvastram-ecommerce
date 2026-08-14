import { eq } from 'drizzle-orm';
import { products } from '../db/schema';
import { compactUndefined } from '../domain/products/product-write-input-policy';

export function buildProductBaseUpdateInput(productFields: Record<string, unknown>, updatedAt = new Date()) {
  return compactUndefined({ ...productFields, updated_at: updatedAt });
}

export class ProductBaseRepository {
  async create(tx: any, productData: Record<string, unknown>) {
    const result = await tx
      .insert(products)
      .values(productData as typeof products.$inferInsert)
      .returning();
    return result[0];
  }

  async update(tx: any, productId: string, productFields: Record<string, unknown>) {
    const result = await tx
      .update(products)
      .set(buildProductBaseUpdateInput(productFields) as typeof products.$inferInsert)
      .where(eq(products.id, productId))
      .returning();
    return result[0] ?? null;
  }
}

export const productBaseRepository = new ProductBaseRepository();
