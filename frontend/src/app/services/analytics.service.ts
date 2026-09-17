import { Injectable } from '@angular/core';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  trackPageView(pagePath: string, pageTitle: string): void {
    this.trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  trackEvent(eventName: string, eventParams?: Record<string, unknown>): void {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }
    window.gtag('event', eventName, eventParams);
  }

  trackContactFormSubmit(formData: { phone?: string }): void {
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
