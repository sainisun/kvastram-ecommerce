import { expect, test } from '@playwright/test';

test.describe('Customer shopping flow', () => {
  test('a shopper can add a product to the bag and retain it on the cart page', async ({ page }) => {
    await page.goto('/products/kantha-jacket', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: /Indigo Kantha Jacket/i }).first()
    ).toBeVisible();

    const addToCart = page.locator('#pdp-atc-btn').first();
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toHaveText(/Add to cart/i);
    await addToCart.click();
    await expect(addToCart).toHaveText(/Added to cart/i);

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Indigo Kantha Jacket/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Your Bag Is Empty/i })).toHaveCount(0);
  });

  test('a shopper can adjust line-item quantity from the cart', async ({ page }) => {
    await page.goto('/products/kantha-jacket', { waitUntil: 'domcontentloaded' });
    await page.locator('#pdp-atc-btn').first().click();
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    const quantityButtons = page.getByRole('button', { name: /increase quantity|increment quantity|plus/i });
    await expect(quantityButtons.first()).toBeVisible();
    await quantityButtons.first().click();

    await expect(
      page.getByRole('spinbutton', { name: /Quantity for Indigo Kantha Jacket/i })
    ).toHaveValue('2');
  });
});
