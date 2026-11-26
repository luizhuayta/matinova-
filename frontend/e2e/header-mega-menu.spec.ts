import { test, expect, Page } from '@playwright/test';

async function suppressOverlays(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('splashSeen', 'true');
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('ctaBannerClosed', 'true');
  });
}

test.describe('Header mega-menú (desktop y móvil)', () => {
  test('desktop ES: abre mega-menú por clic y hover, muestra 3 columnas con tiles, cierra con Escape (devolviendo foco), clic fuera y scroll', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('button[data-mega-trigger="servicios"]');
    const panel = page.locator('#menu-servicios');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'menu-servicios');
    await expect(panel).toBeHidden();

    // 1) Abrir por clic
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.mega-panel__section-title')).toHaveText('SERVICIOS TI');
    await expect(panel.locator('.mega-tile')).toHaveCount(5);

    // Panel ancho centrado + rejilla de 3 columnas
    const layout = await panel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const grid = el.querySelector('.mega-panel__grid') as HTMLElement;
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      return { width: Math.round(rect.width), cols };
    });
    expect(layout.width).toBeGreaterThanOrEqual(800);
    expect(layout.cols).toBe(3);

    // Cada tile tiene ícono/monograma + título + subtítulo
    const firstTile = panel.locator('.mega-tile').first();
    await expect(firstTile.locator('.mega-tile__icon')).toBeVisible();
    await expect(firstTile.locator('.mega-tile__title')).not.toHaveText('');
    await expect(firstTile.locator('.mega-tile__subtitle')).not.toHaveText('');

    // 2) Escape cierra el panel y devuelve el foco al disparador (aunque el puntero siga encima)
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const focusedAttr = await page.evaluate(() => document.activeElement?.getAttribute('data-mega-trigger'));
    expect(focusedAttr).toBe('servicios');

    // 3) Teclado ArrowDown abre y enfoca el primer enlace del panel
    await page.keyboard.press('ArrowDown');
    await expect(panel).toBeVisible();
    const insidePanel = await page.evaluate(() => !!document.activeElement?.closest('#menu-servicios'));
    expect(insidePanel).toBe(true);

    // 4) Clic fuera cierra el panel
    await page.mouse.click(20, 450);
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // 5) Hover en desktop abre con delay breve y scroll cierra el panel
    await trigger.hover();
    await expect(panel).toBeVisible({ timeout: 2000 });
    await page.evaluate(() => window.scrollTo(0, 350));
    await expect(panel).toBeHidden({ timeout: 2000 });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // 6) Mega-menú de Proyectos + cierre al navegar
    await page.evaluate(() => window.scrollTo(0, 0));
    const clientsTrigger = page.locator('button[data-mega-trigger="clientes"]');
    const clientsPanel = page.locator('#menu-clientes');
    await clientsTrigger.click();
    await expect(clientsPanel).toBeVisible();
    await expect(clientsPanel.locator('.mega-panel__section-title')).toHaveText('PROYECTOS Y CLIENTES');
    await expect(clientsPanel.locator('.mega-tile')).toHaveCount(3);
    await clientsPanel.locator('.mega-tile').first().click();
    await expect(page).toHaveURL(/\/clientes\?category=empresas$/);
    await expect(clientsPanel).toBeHidden();

    await context.close();
  });

  test('desktop EN: muestra rótulos, subtítulos y enlaces en inglés', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('button[data-mega-trigger="servicios"]');
    const panel = page.locator('#menu-servicios');
    await expect(trigger).toContainText('Services');
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('.mega-panel__section-title')).toHaveText('IT SERVICES');
    await expect(panel.locator('.mega-panel__all')).toHaveText('View all services');
    await expect(panel.locator('.mega-tile').first().locator('.mega-tile__subtitle')).toContainText(/Cloud|Workstations|Web|IT|Support|View service/i);

    const clientsTrigger = page.locator('button[data-mega-trigger="clientes"]');
    const clientsPanel = page.locator('#menu-clientes');
    await clientsTrigger.click();
    await expect(clientsPanel).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(clientsPanel.locator('.mega-panel__section-title')).toHaveText('PROJECTS & CLIENTS');
    await expect(clientsPanel.locator('.mega-panel__all')).toHaveText('View all clients');

    await context.close();
  });

  test('móvil 390px: acordeón con tiles dentro del menú hamburguesa y sin desborde horizontal', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const toggle = page.locator('app-header .mobile-menu-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/mobile-nav-open/);

    await toggle.click();
    await expect(page.locator('app-header nav.mobile-open')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/mobile-nav-open/);

    // Escape cierra el cajón móvil y retira body.mobile-nav-open
    await page.keyboard.press('Escape');
    await expect(page.locator('app-header nav.mobile-open')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/mobile-nav-open/);

    // Reabrir cajón para verificar acordeón y navegación
    await toggle.click();
    await expect(page.locator('app-header nav.mobile-open')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/mobile-nav-open/);

    const trigger = page.locator('button[data-mega-trigger="servicios"]');
    const panel = page.locator('#menu-servicios');
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('.mega-tile')).toHaveCount(5);

    const metrics = await panel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const pos = getComputedStyle(el).position;
      const grid = el.querySelector('.mega-panel__grid') as HTMLElement;
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      return {
        position: pos,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        cols,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    expect(metrics.position).toBe('static');
    expect(metrics.cols).toBe(1);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(390);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);

    // Al pulsar un tile navega, cierra acordeón/cajón y quita body.mobile-nav-open
    await panel.locator('.mega-tile').first().click();
    await expect(page).toHaveURL(/\/servicios\//);
    await expect(page.locator('app-header nav.mobile-open')).toHaveCount(0);
    await expect(panel).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/mobile-nav-open/);

    await context.close();
  });
});
