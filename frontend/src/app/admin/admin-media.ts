import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsMediaItem } from '../cms/cms.models';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  template: `
    <section>
      <h1>Imágenes y archivos</h1>
      <p class="admin-lead">Puedes subir una foto pesada del celular. El sistema la achica solo.</p>

      <label
        class="drop"
        [class.busy]="busy()"
        (dragover)="$event.preventDefault(); dragging.set(true)"
        (dragleave)="dragging.set(false)"
        (drop)="onDrop($event)"
        [class.over]="dragging()">
        <input type="file" accept="image/*" (change)="upload($event)">
        <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>
        <strong>{{ busy() ? 'La foto se está ajustando…' : 'Suelta una foto o haz clic para subir' }}</strong>
        <span>{{ items().length === 0 && !busy() ? 'Todavía no hay fotos. JPG, PNG o WebP.' : 'JPG, PNG o WebP' }}</span>
      </label>

      @if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      }

      @if (loading()) {
        <div class="grid">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (items().length > 0) {
        <div class="grid">
          @for (item of items(); track item.id) {
            <figure>
              <img
                [src]="item.url"
                [attr.width]="item.width || null"
                [attr.height]="item.height || null"
                [alt]="item.original_name">
              <figcaption>
                <strong>{{ item.original_name }}</strong>
                <span>{{ size(item.size_bytes) }}{{ dims(item) }}</span>
              </figcaption>
              @if (auth.isAdmin()) {
                <button type="button" class="admin-btn-danger" (click)="remove(item)">Borrar</button>
              }
            </figure>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .drop {
      display: grid;
      place-items: center;
      gap: 0.3rem;
      margin: 1.1rem 0 1.25rem;
      min-height: 132px;
      padding: 1.25rem;
      border: 1px dashed var(--admin-line);
      border-radius: 14px;
      background: var(--admin-surface);
      text-align: center;
      cursor: pointer;
      color: var(--admin-muted);
    }
    .drop i { font-size: 1.6rem; color: var(--admin-blue); }
    .drop strong { color: var(--admin-text); font-size: 0.98rem; }
    .drop span { font-size: 0.85rem; }
    .drop.over, .drop:hover { border-color: var(--admin-blue); background: var(--admin-blue-soft); }
    .drop.busy { opacity: 0.7; pointer-events: none; }
    .drop input { display: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(188px, 1fr)); gap: 14px; }
    figure {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: 12px;
      padding: 10px;
      margin: 0;
      display: grid;
      gap: 8px;
    }
    img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; background: #e8ecf1; }
    figcaption { display: grid; gap: 2px; min-height: 2.6rem; }
    figcaption strong {
      font-size: 0.82rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    figcaption span { font-size: 0.75rem; color: var(--admin-muted); }
  `],
})
export class AdminMedia implements OnInit {
  private cms = inject(CmsContentService);
  auth = inject(AuthService);
  items = signal<CmsMediaItem[]>([]);
  busy = signal(false);
  loading = signal(true);
  dragging = signal(false);
  error = signal('');

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  dims(item: CmsMediaItem): string {
    if (!item.width || !item.height) {
      return '';
    }
    return ` · ${item.width}×${item.height}`;
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.cms.listMedia());
      this.error.set('');
    } catch {
      this.error.set('No se pudieron cargar las imágenes. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  async upload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    await this.send(file);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragging.set(false);
    await this.send(event.dataTransfer?.files?.[0]);
  }

  private async send(file?: File): Promise<void> {
    if (!file) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.cms.uploadImage(file);
      await this.refresh();
    } catch {
      this.error.set('No se pudo subir la foto. Prueba con JPG, PNG o WebP.');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(item: CmsMediaItem): Promise<void> {
    if (!confirm(`¿Borrar ${item.original_name}?`)) {
      return;
    }
    try {
      await this.cms.deleteMedia(item.id);
      await this.refresh();
    } catch {
      this.error.set('No se pudo borrar la imagen.');
    }
  }

  size(bytes: number): string {
    if (!bytes) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
