import { Component, OnInit, inject, signal } from '@angular/core';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsPageSummary } from '../cms/cms.models';
import { AdminPageList } from './admin-page-list';

@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [AdminPageList],
  template: `
    <section class="wrap">
      <h1>Páginas</h1>
      <p class="admin-lead">Abre una para cambiar textos, fotos y listas.</p>

      @if (loading()) {
        <div class="admin-group" aria-busy="true">
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
    .wrap { max-width: 820px; }
  `],
})
export class AdminPages implements OnInit {
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
