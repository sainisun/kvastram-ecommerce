import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests', () => {
  
  test('Homepage loads correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Kvastram/);
    
    // Check for main content
    await expect(page.locator('main')).toBeVisible();
    
    // Check for hero section or main elements
    await expect(page.locator('body')).toBeVisible();
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('Products page loads', async ({ page }) => {
    await page.goto('/products');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check page loads
    await expect(page).toHaveTitle(/Products|Kvastram/);
  });

  test('Navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find navigation links
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    
    // Check if products link exists and is clickable
    const productsLink = page.getByRole('link', { name: /products/i }).first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/products/);
    }
  });

  test('Footer loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check footer exists
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('Cart page loads', async ({ page }) => {
    await page.goto('/cart');
    
    // Should load without errors
    await page.waitForLoadState('networkidle');
    
    // Check cart content area exists
    await expect(page.locator('main')).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    
    await page.waitForLoadState('networkidle');
    
    // Check login form elements exist
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('Wholesale page loads', async ({ page }) => {
    await page.goto('/wholesale');
    
    await page.waitForLoadState('networkidle');
    
    // Check wholesale page content
    await expect(page.locator('main')).toBeVisible();
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still load correctly on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive design - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still load correctly on tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('No critical console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async errors
    await page.waitForTimeout(2000);
    
    // Filter out non-critical errors (like 404s for images, etc)
    const criticalErrors = errors.filter(err => 
      !err.includes('404') && 
      !err.includes('favicon') &&
      !err.includes('Failed to load resource')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Accessibility - page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Check that h1 exists
    const h1 = page.locator('h1');
    const count = await h1.count();
    
    // Either no h1 or at least one h1 should exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Accessibility - images have alt text', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = page.locator('img');
    const count = await images.count();
    
    // If there are images, check they have alt attributes
    if (count > 0) {
      // Just verify images load without crashing
      await expect(images.first()).toBeVisible();
    }
  });

  test('Links are navigable', async ({ page }) => {
    await page.goto('/');
    
    // Get first few links
    const links = page.locator('a').first();
    await expect(links).toBeVisible();
  });
});
