import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { products, studio_inquiries } from '../../db/schema';

const router = new Hono();

const MeasurementsSchema = z
  .object({
    height: z.string().max(50).optional(),
    bust: z.string().max(50).optional(),
    waist: z.string().max(50).optional(),
    hips: z.string().max(50).optional(),
    preferredLength: z.string().max(80).optional(),
  })
  .partial()
  .optional();

const InquirySchema = z
  .object({
    product_id: z.string().uuid('Invalid product ID').optional(),
    product_title: z.string().min(1, 'Product title is required').max(240),
    product_handle: z.string().max(240).optional(),
    product_url: z.string().url('Invalid product URL').max(1000).optional(),
    inquiry_type: z.enum(['question', 'custom_size', 'shipping']).default('question'),
    customer_name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Invalid email address').max(240).optional().or(z.literal('')),
    phone: z.string().max(40).optional().or(z.literal('')),
    message: z.string().min(10, 'Please add a little more detail').max(2000),
    measurements: MeasurementsSchema,
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = InquirySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const data = parsed.data;

    if (data.product_id) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, data.product_id))
        .limit(1);

      if (!product) {
        return c.json({ error: 'Product not found' }, 404);
      }
    }

    const [inquiry] = await db
      .insert(studio_inquiries)
      .values({
        product_id: data.product_id,
        product_title: data.product_title,
        product_handle: data.product_handle,
        product_url: data.product_url,
        inquiry_type: data.inquiry_type,
        customer_name: data.customer_name,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        message: data.message,
        measurements: data.measurements || {},
        status: 'new',
      })
      .returning({ id: studio_inquiries.id });

    return c.json(
      {
        success: true,
        inquiry,
        message: 'Thanks. Our studio team will reply with product guidance soon.',
      },
      201
    );
  } catch (error: any) {
    console.error('[StudioInquiries] POST error:', error.message);
    return c.json({ error: 'Failed to send inquiry. Please try again.' }, 500);
  }
});

export default router;
