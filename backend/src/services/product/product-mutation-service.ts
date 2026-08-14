/**
 * Product Mutation Service
 * Handles all write operations for products
 */

import { createHash } from 'crypto';
import { db } from '../../db/client';
import {
  products,
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
  product_images,
  categories,
  tags,
  product_collections,
  collection_products,
  product_categories,
  product_tags,
  product_seo,
  product_discovery,
  product_attributes,
  attribute_values,
  product_attribute_values,
  product_variant_merchant,
  product_media_seo,
  product_embeddings,
  back_in_stock_subscriptions,
  regions,
} from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { emailService } from '../email-service';
import { syncSingleProductToMeilisearch, deleteProduct } from '../search-service';
import type {
  CreateProductInput,
  UpdateProductInput,
} from './product-validator';
import { ValidationError } from '../../middleware/error-handler';
import type { ValidationErrorDetails } from '../../middleware/error-handler';
import { getNewProductPublishReadinessIssues } from './product-readiness';
import {
  buildProductDiscoveryDocument,
  buildProductMetaDescription,
  buildProductSeoTitle,
  inferProductAttributeSlugs,
  inferProductSearchIntents,
  inferProductSemanticEntities,
} from '../../domain/products/product-discovery-policy';
import {
  buildDefaultVariantInput,
  buildProductImageInputs,
  compactUndefined,
} from '../../domain/products/product-write-input-policy';
import { productCatalogReferenceRepository } from '../../repositories/product-catalog-reference-repository';
import { productPricingRepository } from '../../repositories/product-pricing-repository';
import { productMediaRepository } from '../../repositories/product-media-repository';
import { productOptionRepository } from '../../repositories/product-option-repository';
import { productVariantRepository } from '../../repositories/product-variant-repository';
import { productBaseRepository } from '../../repositories/product-base-repository';

export class ProductMutationService {
  /**
   * Create a base product with default variant and prices.
   */
  async create(data: CreateProductInput) {
    if (data.status === 'published') {
      const errors = getNewProductPublishReadinessIssues(data);
      if (errors.length > 0) {
        throw new ValidationError('Product is not ready to publish', errors);
      }
    }

    const result = await db.transaction(async (tx) => {
      const {
        prices,
        options,
        images,
        category_ids,
        tag_ids,
        inventory_quantity,
        sku,
        ...productData
      } = data;

      // Validate foreign keys exist before proceeding
      await this.validateForeignKeys(tx, category_ids, tag_ids, productData.collection_id);

      // 1. Create Product
      const newProduct = await this.createBaseProduct(tx, productData);

      // 2. Create Default Variant
      const newVariant = await this.createDefaultVariantForProduct(tx, newProduct.id, data);

      // 3. Create Prices (Money Amounts)
      await productPricingRepository.assign(tx, newVariant.id, prices);

      // 4. Create Options
      await productOptionRepository.assign(tx, newProduct.id, options);

      // 5. Create Images
      const createdImages = await productMediaRepository.assign(tx, newProduct.id, images);

      // 6. Assign catalog references
      await productCatalogReferenceRepository.assign(tx, newProduct.id, category_ids, tag_ids, productData.collection_id);

      // 9. Create SEO/discovery baseline so new products are never SEO-empty.
      await this.createSeoDiscoveryBaseline(tx, newProduct, newVariant, createdImages, data);

      return { ...newProduct, default_variant_id: newVariant.id };
    });

    // Sync to Meilisearch in background (non-blocking)
    syncSingleProductToMeilisearch(result.id).catch((err) =>
      console.error('[SearchService] Sync after product create failed:', err.message)
    );

    return result;
  }

  private async validateForeignKeys(
    tx: any,
    categoryIds: string[] | undefined,
    tagIds: string[] | undefined,
    collectionId?: string | null
  ) {
    const errors = await productCatalogReferenceRepository.validate(tx, categoryIds, tagIds, collectionId);
    if (errors.length > 0) throw new ValidationError('Invalid foreign key references', errors);
  }

  private async createBaseProduct(tx: any, productData: any) {
    const result = await tx
      .insert(products)
      .values(productData as typeof products.$inferInsert)
      .returning();
    return result[0];
  }

  private async createDefaultVariantForProduct(tx: any, productId: string, data: CreateProductInput) {
    const result = await tx
      .insert(product_variants)
      .values(buildDefaultVariantInput(productId, data))
      .returning();
    return result[0];
  }

  private async createSeoDiscoveryBaseline(
    tx: any,
    product: typeof products.$inferSelect,
    variant: typeof product_variants.$inferSelect,
    images: Array<typeof product_images.$inferSelect>,
    data: CreateProductInput
  ) {
    const seoTitle = buildProductSeoTitle(data);
    const metaDescription = buildProductMetaDescription(data);
    const document = buildProductDiscoveryDocument(data);
    const documentHash = createHash('sha256').update(document || product.id).digest('hex');
    const thumbnailImage = images.find((image) => image.is_thumbnail) || images[0];

    await tx
      .insert(product_seo)
      .values({
        product_id: product.id,
        seo_title: seoTitle,
        meta_description: metaDescription,
        canonical_url: `/products/${product.handle}`,
        robots_index: product.status !== 'draft',
        robots_follow: true,
        og_title: seoTitle,
        og_description: metaDescription,
        og_image_url: thumbnailImage?.url || product.thumbnail,
        twitter_card: 'summary_large_image',
        schema_overrides: {},
        localized_metadata: {},
        seo_score: 0,
      })
      .onConflictDoNothing();

    await tx
      .insert(product_discovery)
      .values({
        product_id: product.id,
        primary_keyword: data.title,
        secondary_keywords: [data.material, data.subtitle].filter(Boolean),
        long_tail_keywords: [
          data.title,
          data.material ? `${data.material} handmade product` : undefined,
          /gift/i.test(data.title || '') ? `${data.title} gift` : undefined,
        ].filter(Boolean),
        search_intents: inferProductSearchIntents(data),
        semantic_entities: inferProductSemanticEntities(data),
        negative_keywords: [],
        product_document: document,
        document_hash: documentHash,
        metadata: { source: 'auto_create_baseline' },
      })
      .onConflictDoNothing();

    const inferred = inferProductAttributeSlugs(data);
    if (inferred.length > 0) {
      const attrRows: any[] = await tx.select().from(product_attributes);
      const valueRows: any[] = await tx.select().from(attribute_values);
      const attrByCode = new Map<string, any>(attrRows.map((attr) => [attr.code, attr]));
      const valuesByKey = new Map<string, any>(valueRows.map((value) => [`${value.attribute_id}:${value.slug}`, value]));
      const assignments = inferred
        .map((item) => {
          const attr = attrByCode.get(item.attribute);
          if (!attr) return null;
          const value = valuesByKey.get(`${attr.id}:${item.slug}`);
          if (!value) return null;
          return {
            product_id: product.id,
            attribute_id: attr.id,
            value_id: value.id,
            raw_value: value.label,
            source: 'auto_create_baseline',
            confidence: 82,
            metadata: { inferred_from: 'title_description_material' },
          };
        })
        .filter(Boolean);

      if (assignments.length > 0) {
        await tx.insert(product_attribute_values).values(assignments).onConflictDoNothing();
      }
    }

    if (images.length > 0) {
      await tx
        .insert(product_media_seo)
        .values(
          images.map((image, index) => ({
            image_id: image.id,
            alt_text: image.alt_text || `${product.title} ${index === 0 ? 'product image' : `view ${index + 1}`}`,
            cloudinary_public_id: (image.metadata as any)?.cloudinary_public_id || null,
            image_role: index === 0 ? 'primary' : 'gallery',
            view_type: index === 0 ? 'front' : null,
            color: null,
            seo_filename: product.handle,
            metadata: { source: 'auto_create_baseline' },
          }))
        )
        .onConflictDoNothing();
    }

    await tx
      .insert(product_variant_merchant)
      .values({
        variant_id: variant.id,
        item_group_id: product.id,
        material: data.material || null,
        condition: 'new',
        feed_enabled: false,
        metadata: { source: 'auto_create_baseline' },
      })
      .onConflictDoNothing();

    if (document && process.env.ENABLE_PRODUCT_EMBEDDINGS === 'true') {
      await tx
        .insert(product_embeddings)
        .values({
          product_id: product.id,
          locale: 'en',
          source_hash: documentHash,
          document,
          metadata: { source: 'auto_create_baseline', provider: 'pending' },
          updated_at: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  /**
   * Update a product's base details.
   */
  async update(id: string, data: UpdateProductInput) {
    if (data.status === 'published') {
      await this.validatePublishReadiness(id, data);
    }

    const result = await db.transaction(async (tx) => {
      await this.validateForeignKeys(tx, data.category_ids, data.tag_ids, data.collection_id);

      // 1. Update Product Base
      const updatedProduct = await this.updateBaseProductDetails(tx, id, data);

      // 2. Update default variant if exists
      const defaultVariantId = await productVariantRepository.updateDefault(tx, id, data);

      // 3. Sync prices for the default variant when pricing is provided
      if (defaultVariantId && data.prices) {
        await productPricingRepository.replace(tx, defaultVariantId, data.prices);
      }

      // 4. Handle images if provided
      if (data.images) {
        await productMediaRepository.replace(tx, id, data.images);
      }

      // 5. Handle Categories
      if (data.category_ids) {
        await productCatalogReferenceRepository.replaceCategories(tx, id, data.category_ids);
      }

      // 6. Handle Tags
      if (data.tag_ids) {
        await productCatalogReferenceRepository.replaceTags(tx, id, data.tag_ids);
      }

      if (data.collection_id !== undefined) {
        await productCatalogReferenceRepository.replaceCollection(tx, id, data.collection_id);
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

    // Sync to Meilisearch in background (non-blocking)
    syncSingleProductToMeilisearch(id).catch((err) =>
      console.error('[SearchService] Sync after product update failed:', err.message)
    );

    return result;
  }

  private async validatePublishReadiness(id: string, data: UpdateProductInput) {
    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing) throw new Error(`Product with id ${id} not found`);

    const [seo] = await db.select().from(product_seo).where(eq(product_seo.product_id, id)).limit(1);
    const existingImages = await db.select().from(product_images).where(eq(product_images.product_id, id));
    const existingCategories = await db.select().from(product_categories).where(eq(product_categories.product_id, id));
    const existingAttributes = await db.select().from(product_attribute_values).where(eq(product_attribute_values.product_id, id));
    const existingVariants = await db
      .select({ id: product_variants.id })
      .from(product_variants)
      .where(eq(product_variants.product_id, id));
    const existingVariantIds = existingVariants.map((variant) => variant.id);
    const existingPrices = existingVariantIds.length
      ? await db
          .select({ amount: money_amounts.amount })
          .from(money_amounts)
          .where(inArray(money_amounts.variant_id, existingVariantIds))
      : [];

    const hasImages = data.images ? data.images.some((image) => image.url) : existingImages.length > 0 || Boolean(data.thumbnail || existing.thumbnail);
    const hasCategories = data.category_ids ? data.category_ids.length > 0 : existingCategories.length > 0;
    const hasAttributes = existingAttributes.length > 0 || Boolean(data.material || existing.material);
    const hasSeoTitle = Boolean(data.seo_title || seo?.seo_title || existing.seo_title);
    const hasMetaDescription = Boolean(data.seo_description || seo?.meta_description || existing.seo_description);
    const hasFixedPrice = (data.price_type || existing.price_type || 'fixed') === 'fixed';
    const hasSellablePrice =
      Boolean(data.prices?.some((price) => Number(price.amount) > 0)) ||
      existingPrices.some((price) => Number(price.amount) > 0);
    const hasPrice = hasFixedPrice && hasSellablePrice;

    const errors: ValidationErrorDetails[] = [
      { field: 'title', message: 'Published products need a title.' },
      { field: 'handle', message: 'Published products need an editable URL slug.' },
      { field: 'prices', message: 'Published products need fixed pricing with at least one positive price.' },
      { field: 'images', message: 'Published products need at least one product image.' },
      { field: 'category_ids', message: 'Published products need at least one category or collection.' },
      { field: 'attributes', message: 'Published products need at least one structured attribute or legacy material.' },
      { field: 'seo_title', message: 'Published products need an SEO title.' },
      { field: 'seo_description', message: 'Published products need a meta description.' },
    ].filter((error) => {
      if (error.field === 'title') {
        return getNewProductPublishReadinessIssues({
          title: data.title || existing.title,
          handle: data.handle || existing.handle,
          thumbnail: data.thumbnail || existing.thumbnail || undefined,
          images: data.images,
          price_type: (data.price_type || existing.price_type || 'fixed') as 'fixed' | 'on_request',
          prices: data.prices,
          category_ids: data.category_ids,
          collection_id: data.collection_id ?? existing.collection_id,
        }).some((issue) => issue.field === 'title');
      }
      if (error.field === 'handle') return !Boolean(data.handle || existing.handle);
      if (error.field === 'prices') return !hasPrice;
      if (error.field === 'images') return !hasImages;
      if (error.field === 'category_ids') return !hasCategories && !Boolean(data.collection_id ?? existing.collection_id);
      if (error.field === 'attributes') return !hasAttributes;
      if (error.field === 'seo_title') return !hasSeoTitle;
      if (error.field === 'seo_description') return !hasMetaDescription;
      return false;
    });

    if (errors.length > 0) {
      throw new ValidationError('Product is not ready to publish', errors);
    }
  }

  private async updateBaseProductDetails(tx: any, id: string, data: UpdateProductInput) {
    const {
      category_ids,
      tag_ids,
      collection_id,
      options,
      prices,
      images,
      inventory_quantity,
      sku,
      ...productFields
    } = data;
    const updatedProduct = await productBaseRepository.update(tx, id, productFields);
    if (!updatedProduct) throw new Error(`Product with id ${id} not found`);
    return updatedProduct;
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
    const result = await db.transaction(async (tx) => {
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

      // 10. Delete Drizzle product_embeddings (if any)
      await tx.delete(product_embeddings).where(eq(product_embeddings.product_id, id));

      return { id, deleted: true };
    });

    // Delete from Meilisearch in background (non-blocking)
    deleteProduct(id).catch((err) =>
      console.error('[SearchService] Deletion from Meilisearch failed:', err.message)
    );

    return result;
  }
}

// Export singleton instance
export const productMutationService = new ProductMutationService();
