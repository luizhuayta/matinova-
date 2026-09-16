import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsPageSummary, PAGE_LABELS, PAGE_META, groupPages } from '../cms/cms.models';

@Component({
  selector: 'app-admin-page-list',
  standalone: true,
  imports: [RouterLink, NgClass],
  template: `
    @for (group of groups(); track group.title) {
      <div class="admin-group">
        <h2 class="admin-group-title">{{ group.title }}</h2>
        @for (page of group.pages; track page.slug) {
          <a class="admin-row" [routerLink]="['/admin/paginas', page.slug]">
            <i class="row-icon bi" [ngClass]="meta(page).icon" aria-hidden="true"></i>
            <span class="row-copy">
              <strong>{{ label(page) }}</strong>
              <small>{{ meta(page).blurb }}</small>
            </span>
            <span class="admin-link">Editar</span>
          </a>
        }
      </div>
    }
  `,
  styles: [`
    .admin-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; }
    .row-icon {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--admin-blue-soft);
      color: var(--admin-blue-deep);
      font-size: 1rem;
    }
    .row-copy { display: grid; min-width: 0; }
    .row-copy small {
      color: var(--admin-muted);
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class AdminPageList {
  readonly pages = input.required<CmsPageSummary[]>();

  groups() {
    return groupPages(this.pages());
  }

  label(page: CmsPageSummary): string {
    return PAGE_LABELS[page.slug] || page.title;
  }

  meta(page: CmsPageSummary) {
    return PAGE_META[page.slug] || { icon: 'bi-file-earmark', blurb: 'Textos y fotos' };
  }
}
