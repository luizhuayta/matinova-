import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const AE_CLASSES = [
  'ae-focus',
  'ae-large-cursor',
  'ae-highlight-links',
  'ae-high-contrast',
  'ae-color-shift',
  'ae-stop-animation',
  'ae-text-large',
  'ae-text-extra-large',
  'ae-spacing-increased',
  'ae-dyslexic-font',
  'ae-reading-guide',
  'ae-window-mask',
  'ae-hide-images',
  'ae-highlight-headings',
  'ae-invert-colors',
];

const AE_PROPS = [
  'cursor',
  'background-color',
  'color',
  'font-size',
  'font-family',
  'letter-spacing',
  'line-height',
  'word-spacing',
  'filter',
  'animation',
  'transition',
  'border',
  'border-radius',
  'padding',
  'display',
  'visibility',
  '--hue-rotate',
];

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accesibility.html',
  styleUrls: ['./accesibility.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AccessibilityComponent implements OnInit, OnDestroy {
  isOpen = false;
  activeTab: 'report' | 'tools' = 'tools';

  reportForm = {
    name: '',
    email: '',
    phone: '',
    assistanceType: '',
    description: '',
  };

  accessibilityTools = {
    focus: false,
    largeCursor: false,
    highlightLinks: false,
    highContrast: false,
    colorShift: false,
    stopAnimation: false,
    textSize: 'normal' as 'normal' | 'large' | 'extra-large',
    spacing: 'normal' as 'normal' | 'increased',
    dyslexicFont: false,
    readingGuide: false,
    windowMask: false,
    hideImages: false,
    highlightHeadings: false,
    invertColors: false,
  };

  togglePanel() {
    this.isOpen = !this.isOpen;
  }

  closePanel() {
    this.isOpen = false;
  }

  toggleTool(tool: string) {
    (this.accessibilityTools as any)[tool] = !(this.accessibilityTools as any)[tool];
    this.applyTools();
  }

  toggleTextSize() {
    if (this.accessibilityTools.textSize === 'normal') {
      this.accessibilityTools.textSize = 'large';
    } else if (this.accessibilityTools.textSize === 'large') {
      this.accessibilityTools.textSize = 'extra-large';
    } else {
      this.accessibilityTools.textSize = 'normal';
    }
    this.applyTools();
  }

  toggleSpacing() {
    this.accessibilityTools.spacing = this.accessibilityTools.spacing === 'normal' ? 'increased' : 'normal';
    this.applyTools();
  }

  applyTools() {
    if (typeof document === 'undefined') {
      return;
    }

    const body = document.body;
    const html = document.documentElement;

    this.resetDom();

    if (this.accessibilityTools.highContrast) {
      body.classList.add('ae-high-contrast');
      html.classList.add('ae-high-contrast');
      this.aeSet(body, 'background-color', '#000000');
      this.aeSet(body, 'color', '#ffffff');
      this.aeSet(html, 'background-color', '#000000');
      this.aeSet(html, 'color', '#ffffff');
    }

    if (this.accessibilityTools.largeCursor) {
      body.classList.add('ae-large-cursor');
      html.classList.add('ae-large-cursor');
      const cursorSvg =
        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"48\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23ff6600\" stroke-width=\"3\"><path d=\"M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z\"/></svg>') 0 24, auto";
      this.aeSet(body, 'cursor', cursorSvg);
      this.aeSet(html, 'cursor', cursorSvg);
    }

    if (this.accessibilityTools.highlightLinks) {
      body.classList.add('ae-highlight-links');
      html.classList.add('ae-highlight-links');
      document.querySelectorAll('a, button').forEach((node) => {
        if (this.isProtected(node)) {
          return;
        }
        const el = node as HTMLElement;
        this.aeSet(el, 'background-color', 'rgba(255, 102, 0, 0.3)');
        this.aeSet(el, 'border', '3px solid #ff6600');
        this.aeSet(el, 'border-radius', '6px');
        this.aeSet(el, 'padding', '4px 8px');
      });
    }

    if (this.accessibilityTools.textSize === 'large') {
      body.classList.add('ae-text-large');
      html.classList.add('ae-text-large');
      this.aeSet(body, 'font-size', '1.3rem');
      this.aeSet(html, 'font-size', '1.3rem');
    } else if (this.accessibilityTools.textSize === 'extra-large') {
      body.classList.add('ae-text-large', 'ae-text-extra-large');
      html.classList.add('ae-text-large', 'ae-text-extra-large');
      this.aeSet(body, 'font-size', '1.6rem');
      this.aeSet(html, 'font-size', '1.6rem');
    }

    if (this.accessibilityTools.focus) {
      body.classList.add('ae-focus');
      html.classList.add('ae-focus');
      const style = document.createElement('style');
      style.id = 'ae-focus-styles';
      style.textContent = `
        *:focus {
          outline: 4px solid #ff6600 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 6px rgba(255, 102, 0, 0.3) !important;
        }
      `;
      document.head.appendChild(style);
    }

    if (this.accessibilityTools.colorShift) {
      body.classList.add('ae-color-shift');
      html.classList.add('ae-color-shift');
      this.aeSet(body, 'filter', 'hue-rotate(180deg)');
      this.aeSet(html, 'filter', 'hue-rotate(180deg)');
      this.floatingButtons().forEach((el) => {
        this.aeSet(el, 'filter', 'none');
      });
    }

    if (this.accessibilityTools.stopAnimation) {
      body.classList.add('ae-stop-animation');
      html.classList.add('ae-stop-animation');
      document.querySelectorAll('*').forEach((node) => {
        if (this.isProtected(node)) {
          return;
        }
        const el = node as HTMLElement;
        this.aeSet(el, 'animation', 'none');
        this.aeSet(el, 'transition', 'none');
      });
    }

    if (this.accessibilityTools.spacing === 'increased') {
      body.classList.add('ae-spacing-increased');
      html.classList.add('ae-spacing-increased');
      this.aeSet(body, 'letter-spacing', '0.15em');
      this.aeSet(body, 'line-height', '1.8');
      this.aeSet(html, 'letter-spacing', '0.15em');
      this.aeSet(html, 'line-height', '1.8');
    }

    if (this.accessibilityTools.dyslexicFont) {
      body.classList.add('ae-dyslexic-font');
      html.classList.add('ae-dyslexic-font');
      this.aeSet(body, 'font-family', 'Comic Sans MS, Chalkboard SE, Arial, sans-serif');
      this.aeSet(html, 'font-family', 'Comic Sans MS, Chalkboard SE, Arial, sans-serif');
    }

    if (this.accessibilityTools.readingGuide) {
      body.classList.add('ae-reading-guide');
      html.classList.add('ae-reading-guide');
      const guide = document.createElement('div');
      guide.id = 'ae-reading-guide';
      guide.setAttribute('aria-hidden', 'true');
      guide.style.cssText = `
        position: fixed;
        top: 50%;
        left: 0;
        right: 0;
        height: 4px;
        background: #ff6600;
        z-index: 10003;
        pointer-events: none;
        opacity: 0.7;
        transform: translateY(-50%);
      `;
      document.body.appendChild(guide);
    }

    if (this.accessibilityTools.windowMask) {
      body.classList.add('ae-window-mask');
      html.classList.add('ae-window-mask');
      const mask = document.createElement('div');
      mask.id = 'ae-window-mask';
      mask.setAttribute('aria-hidden', 'true');
      mask.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 9998;
        pointer-events: none;
      `;
      document.body.appendChild(mask);
    }

    if (this.accessibilityTools.hideImages) {
      body.classList.add('ae-hide-images');
      html.classList.add('ae-hide-images');
      document.querySelectorAll('img, svg, picture').forEach((node) => {
        if (this.isProtected(node)) {
          return;
        }
        const el = node as HTMLElement;
        this.aeSet(el, 'display', 'none');
        this.aeSet(el, 'visibility', 'hidden');
      });
    }

    if (this.accessibilityTools.highlightHeadings) {
      body.classList.add('ae-highlight-headings');
      html.classList.add('ae-highlight-headings');
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((node) => {
        if (this.isProtected(node)) {
          return;
        }
        const el = node as HTMLElement;
        this.aeSet(el, 'background-color', 'rgba(255, 102, 0, 0.3)');
        this.aeSet(el, 'border', '3px solid #ff6600');
        this.aeSet(el, 'border-radius', '8px');
        this.aeSet(el, 'padding', '8px 12px');
      });
    }

    if (this.accessibilityTools.invertColors) {
      body.classList.add('ae-invert-colors');
      html.classList.add('ae-invert-colors');
      this.aeSet(body, 'filter', 'invert(1)');
      this.aeSet(html, 'filter', 'invert(1)');
      this.floatingButtons().forEach((el) => {
        this.aeSet(el, 'filter', 'none');
      });
    }

    try {
      localStorage.setItem('accessibilityTools', JSON.stringify(this.accessibilityTools));
    } catch {
      /* modo privado */
    }
  }

  resetTools() {
    this.accessibilityTools = {
      focus: false,
      largeCursor: false,
      highlightLinks: false,
      highContrast: false,
      colorShift: false,
      stopAnimation: false,
      textSize: 'normal',
      spacing: 'normal',
      dyslexicFont: false,
      readingGuide: false,
      windowMask: false,
      hideImages: false,
      highlightHeadings: false,
      invertColors: false,
    };
    try {
      localStorage.removeItem('accessibilityTools');
    } catch {
      /* modo privado */
    }
    this.applyTools();
  }

  submitReport() {
    alert('Gracias por tu reporte. Nos pondremos en contacto contigo pronto.');
    this.reportForm = {
      name: '',
      email: '',
      phone: '',
      assistanceType: '',
      description: '',
    };
    this.closePanel();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.moveGuide(event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    const y = event.touches[0]?.clientY;
    if (y != null) {
      this.moveGuide(y);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (event.shiftKey && event.key === 'R') {
      event.preventDefault();
      this.resetTools();
    }
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closePanel();
    }
  }

  ngOnInit() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const savedTools = localStorage.getItem('accessibilityTools');
    if (!savedTools) {
      return;
    }
    try {
      this.accessibilityTools = { ...this.accessibilityTools, ...JSON.parse(savedTools) };
      this.accessibilityTools.colorShift = false;
      this.accessibilityTools.invertColors = false;
      this.applyTools();
    } catch {
      localStorage.removeItem('accessibilityTools');
    }
  }

  ngOnDestroy(): void {
    this.resetDom();
  }

  private resetDom(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const body = document.body;
    const html = document.documentElement;
    this.clearAeMarks();
    body.classList.remove(...AE_CLASSES);
    html.classList.remove(...AE_CLASSES);
    this.clearProps(body);
    this.clearProps(html);
    document.getElementById('ae-reading-guide')?.remove();
    document.getElementById('ae-window-mask')?.remove();
    document.getElementById('ae-focus-styles')?.remove();
  }

  private moveGuide(clientY: number): void {
    const guide = document.getElementById('ae-reading-guide');
    if (guide) {
      guide.style.top = `${clientY}px`;
    }
  }

  private floatingButtons(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        '.accessibility-toggle, .chat-fab, .whatsapp-float, .chatbot-toggle, .whatsapp-bubble'
      )
    );
  }

  private isProtected(el: Element): boolean {
    return Boolean(
      el.closest('app-accessibility') ||
        el.closest('app-chatbot') ||
        el.closest('app-whatsapp-bubble') ||
        el.id === 'ae-reading-guide' ||
        el.id === 'ae-window-mask'
    );
  }

  private aeSet(el: HTMLElement, prop: string, value: string): void {
    el.style.setProperty(prop, value, 'important');
    el.setAttribute('data-ae-tool', '1');
  }

  private clearProps(el: HTMLElement): void {
    AE_PROPS.forEach((prop) => el.style.removeProperty(prop));
    el.removeAttribute('data-ae-tool');
  }

  private clearAeMarks(): void {
    document.querySelectorAll('[data-ae-tool]').forEach((node) => {
      this.clearProps(node as HTMLElement);
    });
  }
}
