import { Component, computed, effect, inject, signal, OnInit, OnDestroy, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { PublicButton } from './public-button';
import { LocaleLink } from './locale-link';
import { LocaleService } from '../../cms/locale.service';
import { asList } from '../../cms/block-registry';
import { publicPhotoSrc } from '../../cms/public-url';
import { DEFAULT_SPLASH_IMAGES } from '../../cms/cms-schema';

@Component({
  selector: 'app-site-chrome',
  standalone: true,
  imports: [RouterLink, PublicButton, LocaleLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './site-chrome.html',
  styleUrl: './site-chrome.scss',
  host: { style: 'display: contents' },
})
export class SiteChrome implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  editor = inject(CmsEditorService);
  showCtaBanner = signal(true);
  showCookieBanner = signal(true);
  showLoading = signal(true);
  private splashTimer?: ReturnType<typeof setTimeout>;
  private ctaTimer?: ReturnType<typeof setTimeout>;
  private cookieResizeObserver?: ResizeObserver;
  private cookieResizeListener?: () => void;

  @ViewChild('cookieContent') set cookieContent(element: ElementRef<HTMLElement> | undefined) {
    this.observeCookieContent(element);
  }

  constructor() {
    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      const showCookies = this.showCookies();
      document.body.classList.toggle('has-cookie-banner', showCookies);
      if (!showCookies) {
        document.body.style.removeProperty('--cookie-banner-h');
      }
    });
  }

  site = computed(() => this.cms.site());
  showSplash = computed(() => this.site()['showSplash'] !== false && this.showLoading() && !this.editor.editMode());
  showCta = computed(() => this.site()['showCtaBanner'] !== false && this.showCtaBanner());
  showCookies = computed(() => this.showCookieBanner() && !this.editor.editMode());

  splashMarks = computed(() => {
    const all = this.splashImages();
    if (this.editor.editMode() || all.length <= 1) {
      return all;
    }
    return [all[all.length - 1]];
  });

  splashImages = computed(() => {
    const raw = this.site()['splashImages'];
    if (!Array.isArray(raw)) {
      return DEFAULT_SPLASH_IMAGES.map((item) => ({ ...item }));
    }
    return asList(raw).filter((item) => String(item['image'] || '').trim());
  });

  contactPath(): string {
    return this.locales.hrefFor('/contacto');
  }

  markSrc(src: unknown): string {
    return publicPhotoSrc(src);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    const cookiesAccepted = this.readStorage('cookiesAccepted');
    if (cookiesAccepted === 'true' || cookiesAccepted === 'false') {
      this.showCookieBanner.set(false);
    }
    if (this.readStorage('ctaBannerClosed') === 'true') {
      this.showCtaBanner.set(false);
    }
    const splashSeen = this.splashAlreadySeen();
    if (splashSeen || this.reducedMotion()) {
      this.showLoading.set(false);
    } else {
      const splashMs = Number(this.site()['splashSeconds'] ?? 3) * 1000;
      this.splashTimer = setTimeout(() => this.dismissSplash(), Number.isFinite(splashMs) ? splashMs : 3000);
    }

    // Auto-cerrar el banner CTA después de 8 segundos
    if (this.showCtaBanner()) {
      this.ctaTimer = setTimeout(() => this.closeCtaBanner(), 8000);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.body.classList.remove('has-cookie-banner');
      document.body.style.removeProperty('--cookie-banner-h');
    }
    this.stopCookieMeasurement();
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
    }
    if (this.ctaTimer) {
      clearTimeout(this.ctaTimer);
    }
  }

  dismissSplash(): void {
    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
      this.splashTimer = undefined;
    }
    this.showLoading.set(false);
    this.writeStorage('splashSeen', 'true');
    this.writeStorage('splashSeen', 'true', 'session');
  }

  closeCtaBanner(): void {
    this.showCtaBanner.set(false);
    this.writeStorage('ctaBannerClosed', 'true');
  }

  acceptCookies(): void {
    this.showCookieBanner.set(false);
    this.writeStorage('cookiesAccepted', 'true');
  }

  rejectCookies(): void {
    this.showCookieBanner.set(false);
    this.writeStorage('cookiesAccepted', 'false');
  }

  private observeCookieContent(element: ElementRef<HTMLElement> | undefined): void {
    if (!this.isBrowser) {
      return;
    }
    this.stopCookieMeasurement();
    if (!element) {
      document.body.style.removeProperty('--cookie-banner-h');
      return;
    }
    const content = element.nativeElement;
    const update = () => {
      const height = Math.ceil(content.getBoundingClientRect().height);
      if (height > 0) {
        document.body.style.setProperty('--cookie-banner-h', `${height}px`);
      }
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      this.cookieResizeObserver = new ResizeObserver(update);
      this.cookieResizeObserver.observe(content);
    } else {
      this.cookieResizeListener = update;
      window.addEventListener('resize', update);
    }
  }

  private stopCookieMeasurement(): void {
    this.cookieResizeObserver?.disconnect();
    this.cookieResizeObserver = undefined;
    if (this.cookieResizeListener) {
      window.removeEventListener('resize', this.cookieResizeListener);
      this.cookieResizeListener = undefined;
    }
  }

  private splashAlreadySeen(): boolean {
    return this.readStorage('splashSeen') === 'true' || this.readStorage('splashSeen', 'session') === 'true';
  }

  private readStorage(key: string, storage: 'local' | 'session' = 'local'): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string, storage: 'local' | 'session' = 'local'): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      (storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
    } catch {
      /* private mode */
    }
  }

  private reducedMotion(): boolean {
    return this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
