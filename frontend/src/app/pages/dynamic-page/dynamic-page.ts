import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsPageBlocks } from '../../cms/blocks/cms-page-blocks';
import { CmsApiService } from '../../cms/cms-api.service';
import { LocaleService } from '../../cms/locale.service';
import { slugFromRoute } from '../../cms/cms.models';
import { PublicButton } from '../../components/public/public-button';

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
        <h1>Página no encontrada</h1>
        <p>Esa ruta no existe o todavía no se publicó.</p>
        <div>
          <a publicBtn [routerLink]="homePath()">Ir al inicio</a>
          <a publicBtn tone="ghost" [routerLink]="contactPath()">Contacto</a>
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
  readonly slugInput = input('', { alias: 'slug' });
  slug = signal<string | null>(null);
  readonly loadError = this.cms.publicLoadError;
  readonly loading = computed(() => this.cms.loadingSlug() !== null);
  readonly isEnglish = computed(() => this.locales.locale() === 'en');

  retry(): void {
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
    this.route.paramMap.subscribe(() => void this.syncSlug());
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => void this.syncSlug());
    void this.syncSlug();
  }

  private async syncSlug(): Promise<void> {
    const snapshot = this.route.snapshot;
    const url = this.router.url.split('?')[0];
    const parsed = this.locales.parseUrl(url);
    this.locales.locale.set(parsed.locale);
    const suffix = snapshot.paramMap.get('suffix');
    const next = String(
      snapshot.data['slug']
      || (suffix ? `servicios-${suffix}` : '')
      || slugFromRoute(parsed.path)
      || snapshot.paramMap.get('slug')
      || this.slugInput()
      || ''
    );
    if (!next) {
      const redirect = await this.api.lookupRedirect(parsed.path).catch(() => null);
      if (redirect?.to) {
        await this.router.navigateByUrl(this.locales.prefix(redirect.to, parsed.locale));
        return;
      }
      this.slug.set(parsed.path || '__missing__');
      return;
    }
    if (next !== this.slug()) {
      this.slug.set(next);
      this.cms.useSlug(next);
    }
    await this.cms.loadPublic(next);
    if (this.cms.publicLoadError()) {
      return;
    }
    if (!this.cms.pages()[next]) {
      const redirect = await this.api.lookupRedirect(parsed.path).catch(() => null);
      if (redirect?.to) {
        await this.router.navigateByUrl(this.locales.prefix(redirect.to, parsed.locale));
      }
    }
  }
}
