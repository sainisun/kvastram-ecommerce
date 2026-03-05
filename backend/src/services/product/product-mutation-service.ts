/**
 * Product Mutation Service
 * Handles all write operations for products
 */

import { db } from '../../db/client';
import {
  products,
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
  product_images,
  product_categories,
  product_tags,
  back_in_stock_subscriptions,
} from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { emailService } from '../email-service';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductBulkUpdate,
} from './product-validator';


export class ProductMutationService {
  /**
   * Create a base product with default variant and prices.
   */
  async create(data: CreateProductInput) {
    return await db.transaction(async (tx) => {
      const { prices, ...productData } = data;

      // 1. Create Product
      const newProduct = await this.createBaseProduct(tx, productData);

      // 2. Create Default Variant
      const newVariant = await this.createDefaultVariantForProduct(tx, newProduct.id, data);

      // 3. Create Prices (Money Amounts)
      await this.assignPricesToVariant(tx, newVariant.id, prices);

      // 4. Create Options
      await this.assignOptionsToProduct(tx, newProduct.id, data.options);

      // 5. Create Images
      await this.assignImagesToProduct(tx, newProduct.id, data.images);

      // 6. Assign Categories
      await this.assignCategoriesToProduct(tx, newProduct.id, data.category_ids);

      // 7. Assign Tags
      await this.assignTagsToProduct(tx, newProduct.id, data.tag_ids);

      return { ...newProduct, default_variant_id: newVariant.id };
    });
  }

  private async createBaseProduct(tx: any, productData: any) {
    const result = await tx
      .insert(products)
      .values({
        ...productData,
        options: undefined,
      } as typeof products.$inferInsert)
      .returning();
    return result[0];
  }

  private async createDefaultVariantForProduct(tx: any, productId: string, data: CreateProductInput) {
    const result = await tx
      .insert(product_variants)
      .values({
        product_id: productId,
        title: 'Default Variant',
        sku: data.sku || `${data.handle}-default`,
        inventory_quantity: data.inventory_quantity || 0,
        manage_inventory: true,
        hs_code: data.hs_code,
        origin_country: data.origin_country,
        material: data.material,
        weight: data.weight,
        length: data.length,
        height: data.height,
        width: data.width,
      })
      .returning();
    return result[0];
  }

  private async assignPricesToVariant(tx: any, variantId: string, prices: any[] | undefined) {
    if (!prices || prices.length === 0) return;
    for (const price of prices) {
      await tx.insert(money_amounts).values({
        variant_id: variantId,
        region_id: price.region_id,
        currency_code: price.currency_code,
        amount: price.amount,
        min_quantity: 1,
      });
    }
  }

  private async assignOptionsToProduct(tx: any, productId: string, options: any[] | undefined) {
    if (!options || options.length === 0) return;
    for (const opt of options) {
      await tx.insert(product_options).values({
        product_id: productId,
        title: opt.title,
        metadata: null,
      });
    }
  }

  private async assignImagesToProduct(tx: any, productId: string, images: any[] | undefined) {
    if (!images || images.length === 0) return;
    const imageValues = images
      .filter((img) => img.url)
      .map((img) => ({
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text,
        position: img.position ?? 0,
        is_thumbnail: img.is_thumbnail ?? false,
      }));

    if (imageValues.length > 0) {
      await tx.insert(product_images).values(imageValues);
    }
  }

  private async assignCategoriesToProduct(tx: any, productId: string, categoryIds: string[] | undefined) {
    if (!categoryIds || categoryIds.length === 0) return;
    await tx.insert(product_categories).values(
      categoryIds.map((catId) => ({
        product_id: productId,
        category_id: catId,
      }))
    );
  }

  private async assignTagsToProduct(tx: any, productId: string, tagIds: string[] | undefined) {
    if (!tagIds || tagIds.length === 0) return;
    await tx.insert(product_tags).values(
      tagIds.map((tagId) => ({
        product_id: productId,
        tag_id: tagId,
      }))
    );
  }

  /**
   * Update a product's base details.
   */
  async update(id: string, data: UpdateProductInput) {
    const result = await db.transaction(async (tx) => {
      // 1. Update Product Base
      const updatedProduct = await this.updateBaseProductDetails(tx, id, data);

      // 2. Update default variant if exists
      await this.updateDefaultVariant(tx, id, data);

      // 3. Handle images if provided
      if (data.images) {
        await this.syncProductImages(tx, id, data.images);
      }

      // 4. Handle Categories
      if (data.category_ids) {
        await this.syncProductCategories(tx, id, data.category_ids);
      }

      // 5. Handle Tags
      if (data.tag_ids) {
        await this.syncProductTags(tx, id, data.tag_ids);
      }

      return updatedProduct;
    });

    // Auto-notify back-in-stock subscribers if inventory went above 0
    // Run async (non-blocking) — product update should not fail if emails fail
    if (data.inventory_quantity && data.inventory_quantity > 0) {
      this.notifyBackInStockSubscribers(id).catch((err) =>
        console.error('[BackInStock] Auto-notify failed:', err.message)
      );
    }

    return result;
  }

  private async updateBaseProductDetails(tx: any, id: string, data: UpdateProductInput) {
    const updateData = {
      ...data,
      updated_at: new Date(),
      options: undefined,
      prices: undefined,
      images: undefined,
      category_ids: undefined,
      tag_ids: undefined,
    };

    const result = await tx
      .update(products)
      .set(updateData as typeof products.$inferInsert)
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Product with id ${id} not found`);
    }
    return result[0];
  }

  private async updateDefaultVariant(tx: any, productId: string, data: UpdateProductInput) {
    const variants = await tx
      .select()
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));

    if (variants.length > 0) {
      await tx
        .update(product_variants)
        .set({
          hs_code: data.hs_code,
          origin_country: data.origin_country,
          material: data.material,
          weight: data.weight,
          length: data.length,
          height: data.height,
          width: data.width,
          inventory_quantity: data.inventory_quantity,
          updated_at: new Date(),
        })
        .where(eq(product_variants.id, variants[0].id));
    }
  }

  private async syncProductImages(tx: any, productId: string, images: any[]) {
    await tx
      .delete(product_images)
      .where(eq(product_images.product_id, productId));

    if (images.length > 0) {
      const imageValues = images
        .filter((img) => img.url)
        .map((img) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.alt_text,
          position: img.position ?? 0,
          is_thumbnail: img.is_thumbnail ?? false,
        }));

      if (imageValues.length > 0) {
        await tx.insert(product_images).values(imageValues);
      }
    }
  }

  private async syncProductCategories(tx: any, productId: string, categoryIds: string[]) {
    await tx
      .delete(product_categories)
      .where(eq(product_categories.product_id, productId));

    if (categoryIds.length > 0) {
      await tx.insert(product_categories).values(
        categoryIds.map((catId) => ({
          product_id: productId,
          category_id: catId,
        }))
      );
    }
  }

  private async syncProductTags(tx: any, productId: string, tagIds: string[]) {
    await tx.delete(product_tags).where(eq(product_tags.product_id, productId));

    if (tagIds.length > 0) {
      await tx.insert(product_tags).values(
        tagIds.map((tagId) => ({
          product_id: productId,
          tag_id: tagId,
        }))
      );
    }
  }

  /** Send back-in-stock emails to all pending subscribers for a product */
  private async notifyBackInStockSubscribers(productId: string) {
    // Find all unnotified subscribers for this product
    const subscribers = await db
      .select({
        id: back_in_stock_subscriptions.id,
        email: back_in_stock_subscriptions.email,
      })
      .from(back_in_stock_subscriptions)
      .where(
        and(
          eq(back_in_stock_subscriptions.product_id, productId),
          eq(back_in_stock_subscriptions.notified, false)
        )
      );

    if (subscribers.length === 0) return;

    // Get product info for email
    const [product] = await db
      .select({ title: products.title, handle: products.handle })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) return;

    const productUrl = `/products/${product.handle}`;

    console.log(`[BackInStock] Notifying ${subscribers.length} subscriber(s) for "${product.title}"`);

    // Send emails and mark as notified
    for (const subscriber of subscribers) {
      try {
        await emailService.sendBackInStockNotification({
          email: subscriber.email,
          product_title: product.title || 'Product',
          product_url: productUrl,
        });

        // Mark as notified
        await db
          .update(back_in_stock_subscriptions)
          .set({ notified: true, notified_at: new Date() })
          .where(eq(back_in_stock_subscriptions.id, subscriber.id));
      } catch (err: any) {
        console.error(`[BackInStock] Failed to notify ${subscriber.email}:`, err.message);
      }
    }

    console.log(`[BackInStock] Done notifying subscribers for "${product.title}"`);
  }


  /**
   * Delete a product and all its related data.
   */
  async delete(id: string) {
    return await db.transaction(async (tx) => {
      // 1. Get variants for this product
      const variants = await tx
        .select({ id: product_variants.id })
        .from(product_variants)
        .where(eq(product_variants.product_id, id));

      const variantIds = variants.map((v) => v.id);

      // 2. Delete product_options and product_option_values
      if (variantIds.length > 0) {
        await tx
          .delete(product_option_values)
          .where(inArray(product_option_values.variant_id, variantIds));
        await tx
          .delete(product_options)
          .where(eq(product_options.product_id, id));
      }

      // 3. Delete money_amounts (prices) for all variants
      if (variantIds.length > 0) {
        await tx
          .delete(money_amounts)
          .where(inArray(money_amounts.variant_id, variantIds));
      }

      // 4. Delete variants
      await tx
        .delete(product_variants)
        .where(eq(product_variants.product_id, id));

      // 5. Delete images
      await tx.delete(product_images).where(eq(product_images.product_id, id));

      // 6. Delete category associations
      await tx
        .delete(product_categories)
        .where(eq(product_categories.product_id, id));

      // 7. Delete tag associations
      await tx.delete(product_tags).where(eq(product_tags.product_id, id));

      // 8. Finally delete the product
      await tx.delete(products).where(eq(products.id, id));

      return { id, deleted: true };
    });
  }

  /**
   * Bulk update products
   */
  async bulkUpdate(ids: string[], updates: ProductBulkUpdate) {
    const updateData = { ...updates, updated_at: new Date() };
    await db.update(products).set(updateData).where(inArray(products.id, ids));
    return ids.length;
  }

  /**
   * Bulk delete products
   */
  async bulkDelete(ids: string[]) {
    return await db.transaction(async (tx) => {
      // 1. Get all variant IDs for these products
      const variants = await tx
        .select({ id: product_variants.id })
        .from(product_variants)
        .where(inArray(product_variants.product_id, ids));

      const variantIds = variants.map((v) => v.id);

      // 2. Delete product_options and product_option_values
      if (variantIds.length > 0) {
        await tx
          .delete(product_option_values)
          .where(inArray(product_option_values.variant_id, variantIds));
        await tx
          .delete(product_options)
          .where(inArray(product_options.product_id, ids));
      }

      // 3. Delete money_amounts (prices) for all variants
      if (variantIds.length > 0) {
        await tx
          .delete(money_amounts)
          .where(inArray(money_amounts.variant_id, variantIds));
      }

      // 4. Delete variants
      await tx
        .delete(product_variants)
        .where(inArray(product_variants.product_id, ids));

      // 5. Delete images
      await tx
        .delete(product_images)
        .where(inArray(product_images.product_id, ids));

      // 6. Delete category associations
      await tx
        .delete(product_categories)
        .where(inArray(product_categories.product_id, ids));

      // 7. Delete tag associations
      await tx
        .delete(product_tags)
        .where(inArray(product_tags.product_id, ids));

      // 8. Finally delete products
      await tx.delete(products).where(inArray(products.id, ids));
      return ids.length;
    });
  }
}

// Export singleton instance
export const productMutationService = new ProductMutationService();
