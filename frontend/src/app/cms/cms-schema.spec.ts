import { describe, expect, it } from 'vitest';
import { changedPaths, getByPath, setByPath, slugFromRoute, SLUG_PATHS } from './cms.models';
import {
  CMS_SCHEMA_VERSION,
  altPathForImage,
  humanChangeLine,
  inspectorRootSchema,
  migrateCmsDocument,
  minListLength,
  schemaForSlug,
} from './cms-schema';

describe('migrateCmsDocument', () => {
  it('añade seo y schemaVersion sin perder el título viejo', () => {
    const migrated = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    expect(migrated['schemaVersion']).toBe(CMS_SCHEMA_VERSION);
    expect((migrated['seo'] as { title: string }).title).toBe('Inicio');
    const sections = migrated['sections'] as Array<{ type: string }>;
    expect(sections.map((item) => item.type)).toContain('hero');
    expect(sections).toHaveLength(6);
    expect(migrated['decorativeImagePaths']).toEqual([]);
  });

  it('es idempotente si el documento ya está al día', () => {
    const once = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    const twice = migrateCmsDocument(once, 'inicio');
    expect(twice).toEqual(once);
  });

  it('no inventa schema para contacto', () => {
    expect(schemaForSlug('contacto')).toBeNull();
  });
});

describe('getByPath / setByPath', () => {
  it('lee y escribe rutas anidadas con índices', () => {
    const doc = { slides: [{ title: 'A' }], about: { title: 'Nosotros' } };
    expect(getByPath(doc, 'slides.0.title')).toBe('A');
    expect(getByPath(doc, 'about.title')).toBe('Nosotros');
    const next = setByPath(doc, 'slides.0.title', 'B');
    expect(getByPath(next, 'slides.0.title')).toBe('B');
    expect(getByPath(doc, 'slides.0.title')).toBe('A');
  });
});

describe('changedPaths', () => {
  it('lista hojas distintas y no el padre entero', () => {
    const before = { heroCta: 'Ver', about: { title: 'A', text: 'x' } };
    const after = { heroCta: 'Ir', about: { title: 'A', text: 'y' } };
    expect(changedPaths(before, after).sort()).toEqual(['about.text', 'heroCta']);
  });
});

describe('humanChangeLine', () => {
  it('usa frases fijas para portada y opiniones', () => {
    expect(humanChangeLine('inicio', 'slides.0.title')).toBe('Cambiaste el titular de la portada');
    expect(humanChangeLine('inicio', 'slides.2.image')).toBe('Cambiaste una foto de la portada');
    expect(humanChangeLine('inicio', 'testimonials.items.0.text')).toBe('Cambiaste una opinión');
    expect(humanChangeLine('inicio', 'testimonials.items.0.client')).toBe('Cambiaste datos de una opinión');
  });

  it('cae al label del schema en minúsculas', () => {
    expect(humanChangeLine('inicio', 'heroCta')).toBe('Cambiaste botón del banner');
  });
});

describe('minListLength / altPathForImage', () => {
  it('exige al menos un ítem en listas de inicio', () => {
    expect(minListLength('inicio', 'slides')).toBe(1);
    expect(minListLength('inicio', 'contactCards')).toBe(1);
    expect(minListLength('inicio', 'testimonials.items')).toBe(1);
    expect(minListLength('inicio', 'services.cards')).toBe(1);
    expect(minListLength('inicio', 'navServices')).toBe(0);
    expect(minListLength('sitio', 'navServices')).toBe(0);
  });

  it('deriva la ruta de alt según la convención de imagen', () => {
    expect(altPathForImage('logo')).toBe('logoAlt');
    expect(altPathForImage('about.image')).toBe('about.imageAlt');
    expect(altPathForImage('services.cards.0.img')).toBe('services.cards.0.alt');
    expect(altPathForImage('heroCta')).toBeNull();
  });
});

describe('inspectorRootSchema', () => {
  it('ordena bloques de inicio según sections', () => {
    const schema = inspectorRootSchema('inicio', {
      sections: [{ type: 'testimonials' }, { type: 'hero' }],
    });
    expect(schema?.map((field) => field.path).slice(0, 4)).toEqual([
      'sections',
      'testimonials',
      'slides',
      'heroCta',
    ]);
  });
});

describe('SLUG_PATHS / slugFromRoute', () => {
  it('son inversos para las páginas públicas', () => {
    for (const [slug, path] of Object.entries(SLUG_PATHS)) {
      if (slug === 'sitio') {
        continue;
      }
      expect(slugFromRoute(path)).toBe(slug);
    }
  });
});
