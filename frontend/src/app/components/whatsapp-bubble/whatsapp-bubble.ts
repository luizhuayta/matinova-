import { Component, computed, inject } from '@angular/core';
import { CmsContentService } from '../../cms/cms-content.service';

@Component({
  selector: 'app-whatsapp-bubble',
  templateUrl: './whatsapp-bubble.html',
  styleUrl: './whatsapp-bubble.scss',
})
export class WhatsappBubble {
  private cms = inject(CmsContentService);
  site = computed(() => this.cms.site());
  href = computed(() => {
    const number = String(this.site()['whatsappNumber'] || '51992422219');
    const text = encodeURIComponent(String(this.site()['whatsappMessage'] || 'Hola Matt Innova Solution'));
    return `https://wa.me/${number}?text=${text}`;
  });
}
