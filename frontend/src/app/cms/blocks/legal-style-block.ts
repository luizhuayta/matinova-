import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsRichDirective } from '../cms-rich.directive';
import { CmsBlock, propsPath } from '../block-registry';
import { LocaleService } from '../locale.service';
import { PageHeader } from '../../components/ui/page-header';
import { HudDivider } from '../../components/ui/hud-divider';

@Component({
  selector: 'app-legal-style-block',
  standalone: true,
  imports: [CommonModule, CmsTextDirective, CmsRichDirective, PageHeader, HudDivider],
  template: `
    <app-page-header align="left" background="none">
      <h1 page-title class="cyber-page-header__title" [cmsText]="path('title')"></h1>
      @if (props()['lastUpdated']) {
        <p page-text class="cyber-page-header__text">{{ isEn() ? 'Last updated:' : 'Última actualización:' }} <span [cmsText]="path('lastUpdated')"></span></p>
      }
    </app-page-header>
    <div class="legal-shell">
      <app-hud-divider />
      <div class="content-section" [cmsRich]="path('body')"></div>
    </div>
  `,
})
export class LegalStyleBlock {
  private locales = inject(LocaleService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  isEn = computed(() => this.locales.locale() === 'en');

  path(field: string): string {
    return propsPath(this.index(), field);
  }
}
