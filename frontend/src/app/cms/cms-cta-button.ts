import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicButton, PublicButtonTone } from '../components/public/public-button';
import { CmsLinkDirective } from './cms-link.directive';
import { CmsTextDirective } from './cms-text.directive';
import { isInternalLink } from './block-registry';
import { isLiveHref } from './public-url';

@Component({
  selector: 'app-cms-cta',
  standalone: true,
  imports: [NgClass, RouterModule, PublicButton, CmsTextDirective, CmsLinkDirective],
  template: `
    @if (visible() && href() && internal()) {
      <a
        publicBtn
        [tone]="tone()"
        [buttonIcon]="tone() === 'ghost' ? 'none' : 'arrow'"
        [ngClass]="cssClass()"
        [routerLink]="href()"
        [cmsLink]="linkPath()"
        [attr.aria-label]="ariaLabel()">
        <span [cmsText]="textPath()"></span>
        <ng-content />
      </a>
    } @else if (visible() && href() && live()) {
      <a
        publicBtn
        [tone]="tone()"
        [buttonIcon]="tone() === 'ghost' ? 'none' : 'arrow'"
        [ngClass]="cssClass()"
        [href]="href()"
        [cmsLink]="linkPath()"
        [attr.aria-label]="ariaLabel()">
        <span [cmsText]="textPath()"></span>
        <ng-content />
      </a>
    }
  `,
})
export class CmsCtaButton {
  readonly href = input('');
  readonly textPath = input('');
  readonly linkPath = input('');
  readonly tone = input<PublicButtonTone>('primary');
  readonly cssClass = input('');
  readonly ariaLabel = input<string | null>(null);
  readonly show = input(true);
  readonly visible = computed(() => this.show() && !!this.href());
  readonly internal = computed(() => isInternalLink(this.href()));
  readonly live = computed(() => isLiveHref(this.href()));
}
