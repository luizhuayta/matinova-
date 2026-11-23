import { describe, expect, it } from 'vitest';
import { changedPaths, getByPath, setByPath, slugFromRoute, SLUG_PATHS, registerPageRoutes } from './cms.models';
import {
  CMS_SCHEMA_VERSION,
  DEFAULT_SPLASH_IMAGES,
  altPathForImage,
  humanChangeLine,
  inspectorRootSchema,
  migrateCmsDocument,
  minListLength,
  schemaForSlug,
} from './cms-schema';
import { blockHasBgImage, blockLayoutStyle, DEFAULT_BG_IMAGE, pageBlocks, templateBlocks } from './block-registry';

describe('migrateCmsDocument', () => {
  it('añade seo, schemaVersion y bloques en inicio', () => {
    const migrated = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    expect(migrated['schemaVersion']).toBe(CMS_SCHEMA_VERSION);
    expect((migrated['seo'] as { title: string }).title).toBe('Inicio');
    const blocks = pageBlocks(migrated);
    expect(blocks.map((item) => item.type)).toContain('hero');
    expect(blocks[0]?.layout?.width).toBe('full');
    expect(blocks[0]?.layout?.backgroundImage).toBe(DEFAULT_BG_IMAGE);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(migrated['decorativeImagePaths']).toEqual([]);
  });

  it('v6 pone el fondo por defecto en bloques sin imagen y respeta la propia', () => {
    const doc = {
      schemaVersion: 5,
      blocks: [
        { id: 'a', type: 'cta', hidden: false, layout: { width: 'full', padding: '', background: '', backgroundImage: '' }, props: {} },
        { id: 'b', type: 'cta', hidden: false, layout: { width: 'full', padding: '', background: '', backgroundImage: '/api/uploads/x.webp' }, props: {} },
      ],
    };
    const migrated = migrateCmsDocument(doc, 'inicio');
    expect(migrated['schemaVersion']).toBe(CMS_SCHEMA_VERSION);
    const blocks = pageBlocks(migrated);
    expect(blocks[0]?.layout?.backgroundImage).toBe(DEFAULT_BG_IMAGE);
    expect(blocks[1]?.layout?.backgroundImage).toBe('/api/uploads/x.webp');
  });

  it('es idempotente si el documento ya está al día', () => {
    const once = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    const twice = migrateCmsDocument(once, 'inicio');
    expect(twice['schemaVersion']).toBe(once['schemaVersion']);
    expect(pageBlocks(twice).map((item) => item.type)).toEqual(pageBlocks(once).map((item) => item.type));
  });

  it('usa el esquema de bloques en páginas que no son el sitio', () => {
    expect(schemaForSlug('acerca-de')?.some((field) => field.path === 'blocks')).toBe(true);
    expect(schemaForSlug('contacto')?.some((field) => field.path === 'blocks')).toBe(true);
    expect(schemaForSlug('sitio')).not.toBeNull();
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
    expect(humanChangeLine('inicio', 'blocks.0.props.slides.0.title')).toBe('Cambiaste el titular de la portada');
    expect(humanChangeLine('inicio', 'blocks.0.props.slides.2.image')).toBe('Cambiaste una foto de la portada');
    expect(humanChangeLine('inicio', 'slides.0.title')).toBe('Cambiaste el titular de la portada');
  });
});

describe('minListLength / altPathForImage', () => {
  it('ya no exige mínimos fijos de inicio fuera de bloques', () => {
    expect(minListLength('inicio', 'slides')).toBe(0);
    expect(minListLength('sitio', 'navServices')).toBe(0);
  });

  it('deriva la ruta de alt según la convención de imagen', () => {
    expect(altPathForImage('logo')).toBe('logoAlt');
    expect(altPathForImage('about.image')).toBe('about.imageAlt');
    expect(altPathForImage('services.cards.0.img')).toBe('services.cards.0.alt');
    expect(altPathForImage('heroCta')).toBeNull();
  });
});

describe('SITE_SCHEMA chatbot', () => {
  it('deja el modo IA fuera del inspector y no incluye la clave', () => {
    const schema = schemaForSlug('sitio') ?? [];
    const paths = schema.map((field) => field.path);
    expect(paths).toContain('showChatbot');
    expect(paths).not.toContain('chatbotMode');
    expect(paths).not.toContain('aiProvider');
    expect(paths.join(' ')).not.toMatch(/apiKey|aiKey/i);
    expect(paths).toContain('splashImages');
    expect(paths).toContain('splashLabel');
  });

  it('rellena splashImages si el sitio no las trae y respeta una lista vacía', () => {
    const filled = migrateCmsDocument({ schemaVersion: 5 }, 'sitio');
    expect(filled['splashImages']).toEqual(DEFAULT_SPLASH_IMAGES);
    expect(filled['splashLabel']).toBe('CARGANDO…');
    const empty = migrateCmsDocument({ schemaVersion: 5, splashImages: [] }, 'sitio');
    expect(empty['splashImages']).toEqual([]);
  });

  it('conserva chatbotMode ia al migrar el sitio', () => {
    const migrated = migrateCmsDocument({ chatbotMode: 'ia' }, 'sitio');
    expect(migrated['chatbotMode']).toBe('ia');
  });

  it('conserva chatbotMode clasico si ya venía en el documento', () => {
    const migrated = migrateCmsDocument({ chatbotMode: 'clasico' }, 'sitio');
    expect(migrated['chatbotMode']).toBe('clasico');
  });
});

describe('inspectorRootSchema', () => {
  it('muestra bloques y seo en páginas de contenido', () => {
    const schema = inspectorRootSchema('inicio', { blocks: [{ type: 'hero', props: {} }] });
    expect(schema?.map((field) => field.path)).toEqual(['blocks', 'seo']);
  });
});

describe('SLUG_PATHS / slugFromRoute', () => {
  it('son inversos para las páginas públicas', () => {
    registerPageRoutes([]);
    for (const [slug, path] of Object.entries(SLUG_PATHS)) {
      if (slug === 'sitio') {
        continue;
      }
      expect(slugFromRoute(path)).toBe(slug);
    }
  });

  it('registra rutas de páginas nuevas', () => {
    registerPageRoutes([{ slug: 'casos', title: 'Casos', path: '/casos' }]);
    expect(slugFromRoute('/casos')).toBe('casos');
  });

  it('conoce /clientes', () => {
    expect(SLUG_PATHS['clientes']).toBe('/clientes');
    expect(schemaForSlug('clientes')?.some((field) => field.path === 'blocks')).toBe(true);
    expect(templateBlocks('clients').map((item) => item.type)).toEqual(['listingHero', 'clients', 'cta']);
    expect(templateBlocks('clients')[1]?.props['layout']).toBe('paneles');
  });
});

describe('migración de páginas de servicio', () => {
  it('convierte hero y reasons en bloques', () => {
    const migrated = migrateCmsDocument(
      {
        title: 'Software',
        heroImage: '/software-banner.png',
        reasons: [{ title: 'ERP', text: 'Gestión' }],
      },
      'servicios-software'
    );
    expect(pageBlocks(migrated).map((item) => item.type)).toEqual(['serviceHero', 'reasons']);
  });
});

describe('blockLayoutStyle / blockHasBgImage', () => {
  it('pasa padding y color como antes', () => {
    const block = { id: 'x', type: 'cta', props: {}, layout: { padding: '2rem 0', background: '#123456' } };
    expect(blockHasBgImage(block)).toBe(false);
    expect(blockLayoutStyle(block)).toEqual({ padding: '2rem 0', background: '#123456' });
  });

  it('la imagen tapa el color y añade velo', () => {
    const block = {
      id: 'x',
      type: 'cta',
      props: {},
      layout: { background: '#123456', backgroundImage: '/api/uploads/abc123.webp' },
    };
    expect(blockHasBgImage(block)).toBe(true);
    const style = blockLayoutStyle(block);
    expect(style['backgroundImage']).toContain('url("/api/uploads/abc123.webp")');
    expect(style['backgroundImage']).toContain('linear-gradient');
    expect(style['backgroundSize']).toBe('cover');
    expect(style['backgroundColor']).toBe('#123456');
    expect(style['background']).toBeUndefined();
  });

  it('usa el token de fondo cuando el campo background trae otra capa', () => {
    const block = {
      id: 'x',
      type: 'cta',
      props: {},
      layout: { background: 'url(/x.png)', backgroundImage: '/bg.webp' },
    };
    expect(blockLayoutStyle(block)['backgroundColor']).toBe('var(--dt-bg)');
  });
});
