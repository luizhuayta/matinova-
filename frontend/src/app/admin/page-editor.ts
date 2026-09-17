import { NgComponentOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Type, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsEditorService, PreviewDevice } from '../cms/cms-editor.service';
import { CmsSelectionService } from '../cms/cms-selection.service';
import { LocaleService, CMS_LOCALES } from '../cms/locale.service';
import { CmsApiService } from '../cms/cms-api.service';
import { labelForPath } from '../cms/cms-schema';
import { CmsRevision, PAGE_LABELS, changedPaths, pathForSlug } from '../cms/cms.models';
import { CmsInspector } from './cms-inspector';
import { AdminTour } from './admin-tour';
import { Header } from '../components/header/header';
import { Footer } from '../components/footer/footer';

const DEVICE_HEIGHT: Record<PreviewDevice, number> = {
  desktop: 0,
  tablet: 1024,
  mobile: 844,
};

const BEZEL = 24;

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, Header, Footer, CmsInspector, AdminTour, FormsModule],
  templateUrl: './page-editor.html',
  styleUrl: './page-editor.scss',
})
export class PageEditor implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('previewWrap') previewWrap?: ElementRef<HTMLElement>;
  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLElement>;
  @ViewChild(AdminTour) tour?: AdminTour;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  selection = inject(CmsSelectionService);
  auth = inject(AuthService);
  locales = inject(LocaleService);
  private api = inject(CmsApiService);
  slug = signal('inicio');
  error = signal('');
  status = signal('');
  scale = signal(1);
  frameHeight = signal(640);
  preview = signal<Type<unknown> | null>(null);
  revisions = signal<CmsRevision[]>([]);
  showRevisions = signal(false);
  isSitio = computed(() => this.slug() === 'sitio');
  isLibro = computed(() => this.slug() === 'libro-reclamaciones');
  inMenu = computed(() => !!this.cms.pageList().find((page) => page.slug === this.slug())?.show_in_menu);
  title = computed(() => this.cms.pageList().find((page) => page.slug === this.slug())?.title || PAGE_LABELS[this.slug()] || this.slug());
  deviceWidth = computed(() => this.editor.deviceWidth());
  viewportHeight = computed(() => DEVICE_HEIGHT[this.editor.device()] || this.frameHeight());
  stageWidth = computed(() => {
    const extra = this.editor.device() === 'desktop' ? 0 : BEZEL;
    return Math.round(this.deviceWidth() * this.scale() + extra);
  });
  stageHeight = computed(() => {
    const extra = this.editor.device() === 'desktop' ? 0 : BEZEL;
    return Math.max(320, Math.round(this.viewportHeight() * this.scale() + extra));
  });
  canPublish = computed(() => this.auth.role() === 'admin');
  canRestore = computed(() => this.auth.role() === 'admin');
  canEditSlug = computed(() => {
    if (this.isSitio()) {
      return false;
    }
    const page = this.cms.pageList().find((item) => item.slug === this.slug());
    return page ? !page.protected : true;
  });
  slugDraft = signal('');
  slugWarn = signal('');
  redirects = signal<Array<{ id: number; from_path: string; to_path: string }>>([]);
  localeOptions = CMS_LOCALES;
  saveState = computed(() => {
    if (this.cms.saving() || this.editor.uploading()) {
      return 'Guardando…';
    }
    if (this.cms.dirty() || this.cms.hasDraft()[this.slug()]) {
      return 'Cambios sin publicar';
    }
    return 'Guardado';
  });
  notice = computed(() => {
    const err = this.error() || this.cms.conflict();
    if (err) {
      return { kind: 'error' as const, text: err, action: 'reload' as const, path: '' };
    }
    const fieldErr = this.cms.fieldError();
    if (fieldErr) {
      return { kind: 'error' as const, text: fieldErr.message, action: 'goto' as const, path: fieldErr.path };
    }
    const toast = this.cms.removeToast();
    if (toast) {
      return { kind: 'info' as const, text: toast, action: 'undo' as const, path: '' };
    }
    if (this.editor.uploading()) {
      return { kind: 'info' as const, text: 'La foto se está ajustando…', action: '' as const, path: '' };
    }
    const status = this.status();
    if (status) {
      return { kind: 'ok' as const, text: status, action: '' as const, path: '' };
    }
    return null;
  });
  unpublishedCount = computed(() => this.cms.changeLines().length);
  changeLines = computed(() => this.cms.changeLines());
  private resize?: ResizeObserver;
  private timer?: number;
  private tourTimer?: number;

  constructor() {
    effect(() => {
      this.cms.activeContent();
      this.editor.device();
      this.slug();
      this.scheduleScale();
    });
  }

  ngOnInit(): void {
    this.editor.enable();
    this.cms.startEditingSession();
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || 'inicio';
      this.slug.set(slug);
      this.slugDraft.set(slug);
      this.cms.useSlug(slug);
      this.selection.slug = slug;
      this.selection.selectedPath.set('');
      void this.loadPreview(slug);
      this.scheduleScale();
    });
  }

  ngAfterViewInit(): void {
    this.resize = new ResizeObserver(() => this.updateScale());
    if (this.previewWrap) {
      this.resize.observe(this.previewWrap.nativeElement);
    }
    this.scheduleScale();
    this.tourTimer = window.setTimeout(() => this.tour?.maybeStart(), 400);
  }

  ngOnDestroy(): void {
    this.editor.disable();
    this.cms.stopEditingSession();
    this.resize?.disconnect();
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    if (this.tourTimer) {
      window.clearTimeout(this.tourTimer);
    }
  }

  setEditing(on: boolean): void {
    this.editor.setEditing(on);
  }

  onTourActive(on: boolean): void {
    if (on) {
      this.editor.setEditing(true);
    }
  }

  replayTour(): void {
    this.tour?.start();
  }

  setDevice(device: PreviewDevice): void {
    this.editor.device.set(device);
    this.scheduleScale();
  }

  deviceLabel(): string {
    switch (this.editor.device()) {
      case 'tablet':
        return 'Vista tablet';
      case 'mobile':
        return 'Vista celular';
      default:
        return 'Vista escritorio';
    }
  }

  scaleHeight(): string {
    const locked = DEVICE_HEIGHT[this.editor.device()];
    return locked ? `${locked}px` : 'auto';
  }

  async toggleMenu(on: boolean): Promise<void> {
    try {
      await this.cms.updatePageMeta(this.slug(), { showInMenu: on });
    } catch {
      this.error.set('No se pudo actualizar el menú.');
    }
  }

  async save(): Promise<void> {
    this.error.set('');
    this.status.set('');
    try {
      await this.cms.save();
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.error.set(this.cms.conflict() || 'Alguien guardó antes. Recarga para no pisar cambios.');
        return;
      }
      this.error.set(this.cms.conflict() || 'No se pudieron guardar los cambios. Revisa tu conexión.');
    }
  }

  async publish(): Promise<void> {
    const n = this.unpublishedCount();
    const howMany = n > 0 ? `Afecta a ${n} cambio${n === 1 ? '' : 's'} de esta página. ` : 'Se publicará el borrador de esta página. ';
    if (!confirm(`${howMany}Esto lo verá todo el mundo en la web. ¿Publicar ahora?`)) {
      return;
    }
    this.error.set('');
    this.status.set('');
    try {
      await this.cms.publish();
      this.status.set('Publicado. La web ya muestra esta versión.');
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.error.set(this.cms.conflict() || 'Alguien publicó antes. Recarga para no pisar cambios.');
        return;
      }
      this.error.set(this.cms.conflict() || 'No se pudo publicar. Comprueba que tu usuario sea administrador.');
    }
  }

  async reload(): Promise<void> {
    await this.cms.reloadSlug(this.slug());
    this.error.set('');
    this.status.set('Se recargó el documento actual.');
  }

  async previewPublic(): Promise<void> {
    try {
      const url = await this.cms.createPreviewLink();
      window.open(url, '_blank', 'noopener');
    } catch {
      this.error.set('No se pudo crear el enlace de vista previa.');
    }
  }

  async toggleRevisions(): Promise<void> {
    const next = !this.showRevisions();
    this.showRevisions.set(next);
    if (next) {
      try {
        this.revisions.set(await this.cms.listRevisions());
      } catch {
        this.error.set('No se pudieron cargar las revisiones.');
      }
    }
  }

  goToPath(path: string): void {
    this.editor.setEditing(true);
    this.selection.selectFromPreview(path);
  }

  revisionDiff(item: CmsRevision): string[] {
    return changedPaths(this.cms.activeContent(), item.snapshot)
      .slice(0, 12)
      .map((path) => labelForPath(this.slug(), path));
  }

  async restore(item: CmsRevision): Promise<void> {
    if (!this.canRestore()) {
      return;
    }
    if (!confirm('¿Restaurar esta revisión al borrador?')) {
      return;
    }
    try {
      await this.cms.restoreRevision(item.id);
      this.status.set('Revisión restaurada en el borrador. Publica para verla en la web.');
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 409) {
        this.error.set(this.cms.conflict() || 'Alguien guardó antes. Recarga para no pisar cambios.');
        return;
      }
      this.error.set(this.cms.conflict() || 'No se pudo restaurar la revisión.');
    }
  }

  publicPath(): string {
    return pathForSlug(this.slug());
  }

  async saveSlug(): Promise<void> {
    const next = this.slugDraft().trim().toLowerCase();
    if (!next || next === this.slug()) {
      return;
    }
    if (!confirm('Al cambiar la ruta, la URL anterior redirigirá a la nueva. ¿Continuar?')) {
      return;
    }
    try {
      const page = await this.cms.updatePageMeta(this.slug(), { slug: next });
      this.slugWarn.set('');
      this.redirects.set(await this.api.listRedirects().catch(() => []));
      await this.router.navigate(['/admin/paginas', page.slug]);
      this.status.set('Ruta actualizada. La URL anterior redirige aquí.');
    } catch {
      this.error.set('No se pudo cambiar la ruta.');
    }
  }

  async changeLocale(next: string): Promise<void> {
    const locale = next === 'en' ? 'en' : 'es';
    this.locales.locale.set(locale);
    try {
      if (locale !== 'es') {
        await this.api.translatePage(this.slug(), locale);
      }
      await this.cms.loadAll();
      this.cms.useSlug(this.slug());
    } catch {
      this.error.set('No se pudo cargar el idioma.');
    }
  }

  private async loadPreview(slug: string): Promise<void> {
    if (slug === 'sitio') {
      this.preview.set(null);
      return;
    }
    const mod = await import('../pages/dynamic-page/dynamic-page');
    this.preview.set(mod.DynamicPage);
  }

  private scheduleScale(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(() => this.updateScale(), 60);
  }

  private updateScale(): void {
    const wrap = this.previewWrap?.nativeElement;
    const frame = this.previewFrame?.nativeElement;
    if (!wrap || !frame) {
      return;
    }
    const device = this.editor.device();
    const locked = DEVICE_HEIGHT[device];
    const bezel = locked ? BEZEL : 0;
    const availW = Math.max(180, wrap.clientWidth - 32);
    const availH = Math.max(240, wrap.clientHeight - 32);
    const width = this.editor.deviceWidth();
    const contentH = Math.max(frame.scrollHeight, frame.offsetHeight, 480);
    const height = locked || contentH;
    const scaleW = (availW - bezel) / width;
    const scaleH = locked ? (availH - bezel) / locked : 1;
    this.scale.set(Math.min(1, scaleW, scaleH));
    this.frameHeight.set(height);
    if (this.resize && !frame.dataset['observed']) {
      this.resize.observe(frame);
      frame.dataset['observed'] = '1';
    }
  }
}
