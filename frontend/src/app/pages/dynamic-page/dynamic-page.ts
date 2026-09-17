import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsPageBlocks } from '../../cms/blocks/cms-page-blocks';
import { CmsApiService } from '../../cms/cms-api.service';
import { LocaleService } from '../../cms/locale.service';
import { slugFromRoute } from '../../cms/cms.models';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [CmsPageBlocks],
  template: `
    @if (missing()) {
      <section class="missing">
        <h1>Página no encontrada</h1>
        <p>Esa ruta no existe o todavía no se publicó.</p>
      </section>
    } @else {
      <app-cms-page-blocks [slug]="slug()" />
    }
  `,
  styles: [`
    .missing {
      min-height: 50vh;
      display: grid;
      place-content: center;
      text-align: center;
      padding: 4rem 1rem;
    }
  `],
})
export class DynamicPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cms = inject(CmsContentService);
  private api = inject(CmsApiService);
  private locales = inject(LocaleService);
  readonly slugInput = input('', { alias: 'slug' });
  slug = signal('');
  missing = computed(() => {
    const value = this.slug();
    if (!value || !this.cms.loaded()) {
      return false;
    }
    return !this.cms.pages()[value];
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => void this.syncSlug());
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
    }
    if (next && next !== this.slug()) {
      this.slug.set(next);
      this.cms.useSlug(next);
    }
    if (next && this.cms.loaded() && !this.cms.pages()[next]) {
      const redirect = await this.api.lookupRedirect(parsed.path).catch(() => null);
      if (redirect?.to) {
        await this.router.navigateByUrl(this.locales.prefix(redirect.to, parsed.locale));
      }
    }
  }
}
