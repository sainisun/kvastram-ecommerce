import { product_options } from '../db/schema';

export type ProductOptionInput = { title: string };

export function buildProductOptionRows(productId: string, options: ProductOptionInput[] | undefined) {
  return (options || []).map((option) => ({
    product_id: productId,
    title: option.title,
    metadata: null,
  }));
}

export class ProductOptionRepository {
  async assign(tx: any, productId: string, options: ProductOptionInput[] | undefined) {
    const rows = buildProductOptionRows(productId, options);
    if (!rows.length) return;
    await tx.insert(product_options).values(rows);
  }
}

export const productOptionRepository = new ProductOptionRepository();
