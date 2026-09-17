import { test, expect } from '@playwright/test';

test.describe('visual del panel', () => {
  test('login snapshot', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('#admin-user')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.login-split')).toHaveScreenshot('admin-login.png', {
      maxDiffPixelRatio: 0.12,
    });
  });
});
