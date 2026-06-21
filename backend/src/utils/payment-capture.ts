import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { orders } from '../db/schema';

export async function finalizeCapturedPayment(
  orderId: string,
  metadataPatch: Record<string, unknown>
) {
  const [captured] = await db
    .update(orders)
    .set({
      payment_status: 'captured',
      status: 'completed',
      metadata: sql`COALESCE(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify(metadataPatch)}::jsonb`,
      updated_at: new Date(),
    })
    .where(
      and(
        eq(orders.id, orderId),
        sql`COALESCE(${orders.metadata}->>'inventory_reservation_released_at', '') = ''`
      )
    )
    .returning({ id: orders.id });

  if (captured) return true;

  await db
    .update(orders)
    .set({
      payment_status: 'payment_review',
      metadata: sql`COALESCE(${orders.metadata}, '{}'::jsonb) || ${JSON.stringify({
        ...metadataPatch,
        payment_review_reason: 'payment_captured_after_inventory_release',
      })}::jsonb`,
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId));

  return false;
}
