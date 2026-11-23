import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/acerca-de',
  '/servicios',
  '/servicios/software',
  '/servicios/hardware',
  '/servicios/saas',
  '/servicios/consultoria',
  '/servicios/soluciones-ti',
  '/contacto',
  '/clientes',
  '/privacidad',
  '/terminos',
  '/libro-reclamaciones',
  '/en',
  '/ruta-inexistente',
];

for (const route of routes) {
  test(`ruta ${route} carga con shell oscuro`, async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
      localStorage.setItem('cookiesAccepted', 'true');
      localStorage.setItem('ctaBannerClosed', 'true');
    });
    await page.goto(route);
    await expect(page.locator('.public-theme')).toBeVisible();
    await expect(page.locator('app-header')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('app-footer')).toBeVisible();
  });
}
