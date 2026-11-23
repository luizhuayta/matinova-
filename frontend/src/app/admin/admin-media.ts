import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsMediaItem } from '../cms/cms.models';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  templateUrl: './admin-media.html',
  styleUrl: './styles/media.scss',
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

  kindLabel(item: CmsMediaItem): string {
    if (item.kind === 'crop') {
      return ' · recorte';
    }
    if (item.original_url) {
      return ' · original guardado';
    }
    return '';
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
