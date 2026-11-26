import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicButton } from '../public/public-button';

@Component({
  selector: 'app-glow-button',
  standalone: true,
  imports: [RouterModule, PublicButton],
  template: `
    @if (href()) {
      @if (isInternal()) {
        <a publicBtn class="cyber-glow-button" [tone]="tone()" [buttonIcon]="tone() === 'primary' ? 'arrow' : 'none'" [routerLink]="href()">
          <ng-content></ng-content>@if (label()) { {{ label() }} }
        </a>
      } @else {
        <a publicBtn class="cyber-glow-button" [tone]="tone()" [buttonIcon]="tone() === 'primary' ? 'arrow' : 'none'" [href]="href()" target="_blank" rel="noopener">
          <ng-content></ng-content>@if (label()) { {{ label() }} }
        </a>
      }
    } @else {
      <button publicBtn class="cyber-glow-button" [tone]="tone()" [buttonIcon]="tone() === 'primary' ? 'arrow' : 'none'" [type]="type()" [disabled]="disabled()">
        <ng-content></ng-content>@if (label()) { {{ label() }} }
      </button>
    }
  `,
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
