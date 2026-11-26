import { test, expect } from '@playwright/test';

test('crear en español y guardar y publicar una imagen en ambos idiomas', async ({ page, browser, baseURL }) => {
  const slug = `prueba-auto-en-${Date.now()}-${test.info().workerIndex}`;
  const title = 'Prueba de versión automática';
  const oldImage = '/images/redesign/section-bg.webp';
  const newImage = '/software-banner.webp';
  const api = `/api/pages/${slug}`;
  // En dev el frontend llama a /api/...; en el paquete de cPanel, a /api.php/...
  const apiPath = (url: string) => url.replace('/api.php/', '/api/');
  const english = await browser.newContext({ baseURL, locale: 'en-US' });
  const publicPage = await english.newPage();
  const publicBlock = publicPage.locator('.cms-block.has-bg-image').first();

  await page.addInitScript(() => localStorage.setItem('matt_admin_tour', '1'));
  await page.goto('/admin/login');
  await page.locator('#admin-user').fill('admin');
  await page.locator('#admin-pass').fill('admin123');
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith('/admin') && !url.pathname.includes('/login'));
  const session = await page.request.get('/api/auth/me');
  const csrf: string = (await session.json()).csrfToken;
  expect(csrf).toBeTruthy();

  // La biblioteca ofrece una imagen pública existente para probar el selector sin escribir en uploads.
  await page.route(/\/api(\.php)?\/media(\?|$)/, (route) => route.fulfill({
    json: { items: [{ id: 1, url: newImage, original_name: 'Foto de prueba', width: 1440, height: 900 }] },
  }));
  try {
    await page.goto('/admin/paginas');
    await page.getByRole('button', { name: 'Nueva página' }).click();
    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
    await page.getByRole('textbox', { name: 'Ruta', exact: true }).fill(slug);
    const created = page.waitForResponse((r) => apiPath(r.url()).includes('/api/pages?') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    const creation = await created;
    expect(creation.status()).toBe(201);
    const spanish = await creation.json();
    expect(spanish.translations).toEqual(['en']);
    await expect(page.getByText('Se creó también la versión en inglés; traduce el texto cuando quieras.')).toBeVisible();

    const initialEnglish = await english.request.get(`${api}?locale=en`);
    expect(initialEnglish.ok()).toBeTruthy();
    const initialDocument = await initialEnglish.json();
    expect(initialDocument.locale).toBe('en');
    expect(initialDocument.version).toBe(1);
    expect(initialDocument.content.blocks.map((block: { id: string }) => block.id))
      .toEqual(spanish.content.blocks.map((block: { id: string }) => block.id));
    const copy = await page.request.post(`${api}/translate?locale=es`, {
      headers: { 'X-CSRF-Token': csrf },
      data: { locale: 'en' },
    });
    expect(copy.status()).toBe(200);
    expect((await copy.json()).existed).toBe(true);
    await publicPage.goto(`/en/${slug}`);
    await expect(publicPage).toHaveURL(new RegExp(`/en/${slug}$`));
    await expect(publicBlock).toHaveAttribute('style', /section-bg\.webp/);

    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    const background = page.locator('.layout-row--media app-cms-image-field').first();
    await background.getByRole('button', { name: 'Elegir', exact: true }).click();
    const saved = page.waitForResponse((r) => apiPath(r.url()).includes(`${api}?`) && r.request().method() === 'PUT');
    await page.getByRole('dialog', { name: 'Elegir imagen' }).getByRole('button', { name: 'Foto de prueba' }).click();
    const save = await saved;
    expect(save.ok()).toBeTruthy();
    expect((await save.json()).syncedImages).toBe(1);
    await expect(page.getByText('Imagen actualizada también en inglés')).toBeVisible();
    const draft = await page.request.get(`${api}?locale=en&editor=1`);
    expect(draft.ok()).toBeTruthy();
    const draftDoc = await draft.json();
    expect(draftDoc.version).toBe(2);
    expect(draftDoc.content.blocks[0].layout.backgroundImage).toBe(newImage);
    expect(draftDoc.published.blocks[0].layout.backgroundImage).toBe(oldImage);
    await publicPage.reload();
    await expect(publicBlock).toHaveAttribute('style', /section-bg\.webp/);

    const published = page.waitForResponse((r) => apiPath(r.url()).includes(`${api}/publish?`) && r.request().method() === 'POST');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    const publication = await published;
    expect(publication.ok()).toBeTruthy();
    expect((await publication.json()).syncedImages).toBe(1);
    await publicPage.reload();
    await expect(publicBlock).toHaveCSS('background-image', /software-banner\.webp/);
    const publishedEnglish = await english.request.get(`${api}?locale=en`);
    expect(publishedEnglish.ok()).toBeTruthy();
    const publishedDoc = await publishedEnglish.json();
    expect(publishedDoc.version).toBe(3);
    expect(publishedDoc.content.blocks[0].layout.backgroundImage).toBe(newImage);
  } finally {
    try {
      for (const locale of ['en', 'es']) {
        const deleted = await page.request.delete(`${api}?locale=${locale}`, { headers: { 'X-CSRF-Token': csrf } });
        expect([200, 404]).toContain(deleted.status());
      }
    } finally {
      await english.close();
    }
  }
});
