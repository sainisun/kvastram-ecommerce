import { Hono, type Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { z } from 'zod';
import { db } from '../../db/client';
import { saved_carts } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../../config';

const CartItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
  product_id: z.string().uuid().optional(),
  title: z.string().max(500).optional(),
  thumbnail: z.string().max(2048).optional(),
  unit_price: z.number().int().min(0).optional(),
});

const SaveCartSchema = z.object({
  items: z.array(CartItemSchema).max(100),
});

function mergeCartItems(customerItems: any[], guestItems: any[]): any[] {
  const mergedMap = new Map<string, any>();

  // Add customer items first
  for (const item of customerItems) {
    if (item && item.variant_id) {
      mergedMap.set(item.variant_id, { ...item });
    }
  }

  // Merge guest items
  for (const item of guestItems) {
    if (item && item.variant_id) {
      const existing = mergedMap.get(item.variant_id);
      if (existing) {
        existing.quantity = Math.min(999, existing.quantity + (item.quantity || 1));
      } else {
        mergedMap.set(item.variant_id, { ...item });
      }
    }
  }

  return Array.from(mergedMap.values());
}

const cartRouter = new Hono();

// Helper: Get customer ID from JWT cookie (optional auth — don't block guests)
async function getCustomerId(c: Context): Promise<string | null> {
  try {
    const token = getCookie(c, 'auth_token');
    if (!token) return null;
    const payload = await verify(token, config.jwt.secret, 'HS256') as { sub?: string };
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

// GET /store/cart — Fetch saved cart
cartRouter.get('/', async (c) => {
  try {
    const customerId = await getCustomerId(c);

    if (customerId) {
      const [customerCart] = await db
        .select()
        .from(saved_carts)
        .where(eq(saved_carts.customer_id, customerId))
        .limit(1);
      
      let items = (customerCart?.items as any[]) || [];

      // If guest cart session exists, merge it
      const sessionId = getCookie(c, 'cart_session_id');
      if (sessionId) {
        const [guestCart] = await db
          .select()
          .from(saved_carts)
          .where(eq(saved_carts.session_id, sessionId))
          .limit(1);

        const guestItems = (guestCart?.items as any[]) || [];
        if (guestItems.length > 0) {
          items = mergeCartItems(items, guestItems);

          // Update customer cart and purge guest cart
          if (customerCart) {
            await db
              .update(saved_carts)
              .set({ items, updated_at: new Date() })
              .where(eq(saved_carts.customer_id, customerId));
          } else {
            await db.insert(saved_carts).values({
              customer_id: customerId,
              items,
            });
          }

          await db
            .delete(saved_carts)
            .where(eq(saved_carts.session_id, sessionId));
        }
      }

      return c.json({ items });
    }

    // Fallback: session-based cart for guests
    const sessionId = getCookie(c, 'cart_session_id');
    if (sessionId) {
      const [cart] = await db
        .select()
        .from(saved_carts)
        .where(eq(saved_carts.session_id, sessionId))
        .limit(1);
      return c.json({ items: cart?.items || [] });
    }

    return c.json({ items: [] });
  } catch (error: unknown) {
    console.error('[Cart] GET error:', error instanceof Error ? error.message : String(error));
    return c.json({ items: [] }); // Silent fallback — don't crash storefront
  }
});

// POST /store/cart/save — Save/update cart
cartRouter.post('/save', async (c) => {
  try {
    const raw = await c.req.json();
    const parsed = SaveCartSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ error: 'Invalid cart data', details: parsed.error.errors }, 400);
    }
    const { items } = parsed.data;

    const customerId = await getCustomerId(c);

    if (customerId) {
      // Logged-in customer: upsert by customer_id
      const existing = await db
        .select({ id: saved_carts.id })
        .from(saved_carts)
        .where(eq(saved_carts.customer_id, customerId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(saved_carts)
          .set({ items, updated_at: new Date() })
          .where(eq(saved_carts.customer_id, customerId));
      } else {
        await db.insert(saved_carts).values({ customer_id: customerId, items });
      }
      return c.json({ success: true });
    }

    // Guest: upsert by session_id
    let sessionId = getCookie(c, 'cart_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      setCookie(c, 'cart_session_id', sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'Lax',
      });
    }

    const existing = await db
      .select({ id: saved_carts.id })
      .from(saved_carts)
      .where(eq(saved_carts.session_id, sessionId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(saved_carts)
        .set({ items, updated_at: new Date() })
        .where(eq(saved_carts.session_id, sessionId));
    } else {
      await db.insert(saved_carts).values({ session_id: sessionId, items });
    }

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('[Cart] POST /save error:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'Failed to save cart' }, 500);
  }
});

// POST /store/cart/clear — Clear cart on successful checkout
cartRouter.post('/clear', async (c) => {
  try {
    const customerId = await getCustomerId(c);

    if (customerId) {
      await db
        .delete(saved_carts)
        .where(eq(saved_carts.customer_id, customerId));
      return c.json({ success: true });
    }

    const sessionId = getCookie(c, 'cart_session_id');
    if (sessionId) {
      await db
        .delete(saved_carts)
        .where(eq(saved_carts.session_id, sessionId));
    }

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('[Cart] POST /clear error:', error instanceof Error ? error.message : String(error));
    return c.json({ success: true }); // Silent fail — don't block checkout
  }
});

export default cartRouter;
