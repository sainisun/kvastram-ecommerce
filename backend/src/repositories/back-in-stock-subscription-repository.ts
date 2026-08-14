import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { back_in_stock_subscriptions, products } from '../db/schema';

export class BackInStockSubscriptionRepository {
  async loadSubscribers(productId: string) {
    return db
      .select({ id: back_in_stock_subscriptions.id, email: back_in_stock_subscriptions.email })
      .from(back_in_stock_subscriptions)
      .where(and(eq(back_in_stock_subscriptions.product_id, productId), eq(back_in_stock_subscriptions.notified, false)));
  }

  async loadProduct(productId: string) {
    const [product] = await db
      .select({ title: products.title, handle: products.handle })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    return product ?? null;
  }

  async markNotified(subscriptionId: string, notifiedAt: Date) {
    await db
      .update(back_in_stock_subscriptions)
      .set({ notified: true, notified_at: notifiedAt })
      .where(eq(back_in_stock_subscriptions.id, subscriptionId));
  }
}

export const backInStockSubscriptionRepository = new BackInStockSubscriptionRepository();
