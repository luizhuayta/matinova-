import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformLocation } from '@angular/common';
import { LOCALE_STORAGE_KEY, LocaleService } from './locale.service';

function stubBrowserGlobals(opts: {
  pathname?: string;
  language?: string;
  languages?: string[];
  storage?: Record<string, string>;
}) {
  const store = new Map<string, string>(Object.entries(opts.storage ?? {}));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  });
  vi.stubGlobal('navigator', {
    language: opts.language ?? 'es-PE',
    languages: opts.languages ?? [opts.language ?? 'es-PE'],
  });
  vi.stubGlobal('window', {
    location: { pathname: opts.pathname ?? '/' },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LocaleService', () => {
  it('parsea /en y /es exactos y deja rutas sin prefijo o parecidas en español', () => {
    const locales = new LocaleService();
    expect(locales.parseUrl('/en')).toEqual({ locale: 'en', path: '/' });
    expect(locales.parseUrl('/en/')).toEqual({ locale: 'en', path: '/' });
    expect(locales.parseUrl('/en/contacto')).toEqual({ locale: 'en', path: '/contacto' });
    expect(locales.parseUrl('/en/servicios?tab=1#top')).toEqual({ locale: 'en', path: '/servicios' });
    expect(locales.parseUrl('/en#contacto')).toEqual({ locale: 'en', path: '/' });
    expect(locales.parseUrl('/es')).toEqual({ locale: 'es', path: '/' });
    expect(locales.parseUrl('/es/servicios')).toEqual({ locale: 'es', path: '/servicios' });
    expect(locales.parseUrl('/acerca-de')).toEqual({ locale: 'es', path: '/acerca-de' });
    expect(locales.parseUrl('/esto')).toEqual({ locale: 'es', path: '/esto' });
    expect(locales.parseUrl('/english')).toEqual({ locale: 'es', path: '/english' });
    expect(locales.parseUrl('/energia/solar')).toEqual({ locale: 'es', path: '/energia/solar' });
  });

  it('usa la URL como única fuente de verdad al inicializar, ignorando localStorage y navigator.language', () => {
    stubBrowserGlobals({
      pathname: '/servicios',
      language: 'en-US',
      storage: { [LOCALE_STORAGE_KEY]: 'en' },
    });
    const onEsUrl = new LocaleService();
    expect(onEsUrl.locale()).toBe('es');
    expect(onEsUrl.preferredLocale()).toBe('en');

    stubBrowserGlobals({
      pathname: '/en/servicios',
      language: 'es-ES',
      storage: { [LOCALE_STORAGE_KEY]: 'es' },
    });
    const onEnUrl = new LocaleService();
    expect(onEnUrl.locale()).toBe('en');
    expect(onEnUrl.preferredLocale()).toBe('es');
  });

  it('inicializa el locale desde PlatformLocation en SSR sin depender de window ni localStorage', () => {
    const serverEn = new LocaleService({ pathname: '/en/contacto' } as unknown as PlatformLocation);
    expect(serverEn.locale()).toBe('en');

    const serverEs = new LocaleService({ pathname: '/contacto' } as unknown as PlatformLocation);
    expect(serverEs.locale()).toBe('es');
  });

  it('preferredLocale prioriza localStorage sobre navigator.language sin mutar el locale activo', () => {
    stubBrowserGlobals({ pathname: '/', language: 'en-US', storage: {} });
    const autoEn = new LocaleService();
    expect(autoEn.locale()).toBe('es');
    expect(autoEn.preferredLocale()).toBe('en');
    expect(autoEn.locale()).toBe('es');

    stubBrowserGlobals({ pathname: '/', language: 'en-US', storage: { [LOCALE_STORAGE_KEY]: 'es' } });
    const forcedEs = new LocaleService();
    expect(forcedEs.preferredLocale()).toBe('es');

    stubBrowserGlobals({ pathname: '/', language: 'es-ES', storage: { [LOCALE_STORAGE_KEY]: 'en' } });
    const forcedEn = new LocaleService();
    expect(forcedEn.preferredLocale()).toBe('en');
  });

  it('setFromUrl actualiza el signal sin sobrescribir localStorage', () => {
    const store = stubBrowserGlobals({
      pathname: '/en',
      language: 'en-US',
      storage: { [LOCALE_STORAGE_KEY]: 'en' },
    });
    const locales = new LocaleService();
    expect(locales.setFromUrl('/servicios')).toBe('es');
    expect(locales.locale()).toBe('es');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('prefija rutas en inglés preservando query string y hash', () => {
    const locales = new LocaleService();
    expect(locales.prefix('/', 'en')).toBe('/en');
    expect(locales.prefix('/?a=1', 'en')).toBe('/en?a=1');
    expect(locales.prefix('/contacto', 'en')).toBe('/en/contacto');
    expect(locales.prefix('/contacto?ref=nav#form', 'en')).toBe('/en/contacto?ref=nav#form');
    expect(locales.prefix('/contacto', 'es')).toBe('/contacto');
  });

  it('switchPath calcula la ruta destino sin mutar el locale antes de navegar', () => {
    const locales = new LocaleService();
    expect(locales.locale()).toBe('es');
    expect(locales.switchPath('/', 'en')).toBe('/en');
    expect(locales.switchPath('/clientes?category=empresas#top', 'en')).toBe('/en/clientes?category=empresas#top');
    expect(locales.switchPath('/en/clientes?category=empresas', 'es')).toBe('/clientes?category=empresas');
    expect(locales.switchPath('/es/servicios', 'es')).toBe('/servicios');
    expect(locales.switchPath('/en', 'es')).toBe('/');
    expect(locales.locale()).toBe('es');
  });

  it('hrefFor respeta anclas, URLs externas y prefija enlaces internos según el locale activo', () => {
    const locales = new LocaleService();
    locales.locale.set('en');
    expect(locales.hrefFor('/contacto')).toBe('/en/contacto');
    expect(locales.hrefFor('/es/contacto?x=1')).toBe('/en/contacto?x=1');
    expect(locales.hrefFor('/en/servicios')).toBe('/en/servicios');
    expect(locales.hrefFor('#faq')).toBe('#faq');
    expect(locales.hrefFor('https://example.com')).toBe('https://example.com');
    expect(locales.hrefFor('mailto:hola@matt.pe')).toBe('mailto:hola@matt.pe');
  });

  it('savePreference persiste la elección explícita en localStorage', () => {
    const store = stubBrowserGlobals({ pathname: '/', language: 'en-US', storage: {} });
    const locales = new LocaleService();
    locales.savePreference('es');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('es');
    expect(locales.preferredLocale()).toBe('es');
  });
});
