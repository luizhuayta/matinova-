import { DestroyRef, Directive, HostListener, effect, inject, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';
import { LocaleService } from './locale.service';
import { imageSizes, inferImageFit, publicPhotoSrc, rasterSrcset, srcsetFromVariants, uploadMediaId, webpSrcset } from './public-url';

@Directive({
  selector: 'img[cmsImage]',
  standalone: true,
})
export class CmsImageDirective extends CmsEditableHost {
  private readonly destroyRef = inject(DestroyRef);
  private readonly locales = inject(LocaleService);
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
        img.src = publicPhotoSrc(value);
        img.dataset['cmsSrc'] = value;
        const webp = webpSrcset(value);
        if (webp) {
          img.srcset = webp;
        } else if (uploadMediaId(value)) {
          img.srcset = rasterSrcset(value);
        } else if (value.includes('/uploads/')) {
          img.removeAttribute('srcset');
          void this.applyResolvedSrcset(img, value);
        } else {
          img.removeAttribute('srcset');
        }
        const fit = inferImageFit(img);
        if (!img.getAttribute('sizes')) {
          img.sizes = imageSizes(fit);
        }
        const picture = img.parentElement;
        if (picture?.tagName === 'PICTURE') {
          const source = picture.querySelector('source[type="image/webp"]');
          if (source && !source.getAttribute('sizes')) {
            source.setAttribute('sizes', img.sizes);
          }
        }
        if (!img.getAttribute('decoding')) {
          img.decoding = 'async';
        }
        if (!img.hasAttribute('loading')) {
          img.loading = fit === 'hero' ? 'eager' : 'lazy';
        }
        if (fit === 'hero' && !img.hasAttribute('fetchpriority')) {
          img.setAttribute('fetchpriority', 'high');
        }
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

  private async applyResolvedSrcset(img: HTMLImageElement, url: string): Promise<void> {
    const item = await this.cms.resolvePublicMedia(url);
    if (img.dataset['cmsSrc'] !== url) {
      return;
    }
    const srcset = srcsetFromVariants(item?.variants, 'webp') || srcsetFromVariants(item?.variants, 'jpeg');
    if (srcset) {
      img.srcset = srcset;
    }
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
    if (!file || !file.type.startsWith('image/') || this.editor.uploading()) {
      return;
    }
    const slug = this.cms.currentSlug();
    const locale = this.locales.locale();
    const path = this.cmsImage();
    const scope = this.cmsScope();
    this.cms.uploadNotice.set('');
    this.editor.uploading.set(true);
    try {
      const url = await this.cms.uploadImage(file);
      if (this.destroyRef.destroyed || !this.editor.editMode() || this.cms.currentSlug() !== slug ||
          this.locales.locale() !== locale || this.cmsImage() !== path || this.cmsScope() !== scope) {
        this.cms.uploadNotice.set('La imagen quedó en la biblioteca. Selecciónala en el campo de destino.');
        return;
      }
      this.cms.set(path, url, scope);
    } catch {
      this.cms.uploadNotice.set('No se pudo subir la imagen.');
    } finally {
      this.editor.uploading.set(false);
    }
  }
}
