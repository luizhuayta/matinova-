import { Directive, OnInit, effect, inject, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';
import { LocaleService } from './locale.service';
import { isInternalLink } from './block-registry';
import { isLiveHref } from './public-url';

@Directive({
  selector: '[cmsLink]',
  standalone: true,
})
export class CmsLinkDirective extends CmsEditableHost implements OnInit {
  private locales = inject(LocaleService);
  readonly cmsLink = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');

  constructor() {
    super();
    this.clickMode = 'prevent';
    effect(() => {
      const path = this.cmsLink();
      this.cms.activeContent();
      this.cms.site();
      this.locales.locale();
      const edit = this.editor.editMode();
      const value = (this.cms.get<string>(path, this.cmsScope()) ?? '').trim();
      const node = this.el.nativeElement;
      if (node instanceof HTMLAnchorElement && !edit) {
        const href = isInternalLink(value) ? this.locales.hrefFor(value) : value;
        if (value && (isLiveHref(href) || isInternalLink(value))) {
          node.setAttribute('href', href);
        } else if (!edit) {
          node.removeAttribute('href');
        }
      }
      node.classList.toggle('cms-editable', edit);
      node.classList.toggle('cms-selected', edit && this.selection.selectedPath() === path);
      node.dataset['cmsLabel'] = this.selection.label(path);
    });
  }

  protected fieldPath(): string {
    return this.cmsLink();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.el.nativeElement.dataset['cmsField'] = this.cmsLink();
  }
}
