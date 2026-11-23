import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsEditorService } from '../cms/cms-editor.service';
import { altPathForImage } from '../cms/cms-schema';
import { CmsMediaItem, CmsMediaVersion } from '../cms/cms.models';

@Component({
  selector: 'app-cms-image-field',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="image-field">
      <div class="preview" [class.empty]="!url()">
        @if (url()) {
          <img [src]="url()" alt="">
        } @else {
          <span>Sin foto todavía</span>
        }
      </div>
      @if (fileName()) {
        <p class="name">{{ fileName() }}</p>
      }
      <div class="image-actions">
        <label class="admin-btn-ghost">
          <input type="file" accept="image/*" (change)="upload($event)">
          Subir
        </label>
        <button type="button" class="admin-btn-ghost" (click)="openLibrary()">Elegir</button>
        @if (url()) {
          <button type="button" class="admin-btn-ghost" (click)="openCrop()">Recortar</button>
          <button type="button" class="admin-btn-ghost" (click)="clear()">Quitar</button>
        }
      </div>
      @if (smallWarning()) {
        <p class="warn">Esta foto se verá borrosa en pantallas grandes. Sube una de más de 800 px de ancho.</p>
      }
      @if (altPath()) {
        <label class="alt-label" [attr.for]="'alt-' + path()">Texto de la imagen</label>
        <p class="micro">Se lee en voz alta si la foto no carga. Ejemplo: «Equipo de Matt Innova en la oficina».</p>
        <input class="admin-control" [id]="'alt-' + path()" type="text" [value]="altValue()" (input)="setAlt($any($event.target).value)" [disabled]="decorative()">
        <label class="switch-row">
          <span>Es decorativa (no hace falta describirla)</span>
          <input type="checkbox" [checked]="decorative()" (change)="setDecorative($any($event.target).checked)">
        </label>
      }
    </div>

    @if (cropOpen()) {
      <div class="picker" role="dialog" aria-label="Recortar imagen" (click)="cropOpen.set(false)">
        <div class="picker-card crop-card" (click)="$event.stopPropagation()">
          <header>
            <h3>Recortar al hueco</h3>
            <button type="button" class="admin-btn-ghost" (click)="cropOpen.set(false)">Cerrar</button>
          </header>
          <p class="micro">Ajusta el recorte. El ratio sigue el hueco ({{ ratioLabel() }}).</p>
          <div class="crop-preview">
            <img [src]="url()" alt="" (load)="onCropLoad($event)">
            <div class="crop-box" [style.left.%]="crop().x" [style.top.%]="crop().y" [style.width.%]="crop().w" [style.height.%]="crop().h"></div>
          </div>
          <label>Horizontal <input type="range" min="0" max="80" [ngModel]="crop().x" (ngModelChange)="setCrop('x', $event)"></label>
          <label>Vertical <input type="range" min="0" max="80" [ngModel]="crop().y" (ngModelChange)="setCrop('y', $event)"></label>
          <label>Tamaño <input type="range" min="20" max="100" [ngModel]="crop().w" (ngModelChange)="setCrop('w', $event)"></label>
          <button type="button" class="admin-btn-primary" (click)="applyCrop()" [disabled]="cropping()">{{ cropping() ? 'Recortando…' : 'Aplicar recorte' }}</button>
          @if (previousUrl()) {
            <button type="button" class="admin-btn-ghost" (click)="undoCrop()">Deshacer recorte</button>
          }
          @if (versions().length) {
            <p class="micro">Historial en el servidor</p>
            <div class="hist">
              @for (item of versions(); track item.id + item.url) {
                <button type="button" class="admin-btn-ghost" (click)="useVersion(item)">{{ versionLabel(item) }}</button>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (libraryOpen()) {
      <div class="picker" role="dialog" aria-label="Elegir imagen" (click)="libraryOpen.set(false)">
        <div class="picker-card" (click)="$event.stopPropagation()">
          <header>
            <h3>Imágenes subidas</h3>
            <button type="button" class="admin-btn-ghost" (click)="libraryOpen.set(false)">Cerrar</button>
          </header>
          @if (busy()) {
            <p>Cargando…</p>
          } @else if (items().length === 0) {
            <p>Aún no hay fotos. Sube una primero.</p>
          } @else {
            <div class="picker-grid">
              @for (item of items(); track item.id) {
                <button type="button" (click)="pick(item)">
                  <img [src]="item.url" [attr.width]="item.width || null" [attr.height]="item.height || null" [alt]="item.original_name">
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './styles/image-field.scss',
})
export class CmsImageField {
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  readonly path = input.required<string>();
  readonly aspectRatio = input(16 / 9);
  libraryOpen = signal(false);
  cropOpen = signal(false);
  cropping = signal(false);
  items = signal<CmsMediaItem[]>([]);
  busy = signal(false);
  crop = signal({ x: 10, y: 10, w: 80, h: 45 });
  natural = signal({ w: 0, h: 0 });
  previousUrl = signal('');
  versions = signal<CmsMediaVersion[]>([]);
  mediaId = signal<number | null>(null);

  url(): string {
    return this.cms.get<string>(this.path()) ?? '';
  }

  ratioLabel(): string {
    const ratio = this.aspectRatio();
    return `${ratio.toFixed(2)}:1`;
  }

  altPath(): string | null {
    return altPathForImage(this.path());
  }

  altValue(): string {
    const path = this.altPath();
    return path ? (this.cms.get<string>(path) ?? '') : '';
  }

  decorative(): boolean {
    const list = this.cms.get<string[]>('decorativeImagePaths') ?? [];
    return list.includes(this.path());
  }

  setAlt(value: string): void {
    const path = this.altPath();
    if (path) {
      this.cms.set(path, value);
    }
  }

  setDecorative(on: boolean): void {
    const list = [...(this.cms.get<string[]>('decorativeImagePaths') ?? [])];
    const path = this.path();
    const next = on ? [...new Set([...list, path])] : list.filter((item) => item !== path);
    this.cms.set('decorativeImagePaths', next);
  }

  smallWarning(): boolean {
    const url = this.url();
    const meta = this.cms.imageMeta()[url];
    return !!meta && meta.width < 800;
  }

  fileName(): string {
    const url = this.url();
    if (!url) {
      return '';
    }
    try {
      const path = url.split('?')[0];
      const name = path.split('/').pop() ?? '';
      return decodeURIComponent(name);
    } catch {
      return url;
    }
  }

  async upload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) {
      return;
    }
    this.editor.uploading.set(true);
    try {
      const next = await this.cms.uploadImage(file);
      this.cms.set(this.path(), next);
    } finally {
      this.editor.uploading.set(false);
    }
  }

  async openLibrary(): Promise<void> {
    this.libraryOpen.set(true);
    this.busy.set(true);
    try {
      this.items.set(await this.cms.listMedia());
    } finally {
      this.busy.set(false);
    }
  }

  pick(item: CmsMediaItem): void {
    this.cms.rememberImage(item.url, item.width, item.height);
    this.cms.set(this.path(), item.url);
    this.libraryOpen.set(false);
  }

  clear(): void {
    this.cms.set(this.path(), '');
  }

  openCrop(): void {
    this.cropOpen.set(true);
    void this.loadHistory();
  }

  onCropLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.natural.set({ w: img.naturalWidth, h: img.naturalHeight });
    this.setCrop('w', this.crop().w);
  }

  setCrop(key: 'x' | 'y' | 'w', value: number): void {
    const ratio = this.aspectRatio();
    const next = { ...this.crop(), [key]: Number(value) };
    next.h = Math.min(100, next.w * (1 / ratio) * (this.natural().w && this.natural().h ? this.natural().w / this.natural().h : 1));
    if (next.x + next.w > 100) next.x = Math.max(0, 100 - next.w);
    if (next.y + next.h > 100) next.y = Math.max(0, 100 - next.h);
    this.crop.set(next);
  }

  async applyCrop(): Promise<void> {
    const nat = this.natural();
    if (!nat.w || !nat.h) {
      return;
    }
    const box = this.crop();
    this.cropping.set(true);
    try {
      const res = await this.cms.cropImageDetails(this.url(), {
        x: Math.round((box.x / 100) * nat.w),
        y: Math.round((box.y / 100) * nat.h),
        w: Math.round((box.w / 100) * nat.w),
        h: Math.round((box.h / 100) * nat.h),
      });
      this.previousUrl.set(res.previous_url || this.url());
      if (res.id) {
        this.mediaId.set(res.id);
      }
      this.cms.set(this.path(), res.url);
      this.cropOpen.set(false);
      void this.loadHistory();
    } finally {
      this.cropping.set(false);
    }
  }

  undoCrop(): void {
    const previous = this.previousUrl();
    if (!previous) {
      return;
    }
    this.cms.set(this.path(), previous);
    this.previousUrl.set('');
  }

  async loadHistory(): Promise<void> {
    const url = this.url();
    try {
      const items = await this.cms.listMedia();
      const current = items.find((item) => item.url === url) ?? items.find((item) => url.endsWith(item.url.split('/').pop() || '---'));
      if (!current) {
        this.versions.set([]);
        return;
      }
      this.mediaId.set(current.id);
      this.versions.set(await this.cms.mediaVersions(current.id));
    } catch {
      this.versions.set([]);
    }
  }

  useVersion(item: CmsMediaVersion): void {
    this.previousUrl.set(this.url());
    this.cms.set(this.path(), item.url);
  }

  versionLabel(item: CmsMediaVersion): string {
    if (item.reason === 'parent') {
      return 'Foto anterior';
    }
    if (item.reason === 'upload') {
      return 'Subida original';
    }
    if (item.reason === 'original') {
      return 'Archivo original';
    }
    return 'Recorte guardado';
  }
}
