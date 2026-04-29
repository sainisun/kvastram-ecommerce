import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { products, studio_inquiries } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';

const router = new Hono();

const UpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'replied', 'closed']).optional(),
  admin_notes: z.string().max(2000).optional(),
});

router.get('/', verifyAdmin, async (c) => {
  try {
    const { status, inquiry_type, product_id } = c.req.query();
    const conditions = [];

    if (status && status !== 'all') conditions.push(eq(studio_inquiries.status, status));
    if (inquiry_type && inquiry_type !== 'all') conditions.push(eq(studio_inquiries.inquiry_type, inquiry_type));
    if (product_id) conditions.push(eq(studio_inquiries.product_id, product_id));

    const inquiries = await db
      .select({
        id: studio_inquiries.id,
        product_id: studio_inquiries.product_id,
        product_title: studio_inquiries.product_title,
        product_handle: studio_inquiries.product_handle,
        product_url: studio_inquiries.product_url,
        inquiry_type: studio_inquiries.inquiry_type,
        customer_name: studio_inquiries.customer_name,
        email: studio_inquiries.email,
        phone: studio_inquiries.phone,
        message: studio_inquiries.message,
        measurements: studio_inquiries.measurements,
        status: studio_inquiries.status,
        admin_notes: studio_inquiries.admin_notes,
        created_at: studio_inquiries.created_at,
        updated_at: studio_inquiries.updated_at,
        product_thumbnail: products.thumbnail,
      })
      .from(studio_inquiries)
      .leftJoin(products, eq(studio_inquiries.product_id, products.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(studio_inquiries.created_at))
      .limit(500);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        new: sql<number>`count(*) filter (where status = 'new')`,
        in_progress: sql<number>`count(*) filter (where status = 'in_progress')`,
        replied: sql<number>`count(*) filter (where status = 'replied')`,
        custom_size: sql<number>`count(*) filter (where inquiry_type = 'custom_size')`,
      })
      .from(studio_inquiries);

    return c.json({
      inquiries,
      stats: {
        total: Number(stats?.total || 0),
        new: Number(stats?.new || 0),
        in_progress: Number(stats?.in_progress || 0),
        replied: Number(stats?.replied || 0),
        custom_size: Number(stats?.custom_size || 0),
      },
    });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] GET error:', error.message);
    return c.json({ error: 'Failed to fetch studio inquiries' }, 500);
  }
});

router.patch('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const [inquiry] = await db
      .update(studio_inquiries)
      .set({
        ...parsed.data,
        updated_at: new Date(),
      })
      .where(eq(studio_inquiries.id, id))
      .returning({ id: studio_inquiries.id });

    if (!inquiry) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    return c.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] PATCH error:', error.message);
    return c.json({ error: 'Failed to update inquiry' }, 500);
  }
});

router.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(studio_inquiries).where(eq(studio_inquiries.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] DELETE error:', error.message);
    return c.json({ error: 'Failed to delete inquiry' }, 500);
  }
});

export default router;
