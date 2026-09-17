import { Directive, OnInit, effect, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';

@Directive({
  selector: '[cmsLink]',
  standalone: true,
})
export class CmsLinkDirective extends CmsEditableHost implements OnInit {
  readonly cmsLink = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');

  constructor() {
    super();
    this.clickMode = 'prevent';
    effect(() => {
      const path = this.cmsLink();
      this.cms.activeContent();
      this.cms.site();
      const edit = this.editor.editMode();
      const value = (this.cms.get<string>(path, this.cmsScope()) ?? '').trim();
      const node = this.el.nativeElement;
      if (value && node instanceof HTMLAnchorElement && !edit) {
        node.setAttribute('href', value);
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
