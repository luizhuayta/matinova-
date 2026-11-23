import { Component, inject, signal, OnInit } from '@angular/core';
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
import { LocaleService } from './cms/locale.service';

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
  editor = inject(CmsEditorService);
  isAdmin = signal(false);

  site = this.cms.site;
  showWhatsapp = () => this.site()['showWhatsapp'] !== false && !this.isAdmin();
  showChat = () => this.site()['showChatbot'] !== false && !this.isAdmin();

  ngOnInit() {
    void this.seo;
    // Sin boot ansioso con router.url: durante el bootstrap la navegación inicial
    // aún no completa y url es '/' (locale es), lo que disparaba toda la shell en
    // español antes de descubrir /en. La primera NavigationEnd trae la URL real.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.boot(event.urlAfterRedirects);
      this.redirectToSavedLocaleIfNeeded(event.urlAfterRedirects);
      if (!event.urlAfterRedirects.split('?')[0].startsWith('/admin')) {
        window.scrollTo({ top: 0, behavior: this.reducedMotion() ? 'auto' : 'smooth' });
      }
    });
  }

  private redirectToSavedLocaleIfNeeded(url: string): void {
    const path = url.split('?')[0];
    // Solo redirigir si es la raíz sin prefijo de idioma y no es admin
    if (path === '/' || path === '') {
      const savedLocale = this.locales.locale();
      if (savedLocale === 'en') {
        void this.router.navigateByUrl('/en');
      }
    }
  }

  private boot(rawUrl: string): void {
    const url = rawUrl.split('?')[0];
    const admin = url.startsWith('/admin');
    this.isAdmin.set(admin);
    if (admin) {
      if (!this.cms.hasAllPages()) {
        this.cms.loadAll().catch(() => undefined);
      }
      return;
    }
    const prev = this.locales.locale();
    const parsed = this.locales.parseUrl(url);
    // Si la URL tiene prefijo de idioma, usar ese. Si no, mantener el idioma guardado
    if (url.startsWith('/en') || url.startsWith('/es')) {
      this.locales.locale.set(parsed.locale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.locales.locale() === 'en' ? 'en' : 'es';
    }
    const slug = slugFromRoute(parsed.path) || 'inicio';
    if (!this.editor.editMode()) {
      this.cms.useSlug(slug);
      if (this.locales.locale() !== prev || !this.cms.pages()[slug]) {
        this.cms.loadPublic(slug).catch(() => undefined);
      }
    }
  }

  private reducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
