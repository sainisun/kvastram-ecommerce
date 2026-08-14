import { eq, inArray } from 'drizzle-orm';
import {
  money_amounts,
  product_categories,
  product_embeddings,
  product_images,
  product_option_values,
  product_options,
  product_tags,
  product_variants,
  products,
} from '../db/schema';

export class ProductDeletionRepository {
  /**
   * Deletes the product data set in the legacy transaction order.
   * The caller owns the transaction and schedules external side effects after commit.
   */
  async delete(tx: any, productId: string) {
    const variants = await tx
      .select({ id: product_variants.id })
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));
    const variantIds = variants.map((variant: { id: string }) => variant.id);

    if (variantIds.length > 0) {
      await tx
        .delete(product_option_values)
        .where(inArray(product_option_values.variant_id, variantIds));
      await tx.delete(product_options).where(eq(product_options.product_id, productId));
      await tx.delete(money_amounts).where(inArray(money_amounts.variant_id, variantIds));
    }

    await tx.delete(product_variants).where(eq(product_variants.product_id, productId));
    await tx.delete(product_images).where(eq(product_images.product_id, productId));
    await tx.delete(product_categories).where(eq(product_categories.product_id, productId));
    await tx.delete(product_tags).where(eq(product_tags.product_id, productId));
    await tx.delete(products).where(eq(products.id, productId));
    await tx.delete(product_embeddings).where(eq(product_embeddings.product_id, productId));

    return { id: productId, deleted: true };
  }
}

export const productDeletionRepository = new ProductDeletionRepository();
