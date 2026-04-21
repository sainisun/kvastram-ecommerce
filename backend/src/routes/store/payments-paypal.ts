/**
 * PayPal Payment Routes
 *
 * Handles international payments via PayPal REST API:
 * - POST /store/payments/paypal/create-order  — create PayPal order
 * - POST /store/payments/paypal/capture        — capture PayPal payment after approval
 * - POST /store/payments/paypal/webhook        — PayPal webhook handler
 *
 * Uses PayPal REST API v2 directly (no SDK) to keep the bundle lean.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { orders, webhook_events } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logInfo, logError } from '../../utils/logger';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { config } from '../../config';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_SANDBOX = process.env.PAYPAL_SANDBOX === 'true';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

const PAYPAL_BASE_URL = PAYPAL_SANDBOX
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

// --- PayPal API helpers ---

async function getPaypalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000), // 8s timeout — fail fast
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// Convert paise/cents to currency units (e.g. 1000 paise → "10.00")
function toDecimalAmount(amountInSmallestUnit: number, currencyCode: string): string {
  // PayPal uses 2 decimal places for most currencies
  // INR has no sub-units in PayPal — they use rupees directly
  const noDecimalCurrencies = ['JPY', 'HUF', 'TWD', 'KRW'];
  const upper = currencyCode.toUpperCase();
  if (noDecimalCurrencies.includes(upper)) {
    return String(Math.round(amountInSmallestUnit / 100));
  }
  return (amountInSmallestUnit / 100).toFixed(2);
}

const paypalRouter = new Hono();

// --- SCHEMAS ---

const CreatePaypalOrderSchema = z.object({
  order_id: z.string().uuid(),
});

const CapturePaypalOrderSchema = z.object({
  order_id: z.string().uuid(),        // Our DB order ID
  paypal_order_id: z.string(),        // PayPal order ID
});

// --- ROUTES ---

// POST /store/payments/paypal/create-order
paypalRouter.post(
  '/create-order',
  zValidator('json', CreatePaypalOrderSchema),
  async (c) => {
    try {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return c.json({ error: 'PayPal not configured' }, 503);
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

      const currencyCode = (order.currency_code || 'USD').toUpperCase();
      const decimalAmount = toDecimalAmount(Number(order.total), currencyCode);

      const accessToken = await getPaypalAccessToken();

      const paypalRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: order.id,
              description: `Order #${order.display_id} - ${order.email}`,
              amount: {
                currency_code: currencyCode,
                value: decimalAmount,
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                no_shipping: true,
                user_action: 'PAY_NOW',
              },
            },
          },
        }),
      });

      if (!paypalRes.ok) {
        const errBody = await paypalRes.text();
        logError('PayPal create order error', errBody);
        return c.json({ error: 'Failed to create PayPal order' }, 500);
      }

      const paypalOrder = (await paypalRes.json()) as { id: string };

      // Store PayPal order ID in our order metadata
      await db
        .update(orders)
        .set({
          metadata: {
            ...((order.metadata as Record<string, any>) || {}),
            paypal_order_id: paypalOrder.id,
          },
        })
        .where(eq(orders.id, order_id));

      return c.json({
        paypal_order_id: paypalOrder.id,
        client_id: PAYPAL_CLIENT_ID,
      });
    } catch (error: any) {
      logError('PayPal create order failed', error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// POST /store/payments/paypal/capture
paypalRouter.post(
  '/capture',
  zValidator('json', CapturePaypalOrderSchema),
  async (c) => {
    try {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return c.json({ error: 'PayPal not configured' }, 503);
      }

      const { order_id, paypal_order_id } = c.req.valid('json');

      // Cross-check: paypal_order_id must match what was stored when we created the order.
      // This prevents an attacker from supplying a different PayPal order to mark an arbitrary DB order as paid.
      const [orderCheck] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order_id))
        .limit(1);

      if (!orderCheck) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const storedPaypalOrderId = (orderCheck.metadata as Record<string, any>)
        ?.paypal_order_id;

      if (!storedPaypalOrderId || storedPaypalOrderId !== paypal_order_id) {
        logError('PayPal capture: paypal_order_id mismatch', {
          order_id,
          provided: paypal_order_id,
          stored: storedPaypalOrderId,
        });
        return c.json({ error: 'Payment ID mismatch' }, 400);
      }

      if (orderCheck.payment_status === 'captured') {
        return c.json({ error: 'Order already paid' }, 400);
      }

      const accessToken = await getPaypalAccessToken();

      const captureRes = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypal_order_id}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!captureRes.ok) {
        const errBody = await captureRes.text();
        logError('PayPal capture error', errBody);
        return c.json({ error: 'PayPal capture failed' }, 500);
      }

      const captureData = (await captureRes.json()) as {
        id: string;
        status: string;
        purchase_units: Array<{
          payments: { captures: Array<{ id: string; status: string }> };
        }>;
      };

      const captureId =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const captureStatus =
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.status;

      if (captureStatus !== 'COMPLETED') {
        return c.json({ error: `Capture status: ${captureStatus}` }, 400);
      }

      // Use orderCheck fetched earlier (already verified)
      await db
        .update(orders)
        .set({
          payment_status: 'captured',
          status: 'completed',
          metadata: {
            ...((orderCheck.metadata as Record<string, any>) || {}),
            paypal_order_id,
            paypal_capture_id: captureId,
            payment_provider: 'paypal',
            paid_at: new Date().toISOString(),
          },
        })
        .where(eq(orders.id, order_id));

      logInfo(`PayPal payment captured for order ${order_id}`);
      return c.json({ success: true, capture_id: captureId });
    } catch (error: any) {
      logError('PayPal capture failed', error);
      return c.json({ error: error.message }, 500);
    }
  }
);

// Verify PayPal webhook signature via PayPal's REST API
// https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
async function verifyPaypalWebhook(
  headers: {
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    transmissionSig: string;
  },
  webhookId: string,
  rawBody: string
): Promise<boolean> {
  try {
    const accessToken = await getPaypalAccessToken();
    const res = await fetch(
      `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transmission_id: headers.transmissionId,
          transmission_time: headers.transmissionTime,
          cert_url: headers.certUrl,
          auth_algo: 'SHA256withRSA',
          transmission_sig: headers.transmissionSig,
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      }
    );

    if (!res.ok) return false;
    const data = (await res.json()) as { verification_status: string };
    return data.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

// POST /store/payments/paypal/webhook
paypalRouter.post('/webhook', async (c) => {
  const payload = await c.req.text();

  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    logError('PayPal webhook not configured (missing PAYPAL_WEBHOOK_ID or credentials)');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  // Verify webhook authenticity via PayPal API
  const transmissionId = c.req.header('paypal-transmission-id') || '';
  const transmissionTime = c.req.header('paypal-transmission-time') || '';
  const certUrl = c.req.header('paypal-cert-url') || '';
  const transmissionSig = c.req.header('paypal-transmission-sig') || '';

  if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
    logError('PayPal webhook: missing verification headers');
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  const isValid = await verifyPaypalWebhook(
    { transmissionId, transmissionTime, certUrl, transmissionSig },
    PAYPAL_WEBHOOK_ID,
    payload
  );

  if (!isValid) {
    logError('PayPal webhook signature verification failed');
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const eventId = event.id || `pp_${Date.now()}`;
  const eventType = event.event_type;

  // Idempotency check
  try {
    await db.insert(webhook_events).values({
      event_id: `paypal_${eventId}`,
      event_type: eventType,
      status: 'processing',
    });
  } catch (insertError: any) {
    if (insertError.code === '23505') {
      logInfo(`Duplicate PayPal webhook event ${eventId}`);
      return c.json({ received: true, duplicate: true });
    }
    throw insertError;
  }

  try {
    switch (eventType) {
      // CHECKOUT.ORDER.APPROVED fires when buyer approves — NOT yet captured.
      // We handle actual capture via our /capture endpoint (client triggers it).
      // Log only — do not mark as paid here.
      case 'CHECKOUT.ORDER.APPROVED': {
        logInfo(`PayPal order approved (awaiting capture): ${event.resource?.id}`);
        break;
      }

      // PAYMENT.CAPTURE.COMPLETED is the authoritative "money received" event.
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        // For a capture, PayPal puts the order ID in supplementary_data
        const paypalOrderId =
          resource?.supplementary_data?.related_ids?.order_id;

        if (paypalOrderId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'paypal_order_id' = ${paypalOrderId}`
            )
            .limit(1);

          if (order && order.payment_status !== 'captured') {
            await db
              .update(orders)
              .set({
                payment_status: 'captured',
                status: 'completed',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  paypal_capture_id: resource?.id,
                  payment_provider: 'paypal',
                  paid_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order.id));

            logInfo(`PayPal payment confirmed for order ${order.id}`);
          }
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const resource = event.resource;
        const paypalOrderId =
          resource?.supplementary_data?.related_ids?.order_id;

        if (paypalOrderId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'paypal_order_id' = ${paypalOrderId}`
            )
            .limit(1);

          if (order) {
            await db
              .update(orders)
              .set({
                payment_status: 'failed',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  payment_provider: 'paypal',
                  payment_failed_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order.id));

            logInfo(`PayPal payment denied for order ${order.id}`);
          }
        }
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const resource = event.resource;
        // PayPal puts the original capture ID in links with rel="up"
        const captureId =
          resource?.links?.find((l: any) => l.rel === 'up')
            ?.href?.split('/')
            .pop();

        if (captureId) {
          const [order] = await db
            .select()
            .from(orders)
            .where(
              sql`${orders.metadata}->>'paypal_capture_id' = ${captureId}`
            )
            .limit(1);

          if (order) {
            await db
              .update(orders)
              .set({
                payment_status: 'refunded',
                metadata: {
                  ...((order.metadata as Record<string, any>) || {}),
                  paypal_refund_id: resource?.id,
                  refunded_at: new Date().toISOString(),
                },
              })
              .where(eq(orders.id, order.id));

            logInfo(`PayPal refund for order ${order.id}`);
          }
        }
        break;
      }

      default:
        logInfo(`Unhandled PayPal event: ${eventType}`);
    }

    await db
      .update(webhook_events)
      .set({ processed_at: new Date(), status: 'processed' })
      .where(eq(webhook_events.event_id, `paypal_${eventId}`));

    return c.json({ received: true });
  } catch (error: any) {
    logError('PayPal webhook processing error', error);
    await db
      .update(webhook_events)
      .set({ status: 'failed' })
      .where(eq(webhook_events.event_id, `paypal_${eventId}`));
    return c.json({ error: error.message }, 500);
  }
});

export default paypalRouter;
