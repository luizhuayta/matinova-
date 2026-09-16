import { NgComponentOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Type, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsEditorService, PreviewDevice } from '../cms/cms-editor.service';
import { CmsSelectionService } from '../cms/cms-selection.service';
import { labelForPath } from '../cms/cms-schema';
import { CmsRevision, PAGE_LABELS, SLUG_PATHS, changedPaths } from '../cms/cms.models';
import { CmsInspector } from './cms-inspector';
import { Header } from '../components/header/header';
import { Footer } from '../components/footer/footer';

const DEVICE_HEIGHT: Record<PreviewDevice, number> = {
  desktop: 0,
  tablet: 1024,
  mobile: 844,
};

const BEZEL = 24;

const PAGE_LOADERS: Record<string, () => Promise<Type<unknown>>> = {
  inicio: () => import('../pages/home/home').then((m) => m.Home),
  'acerca-de': () => import('../pages/acerca-de/acerca-de').then((m) => m.AcercaDe),
  servicios: () => import('../pages/servicios/servicios').then((m) => m.Servicios),
  'servicios-software': () => import('../pages/servicios/software/software').then((m) => m.Software),
  'servicios-hardware': () => import('../pages/servicios/hardware/hardware').then((m) => m.Hardware),
  'servicios-saas': () => import('../pages/servicios/saas/saas').then((m) => m.Saas),
  'servicios-consultoria': () => import('../pages/servicios/consultoria/consultoria').then((m) => m.Consultoria),
  'servicios-soluciones-ti': () => import('../pages/servicios/soluciones-ti/soluciones-ti').then((m) => m.SolucionesTi),
  contacto: () => import('../pages/contacto/contacto').then((m) => m.Contacto),
  privacidad: () => import('../pages/privacidad/privacidad').then((m) => m.Privacidad),
  terminos: () => import('../pages/terminos/terminos').then((m) => m.Terminos),
  'libro-reclamaciones': () => import('../components/libro-reclamaciones/libro-reclamaciones').then((m) => m.LibroReclamacionesComponent),
};

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [NgComponentOutlet, RouterLink, Header, Footer, CmsInspector],
  templateUrl: './page-editor.html',
  styleUrl: './page-editor.scss',
})
export class PageEditor implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('previewWrap') previewWrap?: ElementRef<HTMLElement>;
  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLElement>;
  private route = inject(ActivatedRoute);
  cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  selection = inject(CmsSelectionService);
  auth = inject(AuthService);
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
  title = computed(() => PAGE_LABELS[this.slug()] || this.slug());
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
  saveState = computed(() => {
    if (this.cms.saving() || this.editor.uploading()) {
      return 'Guardando…';
    }
    if (this.cms.dirty() || this.cms.hasDraft()[this.slug()]) {
      return 'Cambios sin publicar';
    }
    return 'Guardado';
  });
  unpublishedCount = computed(() => this.cms.changeLines().length);
  changeLines = computed(() => this.cms.changeLines());
  private resize?: ResizeObserver;
  private timer?: number;

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
  }

  ngOnDestroy(): void {
    this.editor.disable();
    this.cms.stopEditingSession();
    this.resize?.disconnect();
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
  }

  setEditing(on: boolean): void {
    this.editor.setEditing(on);
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

  async save(): Promise<void> {
    this.error.set('');
    this.status.set('');
    try {
      await this.cms.save();
      this.status.set('Borrador guardado. Publica para que se vea en la web.');
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
    return SLUG_PATHS[this.slug()] || '/';
  }

  private async loadPreview(slug: string): Promise<void> {
    const loader = PAGE_LOADERS[slug];
    this.preview.set(loader ? await loader() : null);
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
