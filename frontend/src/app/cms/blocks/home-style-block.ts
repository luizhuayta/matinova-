import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsContentService } from '../cms-content.service';
import { CmsEditorService } from '../cms-editor.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, featureText, propsPath } from '../block-registry';
import { LocaleService } from '../locale.service';
import { allowPublicMotion } from '../public-motion';
import { bootstrapIcon, displayPhotoSrc, preferredCmsImage, webpSrcset } from '../public-url';
import { contactCardHref, contactIconName, isInternalHref as isInternalLinkHref, resolveHref, splitAccent } from '../block-presenters';
import { CmsCtaButton } from '../cms-cta-button';
import { PublicButton } from '../../components/public/public-button';
import { PublicReveal } from '../../components/public/public-reveal';

const DEFAULT_HERO_STATS = [
  { icon: 'users', number: '30+', label: 'Años de experiencia' },
  { icon: 'handshake', number: '4,127', label: 'Clientes atendidos' },
  { icon: 'laptop', number: '5', label: 'Áreas de servicio TI' },
  { icon: 'calendar', number: '24/7', label: 'Soporte en línea' },
];

const HERO_STAT_ICONS = ['users', 'handshake', 'laptop', 'calendar'];

@Component({
  selector: 'app-home-style-block',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CmsTextDirective,
    CmsImageDirective,
    CmsListDirective,
    CmsCtaButton,
    PublicButton,
    PublicReveal,
  ],
  templateUrl: './home-style-block.html',
})
export class HomeStyleBlock implements OnDestroy {
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  currentSlide = signal(0);
  autoPaused = signal(false);
  private failedHero = signal<Record<string, true>>({});
  private timers: ReturnType<typeof setInterval>[] = [];

  p = computed(() => propsPath(this.index()));
  props = computed(() => this.block().props);
  slides = computed(() => asList(this.props()['slides']));
  stats = computed(() => asList(this.props()['stats']));
  heroStats = computed(() => (this.stats().length ? this.stats() : DEFAULT_HERO_STATS));
  serviceCards = computed(() => asList(this.props()['cards']));
  serviceTitleParts = computed(() => splitAccent(this.props()['title'], this.props()['titleAccent']));
  items = computed(() => asList(this.props()['items']));
  features = computed(() => {
    const raw = this.props()['features'];
    return Array.isArray(raw) ? raw : [];
  });
  animate = computed(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const a11yOff = typeof document !== 'undefined' && document.documentElement.getAttribute('data-a11y-motion') === 'off';
    return allowPublicMotion(this.cms.site()['animateCarousels'], this.editor.editMode(), reduced, a11yOff);
  });
  current = computed(() => this.slides()[this.currentSlide()] ?? {});
  titleParts = computed(() => splitAccent(this.current()['title'], this.current()['titleAccent']));
  totalSlides = computed(() => this.slides().length);
  slideIndexLabel = computed(() => {
    const total = this.slides().length;
    if (!total) return '01 / 01';
    const cur = String(this.currentSlide() + 1).padStart(2, '0');
    const tot = String(total).padStart(2, '0');
    return `${cur} / ${tot}`;
  });

  constructor() {
    queueMicrotask(() => this.startTimers());
  }

  ngOnDestroy(): void {
    this.timers.forEach((id) => clearInterval(id));
  }

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  tag(): string {
    return String(this.props()['tag'] || '').trim();
  }

  slideBadge(): string {
    return String(this.slides()[this.currentSlide()]?.['badge'] || '').trim();
  }

  subtitle(): string {
    return String(this.props()['subtitle'] || '').trim();
  }

  aboutPhoto(): string {
    return preferredCmsImage(this.props()['image']);
  }

  heroImage(): string {
    return String(this.slides()[this.currentSlide()]?.['image'] || '').trim();
  }

  showHeroPhoto(): boolean {
    const src = this.heroImage();
    return !!src && !this.failedHero()[src];
  }

  onHeroError(): void {
    const src = this.heroImage();
    if (src) {
      this.failedHero.update((map) => ({ ...map, [src]: true }));
    }
  }

  webpOf(src: unknown): string {
    return webpSrcset(src);
  }

  rasterOf(src: unknown): string {
    return displayPhotoSrc(src);
  }

  isAddressCard(card: Record<string, string>): boolean {
    return /san isidro|panamá 3591/i.test(String(card['text'] || ''));
  }

  cardHref(card: Record<string, string>): string {
    return contactCardHref(card, String(this.cms.site()['whatsappNumber'] || '51992422219'));
  }

  iconName(icon: unknown, index: number): string {
    return contactIconName(icon, index);
  }

  featurePath(i: number): string {
    const item = this.features()[i];
    return typeof item === 'string' ? this.path(`features.${i}`) : this.path(`features.${i}.text`);
  }

  featureValue(item: unknown): string {
    return featureText(item);
  }

  href(): string {
    return resolveHref(this.props()['ctaLink'], (path) => this.locales.hrefFor(path));
  }

  secondaryHref(): string {
    return resolveHref(this.props()['secondaryLink'], (path) => this.locales.hrefFor(path), '/acerca-de');
  }

  cardIcon(card: Record<string, string>, index: number): string {
    const fallback = ['bi-code-slash', 'bi-pc-display', 'bi-cloud', 'bi-hdd-network', 'bi-laptop', 'bi-code-slash'][index] ?? 'bi-grid';
    return bootstrapIcon(card['icon'], fallback);
  }

  cardLink(card: Record<string, string>): string {
    return resolveHref(card['link'], (path) => this.locales.hrefFor(path), this.locales.hrefFor('/servicios'));
  }

  isInternalHref(link: string): boolean {
    return isInternalLinkHref(link);
  }

  cardLinkLabel(): string {
    return this.locales.locale() === 'en' ? 'Learn more' : 'Saber más';
  }

  contactCtaLabel(): string {
    return this.locales.locale() === 'en' ? 'Talk to an expert' : 'Hablar con un experto';
  }

  innovativePoints(): string[] {
    return this.locales.locale() === 'en'
      ? ['Implementation included, not just the license', 'Support after go-live', 'Remote work across Latin America']
      : ['Implementación incluida, no solo licencia', 'Soporte post puesta en marcha', 'Trabajo remoto en Latinoamérica'];
  }

  heroStatIcon(icon: unknown, index: number): string {
    const value = String(icon ?? '').trim();
    return HERO_STAT_ICONS.includes(value) ? value : (HERO_STAT_ICONS[index] ?? 'calendar');
  }

  iconOf(icon: unknown, fallback: string): string {
    return bootstrapIcon(icon, fallback);
  }

  private startTimers(): void {
    if (!this.animate() || this.block().type !== 'hero') {
      return;
    }
    this.timers.push(setInterval(() => {
      if (this.autoPaused()) return;
      const n = this.slides().length;
      if (n) this.currentSlide.update((value) => (value + 1) % n);
    }, 5500));
  }

  toggleAuto(): void {
    this.autoPaused.set(!this.autoPaused());
  }

  setSlide(index: number): void {
    this.currentSlide.set(index);
  }

  nextSlide(): void {
    const n = this.slides().length;
    if (n) this.currentSlide.update((value) => (value + 1) % n);
  }

  prevSlide(): void {
    const n = this.slides().length;
    if (n) this.currentSlide.update((value) => (value - 1 + n) % n);
  }

  serviciosPath(): string {
    return this.locales.hrefFor('/servicios');
  }

  contactHref(): string {
    return this.locales.hrefFor('/contacto');
  }

  aboutHref(): string {
    return this.locales.hrefFor('/acerca-de');
  }

  stars(item: Record<string, string>): number[] {
    const raw = Number(item['rating']);
    const n = Number.isFinite(raw) && raw > 0 ? Math.min(5, Math.round(raw)) : 5;
    return Array.from({ length: n }, (_, i) => i);
  }
}
