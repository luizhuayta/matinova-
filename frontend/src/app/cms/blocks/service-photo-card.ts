import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsEditorService } from '../cms-editor.service';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsTextDirective } from '../cms-text.directive';
import { isInternalHref } from '../block-presenters';
import { displayPhotoSrc, webpSrcset } from '../public-url';

@Component({
  selector: 'app-service-photo-card',
  standalone: true,
  imports: [RouterLink, CmsImageDirective, CmsLinkDirective, CmsTextDirective],
  templateUrl: './service-photo-card.html',
  styleUrl: './service-photo-card.scss',
})
export class ServicePhotoCard {
  readonly editor = inject(CmsEditorService);
  readonly field = input.required<string>();
  readonly image = input('');
  readonly alt = input('');
  readonly icon = input.required<string>();
  readonly href = input.required<string>();
  readonly title = input('');
  readonly linkLabel = input.required<string>();
  readonly linkField = input.required<'link' | 'path'>();
  readonly editableLabel = input(false);
  readonly photo = computed(() => displayPhotoSrc(this.image()));
  readonly webp = computed(() => webpSrcset(this.image()));
  readonly internal = computed(() => isInternalHref(this.href()));

  path(property: string): string {
    return `${this.field()}.${property}`;
  }
}
