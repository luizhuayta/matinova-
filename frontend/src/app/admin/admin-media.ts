import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsMediaItem } from '../cms/cms.models';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Imágenes y archivos</h1>
          <p class="admin-lead">Puedes subir una foto pesada del celular. El sistema la achica solo.</p>
        </div>
        @if (!loading() && items().length > 0) {
          <div class="head-actions">
            <span class="pill neutral admin-num">{{ items().length }} archivo{{ items().length === 1 ? '' : 's' }}</span>
          </div>
        }
      </header>

      @if (toast()) {
        <p class="admin-banner info" role="status">
          {{ toast() }}
          <button type="button" class="admin-btn-ghost" (click)="undoRemove()">Deshacer</button>
        </p>
      }

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
        <div class="grid" aria-busy="true">
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
                <span class="admin-num">{{ size(item.size_bytes) }}{{ dims(item) }}</span>
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
    .wrap { max-width: 960px; }
    .admin-banner.info { margin-bottom: 0.9rem; }
    .drop {
      display: grid;
      place-items: center;
      gap: 0.35rem;
      margin: 0 0 1.1rem;
      min-height: 150px;
      padding: 1.6rem 1.15rem;
      border: 2px dashed var(--admin-line);
      border-radius: 14px;
      background: var(--admin-surface);
      text-align: center;
      cursor: pointer;
      color: var(--admin-muted);
      transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
    }
    .drop i { font-size: 1.8rem; color: var(--admin-ink); }
    .drop strong { color: var(--admin-text); font-size: 0.95rem; }
    .drop span { font-size: 0.8125rem; }
    .drop.over {
      border-color: var(--admin-ink);
      background: #ece8e2;
    }
    .drop:hover { border-color: var(--admin-ink); }
    .drop.busy { opacity: 0.7; pointer-events: none; }
    .drop input { display: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(188px, 1fr)); gap: 12px; }
    figure {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: 13px;
      padding: 10px;
      margin: 0;
      display: grid;
      gap: 8px;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }
    figure:hover { border-color: #b7b1a9; box-shadow: var(--admin-shadow); transform: translateY(-2px); }
    img { width: 100%; height: 140px; object-fit: cover; border-radius: var(--admin-radius-ctrl); background: #ece8e2; }
    figcaption { display: grid; gap: 2px; min-height: 2.6rem; }
    figcaption strong {
      font-size: 0.8125rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    figcaption span { font-size: 0.75rem; color: var(--admin-muted); }
  `],
})
export class AdminMedia implements OnInit, OnDestroy {
  private cms = inject(CmsContentService);
  auth = inject(AuthService);
  items = signal<CmsMediaItem[]>([]);
  busy = signal(false);
  loading = signal(true);
  dragging = signal(false);
  error = signal('');
  toast = signal('');
  private pending: CmsMediaItem | null = null;
  private timer?: number;

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  ngOnDestroy(): void {
    void this.commitPending();
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
      const list = await this.cms.listMedia();
      const hidden = this.pending?.id;
      this.items.set(hidden ? list.filter((item) => item.id !== hidden) : list);
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
    await this.commitPending();
    this.pending = item;
    this.items.update((list) => list.filter((entry) => entry.id !== item.id));
    this.toast.set('Eliminado — Deshacer');
    this.timer = window.setTimeout(() => {
      void this.commitPending();
    }, 5000);
  }

  undoRemove(): void {
    const item = this.pending;
    if (!item) {
      return;
    }
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.pending = null;
    this.toast.set('');
    this.items.update((list) => [item, ...list]);
  }

  private async commitPending(): Promise<void> {
    const item = this.pending;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
    if (!item) {
      return;
    }
    this.pending = null;
    this.toast.set('');
    try {
      await this.cms.deleteMedia(item.id);
    } catch {
      this.items.update((list) => [item, ...list]);
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
