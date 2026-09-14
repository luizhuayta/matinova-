import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { WhatsappBubble } from "./components/whatsapp-bubble/whatsapp-bubble";
import { AccessibilityComponent } from './components/accessibility/accesibility';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
    Header,
    Footer,
    ChatbotComponent,
    WhatsappBubble,
    AccessibilityComponent
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  showCtaBanner = signal(true);
  showCookieBanner = signal(true);
  showLoading = signal(true);

  constructor(private router: Router) {}

  ngOnInit() {
    // Check if user already accepted cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === 'true' || cookiesAccepted === 'false') {
      this.showCookieBanner.set(false);
    }

    // Check if user closed CTA banner
    const ctaClosed = localStorage.getItem('ctaBannerClosed');
    if (ctaClosed === 'true') {
      this.showCtaBanner.set(false);
    }

    // Ocultar loading screen después de 3 segundos
    setTimeout(() => {
      this.showLoading.set(false);
    }, 3000);

    // Scroll suave al cambiar de página
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
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
