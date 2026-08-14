export type BackInStockSubscriber = { id: string; email: string };
export type BackInStockProduct = { title: string | null; handle: string };

export type BackInStockNotificationDependencies = {
  loadSubscribers(productId: string): Promise<BackInStockSubscriber[]>;
  loadProduct(productId: string): Promise<BackInStockProduct | null>;
  markNotified(subscriptionId: string, notifiedAt: Date): Promise<void>;
  sendEmail(input: { email: string; product_title: string; product_url: string }): Promise<void>;
  log?: Pick<Console, 'log' | 'error'>;
  now?: () => Date;
};

export async function notifyBackInStockSubscribers(
  productId: string,
  dependencies: BackInStockNotificationDependencies,
) {
  const subscribers = await dependencies.loadSubscribers(productId);
  if (!subscribers.length) return { notified: 0, failed: 0 };

  const product = await dependencies.loadProduct(productId);
  if (!product) return { notified: 0, failed: 0 };

  const log = dependencies.log ?? console;
  const productUrl = `/products/${product.handle}`;
  log.log(`[BackInStock] Notifying ${subscribers.length} subscriber(s) for "${product.title}"`);

  let notified = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    try {
      await dependencies.sendEmail({
        email: subscriber.email,
        product_title: product.title || 'Product',
        product_url: productUrl,
      });
      await dependencies.markNotified(subscriber.id, (dependencies.now ?? (() => new Date()))());
      notified += 1;
    } catch (error: any) {
      failed += 1;
      log.error(`[BackInStock] Failed to notify ${subscriber.email}:`, error.message);
    }
  }

  log.log(`[BackInStock] Done notifying subscribers for "${product.title}"`);
  return { notified, failed };
}
