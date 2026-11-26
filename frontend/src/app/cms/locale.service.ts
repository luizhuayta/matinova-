import { PlatformLocation } from '@angular/common';
import { Injectable, Optional, signal } from '@angular/core';

export type CmsLocale = 'es' | 'en';

export const CMS_LOCALES: { id: CmsLocale; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

export const LOCALE_STORAGE_KEY = 'cms-locale';

/**
 * Signal reactivo sincronizado con el idioma activo de la URL, útil para helpers
 * puros (como `client-panels.ts`) invocados desde `computed()` sin DI directa.
 */
export const activeCmsLocale = signal<CmsLocale>('es');

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<CmsLocale>('es');

  constructor(@Optional() platformLocation?: PlatformLocation) {
    // La URL es la única fuente de verdad del idioma activo (consistente en SSR e hidratación).
    // Nunca inicializar `locale` desde localStorage ni navigator.language.
    const initialPath =
      platformLocation?.pathname
      ?? (typeof window !== 'undefined' && typeof window.location?.pathname === 'string'
        ? window.location.pathname
        : undefined);
    if (initialPath) {
      const initial = this.parseUrl(initialPath).locale;
      this.locale.set(initial);
      activeCmsLocale.set(initial);
    }
  }

  /**
   * Lee la preferencia guardada en localStorage o, en su defecto, el idioma del navegador.
   * No muta `locale`: solo se usa para la redirección inicial en la primera visita a '/'.
   */
  preferredLocale(): CmsLocale {
    const saved = this.readSavedPreference();
    if (saved) {
      return saved;
    }
    if (typeof navigator !== 'undefined') {
      const browserLang = (navigator.language || navigator.languages?.[0] || '').trim().toLowerCase();
      if (browserLang === 'en' || browserLang.startsWith('en-') || browserLang.startsWith('en_')) {
        return 'en';
      }
    }
    return 'es';
  }

  readSavedPreference(): CmsLocale | null {
    try {
      if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
        return null;
      }
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      return saved === 'es' || saved === 'en' ? saved : null;
    } catch {
      return null;
    }
  }

  savePreference(locale: CmsLocale): void {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      }
    } catch {
      /* private mode / SSR */
    }
  }

  parseUrl(url: string): { locale: CmsLocale; path: string } {
    const clean = (url || '/').split(/[?#]/)[0] || '/';
    if (clean === '/en' || clean.startsWith('/en/')) {
      const rest = clean === '/en' ? '/' : clean.slice(3);
      return { locale: 'en', path: rest || '/' };
    }
    if (clean === '/es' || clean.startsWith('/es/')) {
      const rest = clean === '/es' ? '/' : clean.slice(3);
      return { locale: 'es', path: rest || '/' };
    }
    // Si la URL no tiene prefijo de idioma, español es siempre la fuente de verdad
    return { locale: 'es', path: clean || '/' };
  }

  /** Sincroniza el signal `locale` exclusivamente a partir de la URL (sin tocar localStorage). */
  setFromUrl(url: string): CmsLocale {
    const parsed = this.parseUrl(url);
    this.locale.set(parsed.locale);
    activeCmsLocale.set(parsed.locale);
    return parsed.locale;
  }

  prefix(path: string, locale: CmsLocale = this.locale()): string {
    const raw = (path || '').trim();
    const match = /^([^?#]*)(.*)$/.exec(raw);
    const pathname = match ? match[1] : raw;
    const suffix = match ? match[2] : '';
    const normalized = !pathname || pathname === '' ? '/' : pathname.startsWith('/') ? pathname : `/${pathname}`;
    if (locale === 'es') {
      return `${normalized}${suffix}`;
    }
    return normalized === '/' ? `/en${suffix}` : `/en${normalized}${suffix}`;
  }

  /**
   * Calcula la URL equivalente en el idioma destino preservando query string y hash.
   * No muta `locale` prematuramente: la navegación de Router es quien actualiza `locale`.
   */
  switchPath(url: string, next: CmsLocale): string {
    const raw = url || '/';
    const suffixMatch = /[?#].*$/.exec(raw);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const parsed = this.parseUrl(raw);
    return this.prefix(`${parsed.path}${suffix}`, next);
  }

  hrefFor(path: string): string {
    const value = (path || '').trim();
    if (!value) {
      return this.prefix('/');
    }
    if (value.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(value)) {
      return value;
    }
    if (value === '/en' || value.startsWith('/en/') || value.startsWith('/en?') || value.startsWith('/en#')) {
      return value;
    }
    if (value === '/es' || value.startsWith('/es/') || value.startsWith('/es?') || value.startsWith('/es#')) {
      const suffixMatch = /[?#].*$/.exec(value);
      const suffix = suffixMatch ? suffixMatch[0] : '';
      return this.prefix(`${this.parseUrl(value).path}${suffix}`);
    }
    return this.prefix(value);
  }
}
