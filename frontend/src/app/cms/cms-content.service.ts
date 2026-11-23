import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { blankClone } from './cms-fields';
import { CmsApiService } from './cms-api.service';
import { CmsHistoryService } from './cms-history.service';
import { blankFromSchema, humanChangeLine, itemFieldsAt, migrateCmsDocument, minListLength, schemaForSlug } from './cms-schema';
import {
  CmsDocResponse,
  CmsMenuItem,
  CmsPageSummary,
  ImageMeta,
  JsonMap,
  pathForSlug,
  registerPageRoutes,
  getByPath,
  setByPath,
} from './cms.models';
import { BLOCK_CATALOG, CmsBlock, makeBlock, pageBlocks } from './block-registry';
import { CmsLocale, LocaleService } from './locale.service';

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  constructor(
    private api: CmsApiService = inject(CmsApiService),
    private undoHistory: CmsHistoryService = inject(CmsHistoryService),
    private locales?: LocaleService
  ) {}

  /** Locale activo; 'es' cuando el servicio se instancia fuera de la DI (tests). */
  private activeLocale(): CmsLocale {
    return this.locales?.locale() ?? 'es';
  }

  readonly site = signal<JsonMap>({});
  readonly pages = signal<Record<string, JsonMap>>({});
  readonly pageList = signal<CmsPageSummary[]>([]);
  readonly menuItems = signal<CmsMenuItem[]>([]);
  readonly currentSlug = signal('inicio');
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly loaded = signal(false);
  readonly loadingSlug = signal<string | null>(null);
  readonly publicLoadError = signal('');
  readonly conflict = signal('');
  readonly hasDraft = signal<Record<string, boolean>>({});
  readonly versions = signal<Record<string, number>>({});
  readonly dirtyFields = signal<Set<string>>(new Set());
  readonly imageMeta = signal<Record<string, ImageMeta>>({});
  readonly removeToast = signal('');
  readonly fieldError = signal<{ path: string; message: string } | null>(null);
  private toastTimer?: number;
  private pendingRemove: { path: string; index: number; item: unknown } | null = null;
  private autosaveTimer?: number;
  private editing = false;
  private shellLocale = '';
  private shellTask: Promise<void> | null = null;
  private loadedEverything = false;
  private readonly pageLoads = new Map<string, Promise<void>>();
  private readonly resolvedMedia = new Map<
    string,
    Promise<{ url: string; width?: number | null; height?: number | null; variants?: Array<{ width: number; url: string; kind?: string }> } | null>
  >();
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

  get undoStack() {
    return this.undoHistory.undoStack;
  }

  get redoStack() {
    return this.undoHistory.redoStack;
  }

  get canUndo() {
    return this.undoHistory.canUndo;
  }

  get canRedo() {
    return this.undoHistory.canRedo;
  }

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
      this.undoHistory.push({ slug, path, scope, before, after: value });
    }
    this.applyValue(slug, path, value, scope);
    if (slug !== 'sitio') {
      const list = pageBlocks(this.pages()[slug] ?? {});
      if (list.length > 0 && list.every((item) => !!item?.hidden)) {
        this.applyValue(slug, path, before, scope);
        if (record) {
          this.undoHistory.dropLast();
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
    const itemFields = itemFieldsAt(schema, path, this.activeContent());
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

  addBlock(type: string, index?: number): void {
    if (!BLOCK_CATALOG[type]) {
      return;
    }
    const list = [...pageBlocks(this.activeContent())];
    const block = makeBlock(type);
    if (index == null || index < 0 || index > list.length) {
      list.push(block);
    } else {
      list.splice(index, 0, block);
    }
    this.set('blocks', list);
  }

  duplicateBlock(index: number): void {
    const list = [...pageBlocks(this.activeContent())];
    if (!list[index]) {
      return;
    }
    const copy: CmsBlock = { ...structuredClone(list[index]), id: makeBlock(list[index].type).id };
    list.splice(index + 1, 0, copy);
    this.set('blocks', list);
  }

  removeBlock(index: number): void {
    const list = [...pageBlocks(this.activeContent())];
    if (list.length <= 1) {
      this.conflict.set('Debe quedar al menos un elemento.');
      return;
    }
    const visible = list.filter((item, i) => i === index ? false : !item.hidden);
    if (visible.length < 1) {
      this.conflict.set('Deja al menos una parte de la página visible.');
      return;
    }
    this.removeListItem('blocks', index);
  }

  migrateTestimonialsToClients(): void {
    const list = [...pageBlocks(this.activeContent())];
    const source = list.find((item) => item.type === 'testimonials');
    if (!source) {
      return;
    }
    const items = ((source.props['items'] as Array<Record<string, string>>) ?? []).map((item) => ({
      logo: item['logo'] ?? '',
      name: item['client'] ?? '',
      url: '',
      alt: item['client'] ?? '',
      text: item['text'] ?? '',
    }));
    list.push(
      makeBlock('clients', {
        title: source.props['title'] ?? 'Clientes',
        text: source.props['text'] ?? '',
        layout: 'logos-grid',
        items: items.map((item) => ({ ...item, category: 'empresas', subcategory: '', icon: '' })),
      })
    );
    this.set('blocks', list);
  }

  async createPage(body: { title: string; slug?: string; template?: string; showInMenu?: boolean }): Promise<CmsPageSummary> {
    const res = await this.api.createPage(body);
    const catalog = await this.api.getPagesCatalog();
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    if (res.content) {
      this.writeRoot(res.page.slug, migrateCmsDocument(res.content, res.page.slug));
      this.versions.update((map) => ({ ...map, [res.page.slug]: res.version }));
    }
    return res.page;
  }

  async deletePage(slug: string): Promise<void> {
    await this.api.deletePage(slug);
    const next = { ...this.pages() };
    delete next[slug];
    this.pages.set(next);
    const catalog = await this.api.getPagesCatalog();
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
  }

  async updatePageMeta(
    slug: string,
    body: { title?: string; slug?: string; showInMenu?: boolean; menuOrder?: number; path?: string }
  ): Promise<CmsPageSummary> {
    const res = await this.api.updatePageMeta(slug, body);
    const catalog = await this.api.getPagesCatalog();
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    if (res.page.slug !== slug && this.pages()[slug]) {
      const next = { ...this.pages() };
      next[res.page.slug] = next[slug];
      delete next[slug];
      this.pages.set(next);
    }
    return res.page;
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
    const last = this.undoHistory.takeUndo();
    if (!last) {
      return;
    }
    this.applyValue(last.slug, last.path, last.before, last.scope);
    this.dirty.set(true);
    this.scheduleAutosave();
  }

  redo(): void {
    const last = this.undoHistory.takeRedo();
    if (!last) {
      return;
    }
    this.applyValue(last.slug, last.path, last.after, last.scope);
    this.dirty.set(true);
    this.scheduleAutosave();
  }

  history() {
    return this.undoHistory.items();
  }

  async loadAll(): Promise<void> {
    const preview = this.previewQuery();
    const [site, catalog] = await Promise.all([this.api.getSite(preview), this.api.getPagesCatalog()]);
    this.writeDoc('sitio', site);
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    const pageMap: Record<string, JsonMap> = {};
    const versions: Record<string, number> = { ...this.versions(), sitio: site.version };
    const drafts: Record<string, boolean> = { ...this.hasDraft(), sitio: !!site.hasDraft };
    await Promise.all(
      catalog.pages
        .filter((p) => p.slug !== 'sitio')
        .map(async (p) => {
          const full = await this.api.getPage(p.slug, preview);
          pageMap[p.slug] = migrateCmsDocument(full.content ?? {}, p.slug);
          versions[p.slug] = full.version;
          drafts[p.slug] = !!full.hasDraft;
        })
    );
    this.pages.set(pageMap);
    this.versions.set(versions);
    this.hasDraft.set(drafts);
    this.loaded.set(true);
    this.loadedEverything = true;
    this.shellLocale = this.activeLocale();
    this.shellTask = Promise.resolve();
    this.pageLoads.clear();
    this.dirty.set(false);
    this.conflict.set('');
  }

  hasAllPages(): boolean {
    return this.loadedEverything;
  }

  async loadPublic(slug: string): Promise<void> {
    const target = slug || 'inicio';
    this.loadingSlug.set(target);
    this.publicLoadError.set('');
    try {
      await this.ensureShell();
      if (this.activeLocale() !== this.shellLocale) {
        return this.loadPublic(target);
      }
      if (target !== 'sitio' && !this.pages()[target]) {
        await this.fetchPage(target);
      }
      this.currentSlug.set(target);
      this.loaded.set(true);
    } catch {
      this.publicLoadError.set(this.activeLocale() === 'en'
        ? 'We could not load the content. Please try again in a moment.'
        : 'No pudimos cargar el contenido. Inténtalo de nuevo en unos segundos.');
    } finally {
      if (this.loadingSlug() === target) {
        this.loadingSlug.set(null);
      }
    }
  }

  private ensureShell(): Promise<void> {
    const locale = this.activeLocale();
    if (this.shellTask && this.shellLocale === locale) {
      return this.shellTask;
    }
    this.loadedEverything = false;
    this.pageLoads.clear();
    this.pages.set({});
    this.loaded.set(false);
    this.shellLocale = locale;
    const preview = this.previewQuery();
    const task = Promise.all([this.api.getSite(preview), this.api.getPagesCatalog()]).then(([site, catalog]) => {
      if (this.activeLocale() !== locale) {
        return;
      }
      this.writeDoc('sitio', site);
      this.pageList.set(catalog.pages);
      this.menuItems.set(catalog.menu);
      registerPageRoutes(catalog.pages);
    }).catch((err) => {
      if (this.shellTask === task) {
        this.shellTask = null;
      }
      throw err;
    });
    this.shellTask = task;
    return this.shellTask;
  }

  private fetchPage(slug: string): Promise<void> {
    const locale = this.activeLocale();
    const key = `${locale}:${slug}`;
    const existing = this.pageLoads.get(key);
    if (existing) {
      return existing;
    }
    const task = this.api.getPage(slug, this.previewQuery()).then((full) => {
      if (this.activeLocale() !== locale) {
        return;
      }
      this.writeDoc(slug, full);
    }).catch((err) => {
      this.pageLoads.delete(key);
      throw err;
    });
    this.pageLoads.set(key, task);
    return task;
  }

  async reloadSlug(slug: string): Promise<void> {
    const preview = this.previewQuery();
    const full = slug === 'sitio' ? await this.api.getSite(preview) : await this.api.getPage(slug, preview);
    this.writeDoc(slug, full);
    this.dirty.set(false);
    this.conflict.set('');
    this.undoHistory.clear();
    this.dirtyFields.set(new Set());
  }

  async listPages() {
    const catalog = await this.api.getPagesCatalog();
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    return catalog.pages;
  }

  async save(): Promise<void> {
    const slug = this.currentSlug();
    this.saving.set(true);
    this.conflict.set('');
    try {
      const version = this.versions()[slug] ?? 1;
      const content = slug === 'sitio' ? this.site() : (this.pages()[slug] ?? {});
      const res = await this.api.save(slug, content, version);
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
      const res = await this.api.publish(slug, this.versions()[slug] ?? 1);
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

  async listRevisions() {
    return this.api.listRevisions(this.currentSlug());
  }

  async restoreRevision(id: number): Promise<void> {
    const slug = this.currentSlug();
    try {
      const res = await this.api.restoreRevision(slug, id, this.versions()[slug] ?? 1);
      this.applySaveResponse(slug, res);
      this.dirty.set(false);
    } catch (err) {
      this.handleSaveError(err);
      throw err;
    }
  }

  async createPreviewLink(): Promise<string> {
    const slug = this.currentSlug();
    const res = await this.api.createPreviewToken(slug);
    return res.url || `${pathForSlug(slug)}?preview=`;
  }

  async uploadImage(file: File): Promise<string> {
    const res = await this.api.uploadMedia(file);
    if (res.width && res.height) {
      this.imageMeta.update((map) => ({ ...map, [res.url]: { width: res.width!, height: res.height! } }));
    }
    return res.url;
  }

  async cropImage(url: string, box: { x: number; y: number; w: number; h: number }): Promise<string> {
    const res = await this.api.cropMedia({ url, ...box });
    if (res.width && res.height) {
      this.imageMeta.update((map) => ({ ...map, [res.url]: { width: res.width!, height: res.height! } }));
    }
    return res.url;
  }

  async cropImageDetails(url: string, box: { x: number; y: number; w: number; h: number }) {
    const res = await this.api.cropMedia({ url, ...box });
    if (res.width && res.height) {
      this.imageMeta.update((map) => ({ ...map, [res.url]: { width: res.width!, height: res.height! } }));
    }
    return res;
  }

  async mediaVersions(id: number) {
    return this.api.listMediaVersions(id);
  }

  async restoreMedia(id: number, body: { use?: string; versionId?: number }) {
    return this.api.restoreMedia(id, body);
  }

  rememberImage(url: string, width?: number | null, height?: number | null): void {
    if (!url || !width || !height) {
      return;
    }
    this.imageMeta.update((map) => ({ ...map, [url]: { width, height } }));
  }

  resolvePublicMedia(url: string) {
    const hit = this.resolvedMedia.get(url);
    if (hit) {
      return hit;
    }
    const pending = this.api.resolveMedia(url).catch(() => null);
    this.resolvedMedia.set(url, pending);
    return pending;
  }

  async listMedia() {
    const items = await this.api.listMedia();
    for (const item of items) {
      this.rememberImage(item.url, item.width, item.height);
    }
    return items;
  }

  async deleteMedia(id: number): Promise<void> {
    await this.api.deleteMedia(id);
  }

  async listMessages(params?: { kind?: string; q?: string; status?: string; page?: number; limit?: number }) {
    return this.api.listMessages(params);
  }

  patchMessage(id: number, body: { status: string }) {
    return this.api.patchMessage(id, body);
  }

  getAiConfig() {
    return this.api.getAiConfig();
  }

  saveAiConfig(body: Parameters<CmsApiService['saveAiConfig']>[0]) {
    return this.api.saveAiConfig(body);
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
    const next = slug === 'sitio' ? content : migrateCmsDocument(content, slug);
    if (slug === 'sitio') {
      this.site.set(next);
    } else {
      this.pages.set({ ...this.pages(), [slug]: next });
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
    this.undoHistory.push({
      slug,
      path: '',
      scope: slug === 'sitio' ? 'site' : 'page',
      before,
      after: content,
    });
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
