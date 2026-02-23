import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAuth } from '../middleware/auth';
import { db } from '../db/client';
import { categories } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const categoriesRouter = new Hono();

const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parent_id: z.string().optional().nullable(),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET /categories
categoriesRouter.get('/', async (c) => {
  try {
    const list = await db
      .select()
      .from(categories)
      .orderBy(desc(categories.created_at));
    return c.json({ categories: list });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// GET /categories/tree
categoriesRouter.get('/tree', async (c) => {
  try {
    const allCategories = await db.select().from(categories);

    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter((cat) => cat.parent_id === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    const tree = buildTree(null);
    return c.json({ categories: tree });
  } catch (error: unknown) {
    console.error('Error fetching categories tree:', error);
    return c.json({ error: 'Failed to fetch categories tree' }, 500);
  }
});

// GET /categories/:id
categoriesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    return c.json({ category });
  } catch (error: unknown) {
    console.error('Error fetching category:', error);
    return c.json({ error: 'Failed to fetch category' }, 500);
  }
});

// POST /categories
categoriesRouter.post(
  '/',
  verifyAuth,
  zValidator('json', CategorySchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          parent_id: data.parent_id || null,
          image: data.image,
          is_active: data.is_active ?? true,
        })
        .returning();

      return c.json({ category: newCategory }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to create category' },
        500
      );
    }
  }
);

// PUT /categories/:id
categoriesRouter.put(
  '/:id',
  verifyAuth,
  zValidator('json', CategorySchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      return c.json({ category: updatedCategory });
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to update category' },
        500
      );
    }
  }
);

// DELETE /categories/:id
categoriesRouter.delete('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(categories).where(eq(categories.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete category' }, 500);
  }
});

export default categoriesRouter;
