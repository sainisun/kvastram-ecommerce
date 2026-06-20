import { expect, test } from '@playwright/test';

const publicAdminCopy =
  /publish|configure|add|upload|manage|create.+(?:in|from) (?:the )?admin/i;

test.describe('Storefront visual contract', () => {
  test('homepage exposes the primary shopping experience', async ({ page }, testInfo) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Kvastram|Kantha/i);
    await expect(page.locator('main')).toBeVisible();
    if (testInfo.project.name === 'mobile-chromium') {
      await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
    } else {
      await expect(page.locator('nav').first()).toBeVisible();
    }
    await expect(page.locator('footer').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(publicAdminCopy);

    const hero = page.locator('main section').first();
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('link').first()).toBeVisible();
  });

  test('homepage does not overflow its viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('products, cart, and login routes remain usable', async ({ page }) => {
    for (const path of ['/products', '/cart', '/login']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#main-content')).toBeVisible();
    }
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('legacy trending route resolves to reels', async ({ page }) => {
    await page.goto('/trending-now', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/\/reels$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
