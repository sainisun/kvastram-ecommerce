import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { trending_reels } from '../db/schema';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const reels = await db
      .select()
      .from(trending_reels)
      .where(eq(trending_reels.is_active, true))
      .orderBy(asc(trending_reels.sort_order), asc(trending_reels.created_at));

    return c.json({ reels });
  } catch (error) {
    console.error('Error fetching active trending reels:', error);
    return c.json({ error: 'Failed to fetch trending reels' }, 500);
  }
});

export default app;
