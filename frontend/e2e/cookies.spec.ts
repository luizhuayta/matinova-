import { expect, test } from '@playwright/test';

async function abrirSinSplash(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('splashSeen', 'true');
  });
  await page.goto('/');
  await expect(page.locator('.cookie-banner')).toBeVisible();
}

test.describe('banner de cookies', () => {
  test('no deja hueco visual bajo el footer mientras está visible', async ({ page }) => {
    await abrirSinSplash(page);
    const metrics = await page.evaluate(() => {
      const footer = document.querySelector('app-footer .footer');
      const scrolling = document.scrollingElement || document.documentElement;
      const footerBottom = footer ? footer.getBoundingClientRect().bottom + window.scrollY : 0;
      return {
        bodyPaddingBottom: getComputedStyle(document.body).paddingBottom,
        gapBelowFooter: scrolling.scrollHeight - footerBottom,
        bodyClass: document.body.className,
        cookieZIndex: Number(getComputedStyle(document.querySelector('.cookie-banner')).zIndex),
      };
    });
    expect(metrics.bodyClass).toContain('has-cookie-banner');
    expect(metrics.bodyPaddingBottom).toBe('0px');
    expect(metrics.cookieZIndex).toBeGreaterThan(80);
    expect(Math.abs(metrics.gapBelowFooter)).toBeLessThan(2);
  });

  test('los flotantes no se solapan con el banner y el chat se puede abrir', async ({ page }) => {
    await abrirSinSplash(page);
    const chatFab = page.locator('.chat-fab');
    await expect(chatFab).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.whatsapp-float')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.accessibility-toggle')).toBeVisible({ timeout: 15000 });

    await expect.poll(() => page.evaluate(() => {
      const intersects = (a: DOMRect, b: DOMRect) => {
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return width > 1 && height > 1;
      };
      const cookie = document.querySelector('.cookie-content')?.getBoundingClientRect();
      if (!cookie) {
        return ['cookie-content ausente'];
      }
      return ['.chat-fab', '.whatsapp-float', '.accessibility-toggle']
        .filter((selector) => {
          const rect = document.querySelector(selector)?.getBoundingClientRect();
          return rect ? intersects(cookie, rect) : true;
        });
    })).toEqual([]);

    await chatFab.click();
    await expect(page.locator('.chat-window')).toHaveClass(/open/);
    await page.getByRole('button', { name: /cerrar chat/i }).click();
    await expect(page.locator('.chat-window')).not.toHaveClass(/open/);

    await page.locator('.cookie-actions button').nth(1).click();
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
      const chatBottom = getComputedStyle(document.querySelector('.chat-fab')).bottom;
      const whatsappBottom = getComputedStyle(document.querySelector('.whatsapp-float')).bottom;
      const a11yBottom = getComputedStyle(document.querySelector('.accessibility-toggle')).bottom;
      return {
        hasBannerClass: document.body.classList.contains('has-cookie-banner'),
        customProperty: document.body.style.getPropertyValue('--cookie-banner-h'),
        chatBottom,
        whatsappBottom,
        a11yBottom,
      };
    })).toEqual({
      hasBannerClass: false,
      customProperty: '',
      chatBottom: page.viewportSize().width <= 640 ? '88px' : '72px',
      whatsappBottom: '16px',
      a11yBottom: '24px',
    });
  });

  test('rechazar se recuerda al recargar', async ({ page }) => {
    await abrirSinSplash(page);
    await page.locator('.cookie-actions button').nth(1).click();
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cookiesAccepted'))).toBe('false');
    await page.reload();
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
  });

  test('aceptar se recuerda al recargar', async ({ page }) => {
    await abrirSinSplash(page);
    await page.locator('.cookie-actions button').nth(0).click();
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cookiesAccepted'))).toBe('true');
    await page.reload();
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
  });

  test('Escape dentro del banner equivale a rechazar', async ({ page }) => {
    await abrirSinSplash(page);
    await page.locator('.cookie-actions button').nth(1).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cookiesAccepted'))).toBe('false');
  });
});
