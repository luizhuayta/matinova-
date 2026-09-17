import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsPageSummary } from '../cms/cms.models';
import { PAGE_TEMPLATES } from '../cms/block-registry';
import { AdminPageList } from './admin-page-list';

@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [AdminPageList, FormsModule],
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Páginas</h1>
          <p class="admin-lead">Abre una para cambiar textos, fotos y secciones. También puedes crear páginas nuevas.</p>
        </div>
        <div class="head-actions">
          <button type="button" class="admin-btn-primary" (click)="open.set(true)">Nueva página</button>
        </div>
      </header>

      @if (loading()) {
        <div class="admin-group" aria-busy="true">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      } @else {
        <app-admin-page-list [pages]="pages()" (remove)="onRemove($event)" />
      }
    </section>

    @if (open()) {
      <div class="picker-backdrop" (click)="open.set(false)">
        <form class="create" (click)="$event.stopPropagation()" (ngSubmit)="create()">
          <h2>Nueva página</h2>
          <label>
            Título
            <input class="admin-control" name="title" [(ngModel)]="title" required maxlength="160">
          </label>
          <label>
            Ruta
            <input class="admin-control" name="slug" [(ngModel)]="slug" placeholder="se-completa-sola">
          </label>
          <label>
            Plantilla
            <select class="admin-control" name="template" [(ngModel)]="template">
              @for (item of templates; track item.id) {
                <option [value]="item.id">{{ item.label }} — {{ item.description }}</option>
              }
            </select>
          </label>
          <label class="switch-row">
            <span>Mostrar en el menú al publicar</span>
            <input type="checkbox" [(ngModel)]="showInMenu" name="showInMenu">
          </label>
          @if (formError()) {
            <p class="admin-banner error">{{ formError() }}</p>
          }
          <div class="actions">
            <button type="button" class="admin-btn-ghost" (click)="open.set(false)">Cancelar</button>
            <button type="submit" class="admin-btn-primary" [disabled]="saving()">{{ saving() ? 'Creando…' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .wrap { max-width: 860px; }
    .picker-backdrop {
      position: fixed; inset: 0; z-index: 30; display: grid; place-items: center;
      background: rgba(20,24,31,.45); padding: 1rem;
    }
    .create {
      width: min(460px, 100%); display: grid; gap: 12px; padding: 1.2rem;
      background: var(--admin-surface); border-radius: 12px; box-shadow: var(--admin-shadow);
    }
    .create h2 { margin: 0; }
    .create label { display: grid; gap: 4px; font-size: 0.875rem; }
    .switch-row { display: flex; justify-content: space-between; align-items: center; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
  `],
})
export class AdminPages implements OnInit {
  private cms = inject(CmsContentService);
  private router = inject(Router);
  pages = signal<CmsPageSummary[]>([]);
  loading = signal(true);
  error = signal('');
  open = signal(false);
  saving = signal(false);
  formError = signal('');
  title = '';
  slug = '';
  template = 'blank';
  showInMenu = false;
  templates = PAGE_TEMPLATES;

  async ngOnInit(): Promise<void> {
    try {
      this.pages.set(await this.cms.listPages());
    } catch {
      this.error.set('No se pudieron cargar las páginas. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  async onRemove(page: CmsPageSummary): Promise<void> {
    if (!confirm(`¿Eliminar «${page.title}»? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await this.cms.deletePage(page.slug);
      this.pages.set(await this.cms.listPages());
    } catch {
      this.error.set('No se pudo eliminar la página.');
    }
  }

  async create(): Promise<void> {
    this.formError.set('');
    if (!this.title.trim()) {
      this.formError.set('Escribe un título.');
      return;
    }
    this.saving.set(true);
    try {
      const page = await this.cms.createPage({
        title: this.title.trim(),
        slug: this.slug.trim() || undefined,
        template: this.template,
        showInMenu: this.showInMenu,
      });
      this.open.set(false);
      await this.router.navigate(['/admin/paginas', page.slug]);
    } catch (err) {
      const message = err instanceof HttpErrorResponse ? (err.error?.message as string | undefined) : '';
      this.formError.set(message || 'No se pudo crear la página.');
    } finally {
      this.saving.set(false);
    }
  }
}
