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
} from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';
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
      // 1. Create Product
      const { prices, ...productData } = data;

      const newProductResult = await tx
        .insert(products)
        .values({
          ...productData,
          options: undefined,
        } as typeof products.$inferInsert)
        .returning();
      const newProduct = newProductResult[0];

      // 2. Create Default Variant (Use Product Title/Handle as default)
      const newVariantResult = await tx
        .insert(product_variants)
        .values({
          product_id: newProduct.id,
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
      const newVariant = newVariantResult[0];

      // 3. Create Prices (Money Amounts)
      if (prices && prices.length > 0) {
        for (const price of prices) {
          await tx.insert(money_amounts).values({
            variant_id: newVariant.id,
            region_id: price.region_id,
            currency_code: price.currency_code,
            amount: price.amount,
            min_quantity: 1,
          });
        }
      }

      // 4. Create Options (if any - though for simple products usually empty)
      if (data.options && data.options.length > 0) {
        for (const opt of data.options) {
          await tx.insert(product_options).values({
            product_id: newProduct.id,
            title: opt.title,
            metadata: null,
          });
        }
      }

      // 5. Create Images
      if (data.images && data.images.length > 0) {
        const imageValues = data.images
          .filter((img) => img.url) // Filter out images without URL
          .map((img) => ({
            product_id: newProduct.id,
            url: img.url,
            alt_text: img.alt_text,
            position: img.position ?? 0,
            is_thumbnail: img.is_thumbnail ?? false,
          }));

        if (imageValues.length > 0) {
          await tx.insert(product_images).values(imageValues);
        }
      }

      // 6. Assign Categories
      if (data.category_ids && data.category_ids.length > 0) {
        await tx.insert(product_categories).values(
          data.category_ids.map((catId) => ({
            product_id: newProduct.id,
            category_id: catId,
          }))
        );
      }

      // 7. Assign Tags
      if (data.tag_ids && data.tag_ids.length > 0) {
        await tx.insert(product_tags).values(
          data.tag_ids.map((tagId) => ({
            product_id: newProduct.id,
            tag_id: tagId,
          }))
        );
      }

      return { ...newProduct, default_variant_id: newVariant.id };
    });
  }

  /**
   * Update a product's base details.
   */
  async update(id: string, data: UpdateProductInput) {
    return await db.transaction(async (tx) => {
      const updateData = {
        ...data,
        updated_at: new Date(),
        options: undefined,
        prices: undefined,
        images: undefined,
        category_ids: undefined,
        tag_ids: undefined,
      };

      const updatedProductResult = await tx
        .update(products)
        .set(updateData as typeof products.$inferInsert)
        .where(eq(products.id, id))
        .returning();

      if (updatedProductResult.length === 0) {
        throw new Error(`Product with id ${id} not found`);
      }

      const updatedProduct = updatedProductResult[0];

      // Update default variant if exists
      const variants = await tx
        .select()
        .from(product_variants)
        .where(eq(product_variants.product_id, id));
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

      // Handle images if provided
      if (data.images) {
        await tx
          .delete(product_images)
          .where(eq(product_images.product_id, id));

        if (data.images.length > 0) {
          const imageValues = data.images
            .filter((img) => img.url)
            .map((img) => ({
              product_id: id,
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

      // Handle Categories
      if (data.category_ids) {
        await tx
          .delete(product_categories)
          .where(eq(product_categories.product_id, id));
        if (data.category_ids.length > 0) {
          await tx.insert(product_categories).values(
            data.category_ids.map((catId) => ({
              product_id: id,
              category_id: catId,
            }))
          );
        }
      }

      // Handle Tags
      if (data.tag_ids) {
        await tx.delete(product_tags).where(eq(product_tags.product_id, id));
        if (data.tag_ids.length > 0) {
          await tx.insert(product_tags).values(
            data.tag_ids.map((tagId) => ({
              product_id: id,
              tag_id: tagId,
            }))
          );
        }
      }

      return updatedProduct;
    });
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
