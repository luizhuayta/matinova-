import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CmsEditorService } from '../cms-editor.service';
import { CmsContentService } from '../cms-content.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, isInternalLink, mapEmbed, propsPath } from '../block-registry';
import { ClientPanel, groupClientItems } from '../client-panels';

@Component({
  selector: 'app-extra-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, NgTemplateOutlet, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective],
  templateUrl: './extra-style-block.html',
  styleUrl: './extra-style-block.scss',
})
export class ExtraStyleBlock implements OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private cms = inject(CmsContentService);
  private route = inject(ActivatedRoute);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  current = 0;
  openFaq = -1;
  expandedCategories: Record<string, boolean> = { empresas: true };
  expandedSubs: Record<string, boolean> = {};
  private timer?: ReturnType<typeof setInterval>;

  props = computed(() => this.block().props);
  items = computed(() => asList(this.props()['items'] ?? this.props()['stages']));
  layout = computed(() => String(this.props()['layout'] || 'logos-grid'));
  panels = computed<ClientPanel[]>(() => groupClientItems(this.items()));
  animate = computed(() => this.cms.site()['animateCarousels'] !== false && !this.editor.editMode());

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const category = (params.get('category') || '').trim().toLowerCase();
      if (category) {
        this.expandedCategories = { ...this.expandedCategories, [category]: true };
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

  hasUrl(url: unknown): boolean {
    const value = String(url ?? '').trim();
    return value !== '' && value !== '#';
  }

  subKey(category: string, name: string): string {
    return `${category}::${name}`;
  }

  toggleCategory(key: string): void {
    this.expandedCategories = { ...this.expandedCategories, [key]: !this.expandedCategories[key] };
  }

  toggleSub(key: string): void {
    this.expandedSubs = { ...this.expandedSubs, [key]: !this.expandedSubs[key] };
  }

  expandAll(): void {
    const categories: Record<string, boolean> = {};
    const subs: Record<string, boolean> = {};
    for (const panel of this.panels()) {
      categories[panel.key] = true;
      for (const sub of panel.subs) {
        subs[this.subKey(panel.key, sub.name)] = true;
      }
    }
    this.expandedCategories = categories;
    this.expandedSubs = subs;
  }

  collapseAll(): void {
    this.expandedCategories = {};
    this.expandedSubs = {};
  }

  hideBrokenLogo(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }

  initial(name: unknown): string {
    const value = String(name ?? '').trim();
    return value ? value.slice(0, 1).toUpperCase() : '•';
  }

  embed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbed(url));
  }

  mapUrl(): string {
    return String(this.props()['embed'] ?? '');
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
