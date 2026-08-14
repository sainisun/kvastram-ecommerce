/**
 * Product Mutation Service
 * Handles all write operations for products
 */

import { createHash } from 'crypto';
import { db } from '../../db/client';
import {
  products,
  product_variants,
  product_images,
} from '../../db/schema';
import { emailService } from '../email-service';
import { syncSingleProductToMeilisearch, deleteProduct } from '../search-service';
import { synchronizeProductSearch } from '../../application/products/product-search-synchronization-command';
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
  buildProductBaseUpdateInput,
  compactUndefined,
} from '../../domain/products/product-write-input-policy';
import { productCatalogReferenceRepository } from '../../repositories/product-catalog-reference-repository';
import { productPricingRepository } from '../../repositories/product-pricing-repository';
import { productMediaRepository } from '../../repositories/product-media-repository';
import { productOptionRepository } from '../../repositories/product-option-repository';
import { productVariantRepository } from '../../repositories/product-variant-repository';
import { productBaseRepository } from '../../repositories/product-base-repository';
import { productDiscoveryBaselineRepository } from '../../repositories/product-discovery-baseline-repository';
import { productDeletionRepository } from '../../repositories/product-deletion-repository';
import { productPublishReadinessRepository } from '../../repositories/product-publish-readiness-repository';
import { backInStockSubscriptionRepository } from '../../repositories/back-in-stock-subscription-repository';
import { notifyBackInStockSubscribers } from '../../application/products/back-in-stock-notification-command';
import { getProductPublishReadinessIssues } from '../../application/products/product-publish-readiness-command';

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
      const newProduct = await productBaseRepository.create(tx, productData);

      // 2. Create Default Variant
      const newVariant = await productVariantRepository.createDefault(tx, newProduct.id, data);

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
    void synchronizeProductSearch(result.id, 'created', {
      syncProduct: syncSingleProductToMeilisearch,
      deleteProduct,
    });

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

  private async createSeoDiscoveryBaseline(
    tx: any,
    product: typeof products.$inferSelect,
    variant: typeof product_variants.$inferSelect,
    images: Array<typeof product_images.$inferSelect>,
    data: CreateProductInput
  ) {
    await productDiscoveryBaselineRepository.persist(tx, product, variant, images, data);
  }

  /**
   * Update a product's base details.
   */
  async update(id: string, data: UpdateProductInput) {
    if (data.status === 'published') {
      const errors = await getProductPublishReadinessIssues(id, data, {
        loadSnapshot: (productId) => productPublishReadinessRepository.loadSnapshot(productId),
        getNewProductIssues: getNewProductPublishReadinessIssues,
      });
      if (errors.length > 0) {
        throw new ValidationError('Product is not ready to publish', errors);
      }
    }

    const result = await db.transaction(async (tx) => {
      await this.validateForeignKeys(tx, data.category_ids, data.tag_ids, data.collection_id);

      // 1. Update Product Base
      const updatedProduct = await productBaseRepository.update(tx, id, buildProductBaseUpdateInput(data));
      if (!updatedProduct) throw new Error(`Product with id ${id} not found`);

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
      notifyBackInStockSubscribers(id, {
        loadSubscribers: (productId) => backInStockSubscriptionRepository.loadSubscribers(productId),
        loadProduct: (productId) => backInStockSubscriptionRepository.loadProduct(productId),
        markNotified: (subscriptionId, notifiedAt) => backInStockSubscriptionRepository.markNotified(subscriptionId, notifiedAt),
        sendEmail: (input) => emailService.sendBackInStockNotification(input),
      }).catch((err) =>
        console.error('[BackInStock] Auto-notify failed:', err.message)
      );
    }

    // Sync to Meilisearch in background (non-blocking)
    void synchronizeProductSearch(id, 'updated', {
      syncProduct: syncSingleProductToMeilisearch,
      deleteProduct,
    });

    return result;
  }

  /**
   * Delete a product and all its related data.
   */
  async delete(id: string) {
    const result = await db.transaction((tx) => productDeletionRepository.delete(tx, id));

    // Delete from Meilisearch in background (non-blocking)
    void synchronizeProductSearch(id, 'deleted', {
      syncProduct: syncSingleProductToMeilisearch,
      deleteProduct,
    });

    return result;
  }
}

// Export singleton instance
export const productMutationService = new ProductMutationService();
