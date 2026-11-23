import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  editor = inject(CmsEditorService);
  showCtaBanner = signal(true);
  showCookieBanner = signal(true);
  showLoading = signal(true);
  private splashTimer?: ReturnType<typeof setTimeout>;
  private ctaTimer?: ReturnType<typeof setTimeout>;

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
    const cookiesAccepted = typeof localStorage === 'undefined' ? null : localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === 'true' || cookiesAccepted === 'false') {
      this.showCookieBanner.set(false);
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ctaBannerClosed') === 'true') {
      this.showCtaBanner.set(false);
    }
    const splashSeen = this.splashAlreadySeen();
    if (splashSeen || this.reducedMotion()) {
      this.showLoading.set(false);
    } else {
      const splashMs = Number(this.site()['splashSeconds'] ?? 3) * 1000;
      this.splashTimer = setTimeout(() => this.dismissSplash(), Number.isFinite(splashMs) ? splashMs : 3000);
    }
    this.syncCookiePad();
    
    // Auto-cerrar el banner CTA después de 8 segundos
    if (this.showCtaBanner()) {
      this.ctaTimer = setTimeout(() => this.closeCtaBanner(), 8000);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('has-cookie-banner');
    }
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
    try {
      localStorage.setItem('splashSeen', 'true');
      sessionStorage.setItem('splashSeen', 'true');
    } catch {
      /* private mode */
    }
  }

  closeCtaBanner(): void {
    this.showCtaBanner.set(false);
    localStorage.setItem('ctaBannerClosed', 'true');
  }

  acceptCookies(): void {
    this.showCookieBanner.set(false);
    localStorage.setItem('cookiesAccepted', 'true');
    this.syncCookiePad();
  }

  rejectCookies(): void {
    this.showCookieBanner.set(false);
    localStorage.setItem('cookiesAccepted', 'false');
    this.syncCookiePad();
  }

  private syncCookiePad(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.classList.toggle('has-cookie-banner', this.showCookies());
  }

  private splashAlreadySeen(): boolean {
    try {
      return localStorage.getItem('splashSeen') === 'true' || sessionStorage.getItem('splashSeen') === 'true';
    } catch {
      return false;
    }
  }

  private reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
