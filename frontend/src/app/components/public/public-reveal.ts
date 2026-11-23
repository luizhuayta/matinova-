import { afterNextRender, Directive, ElementRef, inject, input, OnDestroy, signal } from '@angular/core';
import { allowPublicMotion } from '../../cms/public-motion';

@Directive({
  selector: '[appReveal], [publicReveal]',
  standalone: true,
  host: {
    class: 'public-reveal',
    '[class.is-pending]': 'pending()',
    '[class.is-in]': 'shown()',
    '[style.--reveal-delay]': 'delay()',
  },
})
export class PublicReveal implements OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  readonly delay = input('0ms');
  readonly pending = signal(false);
  readonly shown = signal(false);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const a11yOff = document.documentElement.getAttribute('data-a11y-motion') === 'off';
      if (!allowPublicMotion(true, false, reduced, a11yOff) || typeof IntersectionObserver === 'undefined') {
        this.shown.set(true);
        return;
      }
      this.pending.set(true);
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.shown.set(true);
          this.pending.set(false);
          this.observer?.disconnect();
        }
      }, { threshold: 0.08, rootMargin: '80px 0px 12% 0px' });
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
