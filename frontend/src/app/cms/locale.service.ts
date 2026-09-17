import { Injectable, signal } from '@angular/core';

export type CmsLocale = 'es' | 'en';

export const CMS_LOCALES: { id: CmsLocale; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
];

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<CmsLocale>('es');

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
    return { locale: 'es', path: clean || '/' };
  }

  setFromUrl(url: string): CmsLocale {
    const parsed = this.parseUrl(url);
    this.locale.set(parsed.locale);
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
    return this.prefix(parsed.path, next);
  }
}
