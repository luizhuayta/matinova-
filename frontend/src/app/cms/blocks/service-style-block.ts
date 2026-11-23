import { Component, computed, inject, input } from '@angular/core';
import { CmsEditorService } from '../cms-editor.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, propsPath } from '../block-registry';
import { LocaleService } from '../locale.service';
import { displayPhotoSrc, webpSrcset } from '../public-url';
import { resolveHref, splitAccent } from '../block-presenters';
import { PublicReveal } from '../../components/public/public-reveal';
import { PageHeader } from '../../components/ui/page-header';
import { CyberCard } from '../../components/ui/cyber-card';
import { HudDivider } from '../../components/ui/hud-divider';
import { GlowButton } from '../../components/ui/glow-button';

@Component({
  selector: 'app-service-style-block',
  standalone: true,
  imports: [CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective, PublicReveal, PageHeader, CyberCard, HudDivider, GlowButton],
  templateUrl: './service-style-block.html',
})
export class ServiceStyleBlock {
  private locales = inject(LocaleService);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  titleParts = computed(() => splitAccent(this.props()['title'], this.props()['titleAccent']));
  eyebrow = computed(() => String(this.props()['label'] ?? '').trim());
  reasons = computed(() => asList(this.props()['items']));

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  ctaHref(): string {
    return resolveHref(this.props()['ctaLink'], (path) => this.locales.hrefFor(path), '/contacto');
  }

  ctaLabel(): string {
    return String(this.props()['cta'] ?? '').trim();
  }

  webpOf(src: unknown): string {
    return webpSrcset(src);
  }

  rasterOf(src: unknown): string {
    return displayPhotoSrc(src);
  }
}
