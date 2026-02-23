/**
 * Product Query Service
 * Handles all read operations for products
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
import { eq, desc, asc, sql, or, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { escapeLikeWildcards } from '../../utils/validation';
import type { ProductFilter, ProductSearch } from './product-validator';

// --- Types for merged data ---
interface VariantStats {
  product_id: string;
  variant_count: number;
  total_inventory: number;
}

interface ProductWithStats {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date | null;
  variant_count: number;
  total_inventory: number;
  images: (typeof product_images.$inferSelect)[];
}

export class ProductQueryService {
  /**
   * Build filter conditions for product queries
   */
  private async buildFilterConditions(filters: {
    status?: string;
    categoryId?: string;
    tagId?: string;
    collectionId?: string;
  }): Promise<ReturnType<typeof eq>[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    // Collection Filter
    if (filters.collectionId) {
      conditions.push(eq(products.collection_id, filters.collectionId));
    }

    // Category Filter
    if (filters.categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, filters.categoryId));

      if (catMatches.length === 0) {
        return conditions; // Return empty conditions (no match)
      }

      conditions.push(
        inArray(
          products.id,
          catMatches.map((c) => c.product_id)
        )
      );
    }

    // Tag Filter
    if (filters.tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, filters.tagId));

      if (tagMatches.length === 0) {
        return conditions; // Return empty conditions (no match)
      }

      conditions.push(
        inArray(
          products.id,
          tagMatches.map((t) => t.product_id)
        )
      );
    }

    return conditions;
  }

  /**
   * Fetch variant statistics for products
   */
  private async fetchVariantStats(
    productIds: string[]
  ): Promise<VariantStats[]> {
    if (productIds.length === 0) return [];

    return await db
      .select({
        product_id: product_variants.product_id,
        variant_count: sql<number>`count(*)`,
        total_inventory: sql<number>`sum(${product_variants.inventory_quantity})`,
      })
      .from(product_variants)
      .where(inArray(product_variants.product_id, productIds))
      .groupBy(product_variants.product_id);
  }

  /**
   * Fetch images for products
   */
  private async fetchProductImages(
    productIds: string[]
  ): Promise<(typeof product_images.$inferSelect)[]> {
    if (productIds.length === 0) return [];

    return await db
      .select()
      .from(product_images)
      .where(inArray(product_images.product_id, productIds));
  }

  /**
   * Merge product data with variant stats and images
   */
  private mergeProductData(
    productsList: Array<Record<string, unknown>>,
    variantData: VariantStats[],
    imagesData: (typeof product_images.$inferSelect)[]
  ): ProductWithStats[] {
    return productsList.map((product) => {
      const stats = variantData.find((v) => v.product_id === product.id);
      const pImages = imagesData.filter((img) => img.product_id === product.id);
      return {
        id: String(product.id),
        title: String(product.title),
        handle: String(product.handle),
        description: product.description as string | null,
        status: String(product.status),
        thumbnail: product.thumbnail as string | null,
        created_at: product.created_at as Date,
        updated_at: product.updated_at as Date | null,
        variant_count: stats?.variant_count || 0,
        total_inventory: stats?.total_inventory || 0,
        images: pImages,
      };
    });
  }

  /**
   * List products with advanced filtering and stats
   */
  async listDetailed(filters: ProductFilter) {
    const { limit = 20, offset = 0, sort = 'created_at' } = filters;
    const limitNum = Math.min(Math.max(limit, 1), 100);
    const offsetNum = Math.max(offset, 0);

    // Build filter conditions
    const conditions = await this.buildFilterConditions({
      status: filters.status,
      categoryId: filters.categoryId,
      tagId: filters.tagId,
      collectionId: filters.collectionId,
    });

    // Early return if no products match filters
    if (conditions.length > 0) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));

      if (Number(count) === 0) {
        return { products: [], total: 0, limit: limitNum, offset: offsetNum };
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch products
    const productsList = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        description: products.description,
        status: products.status,
        thumbnail: products.thumbnail,
        created_at: products.created_at,
        updated_at: products.updated_at,
      })
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.created_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Fetch related data
    const productIds = productsList.map((p) => p.id);
    const [variantData, imagesData] = await Promise.all([
      this.fetchVariantStats(productIds),
      this.fetchProductImages(productIds),
    ]);

    // Merge data
    const productsWithStats = this.mergeProductData(
      productsList,
      variantData,
      imagesData
    );

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    return {
      products: productsWithStats,
      total: Number(count),
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Simple list products
   */
  async list(limit: number = 20, offset: number = 0) {
    const data = await db.query.products.findMany({
      limit,
      offset,
      orderBy: desc(products.created_at),
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
      },
    });
    return data;
  }

  /**
   * Retrieve a single product by ID or handle
   */
  async retrieve(idOrHandle: string) {
    // Check if input is a valid UUID
    const isUuid = z.string().uuid().safeParse(idOrHandle).success;

    // Use query builder for relations
    const product = await db.query.products.findFirst({
      where: isUuid
        ? eq(products.id, idOrHandle)
        : eq(products.handle, idOrHandle),
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
        collection: true,
        images: true,
        categories: {
          with: {
            category: true,
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product with id/handle ${idOrHandle} not found`);
    }

    return product;
  }

  /**
   * Search products with text query and filters
   */
  async search(query: string, filters?: ProductSearch) {
    const conditions: (
      | ReturnType<typeof eq>
      | ReturnType<typeof or>
      | undefined
    )[] = [];
    const searchFilters = filters ?? { query: '', sortBy: 'relevance' };
    const {
      minPrice,
      maxPrice,
      status,
      sortBy = 'relevance',
      categoryId,
      tagId,
      collectionId,
    } = searchFilters;

    // Add collection filter
    if (collectionId) {
      conditions.push(eq(products.collection_id, collectionId));
    }

    // Text Search (Title, Description, Handle)
    if (query) {
      const safePattern = `%${escapeLikeWildcards(query.toLowerCase())}%`;
      const matchTitle = sql`lower(${products.title}) LIKE ${safePattern}`;
      const matchDesc = sql`lower(${products.description}) LIKE ${safePattern}`;

      // Combine with OR
      conditions.push(or(matchTitle, matchDesc) as ReturnType<typeof eq>);
    }

    // Filters
    if (status) {
      conditions.push(eq(products.status, status));
    }

    // Category Filter
    if (categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, categoryId));

      if (catMatches.length === 0) return [];
      conditions.push(
        inArray(
          products.id,
          catMatches.map((c) => c.product_id)
        )
      );
    }

    // Tag Filter
    if (tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, tagId));

      if (tagMatches.length === 0) return [];
      conditions.push(
        inArray(
          products.id,
          tagMatches.map((t) => t.product_id)
        )
      );
    }

    // Construct Where Clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query
    const searchResults = await db.query.products.findMany({
      where: whereClause,
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
        images: true,
      },
      limit: 50,
    });

    // Post-process filtering (Price) and Sorting
    let processedResults = searchResults.map((p) => {
      const variantPrices =
        p.variants?.flatMap((v) => v.prices?.map((pr) => pr.amount) || []) ||
        [];
      const minProductPrice =
        variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      return { ...p, price: minProductPrice };
    });

    if (minPrice !== undefined) {
      processedResults = processedResults.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      processedResults = processedResults.filter((p) => p.price <= maxPrice);
    }

    // Sort
    if (sortBy === 'price_asc') {
      processedResults.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      processedResults.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      processedResults.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    return processedResults;
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 5) {
    if (!query || query.length < 2) return [];

    const safePattern = `%${escapeLikeWildcards(query.toLowerCase())}%`;
    const results = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
      })
      .from(products)
      .where(
        and(
          eq(products.status, 'published'),
          sql`lower(${products.title}) LIKE ${safePattern}`
        )
      )
      .limit(limit);

    return results;
  }
}

// Export singleton instance
export const productQueryService = new ProductQueryService();
