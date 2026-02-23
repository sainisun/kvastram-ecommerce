import { Hono } from 'hono';
import { db } from '../db';
import { banners } from '../db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { verifyAdmin } from '../middleware/auth'; // BUG-013 FIX: was verifyAuth
import { z } from 'zod';

const app = new Hono();

const bannerSchema = z.object({
  title: z.string().min(1),
  image_url: z.string().url(),
  link: z.string().optional(),
  button_text: z.string().optional(),
  position: z.number().int().default(0),
  is_active: z.boolean().default(true),
  section: z.string().default('hero'),
});

// Public: Get active banners for storefront
app.get('/storefront', async (c) => {
  try {
    const activeBanners = await db
      .select()
      .from(banners)
      .where(eq(banners.is_active, true))
      .orderBy(asc(banners.position));
    return c.json({ banners: activeBanners });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Get all banners
app.get('/', verifyAdmin, async (c) => {
  try {
    const allBanners = await db
      .select()
      .from(banners)
      .orderBy(asc(banners.position));
    return c.json({ banners: allBanners });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Create banner
app.post('/', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const validated = bannerSchema.parse(body);

    const [newBanner] = await db.insert(banners).values(validated).returning();
    return c.json({ banner: newBanner }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Update banner
app.put('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = bannerSchema.partial().parse(body);

    const [updated] = await db
      .update(banners)
      .set({ ...validated, updated_at: new Date() })
      .where(eq(banners.id, id))
      .returning();

    return c.json({ banner: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Delete banner
app.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(banners).where(eq(banners.id, id));
    return c.json({ message: 'Banner deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Reorder banners
// BUG-015 FIX: Added input validation for reorder items
const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().min(0),
      })
    )
    .min(1)
    .max(100),
});

app.post('/reorder', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { items } = reorderSchema.parse(body);

    await Promise.all(
      items.map((item) =>
        db
          .update(banners)
          .set({ position: item.position })
          .where(eq(banners.id, item.id))
      )
    );

    return c.json({ message: 'Banners reordered' });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
