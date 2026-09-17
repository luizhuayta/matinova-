import { describe, expect, it } from 'vitest';
import { LocaleService } from './locale.service';

describe('LocaleService', () => {
  it('parsea /en y /es y deja el resto en español', () => {
    const locales = new LocaleService();
    expect(locales.parseUrl('/en/contacto')).toEqual({ locale: 'en', path: '/contacto' });
    expect(locales.parseUrl('/es/servicios')).toEqual({ locale: 'es', path: '/servicios' });
    expect(locales.parseUrl('/acerca-de')).toEqual({ locale: 'es', path: '/acerca-de' });
  });

  it('prefija rutas en inglés', () => {
    const locales = new LocaleService();
    expect(locales.prefix('/', 'en')).toBe('/en');
    expect(locales.prefix('/contacto', 'en')).toBe('/en/contacto');
    expect(locales.prefix('/contacto', 'es')).toBe('/contacto');
  });
});
