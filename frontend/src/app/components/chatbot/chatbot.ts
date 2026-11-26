import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatLink, ChatService, ChatbotMode } from '../../services/chat';
import { ChatDataService, ChatMessage } from '../../services/chat-data.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CmsContentService } from '../../cms/cms-content.service';
import { LocaleService } from '../../cms/locale.service';
import { CHATBOT_WELCOME_LINKS, publicPathLabel } from '../../cms/cms-routes';

const WELCOME: ChatMessage = {
  text: 'Hola. Soy el asistente de *Matt Innova Solution*. Puedo orientarte sobre servicios, clientes, contacto y el libro de reclamaciones.',
  type: 'bot',
  links: [...CHATBOT_WELCOME_LINKS],
};

const LOGO_FALLBACK = 'logo.svg';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef<HTMLElement>;
  @ViewChild('chatInput') private chatInput?: ElementRef<HTMLInputElement>;
  @ViewChild('chatFab') private chatFab?: ElementRef<HTMLButtonElement>;
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  private chatData = inject(ChatDataService);
  private analytics = inject(AnalyticsService);

  readonly logoFallback = LOGO_FALLBACK;

  siteLogo(): string {
    return String(this.cms.site()['logo'] || LOGO_FALLBACK);
  }

  isOpen = false;
  userInput = '';
  isTyping = false;
  hasInteracted = false;

  suggestions = ['¿Qué servicios ofrecen?', 'Nuestros clientes', 'ERP y precios', 'Contacto'];

  get hasUserMessage(): boolean {
    return this.messages.some((msg) => msg.type === 'user');
  }

  get canSend(): boolean {
    return this.userInput.trim().length > 0 && !this.isTyping;
  }

  messages: ChatMessage[] = [{ ...WELCOME, links: [...(WELCOME.links ?? [])] }];

  mode = computed<ChatbotMode>(() => (this.cms.site()['chatbotMode'] === 'ia' ? 'ia' : 'clasico'));

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    const stored = this.chatData.getMessages();
    if (stored.length > 0) {
      this.messages = stored;
      this.hasInteracted = stored.some((msg) => msg.type === 'user');
    } else {
      this.chatData.addMessage(this.messages[0]);
    }
  }

  ngOnDestroy(): void {
    this.isOpen = false;
    this.syncBodyScroll();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.syncBodyScroll();
    if (this.isOpen) {
      this.hasInteracted = true;
      this.scrollToBottom();
      // El foco entra al campo de texto cuando se abre.
      queueMicrotask(() => this.chatInput?.nativeElement.focus());
    } else {
      // Al cerrar, el foco vuelve al botón flotante.
      queueMicrotask(() => this.chatFab?.nativeElement.focus());
    }
  }

  closeFromKeyboard(): void {
    if (this.isOpen) {
      this.toggleChat();
    }
  }

  private syncBodyScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.classList.toggle('chatbot-open', this.isOpen);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img && img.src !== LOGO_FALLBACK) {
      img.src = LOGO_FALLBACK;
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  /** Convierte el texto del bot en HTML seguro: negritas, links internos, emails y saltos. */
  formatText(text: string): string {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Líneas separadoras tipo "----..." -> divisor visual (evita desbordes feos)
    const withDividers = escaped
      .split('\n')
      .map((line) => (/^\s*[-─═]{4,}\s*$/.test(line) ? '<span class="msg-divider"></span>' : line))
      .join('\n');

    let html = withDividers
      // *negrita*
      .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
      // _cursiva_ (evita romper emails: exige espacios o inicio/fin alrededor)
      .replace(/(^|\s)_([^_\n@]+)_(\s|$|[.,!?;:])/g, '$1<em>$2</em>$3');

    // Rutas internas /algo -> enlace navegable (resuelve el "en /libro-reclamaciones" cortado)
    html = html.replace(/(^|[\s(])(\/[a-z0-9][a-z0-9/_-]*)/gi, (_m, prefix: string, path: string) => {
      const clean = path.replace(/[.,;:!?)]+$/, '');
      const trail = path.slice(clean.length);
      const label = this.friendlyPath(clean);
      return `${prefix}<a class="inline-link" data-internal="${clean}" title="${clean}">${label}</a>${trail}`;
    });

    // Emails -> mailto (con ruptura de línea segura)
    html = html.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a class="inline-link" href="mailto:$1">$1</a>');

    // URLs http(s)
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noopener">$1</a>');

    // Teléfonos (+51) 992 422 219 -> tel:
    html = html.replace(/(\(\+\d{1,3}\)\s?[\d\s.-]{6,})/g, (_m, phone: string) => {
      const tel = phone.replace(/[^\d+]/g, '');
      return `<a class="inline-link" href="tel:${tel}">${phone}</a>`;
    });

    return html.replace(/\n/g, '<br>');
  }

  private friendlyPath(path: string): string {
    return publicPathLabel(path);
  }

  /** Delegación de clics en enlaces internos renderizados dentro del mensaje. */
  onBubbleClick(event: Event): void {
    const target = (event.target as HTMLElement | null)?.closest?.('[data-internal]') as HTMLElement | null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const path = target.getAttribute('data-internal');
    if (path) {
      this.navigateTo(path);
    }
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      try {
        const el = this.myScrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch { /* noop */ }
    });
  }

  private push(message: ChatMessage): void {
    this.messages.push(message);
    this.chatData.addMessage(message);
  }

  selectSuggestion(suggestion: string) {
    if (this.isTyping) return;
    this.userInput = suggestion;
    this.sendMessage();
  }

  clearChat(): void {
    this.chatData.clearMessages();
    this.messages = [{ ...WELCOME, links: [...(WELCOME.links ?? [])] }];
    this.chatData.addMessage(this.messages[0]);
    this.scrollToBottom();
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isTyping) return;

    this.hasInteracted = true;
    const userMsg = this.userInput.trim();
    this.userInput = '';
    this.push({ text: userMsg, type: 'user' });
    this.analytics.trackChatbotInteraction(userMsg);
    this.isTyping = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    this.chatService.sendSmart(userMsg, this.mode()).subscribe({
      next: (resp) => {
        this.isTyping = false;
        this.push({
          text: resp.reply,
          type: 'bot',
          links: this.safeLinks(resp.links),
          showFeedback: true,
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.isTyping = false;
        this.push({
          text: 'No pude responder ahora. Puedes ver nuestros servicios o escribirnos desde contacto.',
          type: 'bot',
          links: [
            { label: 'Servicios', path: '/servicios' },
            { label: 'Contacto', path: '/contacto' }
          ]
        });
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });
  }

  private safeLinks(links?: ChatLink[]): ChatLink[] | undefined {
    if (!Array.isArray(links) || links.length === 0) {
      return undefined;
    }
    return links.filter((link) => link?.path?.startsWith('/') && !!link.label);
  }

  navigateTo(path: string) {
    void this.router.navigateByUrl(this.locales.hrefFor(path));
    this.isOpen = false;
    this.syncBodyScroll();
  }

  rateMessage(index: number, rating: 'up' | 'down'): void {
    const message = this.messages[index];
    if (!message || message.type !== 'bot' || message.feedback) {
      return;
    }
    message.feedback = rating;
    message.showFeedback = false;
    this.chatData.clearMessages();
    this.messages.forEach((item) => this.chatData.addMessage(item));
    this.analytics.trackChatbotInteraction(rating === 'up' ? 'feedback_util' : 'feedback_mejorar');
  }
}
