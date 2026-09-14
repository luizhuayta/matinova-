import { Injectable } from '@angular/core';

// Declaración global para gtag
declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Google Analytics 4 - Reemplazar con tu Measurement ID
    const measurementId = 'G-XXXXXXXXXX'; // TODO: Configurar con ID real
    
    // Cargar gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Inicializar gtag
    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(configScript);

    this.isInitialized = true;
  }

  trackPageView(pagePath: string, pageTitle: string): void {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  }

  trackEvent(eventName: string, eventParams?: any): void {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, eventParams);
    }
  }

  trackContactFormSubmit(formData: any): void {
    this.trackEvent('contact_form_submit', {
      form_type: 'contact',
      has_phone: !!formData.phone
    });
  }

  trackChatbotInteraction(message: string): void {
    this.trackEvent('chatbot_interaction', {
      message_length: message.length
    });
  }

  trackLibroReclamacionesSubmit(): void {
    this.trackEvent('libro_reclamaciones_submit', {
      form_type: 'complaint'
    });
  }
}
