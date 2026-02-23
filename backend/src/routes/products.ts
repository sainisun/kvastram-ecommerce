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

    // If search or advanced price/sort filters are active, use the search service
    if (
      search ||
      min_price ||
      max_price ||
      (sort && sort !== 'created_at') ||
      collection_id
    ) {
      let sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' =
        'relevance';
      if (sort === 'price_asc') sortBy = 'price_asc';
      if (sort === 'price_desc') sortBy = 'price_desc';
      if (sort === 'created_at' || sort === 'newest') sortBy = 'newest';

      const results = await productService.search(search, {
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

    // Standard detailed list
    const result = await productService.listDetailed({
      limit: limitNum,
      offset: offsetNum,
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
    status: z.enum(['draft', 'published', 'archived']).optional(),
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

    // Fetch each product by ID
    const products = await Promise.all(
      productIds.map(async (id) => {
        try {
          return await productService.retrieve(id);
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls and inactive products
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

export default productsRouter;
