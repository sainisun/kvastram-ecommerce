import { Hono } from "hono";
import { verifyCustomer } from "../../middleware/customer-auth";
import { db } from "../../db/client";
import { customers, orders, line_items } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

const storeCustomersRouter = new Hono();

// Get Current Customer Profile
storeCustomersRouter.get("/me", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer) return c.json({ error: "Customer not found" }, 404);

  // Remove password hash before sending
  const { password_hash, ...safeCustomer } = customer;
  return c.json({ customer: safeCustomer });
});

// Update Current Customer Profile
storeCustomersRouter.put("/me", verifyCustomer, async (c) => {
  const payload = c.get("customer" as any) as any;
  const body = await c.req.json();

  // Basic validation (can improve with Zod)
  const allowedUpdates = {
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
  };

  try {
    const updated = await db
      .update(customers)
      .set({ ...allowedUpdates, updated_at: new Date() })
      .where(eq(customers.id, payload.sub))
      .returning();

    const { password_hash, ...safeCustomer } = updated[0];
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
