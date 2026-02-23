import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAuth } from '../middleware/auth';
import { db } from '../db/client';
import { tags } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const tagsRouter = new Hono();

const TagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

// GET /tags
tagsRouter.get('/', async (c) => {
  try {
    const list = await db.select().from(tags).orderBy(desc(tags.created_at));
    return c.json({ tags: list });
  } catch (error: unknown) {
    console.error('Error fetching tags:', error);
    return c.json({ error: 'Failed to fetch tags' }, 500);
  }
});

// POST /tags
tagsRouter.post('/', verifyAuth, zValidator('json', TagSchema), async (c) => {
  const data = c.req.valid('json');
  try {
    const [newTag] = await db
      .insert(tags)
      .values({
        name: data.name,
        slug: data.slug,
      })
      .returning();

    return c.json({ tag: newTag }, 201);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create tag' }, 500);
  }
});

// PUT /tags/:id - Update tag
tagsRouter.put(
  '/:id',
  verifyAuth,
  zValidator('json', TagSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      const [updatedTag] = await db
        .update(tags)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(tags.id, id))
        .returning();

      if (!updatedTag) {
        return c.json({ error: 'Tag not found' }, 404);
      }

      return c.json({ tag: updatedTag });
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to update tag' }, 500);
    }
  }
);

// DELETE /tags/:id
tagsRouter.delete('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(tags).where(eq(tags.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete tag' }, 500);
  }
});

export default tagsRouter;
