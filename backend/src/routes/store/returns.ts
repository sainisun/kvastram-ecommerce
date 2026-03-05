import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db/client';
import { returns, return_items, orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../../middleware/auth';

const router = new Hono();

const ReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(10, 'Please describe your reason (min 10 chars)').max(1000),
  items: z.array(
    z.object({
      line_item_id: z.string().uuid(),
      quantity: z.number().int().min(1),
      restock: z.boolean().optional().default(true),
    })
  ).min(1, 'At least one item required'),
});

// POST /store/returns — Customer submits a return request
router.post('/', verifyAuth, async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const data = ReturnSchema.parse(body);

    // Verify order belongs to this customer
    const [order] = await db
      .select({ id: orders.id, customer_id: orders.customer_id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, data.order_id))
      .limit(1);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Only allow return on completed orders
    if (order.status !== 'completed') {
      return c.json({ error: 'Returns can only be requested for completed orders' }, 400);
    }

    // Check if a return already exists for this order
    const [existing] = await db
      .select({ id: returns.id, status: returns.status })
      .from(returns)
      .where(eq(returns.order_id, data.order_id))
      .limit(1);

    if (existing) {
      return c.json({
        error: `A return request for this order already exists (status: ${existing.status})`,
      }, 409);
    }

    // Create the return
    const [newReturn] = await db
      .insert(returns)
      .values({
        order_id: data.order_id,
        customer_id: order.customer_id || null,
        reason: data.reason,
        status: 'pending',
        refund_amount: 0,
      })
      .returning();

    // Insert return items
    if (data.items.length > 0) {
      await db.insert(return_items).values(
        data.items.map((item) => ({
          return_id: newReturn.id,
          line_item_id: item.line_item_id,
          quantity: item.quantity,
          restock: item.restock ?? true,
        }))
      );
    }

    return c.json(
      {
        success: true,
        return_id: newReturn.id,
        message: 'Return request submitted successfully. Our team will review it within 2-3 business days.',
      },
      201
    );
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return c.json({ error: e.errors[0].message }, 400);
    }
    return c.json({ error: e.message || 'Internal server error' }, 500);
  }
});

// GET /store/returns — Customer views their return requests
router.get('/', verifyAuth, async (c) => {
  try {
    const user = c.get('user') as any;

    const customerReturns = await db
      .select()
      .from(returns)
      .where(eq(returns.customer_id, user.sub))
      .orderBy(returns.created_at);

    return c.json({ returns: customerReturns });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default router;
