import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsPageBlocks } from '../../cms/blocks/cms-page-blocks';
import { CmsApiService } from '../../cms/cms-api.service';
import { CmsLocale, LocaleService } from '../../cms/locale.service';
import { slugFromRoute } from '../../cms/cms.models';
import { PublicButton } from '../../components/public/public-button';

const SLUG_PATH_RE = /^\/([a-z0-9-]+)$/;

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [CmsPageBlocks, RouterLink, PublicButton],
  template: `
    @if (loadError()) {
      <section class="missing-page" role="alert">
        <h1>{{ isEnglish() ? 'Content unavailable' : 'Contenido no disponible' }}</h1>
        <p>{{ loadError() }}</p>
        <button publicBtn type="button" (click)="retry()" [disabled]="loading()">
          {{ isEnglish() ? 'Try again' : 'Reintentar' }}
        </button>
      </section>
    } @else if (loading()) {
      <section class="missing-page" role="status" aria-live="polite">
        <p>{{ isEnglish() ? 'Loading content…' : 'Cargando contenido…' }}</p>
      </section>
    } @else if (missing()) {
      <section class="missing-page">
        <h1>{{ isEnglish() ? 'Page not found' : 'Página no encontrada' }}</h1>
        <p>{{ isEnglish() ? 'This route does not exist or has not been published yet.' : 'Esa ruta no existe o todavía no se publicó.' }}</p>
        <div>
          <a publicBtn [routerLink]="homePath()">{{ isEnglish() ? 'Go to home' : 'Ir al inicio' }}</a>
          <a publicBtn tone="ghost" [routerLink]="contactPath()">{{ isEnglish() ? 'Contact' : 'Contacto' }}</a>
        </div>
      </section>
    } @else {
      <app-cms-page-blocks [slug]="slug() || ''" />
    }
  `,
})
export class DynamicPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cms = inject(CmsContentService);
  private api = inject(CmsApiService);
  private locales = inject(LocaleService);
  private destroyRef = inject(DestroyRef);
  readonly slugInput = input('', { alias: 'slug' });
  slug = signal<string | null>(null);
  readonly loadError = this.cms.publicLoadError;
  readonly loading = computed(() => this.cms.loadingSlug() !== null);
  readonly isEnglish = computed(() => this.locales.locale() === 'en');

  private destroyed = false;
  private lastSyncedKey = '';

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }

  retry(): void {
    this.lastSyncedKey = '';
    void this.cms.loadPublic(this.slug() || 'inicio');
  }

  missing = computed(() => {
    const value = this.slug();
    if (value === null || !this.cms.loaded() || this.cms.loadingSlug() === value) {
      return false;
    }
    return !this.cms.pages()[value];
  });

  homePath(): string {
    return this.locales.hrefFor('/');
  }

  contactPath(): string {
    return this.locales.hrefFor('/contacto');
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => void this.syncSlug(this.router.url));
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => void this.syncSlug(event.urlAfterRedirects));
  }

  private async syncSlug(rawUrl: string): Promise<void> {
    if (this.destroyed) {
      return;
    }
    const url = (rawUrl || '/').split(/[?#]/)[0] || '/';
    // Nunca interferir con rutas del panel de administración
    if (url === '/admin' || url.startsWith('/admin/')) {
      return;
    }
    const snapshot = this.route.snapshot;
    const parsed = this.locales.parseUrl(url);
    const routeLocale = snapshot.data['locale'] as CmsLocale | undefined;
    // Durante la activación previa a NavigationEnd, router.url puede conservar la URL anterior;
    // esperar a NavigationEnd para evitar recargar el idioma viejo.
    if (routeLocale && routeLocale !== parsed.locale) {
      return;
    }
    this.locales.setFromUrl(url);
    const suffix = snapshot.paramMap.get('suffix');
    let next = String(
      snapshot.data['slug']
      || (suffix ? `servicios-${suffix}` : '')
      || slugFromRoute(parsed.path)
      || snapshot.paramMap.get('slug')
      || this.slugInput()
      || ''
    );
    const syncKey = `${parsed.locale}:${next || parsed.path}`;
    if (syncKey === this.lastSyncedKey && (!next || this.cms.pages()[next])) {
      return;
    }
    this.lastSyncedKey = syncKey;

    if (!next) {
      // Asegurar shell+catálogo cargados antes de resolver páginas personalizadas o 404
      if (!this.cms.loaded()) {
        await this.cms.loadPublic('sitio');
        if (this.destroyed || this.cms.publicLoadError()) {
          this.lastSyncedKey = '';
          return;
        }
        next = String(slugFromRoute(parsed.path) || '');
      }
      // Si la página personalizada aún no figura en el catálogo del locale actual
      // (p. ej. creada solo en ES y visitada en /en/<slug>, o creada durante la sesión),
      // comprobar directamente en la API diferenciando 404 real de errores de red.
      if (!next) {
        const match = SLUG_PATH_RE.exec(parsed.path);
        const candidate = match?.[1] || '';
        if (candidate && candidate !== 'sitio') {
          try {
            await this.api.getPage(candidate);
            if (this.destroyed) {
              return;
            }
            next = candidate;
          } catch (err) {
            if (this.destroyed) {
              return;
            }
            if (!(err instanceof HttpErrorResponse && err.status === 404)) {
              next = candidate;
            }
          }
        }
      }
      if (!next) {
        const redirect = await this.api.lookupRedirect(parsed.path).catch(() => null);
        if (this.destroyed) {
          return;
        }
        if (redirect?.to) {
          await this.router.navigateByUrl(this.locales.prefix(redirect.to, parsed.locale));
          return;
        }
        this.slug.set(parsed.path || '__missing__');
        return;
      }
    }
    this.lastSyncedKey = `${parsed.locale}:${next}`;
    if (next !== this.slug()) {
      this.slug.set(next);
      this.cms.useSlug(next);
    }
    await this.cms.loadPublic(next);
    if (this.destroyed || this.cms.publicLoadError()) {
      if (this.cms.publicLoadError()) {
        this.lastSyncedKey = '';
      }
      return;
    }
    if (this.cms.currentSlug() !== next) {
      this.cms.useSlug(next);
    }
    if (!this.cms.pages()[next]) {
      const redirect = await this.api.lookupRedirect(parsed.path).catch(() => null);
      if (this.destroyed) {
        return;
      }
      if (redirect?.to) {
        await this.router.navigateByUrl(this.locales.prefix(redirect.to, parsed.locale));
      }
    }
  }
}
