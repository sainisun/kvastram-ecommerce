import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import Stripe from "stripe";
import { db } from "../../db";
import { orders, line_items } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // Cast to any because the types might not cover this specific version string yet
  apiVersion: "2025-02-05.acacia" as any,
});

const paymentRouter = new Hono();

// --- SCHEMAS ---

const CreatePaymentIntentSchema = z.object({
  order_id: z.string().uuid(),
});

// --- ROUTES ---

// POST /store/payments/create-intent
// Creates a Stripe PaymentIntent for an order
paymentRouter.post(
  "/create-intent",
  zValidator("json", CreatePaymentIntentSchema),
  async (c) => {
    try {
      const { order_id } = c.req.valid("json");

      // Fetch the order with line items
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order_id))
        .limit(1);

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (order.payment_status === "captured") {
        return c.json({ error: "Order already paid" }, 400);
      }

      // Fetch line items for the order (for metadata/receipts if needed later)
      // Keeping variable for consistency with original code
      const items = await db
        .select()
        .from(line_items)
        .where(eq(line_items.order_id, order_id));

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.total) * 100), // Convert to integer cents
        currency: order.currency_code.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          order_id: order.id,
          order_display_id: order.display_id?.toString() || "",
          customer_email: order.email,
        },
        description: `Order #${order.display_id} - ${order.email}`,
      });

      // Update order with payment intent ID
      await db
        .update(orders)
        .set({
          metadata: {
            // Merge existing metadata safely
            ...(order.metadata as Record<string, any>),
            stripe_payment_intent_id: paymentIntent.id,
          },
        })
        .where(eq(orders.id, order_id));

      return c.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// GET /store/payments/status/:order_id
// Check payment status of an order
paymentRouter.get("/status/:order_id", async (c) => {
  try {
    const order_id = c.req.param("order_id");

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, order_id))
      .limit(1);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({
      order_id: order.id,
      payment_status: order.payment_status,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /store/payments/webhook
// Stripe webhook handler for payment events
paymentRouter.post("/webhook", async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "No signature" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const order_id = paymentIntent.metadata?.order_id;

        if (order_id) {
          await db
            .update(orders)
            .set({
              payment_status: "captured",
              status: "completed",
              metadata: {
                stripe_payment_intent_id: paymentIntent.id,
                stripe_payment_status: paymentIntent.status,
                paid_at: new Date().toISOString(),
              },
            })
            .where(eq(orders.id, order_id));

          console.log(`Payment succeeded for order ${order_id}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const order_id = paymentIntent.metadata?.order_id;

        if (order_id) {
          await db
            .update(orders)
            .set({
              payment_status: "failed",
              metadata: {
                stripe_payment_intent_id: paymentIntent.id,
                stripe_payment_status: paymentIntent.status,
                payment_failed_at: new Date().toISOString(),
                payment_failure_message:
                  paymentIntent.last_payment_error?.message,
              },
            })
            .where(eq(orders.id, order_id));

          console.log(`Payment failed for order ${order_id}`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Find order by payment intent ID (jsonb column)
          const order = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'stripe_payment_intent_id' = ${paymentIntentId}`,
            )
            .limit(1);

          if (order.length > 0) {
            await db
              .update(orders)
              .set({
                payment_status: "refunded",
                metadata: {
                  ...(order[0].metadata as Record<string, any>),
                  stripe_refund_id: charge.refunds?.data[0]?.id,
                  refunded_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order[0].id));

            console.log(`Order ${order[0].id} refunded`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default paymentRouter;
