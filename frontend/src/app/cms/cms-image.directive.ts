import { Directive, ElementRef, HostListener, OnDestroy, OnInit, effect, inject, input } from '@angular/core';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { CmsSelectionService } from './cms-selection.service';

@Directive({
  selector: 'img[cmsImage]',
  standalone: true,
})
export class CmsImageDirective implements OnDestroy, OnInit {
  private el = inject(ElementRef<HTMLImageElement>);
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  private selection = inject(CmsSelectionService);
  readonly cmsImage = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');

  constructor() {
    effect(() => {
      const path = this.cmsImage();
      this.cms.activeContent();
      this.cms.site();
      const value = this.cms.get<string>(path, this.cmsScope());
      const img = this.el.nativeElement;
      if (typeof value === 'string' && value) {
        img.src = value;
      }
      const meta = typeof value === 'string' ? this.cms.imageMeta()[value] : undefined;
      if (meta) {
        img.width = meta.width;
        img.height = meta.height;
      }
      const edit = this.editor.editMode();
      img.classList.toggle('cms-editable-image', edit);
      img.classList.toggle('cms-selected', edit && this.selection.selectedPath() === path);
      img.title = edit ? 'Clic para editar esta foto' : '';
      img.dataset['cmsLabel'] = this.selection.label(path);
    });
  }

  ngOnInit(): void {
    this.selection.register(this.cmsImage(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.selection.unregister(this.cmsImage(), this.el.nativeElement);
    this.el.nativeElement.classList.remove('cms-editable-image', 'cms-selected');
  }

  @HostListener('mouseenter')
  onEnter(): void {
    if (this.editor.editMode()) {
      this.selection.hover(this.cmsImage());
    }
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.selection.leave(this.cmsImage());
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.editor.editMode()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.selection.selectFromPreview(this.cmsImage());
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (!this.editor.editMode()) {
      return;
    }
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  async onDrop(event: DragEvent): Promise<void> {
    if (!this.editor.editMode()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    this.editor.uploading.set(true);
    try {
      const url = await this.cms.uploadImage(file);
      this.cms.set(this.cmsImage(), url, this.cmsScope());
    } finally {
      this.editor.uploading.set(false);
    }
  }
}
