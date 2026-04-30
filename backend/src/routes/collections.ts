import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAdmin } from '../middleware/auth';
import { db } from '../db/client';
import { product_collections, products } from '../db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { triggerStorefrontRevalidation } from '../utils/storefront-revalidate';

const isUuid = (val: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
};

const collectionsRouter = new Hono();

const CollectionSchema = z.object({
  title: z.string().min(1),
  handle: z.string().min(1),
  image: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const ProductAssignmentSchema = z.object({
  product_ids: z.array(z.string().uuid()).default([]),
});

// GET /collections
collectionsRouter.get('/', async (c) => {
  try {
    const list = await db
      .select({
        id: product_collections.id,
        title: product_collections.title,
        handle: product_collections.handle,
        image: product_collections.image,
        metadata: product_collections.metadata,
        created_at: product_collections.created_at,
        updated_at: product_collections.updated_at,
        deleted_at: product_collections.deleted_at,
        product_count: sql<number>`count(${products.id})`.mapWith(Number),
      })
      .from(product_collections)
      .leftJoin(products, eq(product_collections.id, products.collection_id))
      .groupBy(product_collections.id)
      .orderBy(desc(product_collections.created_at));
    return c.json({ collections: list });
  } catch (error: any) {
    console.error('[Collections] GET / error:', error?.message || error);
    console.error(
      '[Collections] Full error:',
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return c.json(
      { error: 'Failed to fetch collections', details: error?.message },
      500
    );
  }
});

// GET /collections/:id - accepts UUID or handle
collectionsRouter.get('/:id/products', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
        status: products.status,
      })
      .from(products)
      .where(eq(products.collection_id, id))
      .orderBy(desc(products.created_at));

    return c.json({ products: rows });
  } catch (error: unknown) {
    console.error('Error fetching collection products:', error);
    return c.json({ error: 'Failed to fetch collection products' }, 500);
  }
});

collectionsRouter.put(
  '/:id/products',
  verifyAdmin,
  zValidator('json', ProductAssignmentSchema),
  async (c) => {
    const id = c.req.param('id');
    const { product_ids } = c.req.valid('json');

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(products)
          .set({ collection_id: null, updated_at: new Date() })
          .where(eq(products.collection_id, id));

        if (product_ids.length > 0) {
          await tx
            .update(products)
            .set({ collection_id: id, updated_at: new Date() })
            .where(inArray(products.id, product_ids));
        }
      });

      await triggerStorefrontRevalidation({
        paths: ['/', '/products', '/collections'],
        tags: ['products', 'collections'],
      });

      return c.json({ success: true, product_ids });
    } catch (error: unknown) {
      console.error('Error updating collection products:', error);
      return c.json({ error: 'Failed to update collection products' }, 500);
    }
  }
);

collectionsRouter.get('/:id', async (c) => {
  const idOrHandle = c.req.param('id');
  try {
    let collection;
    
    if (isUuid(idOrHandle)) {
      collection = await db.query.product_collections.findFirst({
        where: eq(product_collections.id, idOrHandle),
      });
    } else {
      collection = await db.query.product_collections.findFirst({
        where: eq(product_collections.handle, idOrHandle),
      });
    }

    if (!collection) {
      return c.json({ error: 'Collection not found' }, 404);
    }

    return c.json({ collection });
  } catch (error: unknown) {
    console.error('Error fetching collection:', error);
    return c.json({ error: 'Failed to fetch collection' }, 500);
  }
});

// POST /collections
collectionsRouter.post(
  '/',
  verifyAdmin,
  zValidator('json', CollectionSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const [newCollection] = await db
        .insert(product_collections)
        .values({
          title: data.title,
          handle: data.handle,
          image: data.image,
          metadata: data.metadata,
        })
        .returning();

      return c.json({ collection: newCollection }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to create collection' },
        500
      );
    }
  }
);

// PUT /collections/:id
collectionsRouter.put(
  '/:id',
  verifyAdmin,
  zValidator('json', CollectionSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      const [updatedCollection] = await db
        .update(product_collections)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(product_collections.id, id))
        .returning();

      return c.json({ collection: updatedCollection });
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to update collection' },
        500
      );
    }
  }
);

// DELETE /collections/:id
collectionsRouter.delete('/:id', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(product_collections).where(eq(product_collections.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to delete collection' },
      500
    );
  }
});

export default collectionsRouter;
