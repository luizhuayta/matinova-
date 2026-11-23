import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Las secciones con layout.backgroundImage quedan transparentes (.has-bg-image)
// y el oscuro lo aporta el velo del .cms-block; sin imagen conservan su color.
async function expectDarkSection(page: Page, selector: string) {
  const bg = await page.locator(selector).first().evaluate((el) => {
    const own = getComputedStyle(el).backgroundColor;
    const block = el.closest('.cms-block');
    const veil = block ? getComputedStyle(block).backgroundImage : '';
    return { own, veil };
  });
  const isDark = bg.own === 'rgb(3, 11, 26)' || bg.veil.includes('rgba(3, 11, 26');
  expect(isDark).toBe(true);
}

test('el shell público usa el tema oscuro', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.public-theme')).toBeVisible();
  const bg = await page.locator('.public-theme').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(5, 11, 24)');
});

test('el admin conserva sus tokens claros', async ({ page }) => {
  await page.goto('/admin/login');
  const paper = await page.locator('.login-host').evaluate((el) => getComputedStyle(el).getPropertyValue('--admin-paper').trim());
  expect(paper).toBe('#f5f7fa');
});

test('header y footer usan el lenguaje oscuro', async ({ page }) => {
  await page.goto('/');
  const headerBg = await page.locator('.main-header').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(headerBg).toContain('rgba(5, 11, 24');
  const logoFilter = await page.locator('.logo-img').evaluate((el) => getComputedStyle(el).filter);
  expect(logoFilter).toContain('invert(1)');
  const footerBg = await page.locator('.footer').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(footerBg).toBe('rgb(7, 20, 38)');
});

test('el hero muestra cifras y acento', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.premium-trustbar')).toContainText('30+');
  await expect(page.locator('.premium-hero h1 .accent')).toBeVisible();
});

test('los servicios muestran icono y enlace', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.premium-service-card')).toHaveCount(6);
  await expect(page.locator('.premium-service-card .service-icon').first()).toBeVisible();
  await expect(page.locator('.premium-service-card .service-link').first()).toContainText(/Saber más|Learn more/);
});

test('el listado de servicios muestra iconos', async ({ page }) => {
  await page.goto('/servicios');
  await expect(page.locator('.service-card .service-icon').first()).toBeVisible();
});

test('las secciones de acerca de son oscuras', async ({ page }) => {
  await page.goto('/acerca-de');
  await expectDarkSection(page, '.cyber-page-header');
});

test('el listado de servicios es oscuro', async ({ page }) => {
  await page.goto('/servicios');
  await expectDarkSection(page, '.listing-page');
});

test('el detalle de servicio es oscuro', async ({ page }) => {
  await page.goto('/servicios/software');
  await expectDarkSection(page, '.service-page');
});

test('el formulario de contacto es legible en oscuro', async ({ page }) => {
  await page.goto('/contacto');
  const bg = await page.locator('input').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(255, 255, 255)');
});

test('las legales y el libro de reclamaciones son oscuros', async ({ page }) => {
  await page.goto('/privacidad');
  const legal = await page.locator('.legal-shell').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(legal).not.toBe('rgb(255, 255, 255)');
  await page.goto('/libro-reclamaciones');
  const libro = await page.locator('.libro-container').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(libro).not.toBe('rgb(255, 255, 255)');
});

test('los logos de clientes se ven sobre oscuro', async ({ page }) => {
  await page.goto('/clientes');
  const mark = page.locator('.client-tile-mark').first();
  await expect(mark).toBeVisible();
  const bg = await mark.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(248, 250, 252)');
});

test('la UI flotante usa el tema oscuro', async ({ page }) => {
  await page.goto('/');
  const cookie = page.locator('.cookie-content');
  if (await cookie.count()) {
    const bg = await cookie.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  }
  const a11y = page.locator('.accessibility-toggle');
  if (await a11y.count()) {
    const bg = await a11y.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  }
});

test('el alto contraste sigue funcionando', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.documentElement.setAttribute('data-a11y-contrast', 'high'));
  const bg = await page.locator('.public-theme').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(255, 255, 255)');
  const color = await page.locator('.public-theme').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(0, 0, 0)');
});

test('el chatbot usa el tema oscuro', async ({ page }) => {
  await page.goto('/');
  const fab = page.locator('.chat-fab');
  await expect(fab).toBeVisible({ timeout: 15000 });
  const fabBg = await fab.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(fabBg).toBe('rgb(0, 102, 255)');
  await fab.click();
  const panel = page.locator('.chat-window');
  await expect(panel).toHaveClass(/open/);
  const panelBg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(panelBg).toBe('rgb(10, 27, 51)');
});
