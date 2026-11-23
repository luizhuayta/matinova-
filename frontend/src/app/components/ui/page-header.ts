import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header
      class="cyber-page-header"
      [class.cyber-page-header--center]="align() === 'center'"
      [class.cyber-page-header--grid]="background() === 'grid'">
      <span class="cyber-page-header__corner cyber-page-header__corner--tl cyber-dot-grid" aria-hidden="true"></span>
      <span class="cyber-page-header__corner cyber-page-header__corner--br cyber-dot-grid" aria-hidden="true"></span>
      <div class="cyber-page-header__inner">
        @if (eyebrow()) {
          <p class="cyber-eyebrow">{{ eyebrow() }}</p>
        }
        @if (title()) {
          <h1 class="cyber-page-header__title">
            @for (part of titleParts(); track $index) {
              <span [class.cyber-gradient-text]="part.accent">{{ part.text }}</span>
            }
          </h1>
        } @else {
          <ng-content select="[page-title]"></ng-content>
        }
        @if (text()) {
          <p class="cyber-page-header__text">{{ text() }}</p>
        } @else {
          <ng-content select="[page-text]"></ng-content>
        }
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .cyber-page-header {
      position: relative;
      overflow: hidden;
      padding: clamp(3rem, 6vw, 5rem) 0;
      background: var(--cyber-bg);
      color: var(--cyber-text);
      border-bottom: 1px solid var(--cyber-border);
    }
    .cyber-page-header--grid {
      background-image:
        linear-gradient(180deg, rgba(3, 11, 26, 0.72), rgba(3, 11, 26, 0.92)),
        url('/images/redesign/subpage-grid-bg.webp');
      background-size: cover;
      background-position: center;
    }
    .cyber-page-header__inner {
      position: relative;
      z-index: 1;
      width: min(1120px, calc(100% - 2.5rem));
      margin-inline: auto;
    }
    .cyber-page-header--center .cyber-page-header__inner { text-align: center; }
    .cyber-page-header__title {
      margin: 0 0 1rem;
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: var(--cyber-text);
    }
    .cyber-page-header__text {
      margin: 0;
      max-width: 60ch;
      color: var(--cyber-muted);
    }
    .cyber-page-header--center .cyber-page-header__text { margin-inline: auto; }
    .cyber-page-header__corner {
      position: absolute;
      width: 140px;
      height: 140px;
      opacity: 0.5;
      pointer-events: none;
    }
    .cyber-page-header__corner--tl { top: 0; left: 0; }
    .cyber-page-header__corner--br { bottom: 0; right: 0; }
  `],
})
export class PageHeader {
  readonly eyebrow = input('');
  readonly title = input('');
  readonly accent = input('');
  readonly text = input('');
  readonly align = input<'left' | 'center'>('left');
  readonly background = input<'grid' | 'none'>('grid');

  titleParts(): { text: string; accent: boolean }[] {
    const title = this.title();
    if (!title) {
      return [];
    }
    const accent = this.accent().trim();
    if (!accent) {
      return [{ text: title, accent: false }];
    }
    const index = title.toLowerCase().indexOf(accent.toLowerCase());
    if (index < 0) {
      return [{ text: title, accent: false }];
    }
    const before = title.slice(0, index);
    const match = title.slice(index, index + accent.length);
    const after = title.slice(index + accent.length);
    return [
      ...(before ? [{ text: before, accent: false }] : []),
      { text: match, accent: true },
      ...(after ? [{ text: after, accent: false }] : []),
    ];
  }
}
