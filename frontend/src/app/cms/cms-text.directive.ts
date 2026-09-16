import { Directive, ElementRef, HostListener, OnDestroy, OnInit, effect, inject, input } from '@angular/core';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { CmsSelectionService } from './cms-selection.service';

@Directive({
  selector: '[cmsText]',
  standalone: true,
})
export class CmsTextDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  private selection = inject(CmsSelectionService);
  readonly cmsText = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');

  constructor() {
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

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.dataset['cmsField'] = this.cmsText();
    this.selection.register(this.cmsText(), node);
  }

  ngOnDestroy(): void {
    const node = this.el.nativeElement;
    this.selection.unregister(this.cmsText(), node);
    node.classList.remove('cms-editable', 'cms-placeholder', 'cms-selected');
  }

  @HostListener('mouseenter')
  onEnter(): void {
    if (this.editor.editMode()) {
      this.selection.hover(this.cmsText());
    }
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.selection.leave(this.cmsText());
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.editor.editMode()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.selection.selectFromPreview(this.cmsText());
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
