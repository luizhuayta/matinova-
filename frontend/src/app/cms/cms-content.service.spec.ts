// @vitest-environment jsdom
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { CmsApiService } from './cms-api.service';
import { CmsContentService } from './cms-content.service';
import { CmsHistoryService } from './cms-history.service';
import { CmsDocResponse } from './cms.models';
import { LocaleService } from './locale.service';
import { pageBlocks } from './block-registry';

const INICIO_DOC = {
  sections: [
    { type: 'hero', hidden: false },
    { type: 'about', hidden: false },
  ],
  slides: [{ title: 'Hola', badge: '', image: '' }],
  contactCards: [{ title: 'Card', text: '' }],
  testimonials: { items: [{ text: 'Bien', client: 'Ana' }] },
  services: { cards: [{ title: 'SaaS', img: '', alt: '' }] },
  heroCta: 'Ver más',
};

function makeCms(http: { put?: () => Observable<unknown> } = {}): CmsContentService {
  const cms = new CmsContentService(new CmsApiService(http as never), new CmsHistoryService());
  cms.useSlug('inicio');
  cms.replaceContent({ ...INICIO_DOC });
  return cms;
}

describe('CmsContentService', () => {
  it('deshace y rehace un cambio de texto', () => {
    const cms = makeCms();
    cms.set('blocks.0.props.cta', 'Contactar');
    expect(cms.get('blocks.0.props.cta')).toBe('Contactar');
    expect(cms.canUndo()).toBe(true);
    cms.undo();
    expect(cms.get('blocks.0.props.cta')).toBe('Ver más');
    expect(cms.canRedo()).toBe(true);
    cms.redo();
    expect(cms.get('blocks.0.props.cta')).toBe('Contactar');
  });

  it('no deja ocultar todas las secciones de inicio', () => {
    const cms = makeCms();
    const blocks = pageBlocks(cms.activeContent());
    expect(blocks.length).toBeGreaterThan(1);
    cms.set('blocks.0.hidden', true);
    cms.set('blocks.1.hidden', true);
    expect(cms.get('blocks.1.hidden')).toBe(false);
    expect(cms.conflict()).toBe('Deja al menos una parte de la página visible.');
  });

  it('enumera cambios pendientes en español', () => {
    const cms = makeCms();
    cms.set('blocks.0.props.cta', 'Ir');
    cms.set('blocks.0.props.slides.0.title', 'Nuevo');
    const lines = cms.changeLines().map((row) => row.text);
    expect(lines.some((line) => line.toLowerCase().includes('botón'))).toBe(true);
    expect(lines).toContain('Cambiaste el titular de la portada');
  });

  it('quita un ítem con toast y lo restaura con undoRemove', () => {
    const cms = makeCms();
    cms.removeListItem('blocks.0.props.slides', 0);
    expect((cms.get<unknown[]>('blocks.0.props.slides') ?? []).length).toBe(0);

    const withTwo = makeCms();
    withTwo.set('blocks.0.props.slides', [
      { title: 'Uno', badge: '', image: '' },
      { title: 'Dos', badge: '', image: '' },
    ]);
    withTwo.removeListItem('blocks.0.props.slides', 1);
    expect((withTwo.get<unknown[]>('blocks.0.props.slides') ?? []).map((item) => (item as { title: string }).title)).toEqual(['Uno']);
    expect(withTwo.removeToast()).toBe('Eliminado — Deshacer');
    withTwo.undoRemove();
    expect((withTwo.get<unknown[]>('blocks.0.props.slides') ?? []).map((item) => (item as { title: string }).title)).toEqual([
      'Uno',
      'Dos',
    ]);
    expect(withTwo.removeToast()).toBe('');
  });

  it('marca conflicto 409 al guardar', async () => {
    const cms = makeCms({
      put: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              statusText: 'Conflict',
              error: { message: 'Alguien guardó esta página antes. Recarga para no pisar cambios.' },
            })
        ),
    });
    await expect(cms.save()).rejects.toBeTruthy();
    expect(cms.conflict()).toBe('Alguien guardó esta página antes. Recarga para no pisar cambios.');
  });

  it('añade un bloque de clientes y migra opiniones', () => {
    const cms = makeCms();
    cms.addBlock('clients');
    expect(pageBlocks(cms.activeContent()).some((item) => item.type === 'clients')).toBe(true);

    const fromOpinions = makeCms();
    fromOpinions.addBlock('testimonials');
    fromOpinions.migrateTestimonialsToClients();
    const after = pageBlocks(fromOpinions.activeContent()).map((item) => item.type);
    expect(after).toContain('testimonials');
    expect(after.filter((type) => type === 'clients').length).toBe(1);
  });

  it('expone el campo que falló en un 400', async () => {
    const cms = makeCms({
      put: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              statusText: 'Bad Request',
              error: { field: 'about.imageAlt', message: 'Describe la imagen o márcala como decorativa.' },
            })
        ),
    });
    await expect(cms.save()).rejects.toBeTruthy();
    expect(cms.fieldError()).toEqual({
      path: 'about.imageAlt',
      message: 'Describe la imagen o márcala como decorativa.',
    });
    expect(cms.conflict()).toBe('Describe la imagen o márcala como decorativa.');
  });
});

describe('borrador local del editor', () => {
  const editors: CmsContentService[] = [];

  afterEach(() => {
    editors.splice(0).forEach((cms) => cms.stopEditingSession());
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  function fixture() {
    const auth = { username: signal('admin'), sessionExpired: signal(false) };
    const locales = new LocaleService();
    locales.locale.set('es');
    const serverDoc = { content: INICIO_DOC, version: 3 };
    const api = {
      getSite: vi.fn().mockResolvedValue({ content: { name: 'Matt' }, version: 2 }),
      getPagesCatalog: vi.fn().mockResolvedValue({ pages: [{ slug: 'inicio' }, { slug: 'contacto' }], menu: [] }),
      getPage: vi.fn().mockResolvedValue(serverDoc),
      save: vi.fn().mockResolvedValue({ ...serverDoc, version: 4 }),
      publish: vi.fn().mockResolvedValue({ ...serverDoc, version: 5 }),
    };
    async function openEditor() {
      const cms = new CmsContentService(api as unknown as CmsApiService, new CmsHistoryService(), locales, auth as unknown as AuthService);
      editors.push(cms);
      cms.startEditingSession();
      await cms.loadAll();
      return cms;
    }
    return { api, auth, locales, openEditor };
  }

  it('conserva el autoguardado que devuelve 401 y lo recupera al volver a entrar', async () => {
    vi.useFakeTimers();
    const { api, auth, openEditor } = fixture();
    api.save.mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }));
    const cms = await openEditor();
    cms.set('blocks.0.props.cta', 'Borrador recuperable');
    await vi.advanceTimersByTimeAsync(2000);

    expect(auth.sessionExpired()).toBe(true);
    expect(cms.dirty()).toBe(true);
    expect(cms.conflict()).toContain('Sesión expirada');
    cms.stopEditingSession();

    auth.sessionExpired.set(false);
    const reopened = await openEditor();
    expect(reopened.get('blocks.0.props.cta')).toBe('Borrador recuperable');
    expect(reopened.dirty()).toBe(true);
    await reopened.save();
    expect(api.save).toHaveBeenLastCalledWith('inicio', expect.objectContaining({
      blocks: expect.arrayContaining([expect.objectContaining({ props: expect.objectContaining({ cta: 'Borrador recuperable' }) })]),
    }), 3);
    expect(reopened.dirty()).toBe(false);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('mantiene borradores separados por usuario, locale y slug durante recargas', async () => {
    const { api, auth, locales, openEditor } = fixture();
    const cms = await openEditor();
    cms.set('blocks.0.props.cta', 'Borrador ES');
    cms.useSlug('contacto');
    expect(cms.dirty()).toBe(false);
    locales.locale.set('en');
    await cms.loadAll();
    cms.useSlug('inicio');
    expect(cms.get('blocks.0.props.cta')).toBe('Ver más');
    cms.set('blocks.0.props.cta', 'Borrador EN');

    locales.locale.set('es');
    await cms.loadAll();
    expect(cms.get('blocks.0.props.cta')).toBe('Borrador ES');
    expect(cms.dirty()).toBe(true);
    expect(api.getPagesCatalog).toHaveBeenLastCalledWith(true);
    expect(api.getPage).toHaveBeenCalledWith('inicio', '', true);

    cms.stopEditingSession();
    auth.username.set('editor');
    const other = await openEditor();
    expect(other.get('blocks.0.props.cta')).toBe('Ver más');
    expect(other.dirty()).toBe(false);
  });

  it('conserva un borrador en conflicto hasta un descarte explícito', async () => {
    const { api, openEditor } = fixture();
    const cms = await openEditor();
    cms.set('blocks.0.props.cta', 'Versión local');
    api.getPage.mockResolvedValue({ content: INICIO_DOC, version: 5 });
    await cms.reloadSlug('inicio');
    expect(cms.get('blocks.0.props.cta')).toBe('Versión local');
    expect(cms.conflict()).toContain('versión más reciente');
    await expect(cms.save()).rejects.toMatchObject({ status: 409 });
    expect(api.save).not.toHaveBeenCalled();

    await cms.reloadSlug('inicio', true);
    expect(cms.get('blocks.0.props.cta')).toBe('Ver más');
    expect(cms.dirty()).toBe(false);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('mantiene lo escrito mientras responde el guardado y lo guarda con la nueva versión', async () => {
    const { api, openEditor } = fixture();
    const cms = await openEditor();
    let finish!: (doc: CmsDocResponse) => void;
    api.save.mockImplementationOnce(() => new Promise<CmsDocResponse>((resolve) => { finish = resolve; }));
    cms.set('blocks.0.props.cta', 'Primer cambio');
    const saving = cms.save();
    cms.set('blocks.0.props.cta', 'Cambio durante el guardado');
    finish({ content: INICIO_DOC, version: 4 });
    await saving;

    expect(cms.get('blocks.0.props.cta')).toBe('Cambio durante el guardado');
    expect(cms.dirty()).toBe(true);
    await cms.save();
    expect(api.save).toHaveBeenLastCalledWith('inicio', expect.any(Object), 4);
    expect(cms.dirty()).toBe(false);
  });

  it('guarda el cambio pendiente antes de publicar y usa la versión nueva', async () => {
    const { api, openEditor } = fixture();
    const cms = await openEditor();
    cms.set('blocks.0.props.cta', 'Publicar este cambio');
    await cms.publish();
    expect(api.save).toHaveBeenCalledWith('inicio', expect.any(Object), 3);
    expect(api.publish).toHaveBeenCalledWith('inicio', 4);
    expect(cms.dirty()).toBe(false);
    expect(cms.hasDraft()['inicio']).toBe(false);
  });

  it('autoguarda los cambios de la apariencia por separado desde otra página', async () => {
    vi.useFakeTimers();
    const { api, openEditor } = fixture();
    const cms = await openEditor();
    api.save.mockResolvedValueOnce({ content: { logo: '/nuevo.webp' }, version: 3 });
    cms.set('logo', '/nuevo.webp', 'site');
    await vi.advanceTimersByTimeAsync(2000);

    expect(api.save).toHaveBeenCalledExactlyOnceWith('sitio', expect.objectContaining({ name: 'Matt', logo: '/nuevo.webp' }), 2);
    expect(cms.currentSlug()).toBe('inicio');
    expect(cms.versions()['inicio']).toBe(3);
    expect(cms.site()['logo']).toBe('/nuevo.webp');
    expect(window.sessionStorage.length).toBe(0);
  });

  it('espera la carga del idioma antes de permitir un autoguardado', async () => {
    vi.useFakeTimers();
    const { api, locales, openEditor } = fixture();
    const cms = await openEditor();
    cms.set('blocks.0.props.cta', 'Borrador ES');
    locales.locale.set('en');
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.save).not.toHaveBeenCalled();

    await cms.loadAll();
    expect(cms.get('blocks.0.props.cta')).toBe('Ver más');
    expect(cms.dirty()).toBe(false);
  });
});
