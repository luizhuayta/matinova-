import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { blankClone } from './cms-fields';
import { blankFromSchema, humanChangeLine, itemFieldsAt, migrateCmsDocument, minListLength, schemaForSlug } from './cms-schema';
import {
  API_URL,
  CmsDocResponse,
  CmsMediaItem,
  CmsMessage,
  CmsPageSummary,
  CmsRevision,
  ImageMeta,
  JsonMap,
  SLUG_PATHS,
  getByPath,
  setByPath,
} from './cms.models';

interface FieldPatch {
  slug: string;
  path: string;
  scope: 'page' | 'site';
  before: unknown;
  after: unknown;
}

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  private http: HttpClient;

  constructor(http?: HttpClient) {
    this.http = http ?? inject(HttpClient);
  }
  readonly site = signal<JsonMap>({});
  readonly pages = signal<Record<string, JsonMap>>({});
  readonly currentSlug = signal('inicio');
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly loaded = signal(false);
  readonly conflict = signal('');
  readonly hasDraft = signal<Record<string, boolean>>({});
  readonly versions = signal<Record<string, number>>({});
  readonly undoStack = signal<FieldPatch[]>([]);
  readonly redoStack = signal<FieldPatch[]>([]);
  readonly dirtyFields = signal<Set<string>>(new Set());
  readonly imageMeta = signal<Record<string, ImageMeta>>({});
  readonly removeToast = signal('');
  readonly fieldError = signal<{ path: string; message: string } | null>(null);
  private toastTimer?: number;
  private pendingRemove: { path: string; index: number; item: unknown } | null = null;
  private autosaveTimer?: number;
  private editing = false;
  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  readonly activeContent = computed(() => {
    const slug = this.currentSlug();
    return slug === 'sitio' ? this.site() : (this.pages()[slug] ?? {});
  });

  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  useSlug(slug: string): void {
    this.currentSlug.set(slug);
  }

  startEditingSession(): void {
    this.editing = true;
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  stopEditingSession(): void {
    this.editing = false;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    if (this.autosaveTimer) {
      window.clearTimeout(this.autosaveTimer);
    }
  }

  get<T = unknown>(path: string, scope: 'page' | 'site' = 'page'): T {
    const root = scope === 'site' ? this.site() : this.activeContent();
    return getByPath(root, path) as T;
  }

  set(path: string, value: unknown, scope: 'page' | 'site' = 'page', record = true): void {
    const slug = this.currentSlug();
    const before = this.get(path, scope);
    if (Object.is(before, value) || JSON.stringify(before) === JSON.stringify(value)) {
      return;
    }
    if (record) {
      this.undoStack.update((stack) => [...stack.slice(-79), { slug, path, scope, before, after: value }]);
      this.redoStack.set([]);
    }
    this.applyValue(slug, path, value, scope);
    if (slug === 'inicio') {
      const sections = (slug === this.currentSlug() ? this.get<Array<{ hidden?: boolean }>>('sections') : null)
        ?? ((this.pages()[slug]?.['sections'] as Array<{ hidden?: boolean }>) ?? null);
      const list = Array.isArray(sections) ? sections : [];
      if (list.length > 0 && list.every((item) => !!item?.hidden)) {
        this.applyValue(slug, path, before, scope);
        if (record) {
          this.undoStack.update((stack) => stack.slice(0, -1));
        }
        this.conflict.set('Deja al menos una parte de la página visible.');
        return;
      }
    }
    this.dirty.set(true);
    this.dirtyFields.update((set) => new Set(set).add(`${slug}:${path}`));
    this.scheduleAutosave();
  }

  addListItem(path: string): void {
    const list = [...(this.get<unknown[]>(path) ?? [])];
    const schema = schemaForSlug(this.currentSlug());
    const itemFields = itemFieldsAt(schema, path);
    if (itemFields) {
      list.push(blankFromSchema(itemFields));
    } else {
      list.push(list[0] !== undefined ? blankClone(list[0]) : {});
    }
    this.set(path, list);
  }

  duplicateListItem(path: string, index: number): void {
    const list = [...(this.get<unknown[]>(path) ?? [])];
    if (!list[index]) {
      return;
    }
    list.splice(index + 1, 0, structuredClone(list[index]));
    this.set(path, list);
  }

  addStringItem(path: string): void {
    this.set(path, [...(this.get<unknown[]>(path) ?? []), '']);
  }

  removeListItem(path: string, index: number): void {
    const list = [...(this.get<unknown[]>(path) ?? [])];
    const min = minListLength(this.currentSlug(), path);
    if (list.length <= min) {
      this.conflict.set('Debe quedar al menos un elemento.');
      return;
    }
    const item = list[index];
    list.splice(index, 1);
    this.set(path, list);
    this.pendingRemove = { path, index, item };
    this.removeToast.set('Eliminado — Deshacer');
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      this.removeToast.set('');
      this.pendingRemove = null;
    }, 5000);
  }

  undoRemove(): void {
    const pending = this.pendingRemove;
    if (!pending) {
      return;
    }
    const list = [...(this.get<unknown[]>(pending.path) ?? [])];
    list.splice(pending.index, 0, pending.item);
    this.set(pending.path, list);
    this.pendingRemove = null;
    this.removeToast.set('');
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
  }

  changeLines(): { path: string; text: string }[] {
    const slug = this.currentSlug();
    return [...this.dirtyFields()]
      .filter((key) => key.startsWith(`${slug}:`) && !key.endsWith(':'))
      .map((key) => {
        const path = key.slice(slug.length + 1);
        return { path, text: humanChangeLine(slug, path) };
      });
  }

  moveListItem(path: string, from: number, to: number): void {
    const list = [...(this.get<unknown[]>(path) ?? [])];
    if (to < 0 || to >= list.length) {
      return;
    }
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    this.set(path, list);
  }

  replaceContent(content: JsonMap): void {
    const slug = this.currentSlug();
    this.pushWhole(content);
    this.writeRoot(slug, content);
    this.dirty.set(true);
    this.scheduleAutosave();
  }

  undo(): void {
    const stack = [...this.undoStack()];
    const last = stack.pop();
    if (!last) {
      return;
    }
    this.undoStack.set(stack);
    this.redoStack.update((items) => [...items, last]);
    this.applyValue(last.slug, last.path, last.before, last.scope);
    this.dirty.set(true);
    this.scheduleAutosave();
  }

  redo(): void {
    const stack = [...this.redoStack()];
    const last = stack.pop();
    if (!last) {
      return;
    }
    this.redoStack.set(stack);
    this.undoStack.update((items) => [...items, last]);
    this.applyValue(last.slug, last.path, last.after, last.scope);
    this.dirty.set(true);
    this.scheduleAutosave();
  }

  history(): FieldPatch[] {
    return this.undoStack();
  }

  async loadAll(): Promise<void> {
    const preview = this.previewQuery();
    const [site, list] = await Promise.all([
      firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/site${preview}`)),
      firstValueFrom(this.http.get<{ pages: CmsPageSummary[] }>(`${API_URL}/pages`)),
    ]);
    this.writeDoc('sitio', site);
    const pageMap: Record<string, JsonMap> = {};
    const versions: Record<string, number> = { ...this.versions(), sitio: site.version };
    const drafts: Record<string, boolean> = { ...this.hasDraft(), sitio: !!site.hasDraft };
    await Promise.all(
      (list.pages ?? [])
        .filter((p) => p.slug !== 'sitio')
        .map(async (p) => {
          const full = await firstValueFrom(
            this.http.get<CmsDocResponse>(`${API_URL}/pages/${p.slug}${preview}`)
          );
          pageMap[p.slug] = migrateCmsDocument(full.content ?? {}, p.slug);
          versions[p.slug] = full.version;
          drafts[p.slug] = !!full.hasDraft;
        })
    );
    this.pages.set(pageMap);
    this.versions.set(versions);
    this.hasDraft.set(drafts);
    this.loaded.set(true);
    this.dirty.set(false);
    this.conflict.set('');
  }

  async reloadSlug(slug: string): Promise<void> {
    const preview = this.previewQuery();
    if (slug === 'sitio') {
      const site = await firstValueFrom(this.http.get<CmsDocResponse>(`${API_URL}/site${preview}`));
      this.writeDoc('sitio', site);
    } else {
      const full = await firstValueFrom(
        this.http.get<CmsDocResponse>(`${API_URL}/pages/${slug}${preview}`)
      );
      this.writeDoc(slug, full);
    }
    this.dirty.set(false);
    this.conflict.set('');
    this.undoStack.set([]);
    this.redoStack.set([]);
    this.dirtyFields.set(new Set());
  }

  async listPages(): Promise<CmsPageSummary[]> {
    const res = await firstValueFrom(this.http.get<{ pages: CmsPageSummary[] }>(`${API_URL}/pages`));
    return res.pages ?? [];
  }

  async save(): Promise<void> {
    const slug = this.currentSlug();
    this.saving.set(true);
    this.conflict.set('');
    try {
      const version = this.versions()[slug] ?? 1;
      const content = slug === 'sitio' ? this.site() : (this.pages()[slug] ?? {});
      const url = slug === 'sitio' ? `${API_URL}/site` : `${API_URL}/pages/${slug}`;
      const res = await firstValueFrom(
        this.http.put<CmsDocResponse>(url, { content, version })
      );
      this.applySaveResponse(slug, res);
    } catch (err) {
      this.handleSaveError(err);
      throw err;
    } finally {
      this.saving.set(false);
    }
  }

  async publish(): Promise<void> {
    const slug = this.currentSlug();
    this.saving.set(true);
    try {
      const url = slug === 'sitio' ? `${API_URL}/site/publish` : `${API_URL}/pages/${slug}/publish`;
      const res = await firstValueFrom(this.http.post<CmsDocResponse>(url, { version: this.versions()[slug] ?? 1 }));
      this.applySaveResponse(slug, res);
      this.hasDraft.update((map) => ({ ...map, [slug]: false }));
      this.dirtyFields.set(new Set());
      this.fieldError.set(null);
    } catch (err) {
      this.handleSaveError(err);
      throw err;
    } finally {
      this.saving.set(false);
    }
  }

  async listRevisions(): Promise<CmsRevision[]> {
    const slug = this.currentSlug();
    const res = await firstValueFrom(
      this.http.get<{ items: CmsRevision[] }>(`${API_URL}/pages/${slug}/revisions`)
    );
    return res.items ?? [];
  }

  async restoreRevision(id: number): Promise<void> {
    const slug = this.currentSlug();
    try {
      const res = await firstValueFrom(
        this.http.post<CmsDocResponse>(`${API_URL}/pages/${slug}/revisions/${id}/restore`, {
          version: this.versions()[slug] ?? 1,
        })
      );
      this.applySaveResponse(slug, res);
      this.dirty.set(false);
    } catch (err) {
      this.handleSaveError(err);
      throw err;
    }
  }

  async createPreviewLink(): Promise<string> {
    const slug = this.currentSlug();
    const res = await firstValueFrom(
      this.http.post<{ url: string }>(`${API_URL}/pages/${slug}/preview-token`, {})
    );
    return res.url || `${SLUG_PATHS[slug] || '/'}?preview=`;
  }

  async uploadImage(file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file);
    const res = await firstValueFrom(
      this.http.post<{ url: string; width?: number; height?: number }>(`${API_URL}/media`, body)
    );
    if (res.width && res.height) {
      this.imageMeta.update((map) => ({ ...map, [res.url]: { width: res.width!, height: res.height! } }));
    }
    return res.url;
  }

  rememberImage(url: string, width?: number | null, height?: number | null): void {
    if (!url || !width || !height) {
      return;
    }
    this.imageMeta.update((map) => ({ ...map, [url]: { width, height } }));
  }

  async listMedia(): Promise<CmsMediaItem[]> {
    const res = await firstValueFrom(this.http.get<{ items: CmsMediaItem[] }>(`${API_URL}/media`));
    const items = res.items ?? [];
    for (const item of items) {
      this.rememberImage(item.url, item.width, item.height);
    }
    return items;
  }

  async deleteMedia(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${API_URL}/media/${id}`));
  }

  async listMessages(): Promise<CmsMessage[]> {
    const res = await firstValueFrom(this.http.get<{ items: CmsMessage[] }>(`${API_URL}/messages`));
    return res.items ?? [];
  }

  private applySaveResponse(slug: string, res: CmsDocResponse): void {
    const content = migrateCmsDocument(res.content ?? (slug === 'sitio' ? this.site() : this.pages()[slug] ?? {}), slug);
    this.writeRoot(slug, content);
    this.versions.update((map) => ({ ...map, [slug]: res.version }));
    this.hasDraft.update((map) => ({ ...map, [slug]: true }));
    this.dirty.set(false);
    this.conflict.set('');
  }

  private handleSaveError(err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      const field = err.error?.field;
      const message = err.error?.message as string | undefined;
      if (err.status === 409) {
        this.conflict.set(message || 'Alguien guardó antes. Recarga para no pisar cambios.');
        return;
      }
      if (typeof field === 'string' && field) {
        this.fieldError.set({ path: field, message: message || 'Revisa este contenido.' });
        this.conflict.set(message || 'No se pudieron guardar los cambios.');
        return;
      }
      this.conflict.set(message || 'No se pudieron guardar los cambios.');
      return;
    }
    this.conflict.set('No se pudieron guardar los cambios.');
  }

  private writeDoc(slug: string, doc: CmsDocResponse): void {
    const content = migrateCmsDocument(doc.content ?? {}, slug);
    this.writeRoot(slug, content);
    this.versions.update((map) => ({ ...map, [slug]: doc.version }));
    this.hasDraft.update((map) => ({ ...map, [slug]: !!doc.hasDraft }));
  }

  private writeRoot(slug: string, content: JsonMap): void {
    if (slug === 'sitio') {
      this.site.set(content);
    } else {
      this.pages.set({ ...this.pages(), [slug]: content });
    }
  }

  private applyValue(slug: string, path: string, value: unknown, scope: 'page' | 'site'): void {
    if (!path) {
      this.writeRoot(slug, (value && typeof value === 'object' ? value : {}) as JsonMap);
      return;
    }
    if (scope === 'site' || slug === 'sitio') {
      this.site.set(setByPath(this.site(), path, value));
      return;
    }
    const next = { ...this.pages() };
    next[slug] = setByPath(next[slug] ?? {}, path, value);
    this.pages.set(next);
  }

  private pushWhole(content: JsonMap): void {
    const slug = this.currentSlug();
    const before = slug === 'sitio' ? this.site() : (this.pages()[slug] ?? {});
    this.undoStack.update((stack) => [
      ...stack.slice(-79),
      { slug, path: '', scope: slug === 'sitio' ? 'site' : 'page', before, after: content },
    ]);
    this.redoStack.set([]);
  }

  private scheduleAutosave(): void {
    if (!this.editing) {
      return;
    }
    if (this.autosaveTimer) {
      window.clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = window.setTimeout(() => {
      if (this.dirty() && !this.saving() && !this.conflict()) {
        this.save().catch(() => undefined);
      }
    }, 2000);
  }

  private previewQuery(): string {
    if (typeof location === 'undefined') {
      return '';
    }
    const token = new URLSearchParams(location.search).get('preview');
    return token ? `?preview=${encodeURIComponent(token)}` : '';
  }
}
