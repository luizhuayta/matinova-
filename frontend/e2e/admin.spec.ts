import { test, expect } from '@playwright/test';

test.describe('panel admin', () => {
  test('login, páginas, publicar, mensajes y chatbot', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('matt_admin_tour', '1'));
    await page.goto('/admin/login');
    await expect(page.locator('#admin-user')).toBeVisible();
    await page.locator('#admin-user').fill('admin');
    await page.locator('#admin-pass').fill('admin123');
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await page.waitForURL((url) => url.pathname.startsWith('/admin') && !url.pathname.includes('/login'), {
      timeout: 20000,
    });

    await page.goto('/admin/paginas');
    await expect(page.getByRole('heading', { name: 'Páginas', level: 1 })).toBeVisible();

    await page.goto('/admin/paginas/inicio');
    await expect(page.getByRole('heading', { name: 'Inicio', level: 1 })).toBeVisible();
    const preview = page.locator('.preview-frame');
    await expect(preview).toHaveClass(/public-theme/);
    const previewColor = await preview.evaluate((el) => getComputedStyle(el).color);
    expect(previewColor).toBe('rgb(248, 250, 252)');
    const edit = page.getByRole('button', { name: 'Editar' });
    if ((await edit.getAttribute('aria-pressed')) !== 'true') {
      await edit.click();
    }
    await expect(page.getByRole('button', { name: /guardar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publicar/i })).toBeVisible();

    await page.goto('/admin/mensajes');
    await expect(page.getByRole('heading', { name: /mensajes recibidos/i })).toBeVisible();
    await page.goto('/admin/chatbot');
    await expect(page.getByRole('heading', { name: 'Chatbot', level: 1 })).toBeVisible();
  });
});
