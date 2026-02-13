import { db } from "../db/client";
import {
  products,
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
  product_images,
  product_categories,
  product_tags,
} from "../db/schema";
import { eq, desc, asc, sql, or, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { escapeLikeWildcards } from "../utils/validation";

// --- Types & Zod Schemas ---

const PriceSchema = z.object({
  region_id: z.string().uuid(),
  amount: z.number().int().min(0), // stored in cents
  currency_code: z.string().length(3),
});

const ImageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().optional(),
  is_thumbnail: z.boolean().default(false),
  position: z.number().int().default(0),
});

export const CreateProductSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().min(1),
  status: z
    .enum(["draft", "published", "proposed", "rejected"])
    .default("draft"),
  is_giftcard: z.boolean().default(false),
  discountable: z.boolean().default(true),
  weight: z.number().int().optional(),
  length: z.number().int().optional(),
  height: z.number().int().optional(),
  width: z.number().int().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  mid_code: z.string().optional(),
  material: z.string().optional(),
  inventory_quantity: z.number().int().optional().default(0),
  thumbnail: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  options: z
    .array(
      z.object({
        title: z.string(),
      }),
    )
    .optional(),
  prices: z.array(PriceSchema).optional(),
  images: z.array(ImageSchema).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// --- Service Logic ---

export class ProductService {
  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Build filter conditions for product queries
   */
  private async buildFilterConditions(filters: {
    status?: string;
    categoryId?: string;
    tagId?: string;
  }): Promise<any[]> {
    const conditions: any[] = [];

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    // Category Filter
    if (filters.categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, filters.categoryId));

      if (catMatches.length === 0) {
        return []; // No products in this category
      }

      conditions.push(
        inArray(
          products.id,
          catMatches.map((c) => c.product_id),
        ),
      );
    }

    // Tag Filter
    if (filters.tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, filters.tagId));

      if (tagMatches.length === 0) {
        return []; // No products with this tag
      }

      conditions.push(
        inArray(
          products.id,
          tagMatches.map((t) => t.product_id),
        ),
      );
    }

    return conditions;
  }

  /**
   * Fetch variant statistics for products
   */
  private async fetchVariantStats(productIds: string[]): Promise<any[]> {
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
  private async fetchProductImages(productIds: string[]): Promise<any[]> {
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
    productsList: any[],
    variantData: any[],
    imagesData: any[],
  ): any[] {
    return productsList.map((product) => {
      const stats = variantData.find((v) => v.product_id === product.id);
      const pImages = imagesData.filter((img) => img.product_id === product.id);
      return {
        ...product,
        variant_count: stats?.variant_count || 0,
        total_inventory: stats?.total_inventory || 0,
        images: pImages,
      };
    });
  }

  // ========================================
  // PUBLIC METHODS
  // ========================================

  /**
   * List products with advanced filtering and stats
   */
  async listDetailed(filters: {
    limit?: number;
    offset?: number;
    status?: string;
    categoryId?: string;
    tagId?: string;
    sort?: string;
  }) {
    const { limit = 20, offset = 0, sort = "created_at" } = filters;
    const limitNum = Math.min(Math.max(parseInt(limit.toString()) || 20, 1), 100);
    const offsetNum = Math.max(parseInt(offset.toString()) || 0, 0);

    // Build filter conditions
    const conditions = await this.buildFilterConditions({
      status: filters.status,
      categoryId: filters.categoryId,
      tagId: filters.tagId,
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
      imagesData,
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
   * Retrieve a single product by ID.
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
        collection: true, // Also fetch collection for breadcrumbs/SEO
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
        } as any)
        .returning();
      const newProduct = newProductResult[0];

      // 2. Create Default Variant (Use Product Title/Handle as default)
      const newVariantResult = await tx
        .insert(product_variants)
        .values({
          product_id: newProduct.id,
          title: "Default Variant", // Standard default name
          sku: `${data.handle}-default`,
          inventory_quantity: data.inventory_quantity || 0, // Default stock from input
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
        await tx.insert(product_images).values(
          data.images.map((img) => ({
            product_id: newProduct.id,
            ...img,
          })),
        );
      }

      // 6. Assign Categories
      if (data.category_ids && data.category_ids.length > 0) {
        await tx.insert(product_categories).values(
          data.category_ids.map((catId) => ({
            product_id: newProduct.id,
            category_id: catId,
          })),
        );
      }

      // 7. Assign Tags
      if (data.tag_ids && data.tag_ids.length > 0) {
        await tx.insert(product_tags).values(
          data.tag_ids.map((tagId) => ({
            product_id: newProduct.id,
            tag_id: tagId,
          })),
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
      // TODO: Update variant info if "simple product" details change
      const updatedProductResult = await tx
        .update(products)
        .set({
          ...data,
          updated_at: new Date(),
          options: undefined,
          prices: undefined,
          images: undefined,
          category_ids: undefined,
          tag_ids: undefined,
        } as any)
        .where(eq(products.id, id))
        .returning();

      if (updatedProductResult.length === 0) {
        throw new Error(`Product with id ${id} not found`);
      }

      const updatedProduct = updatedProductResult[0];

      // Update default variant if exists
      // simplified: we assume 1 variant for MVP "Simple Product"
      const variants = await tx
        .select()
        .from(product_variants)
        .where(eq(product_variants.product_id, id));
      if (variants.length > 0) {
        // Update the first variant with shared fields
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
            inventory_quantity: (data as any).inventory_quantity, // Add inventory update
            updated_at: new Date(),
          })
          .where(eq(product_variants.id, variants[0].id));
      }

      // Handle images if provided
      if (data.images) {
        // Delete existing images
        await tx
          .delete(product_images)
          .where(eq(product_images.product_id, id));

        // Insert new images
        if (data.images.length > 0) {
          await tx.insert(product_images).values(
            data.images.map((img) => ({
              product_id: id,
              ...img,
            })),
          );
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
            })),
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
            })),
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
    // Delete in order: child tables first, then parent
    // 1. Delete money_amounts (prices) for all variants of this product
    const variants = await db
      .select({ id: product_variants.id })
      .from(product_variants)
      .where(eq(product_variants.product_id, id));

    const variantIds = variants.map((v) => v.id);

    if (variantIds.length > 0) {
      await db
        .delete(money_amounts)
        .where(inArray(money_amounts.variant_id, variantIds));
    }

    // 2. Delete variants
    await db
      .delete(product_variants)
      .where(eq(product_variants.product_id, id));

    // 3. Delete images
    await db.delete(product_images).where(eq(product_images.product_id, id));

    // 4. Delete category associations
    await db
      .delete(product_categories)
      .where(eq(product_categories.product_id, id));

    // 5. Delete tag associations
    await db.delete(product_tags).where(eq(product_tags.product_id, id));

    // 6. Finally delete the product
    await db.delete(products).where(eq(products.id, id));

    return { id, deleted: true };
  }

  /**
   * Search products with text query and filters.
   */
  async search(
    query: string,
    filters: {
      minPrice?: number;
      maxPrice?: number;
      status?: string;
      sortBy?: "relevance" | "price_asc" | "price_desc" | "newest";
      categoryId?: string;
      tagId?: string;
    } = {},
  ) {
    // Note: Drizzle with Supabase/Postgres works best with ilike for simple search
    // For advanced full-text search, we'd use to_tsvector/to_tsquery, but for this scale
    // a multi-column ILIKE is sufficient and easier to maintain without raw SQL complexity.

    const conditions: any[] = [];
    const {
      minPrice,
      maxPrice,
      status,
      sortBy = "relevance",
      categoryId,
      tagId,
    } = filters;

    // Text Search (Title, Description, Handle)
    if (query) {
      const safePattern = `%${escapeLikeWildcards(query.toLowerCase())}%`;
      const matchTitle = sql`lower(${products.title}) LIKE ${safePattern}`;
      const matchDesc = sql`lower(${products.description}) LIKE ${safePattern}`;

      // We need to combine these with OR. Drizzle 'or' helper:
      conditions.push(or(matchTitle, matchDesc));
    }

    // Filters
    if (status) {
      // e.g., 'published'
      conditions.push(eq(products.status, status));
    }

    // Category Filter
    if (categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, categoryId));

      if (catMatches.length === 0) return []; // No products in this category
      conditions.push(
        inArray(
          products.id,
          catMatches.map((c) => c.product_id),
        ),
      );
    }

    // Tag Filter
    if (tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, tagId));

      if (tagMatches.length === 0) return []; // No products with this tag
      conditions.push(
        inArray(
          products.id,
          tagMatches.map((t) => t.product_id),
        ),
      );
    }

    // Price Filtering
    // This is tricky because prices are in a related table (money_amounts).
    // For MVP search, we might filter post-fetch or use a subquery.
    // To keep it performant:
    // We'll search products first, then filter by price in memory or join if needed.
    // Given typically small catalog (<1000 items), fetching then filtering is acceptable.

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
      limit: 50, // Cap results
    });

    // Post-process filtering (Price) and Sorting
    let processedResults = searchResults.map((p) => {
      // Calculate a generic "price" for sorting (e.g., lowest variant price)
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
    if (sortBy === "price_asc") {
      processedResults.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      processedResults.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      processedResults.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );
    }
    // 'relevance' is roughly preserved by database order (if no sort) or could be enhanced later

    return processedResults;
  }

  /**
   * Get search suggestions (autocomplete).
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
          eq(products.status, "published"),
          sql`lower(${products.title}) LIKE ${safePattern}`,
        ),
      )
      .limit(limit);

    return results;
  }

  // --- Stats & Bulk Ops ---

  async getStats() {
    const [{ total_products }] = await db
      .select({ total_products: sql<number>`count(*)` })
      .from(products);
    const [{ published_products }] = await db
      .select({ published_products: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, "published"));
    const [{ draft_products }] = await db
      .select({ draft_products: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, "draft"));

    const [{ low_stock_products }] = await db
      .select({
        low_stock_products: sql<number>`count(distinct ${product_variants.product_id})`,
      })
      .from(product_variants)
      .where(
        sql`${product_variants.inventory_quantity} < 10 AND ${product_variants.manage_inventory} = true`,
      );

    const [{ out_of_stock_products }] = await db
      .select({
        out_of_stock_products: sql<number>`count(distinct ${product_variants.product_id})`,
      })
      .from(product_variants)
      .where(
        sql`${product_variants.inventory_quantity} = 0 AND ${product_variants.manage_inventory} = true`,
      );

    return {
      total_products: Number(total_products),
      published_products: Number(published_products),
      draft_products: Number(draft_products),
      low_stock_products: Number(low_stock_products),
      out_of_stock_products: Number(out_of_stock_products),
    };
  }

  async bulkUpdate(ids: string[], updates: any) {
    const updateData: any = { updated_at: new Date() };
    if (updates.status) updateData.status = updates.status;
    // Add other bulk fields as needed

    await db.update(products).set(updateData).where(inArray(products.id, ids));
    return ids.length;
  }

  async bulkDelete(ids: string[]) {
    // Delete variants first
    await db
      .delete(product_variants)
      .where(inArray(product_variants.product_id, ids));
    // Delete products
    await db.delete(products).where(inArray(products.id, ids));
    return ids.length;
  }
}

export const productService = new ProductService();
