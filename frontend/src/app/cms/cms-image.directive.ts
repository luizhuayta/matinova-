import { Directive, HostListener, effect, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';

@Directive({
  selector: 'img[cmsImage]',
  standalone: true,
})
export class CmsImageDirective extends CmsEditableHost {
  readonly cmsImage = input.required<string>();
  readonly cmsScope = input<'page' | 'site'>('page');
  protected override removeClasses = ['cms-editable-image', 'cms-selected'];

  constructor() {
    super();
    effect(() => {
      const path = this.cmsImage();
      this.cms.activeContent();
      this.cms.site();
      const value = this.cms.get<string>(path, this.cmsScope());
      const img = this.el.nativeElement as HTMLImageElement;
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

  protected fieldPath(): string {
    return this.cmsImage();
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
