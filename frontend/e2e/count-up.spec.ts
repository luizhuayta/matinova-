import { expect, test } from '@playwright/test';

const numericPart = (text: string | null | undefined) => Number((text ?? '').match(/\d+/)?.[0] ?? Number.NaN);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.addInitScript(() => {
    sessionStorage.setItem('splashSeen', 'true');
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('ctaBannerClosed', 'true');
  });
});

test('las cifras del hero cuentan desde cero al entrar en pantalla', async ({ page }) => {
  await page.goto('/');
  const firstValue = page.locator('.hero-metric strong [data-countup-value]').first();
  await expect(firstValue).toHaveText('30+');

  await page.locator('.hero-metrics').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const early = await firstValue.textContent();
  expect(numericPart(early)).toBeLessThan(30);

  await page.waitForTimeout(2300);
  await expect(firstValue).toHaveText('30+');
});

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('las cifras muestran el valor final inmediatamente', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.hero-metric strong').first();
    await expect(first).toHaveText(/30\+/);
    await page.locator('.hero-metrics').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await expect(first).toHaveText(/30\+/);
  });
});
