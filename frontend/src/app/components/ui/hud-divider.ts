import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hud-divider',
  standalone: true,
  template: `
    <div class="cyber-hud-divider" role="separator">
      <span class="cyber-divider"></span>
      @if (label()) {
        <span class="cyber-hud-divider__label">{{ label() }}</span>
      }
      <span class="cyber-divider"></span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cyber-hud-divider { display: flex; align-items: center; gap: 1rem; margin: 2rem 0; }
    .cyber-hud-divider .cyber-divider { flex: 1; }
    .cyber-hud-divider__label {
      font-size: 0.75rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--cyber-cyan);
    }
  `],
})
export class HudDivider {
  readonly label = input('');
}
