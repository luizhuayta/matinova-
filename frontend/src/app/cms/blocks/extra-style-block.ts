import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CmsEditorService } from '../cms-editor.service';
import { CmsContentService } from '../cms-content.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, isInternalLink, mapEmbed, propsPath } from '../block-registry';
import { JsonMap } from '../cms.models';
import {
  CLIENT_CATEGORY_ORDER,
  ClientPanel,
  clientCountLabel,
  clientSectorArt,
  clientSubIcon,
  clientSubLabel,
  groupClientItems,
  panelItemCount,
} from '../client-panels';
import { bootstrapIcon, displayPhotoSrc, isEmojiMark, isLiveHref, webpSrcset } from '../public-url';
import { LocaleService } from '../locale.service';

import { PublicReveal } from '../../components/public/public-reveal';
import { CyberCard } from '../../components/ui/cyber-card';
import { HudDivider } from '../../components/ui/hud-divider';

function motionAllowed(): boolean {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-a11y-motion') === 'off') {
    return false;
  }
  return true;
}

@Component({
  selector: 'app-extra-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, NgTemplateOutlet, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective, PublicReveal, CyberCard, HudDivider],
  templateUrl: './extra-style-block.html',
})
export class ExtraStyleBlock implements OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  current = 0;
  openFaq = -1;
  mapLoaded = signal(false);
  activeSector = signal<string>('empresas');
  activeSub = signal('');
  private timer?: ReturnType<typeof setInterval>;

  props = computed(() => this.block().props);
  items = computed(() => asList(this.props()['items'] ?? this.props()['stages']));
  layout = computed(() => String(this.props()['layout'] || 'logos-grid'));
  panels = computed<ClientPanel[]>(() => groupClientItems(this.items(), this.locales.locale()));
  animate = computed(() => this.cms.site()['animateCarousels'] !== false && !this.editor.editMode() && motionAllowed());
  activePanel = computed(() => {
    const key = this.activeSector();
    return this.panels().find((panel) => panel.key === key) ?? this.panels()[0] ?? null;
  });
  visibleIndices = computed(() => {
    const panel = this.activePanel();
    if (!panel) {
      return [];
    }
    const sub = this.activeSub();
    if (!sub) {
      return panel.subs.flatMap((item) => item.indices);
    }
    return panel.subs.find((item) => item.name === sub)?.indices ?? [];
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const category = (params.get('category') || '').trim().toLowerCase();
      if (category && (CLIENT_CATEGORY_ORDER as readonly string[]).includes(category)) {
        this.activeSector.set(category);
        this.activeSub.set('');
      }
    });
    queueMicrotask(() => this.start());
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  listPath(): string {
    return this.block().type === 'clientStages' ? 'stages' : 'items';
  }

  internal(link: string): boolean {
    return isInternalLink(link);
  }

  clientHref(url: unknown): string {
    return this.locales.hrefFor(String(url ?? ''));
  }

  hasUrl(url: unknown): boolean {
    return isLiveHref(url);
  }

  iconClass(icon: unknown): string {
    const value = String(icon ?? '').trim();
    if (!value || isEmojiMark(value) || !(value.startsWith('bi-') || value.startsWith('bi '))) {
      return '';
    }
    return bootstrapIcon(icon);
  }

  selectSector(key: string): void {
    this.activeSector.set(key);
    this.activeSub.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  selectSub(name: string): void {
    this.activeSub.set(this.activeSub() === name ? '' : name);
  }

  sectorArt(key: string): string {
    return clientSectorArt(key);
  }

  sectorCount(panel: ClientPanel): string {
    return clientCountLabel(panel.key, panelItemCount(panel), this.locales.locale());
  }

  subIcon(name: string): string {
    return clientSubIcon(name);
  }

  subLabel(name: string): string {
    return clientSubLabel(name, this.locales.locale());
  }

  isEn(): boolean {
    return this.locales.locale() === 'en';
  }

  hideBrokenLogo(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }

  initial(name: unknown): string {
    const value = String(name ?? '').trim();
    return value ? value.slice(0, 1).toUpperCase() : 'M';
  }

  itemSub(item: JsonMap): string {
    return String(item['subcategory'] ?? '').trim();
  }

  private embedCache = new Map<string, SafeResourceUrl>();

  embed(url: string): SafeResourceUrl {
    const key = String(url ?? '');
    let out = this.embedCache.get(key);
    if (!out) {
      out = this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbed(key));
      this.embedCache.set(key, out);
    }
    return out;
  }

  mapUrl(): string {
    return String(this.props()['embed'] ?? '');
  }

  loadMap(): void {
    this.mapLoaded.set(true);
  }

  webpOf(src: unknown): string {
    return webpSrcset(src);
  }

  rasterOf(src: unknown): string {
    return displayPhotoSrc(src);
  }

  toggleFaq(i: number): void {
    this.openFaq = this.openFaq === i ? -1 : i;
  }

  private start(): void {
    if (this.block().type !== 'clients' || this.layout() !== 'carrusel' || !this.animate()) {
      return;
    }
    this.timer = setInterval(() => {
      const n = this.items().length;
      if (n) this.current = (this.current + 1) % n;
    }, 3000);
  }
}
