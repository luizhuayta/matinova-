import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cyber-card',
  standalone: true,
  imports: [RouterModule],
  template: `
    <article class="cyber-card" [class.cyber-card--elevated]="tone() === 'elevated'">
      @if (image()) {
        <img class="cyber-card__image" [src]="image()" alt="" loading="lazy" decoding="async">
      }
      <div class="cyber-card__body">
        @if (icon()) {
          <span class="cyber-card__icon" aria-hidden="true">
            @if (icon().startsWith('bi-')) {
              <i [class]="icon()"></i>
            } @else {
              <svg class="ui-icon"><use [attr.href]="'assets/icons/ui.svg#' + icon()"></use></svg>
            }
          </span>
        }
        @if (title()) {
          <h3 class="cyber-card__title">{{ title() }}</h3>
        }
        @if (text()) {
          <p class="cyber-card__text">{{ text() }}</p>
        }
        <ng-content></ng-content>
        @if (href()) {
          @if (isInternal()) {
            <a class="cyber-card__link" [routerLink]="href()">Ver más</a>
          } @else {
            <a class="cyber-card__link" [href]="href()" target="_blank" rel="noopener">Ver más</a>
          }
        }
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .cyber-card {
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background:
        linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(6, 19, 41, 0) 42%),
        var(--cyber-surface);
      border: 1px solid var(--cyber-border);
      border-radius: calc(var(--cyber-radius) + 2px);
      backdrop-filter: blur(12px);
      box-shadow: var(--cyber-glow), inset 0 1px 0 rgba(248, 250, 252, 0.04);
      color: var(--cyber-text);
      transition: transform 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out;
    }
    .cyber-card:hover {
      transform: translateY(-3px);
      border-color: var(--cyber-border-strong);
      box-shadow: var(--cyber-glow-strong), inset 0 1px 0 rgba(248, 250, 252, 0.06);
    }
    .cyber-card--elevated {
      background:
        linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(6, 19, 41, 0) 42%),
        rgba(6, 19, 41, 0.85);
    }
    .cyber-card__image { width: 100%; height: 180px; object-fit: cover; }
    .cyber-card__body { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.25rem; }
    .cyber-card__icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--cyber-blue), #0056b3);
      color: #fff;
      font-size: 1.25rem;
    }
    .cyber-card__title { margin: 0; font-size: 1.1rem; color: var(--cyber-text); }
    .cyber-card__text { margin: 0; color: var(--cyber-muted); font-size: 0.95rem; line-height: 1.6; }
    .cyber-card__link { color: var(--cyber-cyan); font-weight: 600; text-decoration: none; }
    .cyber-card__link:hover { color: #fff; }
    @media (prefers-reduced-motion: reduce) {
      .cyber-card { transition: none; }
      .cyber-card:hover { transform: none; }
    }
    @media (forced-colors: active) {
      .cyber-card { border-color: CanvasText; box-shadow: none; backdrop-filter: none; }
    }
  `],
})
export class CyberCard {
  readonly icon = input('');
  readonly title = input('');
  readonly text = input('');
  readonly href = input('');
  readonly image = input('');
  readonly tone = input<'default' | 'elevated'>('default');

  isInternal(): boolean {
    return this.href().startsWith('/');
  }
}
