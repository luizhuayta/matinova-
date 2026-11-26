import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../cms/cms.models';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AccessibilityComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;
  isOpen = false;
  activeTab: 'tools' | 'report' = 'tools';
  sending = false;
  sent = false;
  error = '';

  reportForm = {
    name: '',
    email: '',
    phone: '',
    assistanceType: 'accessibility',
    description: '',
  };

  tools = {
    focus: false,
    largeCursor: false,
    highlightLinks: false,
    highContrast: false,
    stopAnimation: false,
    textSize: 'normal' as 'normal' | 'large' | 'extra-large',
    spacing: 'normal' as 'normal' | 'increased',
    readableFont: false,
    readingGuide: false,
    windowMask: false,
    hideImages: false,
    highlightHeadings: false,
  };

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      queueMicrotask(() => this.dialog?.nativeElement.querySelector<HTMLElement>('button, a, input')?.focus());
    }
  }

  closePanel(): void {
    this.isOpen = false;
  }

  toggleTool(key: keyof typeof this.tools): void {
    if (typeof this.tools[key] === 'boolean') {
      (this.tools as Record<string, boolean | string>)[key] = !this.tools[key];
    }
    this.apply();
  }

  cycleText(): void {
    this.tools.textSize = this.tools.textSize === 'normal' ? 'large' : this.tools.textSize === 'large' ? 'extra-large' : 'normal';
    this.apply();
  }

  toggleSpacing(): void {
    this.tools.spacing = this.tools.spacing === 'normal' ? 'increased' : 'normal';
    this.apply();
  }

  resetTools(): void {
    this.tools = {
      focus: false,
      largeCursor: false,
      highlightLinks: false,
      highContrast: false,
      stopAnimation: false,
      textSize: 'normal',
      spacing: 'normal',
      readableFont: false,
      readingGuide: false,
      windowMask: false,
      hideImages: false,
      highlightHeadings: false,
    };
    try {
      localStorage.removeItem('accessibilityTools');
    } catch {
      /* private */
    }
    this.apply();
  }

  apply(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.setAttribute('data-a11y-focus', this.tools.focus ? 'on' : 'off');
    root.setAttribute('data-a11y-cursor', this.tools.largeCursor ? 'large' : 'off');
    root.setAttribute('data-a11y-links', this.tools.highlightLinks ? 'on' : 'off');
    root.setAttribute('data-a11y-contrast', this.tools.highContrast ? 'high' : 'off');
    root.setAttribute('data-a11y-motion', this.tools.stopAnimation ? 'off' : 'on');
    root.setAttribute('data-a11y-text', this.tools.textSize === 'large' ? 'large' : this.tools.textSize === 'extra-large' ? 'xl' : 'off');
    root.setAttribute('data-a11y-space', this.tools.spacing === 'increased' ? 'more' : 'off');
    root.setAttribute('data-a11y-font', this.tools.readableFont ? 'readable' : 'off');
    root.setAttribute('data-a11y-images', this.tools.hideImages ? 'hide' : 'off');
    root.setAttribute('data-a11y-headings', this.tools.highlightHeadings ? 'on' : 'off');
    this.syncGuide();
    this.syncMask();
    try {
      localStorage.setItem('accessibilityTools', JSON.stringify(this.tools));
    } catch {
      /* private */
    }
  }

  submitReport(): void {
    this.error = '';
    if (!this.reportForm.name.trim() || !this.reportForm.email.trim() || !this.reportForm.description.trim()) {
      this.error = 'Nombre, correo y descripción son obligatorios.';
      return;
    }
    this.sending = true;
    this.http.post(`${API_URL}/accesibilidad`, this.reportForm).subscribe({
      next: () => {
        this.sending = false;
        this.sent = true;
        this.reportForm = { name: '', email: '', phone: '', assistanceType: 'accessibility', description: '' };
      },
      error: () => {
        this.sending = false;
        this.error = 'No se pudo enviar. Inténtalo de nuevo o escribe a contacto.';
      },
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(event: MouseEvent): void {
    const guide = document.getElementById('a11y-reading-guide');
    if (guide) {
      guide.style.top = `${event.clientY}px`;
    }
    const mask = document.getElementById('a11y-window-mask');
    if (mask) {
      mask.style.setProperty('--mask-y', `${event.clientY}px`);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.shiftKey && event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.resetTools();
    }
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closePanel();
    }
    if (this.isOpen && event.key === 'Tab' && this.dialog) {
      this.trap(event);
    }
  }

  ngOnInit(): void {
    let saved: string | null = null;
    try {
      saved = typeof window === 'undefined' ? null : window.localStorage.getItem('accessibilityTools');
    } catch {
      return;
    }
    if (!saved) {
      return;
    }
    try {
      this.tools = { ...this.tools, ...JSON.parse(saved) };
      this.apply();
    } catch {
      try {
        window.localStorage.removeItem('accessibilityTools');
      } catch {
        /* private */
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.getElementById('a11y-reading-guide')?.remove();
    document.getElementById('a11y-window-mask')?.remove();
  }

  private trap(event: KeyboardEvent): void {
    const nodes = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, select'
    );
    if (!nodes?.length) {
      return;
    }
    const list = Array.from(nodes).filter((el) => !el.hasAttribute('disabled'));
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private syncGuide(): void {
    document.getElementById('a11y-reading-guide')?.remove();
    if (!this.tools.readingGuide) {
      return;
    }
    const guide = document.createElement('div');
    guide.id = 'a11y-reading-guide';
    guide.setAttribute('aria-hidden', 'true');
    document.body.appendChild(guide);
  }

  private syncMask(): void {
    document.getElementById('a11y-window-mask')?.remove();
    if (!this.tools.windowMask) {
      return;
    }
    const mask = document.createElement('div');
    mask.id = 'a11y-window-mask';
    mask.setAttribute('aria-hidden', 'true');
    document.body.appendChild(mask);
  }
}
