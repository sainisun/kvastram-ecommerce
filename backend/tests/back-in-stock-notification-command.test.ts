import { describe, expect, it, vi } from 'vitest';
import { notifyBackInStockSubscribers } from '../src/application/products/back-in-stock-notification-command';

const createDependencies = () => ({
  loadSubscribers: vi.fn(),
  loadProduct: vi.fn(),
  markNotified: vi.fn(),
  sendEmail: vi.fn(),
  log: { log: vi.fn(), error: vi.fn() },
  now: () => new Date('2026-08-14T00:00:00.000Z'),
});

describe('notifyBackInStockSubscribers', () => {
  it('does not load a product when no subscribers are pending', async () => {
    const dependencies = createDependencies();
    dependencies.loadSubscribers.mockResolvedValue([]);

    await expect(notifyBackInStockSubscribers('product-1', dependencies)).resolves.toEqual({ notified: 0, failed: 0 });
    expect(dependencies.loadProduct).not.toHaveBeenCalled();
  });

  it('sends the legacy product URL and marks a successful recipient notified', async () => {
    const dependencies = createDependencies();
    dependencies.loadSubscribers.mockResolvedValue([{ id: 'subscription-1', email: 'buyer@example.com' }]);
    dependencies.loadProduct.mockResolvedValue({ title: 'Cotton Tote', handle: 'cotton-tote' });
    dependencies.sendEmail.mockResolvedValue(undefined);
    dependencies.markNotified.mockResolvedValue(undefined);

    await expect(notifyBackInStockSubscribers('product-1', dependencies)).resolves.toEqual({ notified: 1, failed: 0 });
    expect(dependencies.sendEmail).toHaveBeenCalledWith({
      email: 'buyer@example.com',
      product_title: 'Cotton Tote',
      product_url: '/products/cotton-tote',
    });
    expect(dependencies.markNotified).toHaveBeenCalledWith('subscription-1', new Date('2026-08-14T00:00:00.000Z'));
  });

  it('continues after an individual email delivery failure without marking that recipient', async () => {
    const dependencies = createDependencies();
    dependencies.loadSubscribers.mockResolvedValue([
      { id: 'bad', email: 'bad@example.com' },
      { id: 'good', email: 'good@example.com' },
    ]);
    dependencies.loadProduct.mockResolvedValue({ title: 'Cotton Tote', handle: 'cotton-tote' });
    dependencies.sendEmail.mockRejectedValueOnce(new Error('SMTP unavailable')).mockResolvedValueOnce(undefined);
    dependencies.markNotified.mockResolvedValue(undefined);

    await expect(notifyBackInStockSubscribers('product-1', dependencies)).resolves.toEqual({ notified: 1, failed: 1 });
    expect(dependencies.markNotified).toHaveBeenCalledTimes(1);
    expect(dependencies.markNotified).toHaveBeenCalledWith('good', new Date('2026-08-14T00:00:00.000Z'));
    expect(dependencies.log.error).toHaveBeenCalledWith('[BackInStock] Failed to notify bad@example.com:', 'SMTP unavailable');
  });
});
