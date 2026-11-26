import { PLATFORM_ID, Directive, ElementRef, NgZone, OnDestroy, effect, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CountUpParts {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  groupSeparator: string;
  decimalSeparator: string;
}

export function parseCountUp(raw: unknown): CountUpParts | null {
  const text = String(raw ?? '').trim();
  const match = text.match(/^([^0-9]*)([0-9]+(?:[.,][0-9]+)*)([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const [, prefix, numeric, suffix] = match;
  const thousands = numeric.match(/^([0-9]{1,3})(?:([.,])[0-9]{3})+$/);
  if (thousands) {
    const separator = numeric.includes(',') ? ',' : '.';
    return {
      prefix,
      suffix,
      target: Number(numeric.replace(/[.,]/g, '')),
      decimals: 0,
      groupSeparator: separator,
      decimalSeparator: '.',
    };
  }

  if (!/^[0-9]+$/.test(numeric)) {
    return null;
  }
  return {
    prefix,
    suffix,
    target: Number(numeric),
    decimals: 0,
    groupSeparator: '',
    decimalSeparator: '.',
  };
}

export function formatCountUp(parts: CountUpParts, value: number): string {
  let body: string;
  if (parts.decimals > 0) {
    body = value.toFixed(parts.decimals).replace('.', parts.decimalSeparator);
  } else {
    body = String(Math.round(value));
  }

  if (parts.groupSeparator) {
    const [integer, fraction] = body.split(parts.decimalSeparator);
    body = integer.replace(/\B(?=(\d{3})+(?!\d))/g, parts.groupSeparator) + (fraction ? parts.decimalSeparator + fraction : '');
  }
  return `${parts.prefix}${body}${parts.suffix}`;
}

function visuallyHiddenStyle(el: HTMLElement): void {
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.padding = '0';
  el.style.margin = '-1px';
  el.style.overflow = 'hidden';
  el.style.clip = 'rect(0 0 0 0)';
  el.style.whiteSpace = 'nowrap';
  el.style.border = '0';
}

@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnDestroy {
  readonly appCountUp = input.required<unknown>();
  readonly countUpDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;
  private frame = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private animated?: HTMLElement;
  private state: 'idle' | 'waiting' | 'running' | 'done' = 'idle';

  constructor() {
    effect(() => {
      const value = this.appCountUp();
      this.countUpDelay();
      this.prepare(String(value ?? ''));
    });
  }

  ngOnDestroy(): void {
    this.cancelWork();
    this.observer?.disconnect();
  }

  private prepare(text: string): void {
    if (!this.isBrowser) {
      return;
    }
    this.cancelWork();
    this.observer?.disconnect();
    const host = this.el.nativeElement;
    const parts = parseCountUp(text);
    if (!parts || this.prefersReducedMotion() || this.state === 'running' || this.state === 'done') {
      this.state = this.state === 'running' || this.state === 'done' ? 'done' : 'idle';
      this.renderPlain(text);
      return;
    }

    this.buildAccessibleStructure(host, text);
    this.state = 'waiting';
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        this.observer?.disconnect();
        if (this.animated) {
          this.animated.textContent = formatCountUp(parts, 0);
        }
        this.timer = setTimeout(() => this.start(parts), this.countUpDelay());
      }, { threshold: 0.2 });
      this.observer.observe(host);
    });
  }

  private start(parts: CountUpParts): void {
    if (this.state !== 'waiting' || !this.animated) {
      return;
    }
    this.state = 'running';
    const duration = 1600;
    const started = performance.now();
    const tick = (now: number) => {
      if (!this.animated) {
        return;
      }
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animated.textContent = formatCountUp(parts, parts.target * eased);
      if (progress < 1) {
        this.frame = requestAnimationFrame(tick);
      } else {
        this.animated.textContent = formatCountUp(parts, parts.target);
        this.state = 'done';
      }
    };
    this.animated.textContent = formatCountUp(parts, 0);
    this.frame = requestAnimationFrame(tick);
  }

  private buildAccessibleStructure(host: HTMLElement, finalText: string): void {
    host.textContent = '';
    host.style.fontVariantNumeric = 'tabular-nums';
    host.style.display = 'inline-block';
    host.style.minWidth = `${Math.max(finalText.length, 1)}ch`;

    this.animated = document.createElement('span');
    this.animated.setAttribute('aria-hidden', 'true');
    this.animated.dataset['countupValue'] = '';
    this.animated.textContent = finalText;

    const readable = document.createElement('span');
    readable.dataset['countupFinal'] = '';
    readable.textContent = finalText;
    visuallyHiddenStyle(readable);

    host.append(this.animated, readable);
  }

  private renderPlain(text: string): void {
    const host = this.el.nativeElement;
    host.textContent = text;
    host.style.fontVariantNumeric = 'tabular-nums';
    host.style.removeProperty('display');
    host.style.removeProperty('min-width');
    host.removeAttribute('aria-label');
    this.animated = undefined;
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.getAttribute('data-a11y-motion') === 'off';
  }

  private cancelWork(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
