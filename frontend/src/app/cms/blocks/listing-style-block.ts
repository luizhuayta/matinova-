import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsEditorService } from '../cms-editor.service';
import { CmsContentService } from '../cms-content.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, propsPath } from '../block-registry';
import { LocaleService } from '../locale.service';
import { bootstrapIcon, displayPhotoSrc, webpSrcset } from '../public-url';
import { resolveHref, splitAccent } from '../block-presenters';
import { PublicReveal } from '../../components/public/public-reveal';
import { PageHeader } from '../../components/ui/page-header';
import { CyberCard } from '../../components/ui/cyber-card';
import { HudDivider } from '../../components/ui/hud-divider';
import { GlowButton } from '../../components/ui/glow-button';

@Component({
  selector: 'app-listing-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective, PublicReveal, PageHeader, CyberCard, HudDivider, GlowButton],
  templateUrl: './listing-style-block.html',
})
export class ListingStyleBlock {
  private locales = inject(LocaleService);
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  titleParts = computed(() => {
    const fallback = this.cms.currentSlug() === 'clientes' ? 'empresas' : 'puesta en marcha';
    return splitAccent(this.props()['title'], this.props()['titleAccent'] || fallback);
  });
  cards = computed(() => asList(this.props()['cards']));
  headerBackground = computed<'grid' | 'none'>(() => (this.cms.currentSlug() === 'clientes' ? 'none' : 'grid'));
  headerEyebrow = computed(() => (this.cms.currentSlug() === 'clientes' ? 'Clientes' : 'Servicios'));

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  pathOf(path: string): string {
    return this.locales.hrefFor(path);
  }

  isInternalPath(card: Record<string, string>): boolean {
    return String(card['path'] || '/').startsWith('/');
  }

  ctaHref(): string {
    return resolveHref(this.props()['link'], (path) => this.locales.hrefFor(path), '/contacto');
  }

  ctaLabel(): string {
    const label = String(this.props()['button'] ?? '').trim();
    return label || (this.locales.locale() === 'en' ? 'Contact us' : 'Contáctanos');
  }

  iconOf(card: Record<string, string>, index: number): string {
    const fallback = ['bi-code-slash', 'bi-pc-display', 'bi-cloud', 'bi-hdd-network', 'bi-laptop', 'bi-code-slash'][index] ?? 'bi-grid';
    return bootstrapIcon(card['icon'], fallback);
  }

  webpOf(src: unknown): string {
    return webpSrcset(src);
  }

  rasterOf(src: unknown): string {
    return displayPhotoSrc(src);
  }
}
