import { Directive, ElementRef, HostListener, OnDestroy, OnInit, effect, inject, input } from '@angular/core';
import type QuillType from 'quill';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { CmsSelectionService } from './cms-selection.service';
import { bindQuillPaste, CMS_QUILL_TOOLBAR } from './cms-quill';

@Directive({
  selector: '[cmsRich]',
  standalone: true,
})
export class CmsRichDirective implements OnDestroy, OnInit {
  private el = inject(ElementRef<HTMLElement>);
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  private selection = inject(CmsSelectionService);
  readonly cmsRich = input.required<string>();
  private quill: QuillType | null = null;
  private applying = false;

  constructor() {
    effect(() => {
      const path = this.cmsRich();
      const html = this.cms.get<string>(path) ?? '';
      const edit = this.editor.editMode();
      if (edit) {
        void this.mountQuill();
        const host = this.el.nativeElement;
        const focused = host.contains(document.activeElement);
        if (this.quill && !this.applying && !focused && this.quill.root.innerHTML !== html) {
          this.applying = true;
          this.quill.clipboard.dangerouslyPasteHTML(html);
          this.applying = false;
        }
      } else {
        this.unmountQuill();
        this.el.nativeElement.innerHTML = html;
      }
    });
  }

  ngOnInit(): void {
    this.selection.register(this.cmsRich(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.selection.unregister(this.cmsRich(), this.el.nativeElement);
    this.unmountQuill();
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.editor.editMode()) {
      return;
    }
    event.stopPropagation();
    this.selection.selectFromPreview(this.cmsRich());
  }

  private async mountQuill(): Promise<void> {
    if (this.quill) {
      return;
    }
    const host = this.el.nativeElement;
    host.classList.add('cms-editable', 'cms-rich');
    const { default: Quill } = await import('quill');
    if (this.quill || !this.editor.editMode()) {
      return;
    }
    this.quill = new Quill(host, {
      theme: 'snow',
      modules: {
        toolbar: CMS_QUILL_TOOLBAR,
      },
    });
    bindQuillPaste(this.quill);
    this.quill.on('text-change', () => {
      if (this.applying || !this.editor.editMode()) {
        return;
      }
      this.cms.set(this.cmsRich(), this.quill?.root.innerHTML ?? '');
    });
  }

  private unmountQuill(): void {
    const host = this.el.nativeElement;
    host.classList.remove('cms-editable', 'cms-rich');
    if (!this.quill) {
      return;
    }
    const html = this.quill.root.innerHTML;
    const toolbar = host.parentElement?.querySelector('.ql-toolbar');
    toolbar?.remove();
    this.quill = null;
    host.classList.remove('ql-container', 'ql-snow');
    host.innerHTML = html;
  }
}
