import { Component, input } from '@angular/core';

export type PublicButtonTone = 'primary' | 'navy' | 'accent' | 'ghost' | 'soft';
export type PublicButtonIcon = 'arrow' | 'play' | 'none';

@Component({
  selector: 'a[publicBtn], button[publicBtn]',
  standalone: true,
  template: '<ng-content />',
  host: {
    class: 'public-btn',
    '[class.public-btn--navy]': 'tone() === "navy"',
    '[class.public-btn--accent]': 'tone() === "accent"',
    '[class.public-btn--ghost]': 'tone() === "ghost"',
    '[class.public-btn--soft]': 'tone() === "soft"',
    '[attr.data-button-icon]': 'buttonIcon()',
  },
  styles: [`
    :host(.public-btn) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      min-block-size: 44px;
      padding: 0.65rem 1.3rem;
      border: 1px solid var(--action-border, color-mix(in srgb, var(--cyber-cyan) 48%, transparent));
      border-radius: 999px;
      /* El relleno saturado conserva AA bajo el texto. El brillo cian queda en el borde. */
      background: var(--action-fill, linear-gradient(105deg in srgb, #006bff, #007caf));
      color: #fff;
      font: 600 1rem/1.35 var(--font-display);
      text-align: center;
      text-decoration: none;
      box-shadow: var(--action-glow,
        0 0 20px color-mix(in srgb, var(--cyber-blue) 38%, transparent),
        inset 0 1px 0 color-mix(in srgb, var(--cyber-cyan) 60%, transparent));
      cursor: pointer;
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }
    :host(.public-btn.public-btn--ghost) {
      background: var(--action-outline-fill, transparent);
      border-color: var(--action-outline-ink, var(--cyber-cyan));
      color: var(--action-outline-ink, var(--cyber-text));
      box-shadow: none;
    }
    :host(.public-btn:hover:not(:disabled)) {
      color: #fff;
      border-color: var(--action-border, var(--cyber-cyan));
      box-shadow: var(--action-glow, var(--cyber-glow-strong));
      transform: translateY(-2px);
    }
    :host(.public-btn--ghost:hover:not(:disabled)) {
      color: var(--action-outline-ink, #fff);
      border-color: var(--action-outline-ink, var(--cyber-cyan));
    }
    :host(.public-btn:active:not(:disabled)) {
      box-shadow: none;
      transform: translateY(1px);
    }
    :host(.public-btn:focus-visible) {
      outline: 2px solid var(--action-outline, var(--cyber-cyan));
      outline-offset: 4px;
      box-shadow: var(--action-focus-shadow, var(--action-glow, var(--cyber-glow)));
    }
    :host(.public-btn:disabled) {
      opacity: 0.58;
      cursor: not-allowed;
    }
    :host([data-button-icon="arrow"])::after {
      content: '';
      flex: none;
      inline-size: 1.05em;
      block-size: 1.05em;
      background: currentColor;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12h15m-6-6 6 6-6 6'/%3E%3C/svg%3E") center / contain no-repeat;
    }
    :host([data-button-icon="play"])::before {
      content: '';
      flex: none;
      inline-size: 1.5em;
      block-size: 1.5em;
      background: currentColor;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='11' stroke='black' fill='none'/%3E%3Cpath d='M9 7l8 5-8 5z'/%3E%3C/svg%3E") center / contain no-repeat;
    }
    :host-context(html[data-a11y-contrast="high"]) {
      --action-fill: #000;
      --action-border: #fff;
      --action-glow: none;
      --action-outline-fill: #fff;
      --action-outline-ink: #000;
      --action-outline: #fff;
      --action-focus-shadow: 0 0 0 7px #000;
    }
    @media (1024px <= width < 1440px) {
      /* Compensa el zoom de escritorio del shell público. */
      :host(.public-btn) { min-block-size: 52px; }
    }
    @media (prefers-reduced-motion: reduce) {
      :host(.public-btn) { transition: none; }
      :host(.public-btn:hover:not(:disabled)), :host(.public-btn:active:not(:disabled)) { transform: none; }
    }
    @media (forced-colors: active) {
      :host(.public-btn) { border-color: ButtonText; }
      :host(.public-btn:focus-visible) { outline-color: Highlight; }
      :host([data-button-icon])::before, :host([data-button-icon])::after {
        forced-color-adjust: none;
        background-color: ButtonText;
      }
    }
  `],
})
export class PublicButton {
  readonly tone = input<PublicButtonTone>('primary');
  readonly buttonIcon = input<PublicButtonIcon>('none');
}
