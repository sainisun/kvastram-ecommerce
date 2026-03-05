import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import {
  returns,
  return_items,
  orders,
  line_items,
  product_variants,
  customers,
} from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { verifyAdmin } from '../../middleware/auth';

const returnsRouter = new Hono();

// ─── SCHEMAS ───────────────────────────────────────────────────────────────

const CreateReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(5),
  refund_amount: z.number().int().min(0),
  admin_notes: z.string().optional(),
  items: z.array(
    z.object({
      line_item_id: z.string().uuid(),
      quantity: z.number().int().positive(),
      restock: z.boolean().default(true),
    })
  ),
});

// ─── ROUTES ────────────────────────────────────────────────────────────────

// GET /admin/returns — List all returns with optional status filter
returnsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const status = c.req.query('status');

    const query = db
      .select({
        id: returns.id,
        status: returns.status,
        reason: returns.reason,
        refund_amount: returns.refund_amount,
        admin_notes: returns.admin_notes,
        created_at: returns.created_at,
        updated_at: returns.updated_at,
        order_id: returns.order_id,
        order_display_id: orders.display_id,
        order_email: orders.email,
        order_total: orders.total,
        customer_id: customers.id,
        customer_email: customers.email,
        customer_name: sql<string>`CONCAT(${customers.first_name}, ' ', ${customers.last_name})`,
      })
      .from(returns)
      .leftJoin(orders, eq(returns.order_id, orders.id))
      .leftJoin(customers, eq(returns.customer_id, customers.id))
      .orderBy(desc(returns.created_at));

    const allReturns = await query;
    const filtered = status ? allReturns.filter((r) => r.status === status) : allReturns;

    return c.json({ returns: filtered, total: filtered.length });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// GET /admin/returns/:id — Single return detail with items
returnsRouter.get('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const [returnRequest] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, id))
      .limit(1);

    if (!returnRequest) return c.json({ error: 'Return not found' }, 404);

    const items = await db
      .select({
        id: return_items.id,
        quantity: return_items.quantity,
        restock: return_items.restock,
        line_item_id: return_items.line_item_id,
        item_title: line_items.title,
        item_description: line_items.description,
        unit_price: line_items.unit_price,
        thumbnail: line_items.thumbnail,
        variant_id: line_items.variant_id,
      })
      .from(return_items)
      .leftJoin(line_items, eq(return_items.line_item_id, line_items.id))
      .where(eq(return_items.return_id, id));

    return c.json({ return: returnRequest, items });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /admin/returns — Create a new return request (admin-initiated)
returnsRouter.post('/', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const data = CreateReturnSchema.parse(body);

    // Verify order exists
    const [order] = await db
      .select({ id: orders.id, customer_id: orders.customer_id })
      .from(orders)
      .where(eq(orders.id, data.order_id))
      .limit(1);

    if (!order) return c.json({ error: 'Order not found' }, 404);

    let newReturn: typeof returns.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(returns)
        .values({
          order_id: data.order_id,
          customer_id: order.customer_id,
          reason: data.reason,
          refund_amount: data.refund_amount,
          admin_notes: data.admin_notes,
          status: 'pending',
        })
        .returning();

      newReturn = created;

      for (const item of data.items) {
        await tx.insert(return_items).values({
          return_id: created.id,
          line_item_id: item.line_item_id,
          quantity: item.quantity,
          restock: item.restock,
        });
      }
    });

    return c.json({ return: newReturn }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// POST /admin/returns/:id/approve — Approve a return request
returnsRouter.post('/:id/approve', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    const [updated] = await db
      .update(returns)
      .set({
        status: 'approved',
        admin_notes: body.admin_notes,
        updated_at: new Date(),
      })
      .where(eq(returns.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Return not found' }, 404);
    return c.json({ return: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /admin/returns/:id/reject — Reject a return request
returnsRouter.post('/:id/reject', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    const [updated] = await db
      .update(returns)
      .set({
        status: 'rejected',
        admin_notes: body.admin_notes,
        updated_at: new Date(),
      })
      .where(eq(returns.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Return not found' }, 404);
    return c.json({ return: updated });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /admin/returns/:id/process-refund — Mark refunded + auto-restock inventory
returnsRouter.post('/:id/process-refund', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const [returnRequest] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, id))
      .limit(1);

    if (!returnRequest) return c.json({ error: 'Return not found' }, 404);
    if (returnRequest.status === 'refunded')
      return c.json({ error: 'Already refunded' }, 400);

    // Fetch return items that need restock
    const items = await db
      .select({
        quantity: return_items.quantity,
        restock: return_items.restock,
        variant_id: line_items.variant_id,
      })
      .from(return_items)
      .leftJoin(line_items, eq(return_items.line_item_id, line_items.id))
      .where(eq(return_items.return_id, id));

    await db.transaction(async (tx) => {
      // Mark return as refunded
      await tx
        .update(returns)
        .set({ status: 'refunded', updated_at: new Date() })
        .where(eq(returns.id, id));

      // Auto-restock inventory
      for (const item of items) {
        if (item.restock && item.variant_id) {
          await tx
            .update(product_variants)
            .set({
              inventory_quantity: sql`COALESCE(${product_variants.inventory_quantity}, 0) + ${item.quantity}`,
              updated_at: new Date(),
            })
            .where(eq(product_variants.id, item.variant_id));
        }
      }

      // Update order payment status to refunded
      await tx
        .update(orders)
        .set({ payment_status: 'refunded', updated_at: new Date() })
        .where(eq(orders.id, returnRequest.order_id));
    });

    return c.json({
      success: true,
      message: `Return #${id} processed. Refund of $${((returnRequest.refund_amount || 0) / 100).toFixed(2)} recorded and inventory restocked.`,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default returnsRouter;
