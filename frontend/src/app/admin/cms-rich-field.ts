import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject, input } from '@angular/core';
import type QuillType from 'quill';
import { CmsContentService } from '../cms/cms-content.service';
import { bindQuillPaste, CMS_QUILL_TOOLBAR } from '../cms/cms-quill';

@Component({
  selector: 'app-cms-rich-field',
  standalone: true,
  template: `
    <div class="cms-panel-rich">
      <div #host></div>
    </div>
  `,
})
export class CmsRichField implements AfterViewInit, OnDestroy {
  @ViewChild('host') host?: ElementRef<HTMLElement>;
  private cms = inject(CmsContentService);
  readonly path = input.required<string>();
  private quill: QuillType | null = null;
  private applying = false;
  private typing = false;

  constructor() {
    effect(() => {
      const html = this.cms.get<string>(this.path()) ?? '';
      if (!this.quill || this.applying) {
        return;
      }
      const focused = this.quill.root.contains(document.activeElement);
      if (!focused && this.quill.root.innerHTML !== html) {
        this.applying = true;
        this.quill.clipboard.dangerouslyPasteHTML(html);
        this.applying = false;
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const host = this.host?.nativeElement;
    if (!host || this.quill) {
      return;
    }
    const { default: Quill } = await import('quill');
    if (this.quill) {
      return;
    }
    const html = this.cms.get<string>(this.path()) ?? '';
    this.quill = new Quill(host, {
      theme: 'snow',
      placeholder: 'Escribe el texto…',
      modules: {
        toolbar: CMS_QUILL_TOOLBAR,
      },
    });
    bindQuillPaste(this.quill);
    this.applying = true;
    this.quill.clipboard.dangerouslyPasteHTML(html);
    this.applying = false;
    this.quill.on('text-change', () => {
      if (this.applying) {
        return;
      }
      this.cms.set(this.path(), this.quill?.root.innerHTML ?? '', 'page', !this.typing);
      this.typing = true;
    });
    this.quill.root.addEventListener('blur', () => {
      this.typing = false;
    });
  }

  ngOnDestroy(): void {
    const host = this.host?.nativeElement;
    const toolbar = host?.parentElement?.querySelector('.ql-toolbar');
    toolbar?.remove();
    this.quill = null;
  }
}
