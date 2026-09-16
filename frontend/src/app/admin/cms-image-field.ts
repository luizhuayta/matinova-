import { Component, inject, input, signal } from '@angular/core';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsEditorService } from '../cms/cms-editor.service';
import { altPathForImage } from '../cms/cms-schema';
import { CmsMediaItem } from '../cms/cms.models';

@Component({
  selector: 'app-cms-image-field',
  standalone: true,
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
  styles: [`
    .image-field { display: grid; gap: 8px; min-width: 0; }
    .preview {
      width: 100%;
      min-height: 112px;
      border-radius: var(--admin-radius-ctrl);
      overflow: hidden;
      background: #ece8e2;
      display: grid;
      place-items: center;
    }
    .preview.empty span {
      color: var(--admin-muted);
      font-size: 0.8125rem;
      padding: 12px;
      text-align: center;
    }
    img { width: 100%; height: 112px; object-fit: cover; display: block; }
    .name {
      margin: 0;
      font-size: 0.75rem;
      color: var(--admin-muted);
      overflow-wrap: anywhere;
    }
    .image-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .image-actions label,
    .image-actions button {
      flex: 1 1 96px;
      min-height: 36px;
      font-size: 0.8125rem;
      white-space: nowrap;
    }
    .image-actions input { display: none; }
    .picker {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(20, 24, 31, 0.5);
      display: grid;
      place-items: center;
      padding: 1rem;
    }
    .picker-card {
      width: min(100%, 640px);
      max-height: 80vh;
      overflow: auto;
      background: var(--admin-surface);
      border-radius: var(--admin-radius);
      padding: 1rem;
      display: grid;
      gap: 0.75rem;
    }
    .picker-card header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .picker-card h3 { margin: 0; font-size: 1rem; }
    .picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
    .picker-grid button { padding: 0; border: 0; background: var(--admin-paper); border-radius: var(--admin-radius-ctrl); overflow: hidden; min-height: 80px; }
    .picker-grid img { width: 100%; height: 80px; object-fit: cover; }
    .warn, .micro { margin: 0; font-size: 0.8125rem; color: var(--admin-warn); }
    .micro { color: var(--admin-muted); }
    .alt-label { font-size: 0.8125rem; font-weight: 600; }
    .switch-row { display: flex; gap: 8px; align-items: center; font-size: 0.8125rem; }
  `],
})
export class CmsImageField {
  private cms = inject(CmsContentService);
  private editor = inject(CmsEditorService);
  readonly path = input.required<string>();
  libraryOpen = signal(false);
  items = signal<CmsMediaItem[]>([]);
  busy = signal(false);

  url(): string {
    return this.cms.get<string>(this.path()) ?? '';
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
}
