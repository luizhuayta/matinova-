import { Injectable, Optional, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { blankClone } from './cms-fields';
import { CmsApiService, CmsWriteResponse } from './cms-api.service';
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
import { AuthService } from './auth.service';

interface LocalDraft {
  version: number;
  content: JsonMap;
}

const DRAFT_CONFLICT = 'Hay una versión más reciente en el servidor. Tus cambios siguen en esta pestaña.';

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  constructor(
    private api: CmsApiService = inject(CmsApiService),
    private undoHistory: CmsHistoryService = inject(CmsHistoryService),
    private locales?: LocaleService,
    @Optional() private auth?: AuthService
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
  readonly uploadNotice = signal('');
  readonly fieldError = signal<{ path: string; message: string } | null>(null);
  readonly draftStorageError = signal(false);
  readonly siteDraftError = signal('');
  private readonly localDrafts = new Map<string, LocalDraft>();
  private readonly translationToast = signal<{ key: string; text: string } | null>(null);
  private toastTimer?: number;
  private translationToastTimer?: number;
  private pendingRemove: { path: string; index: number; item: unknown } | null = null;
  private autosaveTimer?: number;
  private editing = false;
  private shellLocale = '';
  private shellTask: Promise<void> | null = null;
  private loadedEditorContext: string | null = null;
  private editorLoad?: { context: string; task: Promise<void> };
  private readonly pageLoads = new Map<string, Promise<void>>();
  private readonly resolvedMedia = new Map<
    string,
    Promise<{ url: string; width?: number | null; height?: number | null; variants?: Array<{ width: number; url: string; kind?: string }> } | null>
  >();
  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.dirty() || (this.draftStorageError() && this.localDrafts.size > 0)) {
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
    if (slug !== this.currentSlug()) {
      this.resetEditorNotice();
      this.undoHistory.clear();
      this.dirty.set(false);
    }
    this.currentSlug.set(slug);
    if (this.editing && this.hasAllPages()) {
      this.restoreLocalDraft();
    }
  }

  startEditingSession(): void {
    this.editing = true;
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  stopEditingSession(): void {
    this.editing = false;
    this.editorLoad = undefined;
    this.loadedEditorContext = null;
    this.dirty.set(false);
    if (!this.draftStorageError()) {
      window.removeEventListener('beforeunload', this.onBeforeUnload);
    }
    window.clearTimeout(this.autosaveTimer);
  }

  get<T = unknown>(path: string, scope: 'page' | 'site' = 'page'): T {
    const root = scope === 'site' ? this.site() : this.activeContent();
    return getByPath(root, path) as T;
  }

  set(path: string, value: unknown, scope: 'page' | 'site' = 'page', record = true): void {
    const slug = scope === 'site' ? 'sitio' : this.currentSlug();
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
    this.dirtyFields.update((set) => new Set(set).add(`${slug}:${path}`));
    this.recordDraft(slug);
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
    const context = this.editorContext();
    const res = await this.api.createPage(body);
    const catalog = await this.api.getPagesCatalog(true);
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    if (res.content) {
      this.writeRoot(res.page.slug, migrateCmsDocument(res.content, res.page.slug));
      this.versions.update((map) => ({ ...map, [res.page.slug]: res.version }));
    }
    if (res.translations?.includes('en')) {
      this.showTranslationToast(res.page.slug, context, 'Se creó también la versión en inglés; traduce el texto cuando quieras.');
    }
    return res.page;
  }

  translationNotice(slug: string): string {
    const notice = this.translationToast();
    return notice?.key === this.draftKey(slug) ? notice.text : '';
  }

  private showTranslationToast(slug: string, context: string, text: string): void {
    this.translationToast.set({ key: this.draftKey(slug, context), text });
    if (typeof window === 'undefined') {
      return;
    }
    window.clearTimeout(this.translationToastTimer);
    this.translationToastTimer = window.setTimeout(() => this.translationToast.set(null), 8000);
  }

  async deletePage(slug: string): Promise<void> {
    await this.api.deletePage(slug);
    const next = { ...this.pages() };
    delete next[slug];
    this.pages.set(next);
    const catalog = await this.api.getPagesCatalog(true);
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
  }

  async updatePageMeta(
    slug: string,
    body: { title?: string; slug?: string; showInMenu?: boolean; menuOrder?: number; path?: string }
  ): Promise<CmsPageSummary> {
    const res = await this.api.updatePageMeta(slug, body);
    const catalog = await this.api.getPagesCatalog(true);
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    if (res.page.slug !== slug && this.pages()[slug]) {
      const next = { ...this.pages() };
      next[res.page.slug] = next[slug];
      delete next[slug];
      this.pages.set(next);
      this.versions.update(({ [slug]: version, ...versions }) => ({ ...versions, [res.page.slug]: version }));
      this.hasDraft.update(({ [slug]: draft, ...drafts }) => ({ ...drafts, [res.page.slug]: !!draft }));
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
    this.recordDraft(slug);
  }

  undo(): void {
    const last = this.undoHistory.takeUndo();
    if (!last) {
      return;
    }
    this.applyValue(last.slug, last.path, last.before, last.scope);
    this.recordDraft(last.slug);
  }

  redo(): void {
    const last = this.undoHistory.takeRedo();
    if (!last) {
      return;
    }
    this.applyValue(last.slug, last.path, last.after, last.scope);
    this.recordDraft(last.slug);
  }

  history() {
    return this.undoHistory.items();
  }

  async loadAll(): Promise<void> {
    if (this.auth && (!this.auth.username() || this.auth.sessionExpired())) {
      return;
    }
    const context = this.editorContext();
    if (this.editorLoad?.context === context) {
      return this.editorLoad.task;
    }
    const task: Promise<void> = this.fetchEditorDocuments(context, () => this.editorLoad?.task === task);
    this.editorLoad = { context, task };
    try {
      await task;
    } catch (err) {
      if (this.editorLoad?.task === task) {
        this.markSessionExpired(err);
      }
      throw err;
    } finally {
      if (this.editorLoad?.task === task) {
        this.editorLoad = undefined;
      }
    }
  }

  private async fetchEditorDocuments(context: string, isCurrent: () => boolean): Promise<void> {
    const [site, catalog] = await Promise.all([this.api.getSite('', true), this.api.getPagesCatalog(true)]);
    if (!isCurrent() || this.editorContext() !== context) {
      return;
    }
    const docs = await Promise.all(catalog.pages
      .filter((page) => page.slug !== 'sitio')
      .map(async ({ slug }) => [slug, await this.api.getPage(slug, '', true)] as const));
    if (!isCurrent() || this.editorContext() !== context || this.auth?.sessionExpired()) {
      return;
    }
    const wasLoaded = this.loadedEditorContext === context;
    if (!wasLoaded) {
      this.pages.set({});
      this.versions.set({});
      this.hasDraft.set({});
      this.dirtyFields.set(new Set());
      this.undoHistory.clear();
      this.resetEditorNotice();
      this.siteDraftError.set('');
    }
    for (const [slug, doc] of [['sitio', site] as const, ...docs]) {
      if (!wasLoaded || doc.version >= (this.versions()[slug] ?? 0)) {
        this.writeDoc(slug, doc);
      }
    }
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    this.loaded.set(true);
    this.loadedEditorContext = context;
    this.shellTask = null;
    this.pageLoads.clear();
    if (this.editing) {
      this.restoreLocalDraft();
    }
  }

  hasAllPages(): boolean {
    return this.loadedEditorContext === this.editorContext() && !this.auth?.sessionExpired();
  }

  async loadPublic(slug: string): Promise<void> {
    if (this.editing) {
      return;
    }
    const target = slug || 'inicio';
    this.loadingSlug.set(target);
    this.publicLoadError.set('');
    try {
      await this.ensureShell();
      if (this.editing) {
        return;
      }
      if (this.activeLocale() !== this.shellLocale) {
        return this.loadPublic(target);
      }
      if (target !== 'sitio' && !this.pages()[target]) {
        await this.fetchPage(target);
      }
      if (!this.editing) {
        this.currentSlug.set(target);
        this.loaded.set(true);
      }
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
    this.loadedEditorContext = null;
    this.editorLoad = undefined;
    this.pageLoads.clear();
    this.pages.set({});
    this.loaded.set(false);
    this.shellLocale = locale;
    const preview = this.previewQuery();
    const task = Promise.all([this.api.getSite(preview), this.api.getPagesCatalog()]).then(([site, catalog]) => {
      if (this.editing || this.shellTask !== task || this.activeLocale() !== locale) {
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
      if (this.editing || this.pageLoads.get(key) !== task || this.activeLocale() !== locale) {
        return;
      }
      this.writeDoc(slug, full);
    }).catch((err) => {
      if (this.pageLoads.get(key) === task) {
        this.pageLoads.delete(key);
      }
      throw err;
    });
    this.pageLoads.set(key, task);
    return task;
  }

  async reloadSlug(slug: string, discardDraft = false): Promise<void> {
    const context = this.editorContext();
    const key = this.draftKey(slug, context);
    const original = this.readDraft(key);
    if (discardDraft && this.editing) {
      window.clearTimeout(this.autosaveTimer);
    }
    try {
      const full = slug === 'sitio' ? await this.api.getSite('', true) : await this.api.getPage(slug, '', true);
      if (this.editorContext() !== context ||
          (this.loadedEditorContext === context && full.version < (this.versions()[slug] ?? 0))) {
        return;
      }
      if (discardDraft && this.readDraft(key) === original) {
        this.storeDraft(key);
        this.clearDirtyFields(slug);
        if (slug === 'sitio') {
          this.siteDraftError.set('');
        }
      }
      this.writeDoc(slug, full);
      if (this.editing && this.currentSlug() === slug) {
        this.undoHistory.clear();
        this.resetEditorNotice();
        this.restoreLocalDraft();
      }
    } catch (err) {
      this.markSessionExpired(err);
      throw err;
    } finally {
      this.scheduleAutosave();
    }
  }

  async listPages() {
    const catalog = await this.api.getPagesCatalog(true);
    this.pageList.set(catalog.pages);
    this.menuItems.set(catalog.menu);
    registerPageRoutes(catalog.pages);
    return catalog.pages;
  }

  async save(): Promise<void> {
    await this.writeCurrent(async (slug, context) => {
      await this.saveDraft(slug, context);
    });
  }

  async publish(): Promise<void> {
    await this.writeCurrent(async (slug, context) => {
      const key = this.draftKey(slug, context);
      const version = this.readDraft(key)
        ? await this.saveDraft(slug, context)
        : (this.versions()[slug] ?? 1);
      if (this.editorContext() !== context) {
        throw new Error('El idioma o la cuenta cambiaron durante el guardado.');
      }
      const res = await this.api.publish(slug, version);
      this.applyWriteResponse(slug, context, undefined, res, false);
      if (this.editorContext() === context && !this.readDraft(key)) {
        this.clearDirtyFields(slug);
      }
    });
  }

  async listRevisions() {
    return this.api.listRevisions(this.currentSlug());
  }

  async restoreRevision(id: number): Promise<void> {
    await this.writeCurrent(async (slug, context) => {
      const original = this.readDraft(this.draftKey(slug, context));
      const res = await this.api.restoreRevision(slug, id, this.versions()[slug] ?? 1);
      this.applyWriteResponse(slug, context, original, res, true);
    });
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

  private async writeCurrent(
    write: (slug: string, context: string) => Promise<void>,
    slug = this.currentSlug()
  ): Promise<void> {
    if (this.saving() || (this.auth && !this.hasAllPages())) {
      throw new Error('El editor no puede guardar en este momento.');
    }
    const context = this.editorContext();
    this.saving.set(true);
    if (this.currentSlug() === slug) {
      this.conflict.set('');
      this.fieldError.set(null);
    }
    try {
      await write(slug, context);
    } catch (err) {
      if (this.editorContext() === context) {
        this.markSessionExpired(err);
        if (this.currentSlug() === slug) {
          this.handleSaveError(err);
        } else if (slug === 'sitio') {
          this.siteDraftError.set('Hay cambios de la apariencia del sitio pendientes de guardar.');
        }
      }
      throw err;
    } finally {
      this.saving.set(false);
      this.scheduleAutosave();
    }
  }

  private async saveDraft(slug: string, context: string): Promise<number> {
    const original = this.readDraft(this.draftKey(slug, context));
    const version = original?.version ?? this.versions()[slug] ?? 1;
    if (original && this.versions()[slug] !== undefined && version !== this.versions()[slug]) {
      throw new HttpErrorResponse({ status: 409, error: { message: DRAFT_CONFLICT } });
    }
    const res = await this.api.save(slug, original?.content ?? this.documentContent(slug), version);
    this.applyWriteResponse(slug, context, original, res, true);
    return res.version;
  }

  private applyWriteResponse(slug: string, context: string, sent: LocalDraft | undefined, res: CmsWriteResponse, hasDraft: boolean): void {
    const key = this.draftKey(slug, context);
    const isLoaded = this.editorContext() === context && (!this.auth || this.loadedEditorContext === context);
    if (isLoaded && res.version < (this.versions()[slug] ?? 0)) {
      if (this.currentSlug() === slug) {
        this.conflict.set(DRAFT_CONFLICT);
      }
      return;
    }
    const latest = this.readDraft(key);
    const newerDraft = latest && latest !== sent ? { ...latest, version: res.version } : undefined;
    this.storeDraft(key, newerDraft);
    if (!isLoaded) {
      return;
    }
    this.writeDoc(slug, {
      ...res,
      content: newerDraft?.content ?? res.content ?? this.documentContent(slug),
      hasDraft,
    });
    if (slug === 'sitio') {
      this.siteDraftError.set('');
    }
    if (this.currentSlug() === slug) {
      this.dirty.set(!!newerDraft);
      if ((res.syncedImages ?? 0) > 0) {
        this.showTranslationToast(slug, context, 'Imagen actualizada también en inglés');
      }
    }
  }

  private handleSaveError(err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      const field = err.error?.field;
      const message = err.error?.message as string | undefined;
      if (err.status === 401) {
        this.conflict.set('Sesión expirada, vuelve a iniciar sesión.');
        return;
      }
      if (err.status === 409) {
        if (Number.isInteger(err.error?.version)) {
          const slug = this.currentSlug();
          this.versions.update((map) => ({ ...map, [slug]: Math.max(map[slug] ?? 0, err.error.version) }));
        }
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

  private markSessionExpired(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.auth?.sessionExpired.set(true);
    }
  }

  private resetEditorNotice(): void {
    this.conflict.set('');
    this.fieldError.set(null);
    this.removeToast.set('');
    this.pendingRemove = null;
  }

  private clearDirtyFields(slug: string): void {
    this.dirtyFields.update((fields) => new Set([...fields].filter((field) => !field.startsWith(`${slug}:`))));
  }

  private editorContext(): string {
    return `${encodeURIComponent(this.auth?.username() ?? '')}:${this.activeLocale()}`;
  }

  private draftKey(slug: string, context = this.editorContext()): string {
    return `matt-cms-draft:${context}:${slug}`;
  }

  private readDraft(key: string): LocalDraft | undefined {
    const draft = this.localDrafts.get(key);
    if (draft || typeof window === 'undefined') {
      return draft;
    }
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(key) ?? 'null') as LocalDraft | null;
      if (stored && Number.isInteger(stored.version) && stored.content && typeof stored.content === 'object' && !Array.isArray(stored.content)) {
        this.localDrafts.set(key, stored);
        return stored;
      }
    } catch {
      // El borrador en memoria sigue disponible si falla el almacenamiento.
    }
    return undefined;
  }

  private storeDraft(key: string, draft?: LocalDraft): void {
    if (draft) {
      this.localDrafts.set(key, draft);
    } else {
      this.localDrafts.delete(key);
    }
    if (typeof window === 'undefined' || (key.startsWith('matt-cms-draft::') && !this.editing)) {
      return;
    }
    try {
      if (draft) {
        window.sessionStorage.setItem(key, JSON.stringify(draft));
      } else {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      this.draftStorageError.set(true);
    }
  }

  private restoreLocalDraft(): void {
    const slug = this.currentSlug();
    if (slug !== 'sitio') {
      const siteDraft = this.readDraft(this.draftKey('sitio'));
      if (siteDraft) {
        this.writeRoot('sitio', siteDraft.content);
      }
    }
    const draft = this.readDraft(this.draftKey(slug));
    this.dirty.set(!!draft);
    if (draft) {
      this.writeRoot(slug, draft.content);
      if (draft.version !== this.versions()[slug]) {
        this.conflict.set(DRAFT_CONFLICT);
      }
    }
    this.scheduleAutosave();
  }

  private documentContent(slug: string): JsonMap {
    return slug === 'sitio' ? this.site() : (this.pages()[slug] ?? {});
  }

  private recordDraft(slug: string): void {
    const key = this.draftKey(slug);
    this.storeDraft(key, {
      version: this.readDraft(key)?.version ?? this.versions()[slug] ?? 1,
      content: this.documentContent(slug),
    });
    if (this.currentSlug() === slug) {
      this.dirty.set(true);
    }
    this.scheduleAutosave();
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
    window.clearTimeout(this.autosaveTimer);
    if (this.saving() || (this.auth && !this.hasAllPages()) || !this.nextAutosaveSlug()) {
      return;
    }
    this.autosaveTimer = window.setTimeout(() => {
      const slug = this.nextAutosaveSlug();
      if (slug && !this.saving() && (!this.auth || this.hasAllPages())) {
        this.writeCurrent(async (target, context) => {
          await this.saveDraft(target, context);
        }, slug).catch(() => undefined);
      }
    }, 2000);
  }

  private nextAutosaveSlug(): string | undefined {
    if (this.dirty() && !this.conflict()) {
      return this.currentSlug();
    }
    if (this.currentSlug() !== 'sitio' && !this.siteDraftError() && this.readDraft(this.draftKey('sitio'))) {
      return 'sitio';
    }
    return undefined;
  }

  private previewQuery(): string {
    if (typeof location === 'undefined') {
      return '';
    }
    const token = new URLSearchParams(location.search).get('preview');
    return token ? `?preview=${encodeURIComponent(token)}` : '';
  }
}
