import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { CmsLinkDirective } from '../../cms/cms-link.directive';
import { LocaleService } from '../../cms/locale.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective, CmsLinkDirective],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private cms = inject(CmsContentService);
  locales = inject(LocaleService);
  site = computed(() => this.cms.site());
  footer = computed(() => (this.site()['footer'] as Record<string, string>) ?? {});
  nav = computed(() => (this.site()['nav'] as Record<string, string>) ?? {});
  navServices = computed(() => (this.site()['navServices'] as Array<Record<string, string>>) ?? []);
  pathOf(path: string): string {
    return this.locales.prefix(path);
  }
}
