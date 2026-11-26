import { expect, test } from '@playwright/test';

test.use({ locale: 'es-PE', reducedMotion: 'reduce' });

test('el hero presenta dos CTA accesibles y cuatro cifras con iconos rellenos', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.premium-hero');
  const primary = hero.locator('[data-button-icon="arrow"]');
  const secondary = hero.locator('[data-button-icon="play"]');
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();

  for (const cta of [primary, secondary]) {
    expect((await cta.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(cta).toHaveCSS('border-radius', '999px');
  }
  await expect(primary).toHaveCSS('background-image', /linear-gradient/);
  await expect(secondary).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await primary.focus();
  await page.keyboard.press('Tab');
  await expect(secondary).toBeFocused();
  await expect(secondary).toHaveCSS('outline-style', 'solid');

  const metrics = hero.getByRole('list').getByRole('listitem');
  await expect(metrics).toHaveCount(4);
  await expect(metrics.first()).toContainText('30+');
  await expect(metrics.last()).toContainText('24/7');
  await expect(metrics.locator('svg[fill="currentColor"]:has(path[d])')).toHaveCount(4);
});

test('las tarjetas funden la foto a la derecha y conservan el destino original', async ({ page }) => {
  for (const route of ['/', '/servicios']) {
    await page.goto(route);
    const card = page.locator('app-service-photo-card').first();
    const photo = card.locator('picture');
    const link = card.getByRole('link');
    await expect(card.locator('.service-panel-icon')).toBeVisible();
    await expect(photo).toHaveCSS('mask-image', /linear-gradient/);
    await expect(photo.locator('img')).toBeVisible();
    await expect(link).toHaveAttribute('href', '/servicios/consultoria');
    await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(card.getByRole('heading')).toContainText('Consultoría informática');
  }
});
