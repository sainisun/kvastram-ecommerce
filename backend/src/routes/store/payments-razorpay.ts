/**
 * Razorpay Payment Routes
 *
 * Handles Indian (INR) payments via Razorpay:
 * - POST /store/payments/razorpay/create-order  — create Razorpay order
 * - POST /store/payments/razorpay/verify         — verify signature after payment
 * - POST /store/payments/razorpay/webhook        — Razorpay webhook handler
 *
 * Security:
 * - HMAC-SHA256 signature verification on verify endpoint
 * - HMAC-SHA256 webhook signature verification
 * - Idempotent webhook processing
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../../db';
import { orders, webhook_events } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logInfo, logError } from '../../utils/logger';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { config } from '../../config';

const rzpKeyId = process.env.RAZORPAY_ID;
const rzpKeySecret = process.env.RAZORPAY_SECRET;

const razorpay =
  rzpKeyId && rzpKeySecret
    ? new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret })
    : null;

const razorpayRouter = new Hono();

// --- SCHEMAS ---

const CreateRazorpayOrderSchema = z.object({
  order_id: z.string().uuid(),
});

const VerifyPaymentSchema = z.object({
  order_id: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// --- ROUTES ---

// POST /store/payments/razorpay/create-order
razorpayRouter.post(
  '/create-order',
  zValidator('json', CreateRazorpayOrderSchema),
  async (c) => {
    try {
      if (!razorpay) {
        return c.json({ error: 'Razorpay not configured' }, 503);
      }

      const { order_id } = c.req.valid('json');

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order_id))
        .limit(1);

      if (!order) {
        return c.json({ error: 'Order not found' }, 404);
      }

      // Ownership check for registered customers
      if (order.customer_id) {
        const token = getCookie(c, 'auth_token');
        if (!token) return c.json({ error: 'Unauthorized' }, 401);
        try {
          const payload = (await verify(token, config.jwt.secret, 'HS256')) as {
            sub: string;
            role: string;
          };
          if (
            payload.role !== 'customer' ||
            payload.sub !== order.customer_id
          ) {
            return c.json({ error: 'Forbidden' }, 403);
          }
        } catch {
          return c.json({ error: 'Unauthorized' }, 401);
        }
      }

      if (order.payment_status === 'captured') {
        return c.json({ error: 'Order already paid' }, 400);
      }

      if (['cancelled', 'refunded'].includes(order.status ?? '')) {
        return c.json({ error: 'Cannot create payment for this order' }, 400);
      }

      // Razorpay expects amount in paise (smallest INR unit = 1/100 rupee)
      // Our DB stores amounts in paise already (cents-equivalent)
      const amountInPaise = Math.round(Number(order.total));

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: (order.currency_code || 'INR').toUpperCase(),
        receipt: order.id,
        notes: {
          order_id: order.id,
          display_id: order.display_id?.toString() || '',
          email: order.email,
        },
      });

      // Store Razorpay order ID in order metadata
      await db
        .update(orders)
        .set({
          metadata: {
            ...((order.metadata as Record<string, any>) || {}),
            razorpay_order_id: rzpOrder.id,
          },
        })
        .where(eq(orders.id, order_id));

      return c.json({
        razorpay_order_id: rzpOrder.id,
        amount: amountInPaise,
        currency: (order.currency_code || 'INR').toUpperCase(),
        key_id: rzpKeyId,
      });
    } catch (error: any) {
      logError('Razorpay order creation failed', error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// POST /store/payments/razorpay/verify
// Client calls this after Razorpay checkout completes to verify payment
razorpayRouter.post(
  '/verify',
  zValidator('json', VerifyPaymentSchema),
  async (c) => {
    try {
      if (!rzpKeySecret) {
        return c.json({ error: 'Razorpay not configured' }, 503);
      }

      const {
        order_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = c.req.valid('json');

      // Verify HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', rzpKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        logError('Razorpay signature verification failed', {
          order_id,
          razorpay_order_id,
        });
        return c.json({ error: 'Invalid payment signature' }, 400);
      }

      // Fetch order for metadata merge
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order_id))
        .limit(1);

      if (!existingOrder) {
        return c.json({ error: 'Order not found' }, 404);
      }

      // Mark order as paid
      await db
        .update(orders)
        .set({
          payment_status: 'captured',
          status: 'completed',
          metadata: {
            ...((existingOrder.metadata as Record<string, any>) || {}),
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            payment_provider: 'razorpay',
            paid_at: new Date().toISOString(),
          },
        })
        .where(eq(orders.id, order_id));

      logInfo(`Razorpay payment verified for order ${order_id}`);
      return c.json({ success: true });
    } catch (error: any) {
      logError('Razorpay verify failed', error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// POST /store/payments/razorpay/webhook
razorpayRouter.post('/webhook', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');

  if (!signature) {
    return c.json({ error: 'No signature' }, 400);
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logError('RAZORPAY_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  if (expectedSignature !== signature) {
    logError('Razorpay webhook signature mismatch');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const eventId = event.payload?.payment?.entity?.id || `rz_${Date.now()}`;
  const eventType = event.event;

  // Idempotency check
  try {
    await db.insert(webhook_events).values({
      event_id: `razorpay_${eventId}`,
      event_type: eventType,
      status: 'processing',
    });
  } catch (insertError: any) {
    if (insertError.code === '23505') {
      logInfo(`Duplicate Razorpay webhook event ${eventId}`);
      return c.json({ received: true, duplicate: true });
    }
    throw insertError;
  }

  try {
    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        const orderId = payment?.notes?.order_id;

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            await db
              .update(orders)
              .set({
                payment_status: 'captured',
                status: 'completed',
                metadata: {
                  ...((existingOrder.metadata as Record<string, any>) || {}),
                  razorpay_payment_id: payment.id,
                  razorpay_order_id: payment.order_id,
                  payment_provider: 'razorpay',
                  paid_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, orderId));

            logInfo(`Razorpay payment captured for order ${orderId}`);
          }
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        const orderId = payment?.notes?.order_id;

        if (orderId) {
          const [existingOrder] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

          if (existingOrder) {
            await db
              .update(orders)
              .set({
                payment_status: 'failed',
                metadata: {
                  ...((existingOrder.metadata as Record<string, any>) || {}),
                  razorpay_payment_id: payment.id,
                  payment_provider: 'razorpay',
                  payment_failed_at: new Date().toISOString(),
                  payment_failure_reason: payment.error_description,
                },
              })
              .where(eq(orders.id, orderId));

            logInfo(`Razorpay payment failed for order ${orderId}`);
          }
        }
        break;
      }

      case 'refund.created': {
        const refund = event.payload?.refund?.entity;
        const paymentId = refund?.payment_id;

        if (paymentId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'razorpay_payment_id' = ${paymentId}`
            )
            .limit(1);

          if (order) {
            await db
              .update(orders)
              .set({
                payment_status: 'refunded',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  razorpay_refund_id: refund.id,
                  refunded_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order.id));

            logInfo(`Razorpay refund for order ${order.id}`);
          }
        }
        break;
      }

      default:
        logInfo(`Unhandled Razorpay event: ${eventType}`);
    }

    await db
      .update(webhook_events)
      .set({ processed_at: new Date(), status: 'processed' })
      .where(eq(webhook_events.event_id, `razorpay_${eventId}`));

    return c.json({ received: true });
  } catch (error: any) {
    logError('Razorpay webhook processing error', error);
    await db
      .update(webhook_events)
      .set({ status: 'failed' })
      .where(eq(webhook_events.event_id, `razorpay_${eventId}`));
    return c.json({ error: error.message }, 500);
  }
});

export default razorpayRouter;
