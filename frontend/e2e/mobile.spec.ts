import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const publicRoutes = ['/', '/servicios', '/contacto', '/acerca-de', '/clientes', '/libro-de-reclamaciones'];

/**
 * El body usa overflow-x: clip, así que scrollWidth no delata desbordes:
 * se recorren los elementos visibles y se reportan los que sobresalen del
 * viewport sin estar dentro de un contenedor con scroll propio.
 */
async function horizontalOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const offenders: string[] = [];
    const scrollContained = (el: Element): boolean => {
      let node = el.parentElement;
      while (node && node !== document.body) {
        if (getComputedStyle(node).overflowX !== 'visible') return true;
        node = node.parentElement;
      }
      return false;
    };
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const html = el as HTMLElement;
      if (html.closest('.loading-screen')) continue;
      const style = getComputedStyle(html);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.position === 'fixed') continue;
      if (scrollContained(el)) continue;
      const rect = html.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > viewportWidth + 1 || rect.left < -1) {
        const cls = typeof html.className === 'string' ? html.className.split(/\s+/)[0] : '';
        offenders.push(
          `${html.tagName.toLowerCase()}${cls ? '.' + cls : ''} left=${Math.round(rect.left)} right=${Math.round(rect.right)}`
        );
      }
    }
    return offenders;
  });
}

test.describe('responsive público', () => {
  test.beforeEach(async ({ page }) => {
    // Saltar splash y banners para medir el layout real.
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
      localStorage.setItem('cookiesAccepted', 'true');
      localStorage.setItem('ctaBannerClosed', 'true');
    });
  });

  test('las páginas públicas no desbordan horizontalmente', async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator('app-header')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('app-footer')).toBeVisible();
      const offenders = await horizontalOffenders(page);
      expect(offenders, `desborde horizontal en ${route}`).toEqual([]);
    }
  });
});

test.describe('responsive móvil', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'solo el proyecto móvil');
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('splashSeen', 'true');
      localStorage.setItem('cookiesAccepted', 'true');
      localStorage.setItem('ctaBannerClosed', 'true');
    });
  });

  test('el menú hamburguesa abre la navegación y se cierra al navegar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-header')).toBeVisible({ timeout: 15000 });

    const toggle = page.locator('.mobile-menu-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('nav.mobile-open')).toBeVisible();

    // navigateTo() cierra el menú apenas se hace clic en un enlace.
    await page.locator('.nav-list a').first().click();
    await expect(page.locator('nav.mobile-open')).toHaveCount(0);
  });

  test('el chatbot se abre a pantalla completa', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-header')).toBeVisible({ timeout: 15000 });

    const chat = page.locator('.chat-window');
    await expect(chat).toHaveCount(1);
    await page.getByRole('button', { name: /abrir asistente mis-bot/i }).click();
    await expect(chat).toHaveClass(/open/);

    // La apertura anima (translate/scale 0.25s): se sondea hasta que asienta.
    const viewport = page.viewportSize();
    await expect
      .poll(async () => {
        const box = await chat.boundingBox();
        return Math.abs((box?.width ?? 0) - (viewport?.width ?? 0));
      })
      .toBeLessThanOrEqual(2);
    await expect
      .poll(async () => {
        const box = await chat.boundingBox();
        return Math.abs((box?.height ?? 0) - (viewport?.height ?? 0));
      })
      .toBeLessThanOrEqual(2);
  });

  test('el login del panel no desborda a ancho de celular', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('#admin-user')).toBeVisible({ timeout: 15000 });

    const offenders = await horizontalOffenders(page);
    expect(offenders, 'desborde horizontal en el login').toEqual([]);
  });

  test('tras iniciar sesión el menú del panel desplaza en horizontal', async ({ page, request }) => {
    const apiUp = await request
      .get('/api/site')
      .then((res) => res.ok())
      .catch(() => false);
    test.skip(!apiUp, 'requiere la API en 127.0.0.1:8000');
    await page.addInitScript(() => localStorage.setItem('matt_admin_tour', '1'));
    await page.goto('/admin/login');
    await page.locator('#admin-user').fill('admin');
    await page.locator('#admin-pass').fill('admin123');
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await page.waitForURL(
      (url) => url.pathname.startsWith('/admin') && !url.pathname.includes('/login'),
      { timeout: 20000 }
    );

    const nav = page.locator('.admin-nav nav');
    await expect(nav).toBeVisible();
    const canScroll = await nav.evaluate(
      (el) => getComputedStyle(el).overflowX === 'auto' || getComputedStyle(el).overflowX === 'scroll'
    );
    expect(canScroll, 'el menú del panel debe desplazarse en horizontal').toBe(true);
  });
});
