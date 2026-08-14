import { inArray, eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
  money_amounts,
  product_attribute_values,
  product_categories,
  product_images,
  product_seo,
  product_variants,
  products,
} from '../db/schema';

export class ProductPublishReadinessRepository {
  async loadSnapshot(productId: string) {
    const [product] = await db
      .select({
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
        collection_id: products.collection_id,
        price_type: products.price_type,
        material: products.material,
        seo_title: products.seo_title,
        seo_description: products.seo_description,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return {
        product: null,
        seo: null,
        imageCount: 0,
        categoryCount: 0,
        attributeCount: 0,
        prices: [],
      };
    }

    const [seo] = await db
      .select({ seo_title: product_seo.seo_title, meta_description: product_seo.meta_description })
      .from(product_seo)
      .where(eq(product_seo.product_id, productId))
      .limit(1);
    const existingImages = await db
      .select({ id: product_images.id })
      .from(product_images)
      .where(eq(product_images.product_id, productId));
    const existingCategories = await db
      .select({ id: product_categories.product_id })
      .from(product_categories)
      .where(eq(product_categories.product_id, productId));
    const existingAttributes = await db
      .select({ id: product_attribute_values.id })
      .from(product_attribute_values)
      .where(eq(product_attribute_values.product_id, productId));
    const existingVariants = await db
      .select({ id: product_variants.id })
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));
    const variantIds = existingVariants.map((variant) => variant.id);
    const prices = variantIds.length
      ? await db
          .select({ amount: money_amounts.amount })
          .from(money_amounts)
          .where(inArray(money_amounts.variant_id, variantIds))
      : [];

    return {
      product,
      seo: seo ?? null,
      imageCount: existingImages.length,
      categoryCount: existingCategories.length,
      attributeCount: existingAttributes.length,
      prices,
    };
  }
}

export const productPublishReadinessRepository = new ProductPublishReadinessRepository();
