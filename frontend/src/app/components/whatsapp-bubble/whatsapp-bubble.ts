import { Component, computed, inject } from '@angular/core';
import { CmsContentService } from '../../cms/cms-content.service';
import { LocaleService } from '../../cms/locale.service';

@Component({
  selector: 'app-whatsapp-bubble',
  templateUrl: './whatsapp-bubble.html',
  styleUrl: './whatsapp-bubble.scss',
})
export class WhatsappBubble {
  private cms = inject(CmsContentService);
  private locales = inject(LocaleService);
  site = computed(() => this.cms.site());
  isEn = computed(() => this.locales.locale() === 'en');
  href = computed(() => {
    const number = String(this.site()['whatsappNumber'] || '51992422219');
    const fallback = this.isEn() ? 'Hello Matt Innova Solution' : 'Hola Matt Innova Solution';
    const text = encodeURIComponent(String(this.site()['whatsappMessage'] || fallback));
    return `https://wa.me/${number}?text=${text}`;
  });
  tooltip = computed(() =>
    String(this.site()['whatsappTooltip'] || (this.isEn() ? 'Write to us now' : 'Escríbenos ahora'))
  );
  ariaLabel = computed(() => {
    const num = String(this.site()['whatsappNumber'] || '51992422219');
    return this.isEn()
      ? `Chat on WhatsApp with Matt Innova Solution (${num})`
      : `Chatear por WhatsApp con Matt Innova Solution (${num})`;
  });
}
