import { Directive, computed, inject, input } from '@angular/core';
import { isInternalLink } from '../../cms/block-registry';
import { LocaleService } from '../../cms/locale.service';
import { isLiveHref } from '../../cms/public-url';

@Directive({
  selector: 'a[localeLink]',
  standalone: true,
  host: {
    '[attr.href]': 'href() || null',
    '[hidden]': '!visible()',
  },
})
export class LocaleLink {
  private locales = inject(LocaleService);
  readonly localeLink = input.required<string>();

  href = computed(() => {
    const raw = String(this.localeLink() ?? '').trim();
    if (!raw) {
      return '';
    }
    if (isInternalLink(raw)) {
      return this.locales.hrefFor(raw);
    }
    return isLiveHref(raw) ? raw : '';
  });

  visible = computed(() => this.href() !== '');
}
