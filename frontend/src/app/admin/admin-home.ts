import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../cms/auth.service';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsPageSummary } from '../cms/cms.models';
import { AdminPageList } from './admin-page-list';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, AdminPageList],
  template: `
    <section class="dash">
      <header class="dash-head">
        <div>
          <h1>Hola, {{ auth.username() }}</h1>
          <p class="admin-lead">Elige una página y cambia sus textos, fotos y tarjetas.</p>
        </div>
        <div class="dash-tools">
          <a routerLink="/admin/mensajes" class="admin-btn-ghost">
            <i class="bi bi-inbox" aria-hidden="true"></i>
            Mensajes
          </a>
          <a routerLink="/admin/archivos" class="admin-btn-ghost">
            <i class="bi bi-images" aria-hidden="true"></i>
            Imágenes
          </a>
        </div>
      </header>

      <aside class="limits">
        <p>
          Puedes cambiar el contenido de cada página (textos, fotos, banners y cuántas tarjetas hay).
          No puedes crear páginas nuevas ni cambiar el diseño: eso está en Angular.
        </p>
      </aside>

      @if (loading()) {
        <div class="admin-group">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      } @else {
        <app-admin-page-list [pages]="pages()" />
      }
    </section>
  `,
  styles: [`
    .dash { max-width: 820px; }
    .dash-head {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: flex-end;
      margin-bottom: 0.5rem;
    }
    .dash-tools { display: flex; flex-wrap: wrap; gap: 8px; }
    .limits {
      margin: 1rem 0 0;
      padding: 0.9rem 1rem;
      background: var(--admin-blue-soft);
      border-radius: 12px;
      color: var(--admin-blue-deep);
    }
    .limits p { color: var(--admin-blue-deep); }
  `],
})
export class AdminHome implements OnInit {
  auth = inject(AuthService);
  private cms = inject(CmsContentService);
  pages = signal<CmsPageSummary[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.pages.set(await this.cms.listPages());
    } catch {
      this.error.set('No se pudieron cargar las páginas. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }
}
