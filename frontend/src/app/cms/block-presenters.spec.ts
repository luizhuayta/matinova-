import { describe, expect, it } from 'vitest';
import { aboutVisual, contactCardHref, contactIconName, pictureSources, resolveHref, splitAccent } from './block-presenters';

describe('block-presenters', () => {
  it('resuelve rutas internas con el prefijo de locale', () => {
    expect(resolveHref('/contacto', (path) => `/en${path}`)).toBe('/en/contacto');
    expect(resolveHref('https://example.com', (path) => `/en${path}`)).toBe('https://example.com');
  });

  it('cambia la foto genérica de about por la ilustración', () => {
    expect(aboutVisual('about-image.jpg')).toBe('assets/illustrations/why-us.svg');
    expect(aboutVisual('equipo.webp')).toBe('equipo.webp');
  });

  it('arma mailto y wa.me desde tarjetas de contacto', () => {
    expect(contactCardHref({ title: 'WhatsApp', text: '992422219' }, '51992422219')).toBe('https://wa.me/51992422219');
    expect(contactCardHref({ title: 'Correo', text: 'a@b.com' })).toBe('mailto:a@b.com');
    expect(contactIconName('bi-envelope', 0)).toBe('mail');
  });

  it('arma srcset y sizes para fotos CMS', () => {
    const pic = pictureSources('/api/uploads/27dd730a948402a6.webp', 'hero');
    expect(pic.webp).toContain('480w');
    expect(pic.raster).toBe('/api/uploads/27dd730a948402a6.jpg');
    expect(pic.rasterSrcset).toContain('-960.jpg');
    expect(pic.sizes).toContain('50vw');
  });

  it('separa la palabra acentuada del título', () => {
    expect(splitAccent('Tecnología que impulsa el crecimiento', 'crecimiento')).toEqual([
      { text: 'Tecnología que impulsa el ', accent: false },
      { text: 'crecimiento', accent: true },
    ]);
    expect(splitAccent('Sin acento', 'crecimiento')).toEqual([{ text: 'Sin acento', accent: false }]);
    expect(splitAccent('', 'x')).toEqual([]);
  });
});
