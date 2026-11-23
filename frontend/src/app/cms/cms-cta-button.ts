import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicButton } from '../components/public/public-button';
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
        [ngClass]="cssClass()"
        [routerLink]="href()"
        [cmsText]="textPath()"
        [cmsLink]="linkPath()"
        [attr.aria-label]="ariaLabel()">
        <ng-content />
      </a>
    } @else if (visible() && href() && live()) {
      <a
        publicBtn
        [tone]="tone()"
        [ngClass]="cssClass()"
        [href]="href()"
        [cmsText]="textPath()"
        [cmsLink]="linkPath()"
        [attr.aria-label]="ariaLabel()">
        <ng-content />
      </a>
    }
  `,
})
export class CmsCtaButton {
  readonly href = input('');
  readonly textPath = input('');
  readonly linkPath = input('');
  readonly tone = input<'primary' | 'navy' | 'accent' | 'ghost' | 'soft'>('primary');
  readonly cssClass = input('');
  readonly ariaLabel = input('Hablar con un experto de Matt Innova');
  readonly show = input(true);
  readonly visible = computed(() => this.show() && !!this.href());
  readonly internal = computed(() => isInternalLink(this.href()));
  readonly live = computed(() => isLiveHref(this.href()));
}
