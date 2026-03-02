import { Hono } from 'hono';
import {
  productService,
  CreateProductSchema,
  UpdateProductSchema,
} from '../services/product-service';
import { verifyAuth, verifyAdmin } from '../middleware/auth';
import { z } from 'zod';
import {
  successResponse,
  paginatedResponse,
  HttpStatus,
} from '../utils/api-response';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/error-handler';

const productsRouter = new Hono();

// GET /products - List products with advanced filters (Public)
productsRouter.get(
  '/',
  asyncHandler(async (c) => {
    const query = c.req.query();
    const {
      limit = '20',
      offset = '0',
      search = '',
      status = '',
      sort = 'created_at',
      min_price = '',
      max_price = '',
      category_id = '',
      tag_id = '',
      collection_id = '',
    } = query;

    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    // Only use search service when there's actual text search query
    // For sorting/filtering without text search, use listDetailed
    if (search) {
      let sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' =
        'relevance';
      if (sort === 'price_asc') sortBy = 'price_asc';
      if (sort === 'price_desc') sortBy = 'price_desc';
      if (sort === 'created_at' || sort === 'newest') sortBy = 'newest';

      const results = await productService.search(search, {
        query: search,
        minPrice: min_price ? Number(min_price) : undefined,
        maxPrice: max_price ? Number(max_price) : undefined,
        status: status || undefined,
        sortBy,
        categoryId: category_id || undefined,
        tagId: tag_id || undefined,
        collectionId: collection_id || undefined,
      });

      // Manual pagination for search results
      const paginatedResults = results.slice(offsetNum, offsetNum + limitNum);

      return paginatedResponse(
        c,
        paginatedResults,
        {
          offset: offsetNum,
          limit: limitNum,
          total: results.length,
        },
        'Products retrieved successfully'
      );
    }

    // Standard detailed list - handles sorting and all filters
    const result = await productService.listDetailed({
      limit: limitNum,
      offset: offsetNum,
      sort: sort || 'created_at',
      status: status || undefined,
      categoryId: category_id || undefined,
      tagId: tag_id || undefined,
      collectionId: collection_id || undefined,
    });

    return paginatedResponse(
      c,
      result.products,
      {
        offset: result.offset || 0,
        limit: result.limit || 20,
        total: result.total || 0,
      },
      'Products retrieved successfully'
    );
  })
);

// GET /products/search/suggestions - Autocomplete
productsRouter.get(
  '/search/suggestions',
  asyncHandler(async (c) => {
    const { q } = c.req.query();
    if (!q || q.trim().length < 2) {
      return successResponse(c, [], 'Search query too short');
    }

    const suggestions = await productService.getSuggestions(q);
    return successResponse(
      c,
      suggestions,
      'Suggestions retrieved successfully'
    );
  })
);

// GET /products/stats/overview - Get product statistics
productsRouter.get(
  '/stats/overview',
  verifyAuth,
  asyncHandler(async (c) => {
    const stats = await productService.getStats();
    return successResponse(
      c,
      stats,
      'Product statistics retrieved successfully'
    );
  })
);

// GET /products/:id - Get single product (Public)
productsRouter.get(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    try {
      const product = await productService.retrieve(id);
      if (!product) throw new NotFoundError('Product not found');
      return successResponse(c, { product }, 'Product retrieved successfully');
    } catch (error: unknown) {
      console.error('Error fetching product:', error);
      throw new NotFoundError('Product not found');
    }
  })
);

// POST /products - Create product (Protected)
productsRouter.post(
  '/',
  verifyAdmin,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = CreateProductSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Invalid product data', result.error.errors);
    }

    // Convert status to correct type if needed, Zod handles validation
    const product = await productService.create(result.data as any);
    return successResponse(
      c,
      { product },
      'Product created successfully',
      HttpStatus.CREATED
    );
  })
);

// PUT /products/:id - Update product (Protected)
productsRouter.put(
  '/:id',
  verifyAdmin,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateProductSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Invalid product data', result.error.errors);
    }

    try {
      const product = await productService.update(id, result.data as any);
      return successResponse(c, { product }, 'Product updated successfully');
    } catch (e: any) {
      if (e.message.includes('not found'))
        throw new NotFoundError('Product not found');
      throw e;
    }
  })
);

// POST /products/bulk-update - Bulk update products (Protected)
const BulkUpdateSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, 'At least one product ID is required'),
  updates: z.object({
    status: z.enum(['draft', 'published', 'proposed', 'rejected', 'archived']).optional(),
    collection_id: z.string().optional(),
  }),
});

productsRouter.post(
  '/bulk-update',
  verifyAdmin,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = BulkUpdateSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError(
        'Invalid bulk update data',
        result.error.errors
      );
    }

    const { product_ids, updates } = result.data;
    const count = await productService.bulkUpdate(product_ids, updates);

    return successResponse(
      c,
      {
        updated_count: count,
        product_ids,
      },
      `${count} products updated successfully`
    );
  })
);

// POST /products/bulk-delete - Bulk delete products (Protected)
const BulkDeleteSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, 'At least one product ID is required'),
});

productsRouter.post(
  '/bulk-delete',
  verifyAdmin,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = BulkDeleteSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError(
        'Invalid bulk delete data',
        result.error.errors
      );
    }

    const { product_ids } = result.data;
    const count = await productService.bulkDelete(product_ids);

    return successResponse(
      c,
      {
        deleted_count: count,
        product_ids,
      },
      `${count} products deleted successfully`
    );
  })
);

// DELETE /products/:id - Delete product (Protected)
productsRouter.delete(
  '/:id',
  verifyAdmin,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const product = await productService.retrieve(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    await productService.delete(id);
    return successResponse(
      c,
      { id, deleted: true },
      'Product deleted successfully'
    );
  })
);

// GET /products/featured - Get featured products by IDs (Public)
productsRouter.get(
  '/featured',
  asyncHandler(async (c) => {
    const query = c.req.query();
    const { ids = '' } = query;

    if (!ids) {
      return successResponse(c, [], 'No featured product IDs provided');
    }

    const productIds = ids
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (productIds.length === 0) {
      return successResponse(c, [], 'No valid product IDs provided');
    }

    const products = await Promise.all(
      productIds.map(async (id) => {
        try {
          return await productService.retrieve(id);
        } catch {
          return null;
        }
      })
    );

    const validProducts = products.filter(
      (p): p is NonNullable<typeof p> => p !== null && p.status === 'published'
    );

    return successResponse(
      c,
      validProducts,
      'Featured products retrieved successfully'
    );
  })
);

import { db } from '../db/client';
import {
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
} from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

// --- VARIANT MANAGEMENT ---

// GET /products/:id/variants - Get all variants for a product
productsRouter.get(
  '/:id/variants',
  asyncHandler(async (c) => {
    const productId = c.req.param('id');

    const variants = await db
      .select()
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));

    // Get prices for each variant
    const variantIds = variants.map((v) => v.id);
    let prices: any[] = [];
    if (variantIds.length > 0) {
      prices = await db
        .select()
        .from(money_amounts)
        .where(inArray(money_amounts.variant_id, variantIds));
    }

    // Get options for this product
    const options = await db
      .select()
      .from(product_options)
      .where(eq(product_options.product_id, productId));

    // Get option values for each variant
    let optionValues: any[] = [];
    if (variantIds.length > 0) {
      optionValues = await db
        .select()
        .from(product_option_values)
        .where(inArray(product_option_values.variant_id, variantIds));
    }

    const variantsWithPrices = variants.map((v) => ({
      ...v,
      prices: prices.filter((p) => p.variant_id === v.id),
      option_values: optionValues.filter((ov) => ov.variant_id === v.id),
    }));

    return successResponse(
      c,
      { variants: variantsWithPrices, options },
      'Variants retrieved successfully'
    );
  })
);

// POST /products/:id/variants - Create a new variant
productsRouter.post(
  '/:id/variants',
  verifyAdmin,
  asyncHandler(async (c) => {
    const productId = c.req.param('id');
    const body = await c.req.json();

    const {
      title,
      sku,
      inventory_quantity = 0,
      compare_at_price,
      prices: variantPrices = [],
      option_values: optValues = [],
    } = body;

    if (!title) {
      throw new ValidationError('Variant title is required');
    }

    const result = await db.transaction(async (tx) => {
      // Create variant
      const [newVariant] = await tx
        .insert(product_variants)
        .values({
          product_id: productId,
          title,
          sku: sku || undefined,
          inventory_quantity,
          compare_at_price: compare_at_price ? parseInt(compare_at_price) : undefined,
          manage_inventory: true,
        })
        .returning();

      // Create prices
      if (variantPrices.length > 0) {
        for (const price of variantPrices) {
          await tx.insert(money_amounts).values({
            variant_id: newVariant.id,
            region_id: price.region_id,
            currency_code: price.currency_code,
            amount: price.amount,
            min_quantity: 1,
          });
        }
      }

      // Create option values (e.g., Size: "XL")
      if (optValues.length > 0) {
        for (const ov of optValues) {
          await tx.insert(product_option_values).values({
            variant_id: newVariant.id,
            option_id: ov.option_id,
            value: ov.value,
          });
        }
      }

      return newVariant;
    });

    return successResponse(
      c,
      { variant: result },
      'Variant created successfully',
      HttpStatus.CREATED
    );
  })
);

// PUT /products/:productId/variants/:variantId - Update a variant
productsRouter.put(
  '/:productId/variants/:variantId',
  verifyAdmin,
  asyncHandler(async (c) => {
    const variantId = c.req.param('variantId');
    const body = await c.req.json();

    const { title, sku, inventory_quantity, compare_at_price, prices: variantPrices } = body;

    await db.transaction(async (tx) => {
      // Update variant
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (sku !== undefined) updateData.sku = sku;
      if (inventory_quantity !== undefined)
        updateData.inventory_quantity = inventory_quantity;
      if (compare_at_price !== undefined)
        updateData.compare_at_price = compare_at_price === '' ? null : parseInt(compare_at_price);

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(product_variants)
          .set(updateData)
          .where(eq(product_variants.id, variantId));
      }

      // Update prices if provided
      if (variantPrices) {
        // Delete existing prices
        await tx
          .delete(money_amounts)
          .where(eq(money_amounts.variant_id, variantId));

        // Insert new prices
        for (const price of variantPrices) {
          await tx.insert(money_amounts).values({
            variant_id: variantId,
            region_id: price.region_id,
            currency_code: price.currency_code,
            amount: price.amount,
            min_quantity: 1,
          });
        }
      }
    });

    return successResponse(c, { id: variantId }, 'Variant updated successfully');
  })
);

// DELETE /products/:productId/variants/:variantId - Delete a variant
productsRouter.delete(
  '/:productId/variants/:variantId',
  verifyAdmin,
  asyncHandler(async (c) => {
    const variantId = c.req.param('variantId');

    await db.transaction(async (tx) => {
      // Delete option values
      await tx
        .delete(product_option_values)
        .where(eq(product_option_values.variant_id, variantId));

      // Delete prices
      await tx
        .delete(money_amounts)
        .where(eq(money_amounts.variant_id, variantId));

      // Delete variant
      await tx
        .delete(product_variants)
        .where(eq(product_variants.id, variantId));
    });

    return successResponse(
      c,
      { id: variantId, deleted: true },
      'Variant deleted successfully'
    );
  })
);

// POST /products/:id/options - Create a product option (e.g., "Size")
productsRouter.post(
  '/:id/options',
  verifyAdmin,
  asyncHandler(async (c) => {
    const productId = c.req.param('id');
    const body = await c.req.json();
    const { title } = body;

    if (!title) {
      throw new ValidationError('Option title is required');
    }

    const [option] = await db
      .insert(product_options)
      .values({
        product_id: productId,
        title,
      })
      .returning();

    return successResponse(
      c,
      { option },
      'Option created successfully',
      HttpStatus.CREATED
    );
  })
);

export default productsRouter;

