// @vitest-environment jsdom
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CmsApiService } from './cms-api.service';
import { CmsContentService } from './cms-content.service';
import { CmsHistoryService } from './cms-history.service';
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
