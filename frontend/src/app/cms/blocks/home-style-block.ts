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
import { ServicePhotoCard } from './service-photo-card';
import { CountUpDirective } from '../count-up.directive';

const DEFAULT_HERO_STATS = [
  { icon: 'users', number: '30+', es: 'Años de experiencia', en: 'Years of experience' },
  { icon: 'handshake', number: '4,127', es: 'Clientes atendidos', en: 'Clients served' },
  { icon: 'laptop', number: '5', es: 'Áreas de servicio TI', en: 'IT service areas' },
  { icon: 'trophy', number: '24/7', es: 'Soporte en línea', en: 'Online support' },
];

// Los glifos rellenos no forman parte de la fuente Bootstrap reducida del sitio.
const HERO_STAT_ICONS: Record<string, { paths: string[]; viewBox: string }> = {
  users: { viewBox: '0 0 16 16', paths: ['M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5'] },
  laptop: { viewBox: '0 0 16 16', paths: ['M2.5 2A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2zM0 12.5h16a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5'] },
  trophy: { viewBox: '0 0 16 16', paths: ['M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935'] },
  handshake: { viewBox: '0 0 32 32', paths: ['M1 10.5 5.8 7l5.5 7.6-4.9 3.5zM26.2 7 31 10.5l-5.4 7.6-4.8-3.5z', 'm11.6 10.9 2.8-2.2a4 4 0 0 1 4.3-.3l5.4 3.2-3.2 3.8-4.1-3.1-3.5 2.9a2 2 0 0 1-2.8-.2 2 2 0 0 1 .2-2.8z', 'm7.7 17 2.3-1.7a3.5 3.5 0 0 0 4.8 1.2l2-1.7 6.3 4.6a1.5 1.5 0 0 1-1.8 2.4l-3-2.2-.8 1 2.5 1.9a1.5 1.5 0 0 1-1.8 2.4l-2.4-1.8-.7 1 1 .9a1.4 1.4 0 0 1-1.7 2.2L8 22.1a3.2 3.2 0 0 1-.3-5.1z'] },
};

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
    ServicePhotoCard,
    CountUpDirective,
  ],
  templateUrl: './home-style-block.html',
  styleUrl: './home-style-block.scss',
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
  heroStats = computed(() => (this.stats().length ? this.stats() : DEFAULT_HERO_STATS.map(({ icon, number, es, en }) => ({
    icon, number, label: this.locales.locale() === 'en' ? en : es,
  }))));
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

  heroCtaFallback(field: 'cta' | 'secondaryCta'): string {
    const english = this.locales.locale() === 'en';
    if (field === 'secondaryCta') {
      return english ? 'View presentation' : 'Ver presentación';
    }
    return english ? 'Explore our services' : 'Conoce nuestros servicios';
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

  isEn(): boolean {
    return this.locales.locale() === 'en';
  }

  heroSubtitleFallback(): string {
    return this.isEn()
      ? '30 years integrating software, hardware and operations for companies and schools in Peru. Migrations, ERPs, networks and 24/7 support.'
      : '30 años integrando software, hardware y operación para empresas y entidades educativas en Perú. Migraciones, ERPs, redes y soporte 24/7.';
  }

  sitePhone(): string {
    const footer = this.cms.site()['footer'] as Record<string, string> | undefined;
    return String(footer?.['phone'] || '(+51) 992 422 219');
  }

  innovativePoints(): string[] {
    return this.locales.locale() === 'en'
      ? ['Implementation included, not just the license', 'Support after go-live', 'Remote work across Latin America']
      : ['Implementación incluida, no solo licencia', 'Soporte post puesta en marcha', 'Trabajo remoto en Latinoamérica'];
  }

  heroStatIcon(icon: unknown, index: number): { paths: string[]; viewBox: string } {
    const iconName = String(icon ?? '').trim();
    const value = iconName === 'calendar' ? 'trophy' : iconName;
    return Object.hasOwn(HERO_STAT_ICONS, value)
      ? HERO_STAT_ICONS[value]
      : HERO_STAT_ICONS[DEFAULT_HERO_STATS[index]?.icon ?? 'trophy'];
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
