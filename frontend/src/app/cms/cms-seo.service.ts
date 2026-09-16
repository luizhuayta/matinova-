import { Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { JsonMap, SLUG_PATHS } from './cms.models';

@Injectable({ providedIn: 'root' })
export class CmsSeoService {
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  private title = inject(Title);
  private meta = inject(Meta);
  private jsonLd?: HTMLScriptElement;

  constructor() {
    effect(() => {
      const slug = this.cms.currentSlug();
      this.cms.pages();
      this.cms.site();
      if (this.editor.editMode()) {
        return;
      }
      const page = slug === 'sitio' ? this.cms.site() : (this.cms.pages()[slug] ?? {});
      this.apply(slug, page, this.cms.site());
    });
  }

  private apply(slug: string, page: JsonMap, site: JsonMap): void {
    const seo = (page['seo'] as JsonMap | undefined) ?? {};
    const siteSeo = (site['seo'] as JsonMap | undefined) ?? {};
    const footer = (site['footer'] as JsonMap | undefined) ?? {};
    const title = String(
      seo['title'] || page['title'] || siteSeo['title'] || site['logoAlt'] || 'Matt Innova Solution'
    );
    const description = String(seo['description'] || siteSeo['description'] || footer['desc'] || '');
    const image = String(seo['image'] || siteSeo['image'] || site['logo'] || 'logo.svg');
    const path = SLUG_PATHS[slug] || '/';
    const origin = typeof location !== 'undefined' ? location.origin : '';
    const url = origin + path;
    const imageUrl = image.startsWith('http') ? image : `${origin}/${image.replace(/^\//, '')}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: String(site['logoAlt'] || 'Matt Innova Solution'),
        url: origin || undefined,
      },
    };
    if (typeof document === 'undefined') {
      return;
    }
    if (!this.jsonLd) {
      this.jsonLd = document.createElement('script');
      this.jsonLd.type = 'application/ld+json';
      this.jsonLd.id = 'cms-jsonld';
      document.head.appendChild(this.jsonLd);
    }
    this.jsonLd.textContent = JSON.stringify(data);
  }
}
