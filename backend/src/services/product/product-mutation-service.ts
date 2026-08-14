/**
 * Product Mutation Service
 * Handles all write operations for products
 */

import { db } from '../../db/client';
import { product_images } from '../../db/schema';
import { emailService } from '../email-service';
import { syncSingleProductToMeilisearch, deleteProduct } from '../search-service';
import { synchronizeProductSearch } from '../../application/products/product-search-synchronization-command';
import type {
  CreateProductInput,
  UpdateProductInput,
} from './product-validator';
import { ValidationError } from '../../middleware/error-handler';
import { getNewProductPublishReadinessIssues } from './product-readiness';
import { buildProductBaseUpdateInput } from '../../domain/products/product-write-input-policy';
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
import { createProductCommand } from '../../application/products/product-creation-command';
import { updateProductCommand } from '../../application/products/product-update-command';
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
      const outcome = await createProductCommand(data, {
        validateReferences: (categoryIds, tagIds, collectionId) => productCatalogReferenceRepository.validate(tx, categoryIds, tagIds, collectionId),
        createBase: (productData) => productBaseRepository.create(tx, productData),
        createDefaultVariant: (productId, input) => productVariantRepository.createDefault(tx, productId, input),
        assignPrices: (variantId, prices) => productPricingRepository.assign(tx, variantId, prices as CreateProductInput['prices']),
        assignOptions: (productId, options) => productOptionRepository.assign(tx, productId, options as CreateProductInput['options']),
        assignImages: (productId, images) => productMediaRepository.assign(tx, productId, images as CreateProductInput['images']),
        assignReferences: (productId, categoryIds, tagIds, collectionId) => productCatalogReferenceRepository.assign(tx, productId, categoryIds, tagIds, collectionId),
        persistDiscoveryBaseline: (product, variant, images, input) => productDiscoveryBaselineRepository.persist(
          tx,
          product,
          variant,
          images as Array<typeof product_images.$inferSelect>,
          input,
        ),
      });
      if (outcome.kind === 'invalid_catalog_references') {
        throw new ValidationError('Invalid foreign key references', outcome.errors);
      }
      return outcome.product;
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
      const outcome = await updateProductCommand(data, {
        validateReferences: (categoryIds, tagIds, collectionId) => productCatalogReferenceRepository.validate(tx, categoryIds, tagIds, collectionId),
        updateBase: (input) => productBaseRepository.update(tx, id, buildProductBaseUpdateInput(input)),
        updateDefaultVariant: (input) => productVariantRepository.updateDefault(tx, id, input),
        replacePrices: (variantId, prices) => productPricingRepository.replace(tx, variantId, prices as NonNullable<UpdateProductInput['prices']>),
        replaceImages: (images) => productMediaRepository.replace(tx, id, images as NonNullable<UpdateProductInput['images']>),
        replaceCategories: (categoryIds) => productCatalogReferenceRepository.replaceCategories(tx, id, categoryIds),
        replaceTags: (tagIds) => productCatalogReferenceRepository.replaceTags(tx, id, tagIds),
        replaceCollection: (collectionId) => productCatalogReferenceRepository.replaceCollection(tx, id, collectionId),
      });
      if (outcome.kind === 'invalid_catalog_references') {
        throw new ValidationError('Invalid foreign key references', outcome.errors);
      }
      if (outcome.kind === 'product_not_found') {
        throw new Error(`Product with id ${id} not found`);
      }
      return outcome.product;
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
