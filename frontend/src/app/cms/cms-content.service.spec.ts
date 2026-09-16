// @vitest-environment jsdom
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CmsContentService } from './cms-content.service';

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
  const cms = new CmsContentService(http as never);
  cms.useSlug('inicio');
  cms.replaceContent({ ...INICIO_DOC });
  return cms;
}

describe('CmsContentService', () => {
  it('deshace y rehace un cambio de texto', () => {
    const cms = makeCms();
    cms.set('heroCta', 'Contactar');
    expect(cms.get('heroCta')).toBe('Contactar');
    expect(cms.canUndo()).toBe(true);
    cms.undo();
    expect(cms.get('heroCta')).toBe('Ver más');
    expect(cms.canRedo()).toBe(true);
    cms.redo();
    expect(cms.get('heroCta')).toBe('Contactar');
  });

  it('no deja ocultar todas las secciones de inicio', () => {
    const cms = makeCms();
    cms.set('sections.0.hidden', true);
    cms.set('sections.1.hidden', true);
    expect(cms.get('sections.1.hidden')).toBe(false);
    expect(cms.conflict()).toBe('Deja al menos una parte de la página visible.');
  });

  it('enumera cambios pendientes en español', () => {
    const cms = makeCms();
    cms.set('heroCta', 'Ir');
    cms.set('slides.0.title', 'Nuevo');
    const lines = cms.changeLines().map((row) => row.text);
    expect(lines).toContain('Cambiaste botón del banner');
    expect(lines).toContain('Cambiaste el titular de la portada');
  });

  it('quita un ítem con toast y lo restaura con undoRemove', () => {
    const cms = makeCms();
    cms.removeListItem('slides', 0);
    expect((cms.get<unknown[]>('slides') ?? []).length).toBe(1);
    expect(cms.conflict()).toBe('Debe quedar al menos un elemento.');

    const withTwo = makeCms();
    withTwo.replaceContent({
      ...INICIO_DOC,
      slides: [
        { title: 'Uno', badge: '', image: '' },
        { title: 'Dos', badge: '', image: '' },
      ],
    });
    withTwo.removeListItem('slides', 1);
    expect((withTwo.get<unknown[]>('slides') ?? []).map((item) => (item as { title: string }).title)).toEqual(['Uno']);
    expect(withTwo.removeToast()).toBe('Eliminado — Deshacer');
    withTwo.undoRemove();
    expect((withTwo.get<unknown[]>('slides') ?? []).map((item) => (item as { title: string }).title)).toEqual([
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
