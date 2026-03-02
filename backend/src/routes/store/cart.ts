import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { db } from '../../db/client';
import { saved_carts } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { AuthContextVariables } from '../../middleware/auth';

const cartRouter = new Hono<{ Variables: AuthContextVariables }>();

// Helper: Get customer ID from JWT cookie (optional auth — don't block guests)
async function getCustomerId(c: any): Promise<string | null> {
  try {
    const { verify } = await import('hono/jwt');
    const { config } = await import('../../config');
    const { getCookie } = await import('hono/cookie');

    const token =
      c.req.header('Authorization')?.replace('Bearer ', '') ||
      getCookie(c, 'admin_token') ||
      getCookie(c, 'store_token');

    if (!token) return null;
    const payload = (await verify(token, config.jwt.secret, 'HS256')) as any;
    return payload?.sub || null;
  } catch {
    return null;
  }
}

// GET /store/cart — Fetch saved cart
cartRouter.get('/', async (c) => {
  try {
    const customerId = await getCustomerId(c);

    if (customerId) {
      const [cart] = await db
        .select()
        .from(saved_carts)
        .where(eq(saved_carts.customer_id, customerId))
        .limit(1);
      return c.json({ items: cart?.items || [] });
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
  } catch (error: any) {
    console.error('[Cart] GET error:', error.message);
    return c.json({ items: [] }); // Silent fallback — don't crash storefront
  }
});

// POST /store/cart/save — Save/update cart
cartRouter.post('/save', async (c) => {
  try {
    const body = await c.req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return c.json({ error: 'Items must be an array' }, 400);
    }

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
  } catch (error: any) {
    console.error('[Cart] POST /save error:', error.message);
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
  } catch (error: any) {
    console.error('[Cart] POST /clear error:', error.message);
    return c.json({ success: true }); // Silent fail — don't block checkout
  }
});

export default cartRouter;
