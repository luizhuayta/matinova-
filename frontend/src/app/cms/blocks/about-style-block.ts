import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CmsEditorService } from '../cms-editor.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, propsPath, youtubeEmbed } from '../block-registry';
import { CmsContentService } from '../cms-content.service';
import { LocaleService } from '../locale.service';
import { bootstrapIcon, displayPhotoSrc, isLiveHref, preferredCmsImage, swapBrokenImage, webpSrcset } from '../public-url';
import { contactCardHref, contactIconName, resolveHref, splitAccent } from '../block-presenters';
import { PublicReveal } from '../../components/public/public-reveal';
import { PageHeader } from '../../components/ui/page-header';
import { CyberCard } from '../../components/ui/cyber-card';
import { HudDivider } from '../../components/ui/hud-divider';
import { GlowButton } from '../../components/ui/glow-button';

@Component({
  selector: 'app-about-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective, PublicReveal, PageHeader, CyberCard, HudDivider, GlowButton],
  templateUrl: './about-style-block.html',
})
export class AboutStyleBlock {
  private sanitizer = inject(DomSanitizer);
  private locales = inject(LocaleService);
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  titleParts = computed(() => splitAccent(this.props()['title'], this.props()['titleAccent']));
  items = computed(() => asList(this.props()['items']));
  isContact = computed(() => this.cms.currentSlug() === 'contacto');
  heroAlign = computed<'left' | 'center'>(() => (this.isContact() ? 'left' : 'center'));
  heroEyebrow = computed(() => {
    const badge = String(this.props()['badge'] ?? '').trim();
    if (badge) {
      return badge;
    }
    const english = this.locales.locale() === 'en';
    if (this.isContact()) {
      return english ? 'Contact' : 'Contacto';
    }
    return english ? 'About us' : 'Nosotros';
  });
  features = computed(() => {
    const raw = this.props()['features'];
    return Array.isArray(raw) ? raw : [];
  });

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  featurePath(i: number): string {
    const item = this.features()[i];
    return typeof item === 'string' ? this.path(`features.${i}`) : this.path(`features.${i}.text`);
  }

  hasLink(url: unknown): boolean {
    return isLiveHref(url);
  }

  href(): string {
    return resolveHref(this.props()['ctaLink'], (path) => this.locales.hrefFor(path));
  }

  ctaLabel(): string {
    return String(this.props()['cta'] ?? '');
  }

  isEn(): boolean {
    return this.locales.locale() === 'en';
  }

  iconOf(icon: unknown, fallback: string): string {
    return bootstrapIcon(icon, fallback);
  }

  aboutPhoto(): string {
    return preferredCmsImage(this.props()['image']);
  }

  heroImage(): string {
    return preferredCmsImage(this.props()['image']);
  }

  onHeroError(event: Event): void {
    swapBrokenImage(event, '/assets/illustrations/why-us.svg');
  }

  statIcon(icon: unknown, index: number): string {
    const value = String(icon ?? '').trim();
    const allowed = ['calendar', 'users', 'layers', 'headset', 'building', 'handshake', 'laptop'];
    return allowed.includes(value) ? value : (['calendar', 'users', 'layers', 'headset'][index] ?? 'check');
  }

  iconName(icon: unknown, index: number): string {
    return contactIconName(icon, index);
  }

  cardHref(card: Record<string, string>): string {
    return contactCardHref(card);
  }

  webpOf(src: unknown): string {
    return webpSrcset(src);
  }

  rasterOf(src: unknown): string {
    return displayPhotoSrc(src);
  }

  private embedCache = new Map<string, SafeResourceUrl>();

  playedVideos = signal<Record<string, true>>({});

  isPlayed(index: number): boolean {
    return !!this.playedVideos()[index];
  }

  playVideo(index: number): void {
    this.playedVideos.set({ ...this.playedVideos(), [index]: true });
  }

  videoThumb(url: unknown): string {
    const match = String(url ?? '').match(/embed\/([A-Za-z0-9_-]{6,})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
  }

  embed(url: string): SafeResourceUrl {
    const key = String(url ?? '');
    let out = this.embedCache.get(key);
    if (!out) {
      out = this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbed(key));
      this.embedCache.set(key, out);
    }
    return out;
  }
}
