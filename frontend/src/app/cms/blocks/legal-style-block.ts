import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsRichDirective } from '../cms-rich.directive';
import { CmsBlock, propsPath } from '../block-registry';

@Component({
  selector: 'app-legal-style-block',
  standalone: true,
  imports: [CommonModule, CmsTextDirective, CmsRichDirective],
  template: `
    <div class="privacidad-container">
      <div class="container">
        <div class="header-section">
          <h1 [cmsText]="path('title')"></h1>
          @if (props()['lastUpdated']) {
            <p class="last-updated">Última actualización: <span [cmsText]="path('lastUpdated')"></span></p>
          }
        </div>
        <div class="content-section" [cmsRich]="path('body')"></div>
      </div>
    </div>
  `,
  styleUrl: '../../pages/privacidad/privacidad.scss',
})
export class LegalStyleBlock {
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);

  path(field: string): string {
    return propsPath(this.index(), field);
  }
}
