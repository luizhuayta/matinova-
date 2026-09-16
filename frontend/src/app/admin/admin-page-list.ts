import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsPageSummary, PAGE_LABELS, PAGE_META, groupPages } from '../cms/cms.models';

@Component({
  selector: 'app-admin-page-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    @for (group of groups(); track group.title) {
      <div class="admin-group">
        <h2 class="admin-group-title">{{ group.title }}</h2>
        <div class="page-grid">
          @for (page of group.pages; track page.slug) {
            <a class="page-card" [routerLink]="['/admin/paginas', page.slug]">
              <span class="page-top">
                <span class="page-icon"><i class="bi {{ icon(page) }}" aria-hidden="true"></i></span>
                <i class="bi bi-arrow-up-right page-goto" aria-hidden="true"></i>
              </span>
              <span class="row-copy">
                <strong>{{ label(page) }}</strong>
                <small>{{ blurb(page) }}</small>
              </span>
              <span class="admin-link card-cta">Editar</span>
            </a>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .page-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 215px), 1fr));
      gap: 12px;
      margin-top: 0.65rem;
    }
    .page-card {
      display: grid;
      gap: 0.7rem;
      align-content: start;
      min-height: 150px;
      padding: 0.9rem 0.95rem 0.85rem;
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      color: var(--admin-text);
      text-decoration: none;
      transition: border-color var(--admin-ease), box-shadow var(--admin-ease), transform var(--admin-ease);
    }
    .page-card:hover {
      color: var(--admin-text);
      border-color: #b7b1a9;
      box-shadow: var(--admin-shadow);
      transform: translateY(-1px);
    }
    .page-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .page-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: var(--admin-radius-ctrl);
      background: var(--admin-paper);
      border: 1px solid var(--admin-line);
      color: var(--admin-ink);
      font-size: 1.1rem;
      transition: background var(--admin-ease), color var(--admin-ease), border-color var(--admin-ease);
    }
    .page-card:hover .page-icon {
      background: var(--admin-ink);
      border-color: var(--admin-ink);
      color: #fff;
    }
    .page-goto {
      color: var(--admin-muted);
      font-size: 0.95rem;
      transition: color var(--admin-ease), transform var(--admin-ease);
    }
    .page-card:hover .page-goto {
      color: var(--admin-ink);
      transform: translate(1px, -1px);
    }
    .row-copy { display: grid; min-width: 0; gap: 0.15rem; }
    .row-copy strong {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--admin-text);
    }
    .row-copy small {
      color: var(--admin-muted);
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .card-cta {
      font-size: 0.8125rem;
      margin-top: auto;
      justify-self: start;
    }
    @media (prefers-reduced-motion: reduce) {
      .page-card,
      .page-icon,
      .page-goto {
        transition: none;
        transform: none;
      }
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

  blurb(page: CmsPageSummary): string {
    return PAGE_META[page.slug]?.blurb || 'Textos y fotos';
  }

  icon(page: CmsPageSummary): string {
    return PAGE_META[page.slug]?.icon || 'bi-file-text';
  }
}
