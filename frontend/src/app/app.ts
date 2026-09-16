import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { WhatsappBubble } from './components/whatsapp-bubble/whatsapp-bubble';
import { AccessibilityComponent } from './components/accessibility/accesibility';
import { filter } from 'rxjs/operators';
import { CmsContentService } from './cms/cms-content.service';
import { CmsEditorService } from './cms/cms-editor.service';
import { CmsSeoService } from './cms/cms-seo.service';
import { CmsTextDirective } from './cms/cms-text.directive';
import { CmsImageDirective } from './cms/cms-image.directive';
import { slugFromRoute } from './cms/cms.models';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    Header,
    Footer,
    ChatbotComponent,
    WhatsappBubble,
    AccessibilityComponent,
    CmsTextDirective,
    CmsImageDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private cms = inject(CmsContentService);
  private seo = inject(CmsSeoService);
  editor = inject(CmsEditorService);
  isAdmin = signal(false);
  showCtaBanner = signal(true);
  showCookieBanner = signal(true);
  showLoading = signal(true);

  site = computed(() => this.cms.site());
  showSplash = computed(() => this.site()['showSplash'] !== false && this.showLoading() && !this.isAdmin() && !this.editor.editMode());
  showCta = computed(() => this.site()['showCtaBanner'] !== false && this.showCtaBanner() && !this.isAdmin());
  showCookies = computed(() => this.showCookieBanner() && !this.isAdmin() && !this.editor.editMode());
  showWhatsapp = computed(() => this.site()['showWhatsapp'] !== false && !this.isAdmin());
  showChat = computed(() => this.site()['showChatbot'] !== false && !this.isAdmin());

  ngOnInit() {
    void this.seo;
    this.cms.loadAll().catch(() => undefined);

    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === 'true' || cookiesAccepted === 'false') {
      this.showCookieBanner.set(false);
    }
    if (localStorage.getItem('ctaBannerClosed') === 'true') {
      this.showCtaBanner.set(false);
    }

    const splashMs = Number(this.site()['splashSeconds'] ?? 3) * 1000;
    setTimeout(() => this.showLoading.set(false), Number.isFinite(splashMs) ? splashMs : 3000);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects.split('?')[0];
      this.isAdmin.set(url.startsWith('/admin'));
      const slug = slugFromRoute(url);
      if (slug && !this.editor.editMode()) {
        this.cms.useSlug(slug);
      }
      if (!url.startsWith('/admin')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    this.isAdmin.set(this.router.url.startsWith('/admin'));
  }

  closeCtaBanner() {
    this.showCtaBanner.set(false);
    localStorage.setItem('ctaBannerClosed', 'true');
  }

  acceptCookies() {
    this.showCookieBanner.set(false);
    localStorage.setItem('cookiesAccepted', 'true');
  }

  rejectCookies() {
    this.showCookieBanner.set(false);
    localStorage.setItem('cookiesAccepted', 'false');
  }
}
