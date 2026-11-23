import { Injectable, signal } from '@angular/core';

export type CmsLocale = 'es' | 'en';

export const CMS_LOCALES: { id: CmsLocale; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

const STORAGE_KEY = 'cms-locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<CmsLocale>('es');

  constructor() {
    this.loadSavedLocale();
  }

  private loadSavedLocale(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') {
      this.locale.set(saved);
    } else {
      // Si no hay preferencia guardada, detectar idioma del navegador
      const browserLang = navigator.language || navigator.languages?.[0] || '';
      if (browserLang.startsWith('en')) {
        this.locale.set('en');
      }
    }
  }

  private saveLocale(locale: CmsLocale): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  }

  parseUrl(url: string): { locale: CmsLocale; path: string } {
    const clean = url.split('?')[0];
    if (clean === '/en' || clean.startsWith('/en/')) {
      const rest = clean === '/en' ? '/' : clean.slice(3);
      return { locale: 'en', path: rest || '/' };
    }
    if (clean === '/es' || clean.startsWith('/es/')) {
      const rest = clean === '/es' ? '/' : clean.slice(3);
      return { locale: 'es', path: rest || '/' };
    }
    // Si la URL no tiene prefijo de idioma, usar español por defecto
    return { locale: 'es', path: clean || '/' };
  }

  setFromUrl(url: string): CmsLocale {
    const parsed = this.parseUrl(url);
    this.locale.set(parsed.locale);
    this.saveLocale(parsed.locale);
    return parsed.locale;
  }

  prefix(path: string, locale: CmsLocale = this.locale()): string {
    const normalized = !path || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`;
    if (locale === 'es') {
      return normalized;
    }
    return normalized === '/' ? '/en' : `/en${normalized}`;
  }

  switchPath(url: string, next: CmsLocale): string {
    const parsed = this.parseUrl(url);
    this.locale.set(next);
    this.saveLocale(next);
    return this.prefix(parsed.path, next);
  }

  hrefFor(path: string): string {
    const value = (path || '').trim();
    if (!value) {
      return this.prefix('/');
    }
    if (/^(https?:|mailto:|tel:)/i.test(value)) {
      return value;
    }
    if (value.startsWith('/en/') || value === '/en') {
      return value;
    }
    return this.prefix(value);
  }
}
