import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { WhatsappBubble } from './components/whatsapp-bubble/whatsapp-bubble';
import { AccessibilityComponent } from './components/accessibility/accessibility';
import { SkipLink } from './components/public/skip-link';
import { SiteChrome } from './components/public/site-chrome';
import { filter } from 'rxjs/operators';
import { CmsContentService } from './cms/cms-content.service';
import { CmsEditorService } from './cms/cms-editor.service';
import { CmsSeoService } from './cms/cms-seo.service';
import { slugFromRoute } from './cms/cms.models';
import { CmsLocale, LocaleService } from './cms/locale.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Header,
    Footer,
    ChatbotComponent,
    WhatsappBubble,
    AccessibilityComponent,
    SkipLink,
    SiteChrome,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private cms = inject(CmsContentService);
  private seo = inject(CmsSeoService);
  private locales = inject(LocaleService);
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  editor = inject(CmsEditorService);
  isAdmin = signal(false);

  private initialRedirectChecked = false;
  private loadedLocale: CmsLocale | null = null;

  site = this.cms.site;
  showWhatsapp = () => this.site()['showWhatsapp'] !== false && !this.isAdmin();
  showChat = () => this.site()['showChatbot'] !== false && !this.isAdmin();

  ngOnInit() {
    void this.seo;
    // Sin boot ansioso con router.url: durante el bootstrap la navegación inicial
    // aún no completa y url es '/' (locale es), lo que disparaba toda la shell en
    // español antes de descubrir /en. La primera NavigationEnd trae la URL real.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      if (this.redirectToPreferredLocaleOnFirstRootVisit(event.urlAfterRedirects)) {
        return;
      }
      this.boot(event.urlAfterRedirects);
      const path = (event.urlAfterRedirects || '/').split(/[?#]/)[0];
      const admin = path === '/admin' || path.startsWith('/admin/');
      if (typeof window !== 'undefined' && !admin) {
        window.scrollTo({ top: 0, behavior: this.reducedMotion() ? 'auto' : 'smooth' });
      }
    });
  }

  private redirectToPreferredLocaleOnFirstRootVisit(rawUrl: string): boolean {
    if (this.initialRedirectChecked) {
      return false;
    }
    this.initialRedirectChecked = true;
    // Solo en navegador (nunca en SSR, para mantener SSR e hidratación consistentes)
    if (typeof window === 'undefined') {
      return false;
    }
    const path = (rawUrl || '/').split(/[?#]/)[0];
    // Solo redirigir en la primera visita a la raíz exacta '/' (nunca en '/es', '/servicios', '/admin', etc.)
    if (path !== '/' && path !== '') {
      return false;
    }
    if (this.locales.preferredLocale() !== 'en') {
      return false;
    }
    const suffixMatch = /[?#].*$/.exec(rawUrl || '');
    const target = `/en${suffixMatch ? suffixMatch[0] : ''}`;
    void this.router.navigateByUrl(target, { replaceUrl: true });
    return true;
  }

  private boot(rawUrl: string): void {
    const url = (rawUrl || '/').split(/[?#]/)[0] || '/';
    const admin = url === '/admin' || url.startsWith('/admin/');
    this.isAdmin.set(admin);
    if (admin) {
      this.loadedLocale = null;
      if (!this.cms.hasAllPages()) {
        this.cms.loadAll().catch(() => undefined);
      }
      return;
    }
    const parsed = this.locales.parseUrl(url);
    this.locales.setFromUrl(url);
    if (this.doc?.documentElement) {
      this.doc.documentElement.lang = parsed.locale;
    }
    const knownSlug = parsed.path === '/' ? 'inicio' : slugFromRoute(parsed.path);
    const localeChanged = this.loadedLocale !== parsed.locale;
    this.loadedLocale = parsed.locale;
    if (!this.editor.editMode()) {
      if (knownSlug) {
        this.cms.useSlug(knownSlug);
        if (localeChanged || !this.cms.pages()[knownSlug]) {
          this.cms.loadPublic(knownSlug).catch(() => undefined);
        }
      } else if (localeChanged || !this.cms.loaded()) {
        // Para páginas personalizadas aún no registradas o 404, cargar solo shell+catálogo
        // sin pisar currentSlug con 'inicio' ni disparar una carga innecesaria de la portada.
        this.cms.loadPublic('sitio').catch(() => undefined);
      }
    }
  }

  private reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
