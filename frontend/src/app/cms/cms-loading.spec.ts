import { describe, expect, it, vi, afterEach } from 'vitest';
import { NEVER, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CmsApiService } from './cms-api.service';
import { CmsContentService } from './cms-content.service';
import { CmsHistoryService } from './cms-history.service';
import { LocaleService } from './locale.service';

afterEach(() => vi.useRealTimers());

describe('carga del CMS', () => {
  it('cancela lecturas que no responden en 15 segundos', async () => {
    vi.useFakeTimers();
    const api = new CmsApiService({ get: () => NEVER } as unknown as HttpClient);
    const checks = [api.getSite(), api.getPagesCatalog(), api.getPage('inicio')]
      .map((request) => expect(request).rejects.toMatchObject({ name: 'TimeoutError' }));
    await vi.advanceTimersByTimeAsync(15000);
    await Promise.all(checks);
  });

  it('permite reintentar después de que falle la shell', async () => {
    const api = {
      getSite: vi.fn().mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue({ content: { title: 'Sitio' }, version: 1 }),
      getPagesCatalog: vi.fn().mockResolvedValue({ pages: [], menu: [] }),
      getPage: vi.fn().mockResolvedValue({ content: { blocks: [] }, version: 1 }),
    };
    const cms = new CmsContentService(api as unknown as CmsApiService, new CmsHistoryService());
    await cms.loadPublic('inicio');
    expect(cms.publicLoadError()).toContain('No pudimos');
    expect(cms.loadingSlug()).toBeNull();
    expect(cms.loaded()).toBe(false);
    await cms.loadPublic('inicio');
    expect(cms.publicLoadError()).toBe('');
    expect(cms.loaded()).toBe(true);
    expect(cms.pages()['inicio']).toBeDefined();
    expect(api.getSite).toHaveBeenCalledTimes(2);
  });

  it('no oculta errores de página y repite la petición fallida', async () => {
    const api = {
      getSite: vi.fn().mockResolvedValue({ content: {}, version: 1 }),
      getPagesCatalog: vi.fn().mockResolvedValue({ pages: [], menu: [] }),
      getPage: vi.fn().mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue({ content: { blocks: [] }, version: 1 }),
    };
    const locales = new LocaleService();
    locales.locale.set('en');
    const cms = new CmsContentService(api as unknown as CmsApiService, new CmsHistoryService(), locales);
    await cms.loadPublic('inicio');
    expect(cms.publicLoadError()).toContain('could not load');
    await cms.loadPublic('inicio');
    expect(cms.publicLoadError()).toBe('');
    expect(cms.pages()['inicio']).toBeDefined();
    expect(api.getPage).toHaveBeenCalledTimes(2);
    expect(api.getSite).toHaveBeenCalledTimes(1);
  });

  it('las lecturas normales siguen devolviendo el documento', async () => {
    const doc = { content: {}, version: 1 };
    const api = new CmsApiService({ get: () => of(doc) } as unknown as HttpClient);
    expect(await api.getSite()).toEqual(doc);
  });

  it('rechaza respuestas HTML o JSON con formato incorrecto', async () => {
    const api = new CmsApiService({ get: () => of('<!doctype html>') } as unknown as HttpClient);
    await expect(api.getSite()).rejects.toThrow('documento CMS válido');
    await expect(api.getPage('inicio')).rejects.toThrow('documento CMS válido');
    await expect(api.getPagesCatalog()).rejects.toThrow('catálogo CMS válido');
  });
});
