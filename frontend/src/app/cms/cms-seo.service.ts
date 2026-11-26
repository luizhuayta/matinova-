import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { JsonMap, pathForSlug } from './cms.models';
import { CmsLocale, LocaleService } from './locale.service';

@Injectable({ providedIn: 'root' })
export class CmsSeoService {
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  private locales = inject(LocaleService);
  private doc = inject(DOCUMENT);
  private title = inject(Title);
  private meta = inject(Meta);
  private jsonLd?: HTMLScriptElement;

  constructor() {
    effect(() => {
      const slug = this.cms.currentSlug();
      const locale = this.locales.locale();
      this.cms.pages();
      this.cms.site();
      if (this.editor.editMode()) {
        return;
      }
      const page = slug === 'sitio' ? this.cms.site() : (this.cms.pages()[slug] ?? {});
      this.apply(slug, page, this.cms.site(), locale);
    });
  }

  private apply(slug: string, page: JsonMap, site: JsonMap, locale: CmsLocale): void {
    const seo = (page['seo'] as JsonMap | undefined) ?? {};
    const siteSeo = (site['seo'] as JsonMap | undefined) ?? {};
    const footer = (site['footer'] as JsonMap | undefined) ?? {};
    const title = String(
      seo['title'] || page['title'] || siteSeo['title'] || site['logoAlt'] || 'Matt Innova Solution'
    );
    const defaultDesc =
      locale === 'en'
        ? '30 years implementing software, hardware and IT operations for companies and schools in Peru.'
        : '30 años implementando software, hardware y operación TI para empresas y entidades educativas en Perú.';
    const description = String(seo['description'] || siteSeo['description'] || footer['desc'] || defaultDesc);
    const image = String(seo['image'] || siteSeo['image'] || site['logo'] || 'logo.svg');
    const path = this.locales.prefix(pathForSlug(slug), locale);
    const origin = typeof location !== 'undefined' ? location.origin : '';
    const url = origin + path;
    const imageUrl = image.startsWith('http') ? image : `${origin}/${image.replace(/^\//, '')}`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: locale === 'en' ? 'en_US' : 'es_PE' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      inLanguage: locale,
      isPartOf: {
        '@type': 'WebSite',
        name: String(site['logoAlt'] || 'Matt Innova Solution'),
        url: origin || undefined,
      },
    };
    if (!this.doc?.head) {
      return;
    }
    if (!this.jsonLd) {
      this.jsonLd = this.doc.createElement('script');
      this.jsonLd.type = 'application/ld+json';
      this.jsonLd.id = 'cms-jsonld';
      this.doc.head.appendChild(this.jsonLd);
    }
    this.jsonLd.textContent = JSON.stringify(data);
  }
}
