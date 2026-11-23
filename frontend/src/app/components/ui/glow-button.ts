import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-glow-button',
  standalone: true,
  imports: [RouterModule],
  template: `
    @if (href()) {
      @if (isInternal()) {
        <a class="cyber-glow-button" [class.cyber-glow-button--ghost]="tone() === 'ghost'" [routerLink]="href()">
          <ng-content></ng-content>@if (label()) { {{ label() }} }
        </a>
      } @else {
        <a class="cyber-glow-button" [class.cyber-glow-button--ghost]="tone() === 'ghost'" [href]="href()" target="_blank" rel="noopener">
          <ng-content></ng-content>@if (label()) { {{ label() }} }
        </a>
      }
    } @else {
      <button class="cyber-glow-button" [class.cyber-glow-button--ghost]="tone() === 'ghost'" [type]="type()" [disabled]="disabled()">
        <ng-content></ng-content>@if (label()) { {{ label() }} }
      </button>
    }
  `,
  styles: [`
    .cyber-glow-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 44px;
      padding: 0.7rem 1.4rem;
      border: 1px solid transparent;
      border-radius: 999px;
      background: linear-gradient(180deg, var(--cyber-blue), #0056b3);
      color: #fff;
      font-family: var(--font-display);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      box-shadow: var(--cyber-glow);
      transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out;
    }
    .cyber-glow-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--cyber-glow-strong);
      color: #fff;
    }
    .cyber-glow-button--ghost {
      background: var(--cyber-surface);
      border-color: var(--cyber-border-strong);
      color: var(--cyber-text);
      box-shadow: none;
      backdrop-filter: blur(8px);
    }
    .cyber-glow-button--ghost:hover {
      border-color: var(--cyber-cyan);
      box-shadow: var(--cyber-glow);
    }
    .cyber-glow-button:disabled { opacity: 0.5; cursor: default; transform: none; }
  `],
})
export class GlowButton {
  readonly href = input('');
  readonly label = input('');
  readonly tone = input<'primary' | 'ghost'>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);

  isInternal(): boolean {
    return this.href().startsWith('/');
  }
}
