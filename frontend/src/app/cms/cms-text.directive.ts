import { Directive, OnInit, effect, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';

@Directive({
  selector: '[cmsText]',
  standalone: true,
})
export class CmsTextDirective extends CmsEditableHost implements OnInit {
  readonly cmsText = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');

  constructor() {
    super();
    effect(() => {
      const path = this.cmsText();
      this.cms.activeContent();
      this.cms.site();
      const edit = this.editor.editMode();
      const value = (this.cms.get<string>(path, this.cmsScope()) ?? '').trim();
      const node = this.el.nativeElement;
      const placeholder = this.placeholder(path);
      if (edit && !value) {
        node.textContent = placeholder;
        node.classList.add('cms-placeholder');
      } else {
        node.classList.remove('cms-placeholder');
        if (node.textContent !== (this.cms.get<string>(path, this.cmsScope()) ?? '')) {
          node.textContent = this.cms.get<string>(path, this.cmsScope()) ?? '';
        }
      }
      node.classList.toggle('cms-editable', edit);
      node.classList.toggle('cms-selected', edit && this.selection.selectedPath() === path);
      node.dataset['cmsLabel'] = this.selection.label(path);
    });
  }

  protected fieldPath(): string {
    return this.cmsText();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.el.nativeElement.dataset['cmsField'] = this.cmsText();
  }

  private placeholder(path: string): string {
    const leaf = path.split('.').pop() ?? '';
    if (/title|heroTitle/i.test(leaf)) {
      return 'Añadir titular';
    }
    if (/badge|tag/i.test(leaf)) {
      return 'Añadir etiqueta';
    }
    if (/cta|button/i.test(leaf)) {
      return 'Añadir botón';
    }
    return 'Añadir texto';
  }
}
