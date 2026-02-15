import { Hono } from "hono";
import { verifyCustomer } from "../../middleware/customer-auth";
import { db } from "../../db/client";
import { customers, orders, line_items } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { serializeCustomer } from "../../utils/safe-user";

const storeCustomersRouter = new Hono();

// Get Current Customer Profile
storeCustomersRouter.get("/me", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer) return c.json({ error: "Customer not found" }, 404);

  // 🔒 FIX-007: Use serializeCustomer utility
  const safeCustomer = serializeCustomer(customer);
  return c.json({ customer: safeCustomer });
});

// BUG-016 FIX: Added Zod validation for profile update

const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
});

// Update Current Customer Profile
storeCustomersRouter.put("/me", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Validate input
  const parseResult = UpdateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: "Validation failed", details: parseResult.error.errors }, 400);
  }

  const allowedUpdates = parseResult.data;

  try {
    const updated = await db
      .update(customers)
      .set({ ...allowedUpdates, updated_at: new Date() })
      .where(eq(customers.id, payload.sub))
      .returning();

    // 🔒 FIX-007: Use serializeCustomer utility
    const safeCustomer = serializeCustomer(updated[0]);
    return c.json({ customer: safeCustomer });
  } catch (error) {
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Get Customer Orders
storeCustomersRouter.get("/me/orders", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.customer_id, payload.sub),
    orderBy: [desc(orders.created_at)],
    with: {
      items: true,
      shipping_address: true,
    },
  });

  return c.json({ orders: customerOrders });
});

// Get Single Order
storeCustomersRouter.get("/me/orders/:id", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;
  const orderId = c.req.param("id");

  const order = await db.query.orders.findFirst({
    where: (orders, { and, eq }) =>
      and(eq(orders.id, orderId), eq(orders.customer_id, payload.sub)),
    with: {
      items: true,
      shipping_address: true,
      region: true,
    },
  });

  if (!order) return c.json({ error: "Order not found" }, 404);

  return c.json({ order });
});

export default storeCustomersRouter;
