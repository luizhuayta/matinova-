import { test, expect, Page } from '@playwright/test';

async function suppressOverlays(page: Page, savedLocale?: 'es' | 'en') {
  await page.addInitScript((saved) => {
    sessionStorage.setItem('splashSeen', 'true');
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('ctaBannerClosed', 'true');
    // Inicializar cms-locale solo una vez por sesión de test para no pisar cambios tras reload()
    if (!sessionStorage.getItem('__e2e_locale_seeded')) {
      sessionStorage.setItem('__e2e_locale_seeded', '1');
      if (saved) {
        localStorage.setItem('cms-locale', saved);
      } else {
        localStorage.removeItem('cms-locale');
      }
    }
  }, savedLocale ?? null);
}

async function openNavIfMobile(page: Page): Promise<void> {
  const toggle = page.locator('app-header .mobile-menu-toggle');
  if (await toggle.isVisible()) {
    const open = await page.locator('app-header nav.mobile-open').count();
    if (!open) {
      await toggle.click();
      await expect(page.locator('app-header nav.mobile-open')).toBeVisible();
    }
  }
}

async function clickLocale(page: Page, code: 'ES' | 'EN'): Promise<void> {
  await openNavIfMobile(page);
  await page.locator('app-header .lang button', { hasText: code }).click();
}

test.describe('Idioma y sincronización con la URL', () => {
  test('navegador en-US sin localStorage redirige en la primera visita a / -> /en y permite volver a ES', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await expect(page.locator('app-header .lang button.active')).toHaveText('EN');
    await expect(page.locator('h1').first()).toContainText(/Technology|growth/i);

    // Cambiar a ES desde /en debe navegar a /, recargar contenido en español y persistir preferencia
    await clickLocale(page, 'ES');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('app-header .lang button.active')).toHaveText('ES');
    await expect(page.locator('h1').first()).toContainText(/Tecnolog/i);
    expect(await page.evaluate(() => localStorage.getItem('cms-locale'))).toBe('es');

    // Al recargar /, la preferencia guardada 'es' evita rebotar a /en
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toContainText(/Tecnolog/i);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('app-header .lang button.active')).toHaveText('ES');

    await context.close();
  });

  test('URL en español (/servicios) SIEMPRE muestra español incluso con navegador en-US y cms-locale=en en localStorage', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' });
    const page = await context.newPage();
    await suppressOverlays(page, 'en');

    const enRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/') && req.url().includes('locale=en')) {
        enRequests.push(req.url());
      }
    });

    await page.goto('/servicios', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('app-header .lang button.active')).toHaveText('ES');
    await expect(page.locator('h1').first()).toContainText(/Cinco líneas|Seis líneas|servicios|implementamos/i);
    expect(enRequests).toEqual([]);

    // Navegar a Inicio por el logo dentro de la sesión no rebota a /en
    await page.locator('app-header a.logo-container').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('h1').first()).toContainText(/Tecnolog/i);
    expect(enRequests).toEqual([]);

    await context.close();
  });

  test('navegador es-ES con cms-locale=es en /en/servicios muestra inglés y alterna ES <-> EN en varias páginas', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page, 'es');

    await page.goto('/en/servicios', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en\/servicios$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await expect(page.locator('app-header .lang button.active')).toHaveText('EN');
    await expect(page.locator('h1').first()).toContainText(/Five lines|Six lines/i);

    // Menú desplegable de clientes en inglés usa textos en inglés
    await expect(page.locator('#menu-clientes a').first()).toHaveText('View all clients');

    // Navegar a Contacto en inglés mantiene el prefijo /en
    await openNavIfMobile(page);
    await page.locator('app-header .nav-cta a').first().click();
    await expect(page).toHaveURL(/\/en\/contacto$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');

    // Cambiar a ES desde /en/contacto -> /contacto
    await clickLocale(page, 'ES');
    await expect(page).toHaveURL(/\/contacto$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('app-header .lang button.active')).toHaveText('ES');
    await expect(page.locator('#menu-clientes a').first()).toHaveText('Ver todos los clientes');

    // Volver a EN desde /contacto -> /en/contacto
    await clickLocale(page, 'EN');
    await expect(page).toHaveURL(/\/en\/contacto$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await expect(page.locator('app-header .lang button.active')).toHaveText('EN');

    await context.close();
  });

  test('navegador es-ES sin localStorage permanece en / en español, traduce al elegir EN y preserva query params', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
    await expect(page.locator('h1').first()).toContainText(/Tecnolog/i);

    await clickLocale(page, 'EN');
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await expect(page.locator('h1').first()).toContainText(/Technology|growth/i);

    // Cambiar de idioma en /en/servicios/software -> /servicios/software
    await page.goto('/en/servicios/software', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await clickLocale(page, 'ES');
    await expect(page).toHaveURL(/\/servicios\/software$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');

    // Cambiar de idioma en /clientes?category=empresas preserva la query string y traduce categorías
    await page.goto('/clientes?category=empresas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toContainText('Empresas y comercio');
    await expect(page.locator('main')).toContainText(/\d+\s+clientes?/);
    await clickLocale(page, 'EN');
    await expect(page).toHaveURL(/\/en\/clientes\?category=empresas$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
    await expect(page.locator('main')).toContainText('Companies & retail');
    await expect(page.locator('main')).toContainText(/\d+\s+clients?/);

    await context.close();
  });

  test('página 404 es bilingüe y DynamicPage no filtra suscripciones al entrar a /admin', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page);

    await page.goto('/ruta-inexistente', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.missing-page h1')).toHaveText('Página no encontrada');
    await expect(page.locator('.missing-page')).toContainText('Ir al inicio');

    await page.goto('/en/ruta-inexistente', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.missing-page h1')).toHaveText('Page not found');
    await expect(page.locator('.missing-page')).toContainText('Go to home');

    // Navegar por varias rutas públicas y luego entrar a /admin/login sin disparar peticiones CMS públicas
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toContainText(/Tecnolog/i);
    await clickLocale(page, 'EN');
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('h1').first()).toContainText(/Technology|growth/i);

    const leakedPublicCalls: string[] = [];
    page.on('request', (req) => {
      if (/\/api\/pages\/(inicio|servicios)/.test(req.url())) {
        leakedPublicCalls.push(req.url());
      }
    });

    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#admin-user')).toBeVisible();
    await page.waitForTimeout(400);
    expect(leakedPublicCalls).toEqual([]);

    await context.close();
  });

  test('página personalizada creada por API carga en /<slug>, /es/<slug> y /en/<slug>', async ({ browser, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'evita logins duplicados contra el rate limit');
    const slug = `e2e-custom-${Date.now()}`;
    const title = 'Página Personalizada E2E';

    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    expect(loginRes.ok(), `login admin falló: ${loginRes.status()}`).toBe(true);
    const { csrfToken } = (await loginRes.json()) as { csrfToken: string };
    expect(csrfToken).toBeTruthy();

    const createRes = await request.post('/api/pages?locale=es', {
      headers: { 'X-CSRF-Token': csrfToken, 'X-CMS-Locale': 'es' },
      data: { title, slug, template: 'blank', showInMenu: false },
    });
    expect(createRes.status()).toBe(201);

    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await suppressOverlays(page);

    try {
      // 1) Sin prefijo: /<slug>
      await page.goto(`/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/${slug}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('main')).toContainText('Nueva página');
      await expect(page.locator('.missing-page')).toHaveCount(0);
      await expect(page).toHaveTitle(title);

      // 2) Prefijo explícito /es/<slug>
      await page.goto(`/es/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/es/${slug}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('main')).toContainText('Nueva página');
      await expect(page.locator('.missing-page')).toHaveCount(0);
      await expect(page).toHaveTitle(title);

      // 3) Prefijo /en/<slug> (con fallback a ES aunque aún no exista traducción EN)
      await page.goto(`/en/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/en/${slug}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Home');
      await expect(page.locator('main')).toContainText('Nueva página');
      await expect(page.locator('.missing-page')).toHaveCount(0);
      await expect(page).toHaveTitle(title);

      // 4) Cambiar de idioma desde /en/<slug> -> /<slug>
      await clickLocale(page, 'ES');
      await expect(page).toHaveURL(new RegExp(`/${slug}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('app-header a[cmsText="nav.inicio"]')).toHaveText('Inicio');
      await expect(page.locator('main')).toContainText('Nueva página');
      await expect(page.locator('.missing-page')).toHaveCount(0);
    } finally {
      await context.close();
      await request.delete(`/api/pages/${slug}?locale=es`, {
        headers: { 'X-CSRF-Token': csrfToken, 'X-CMS-Locale': 'es' },
      });
      await request.post('/api/auth/logout');
    }
  });
});
