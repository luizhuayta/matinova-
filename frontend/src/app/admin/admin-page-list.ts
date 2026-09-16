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
        <div class="group-head">
          <h2 class="admin-group-title">{{ group.title }}</h2>
          <span class="admin-chip admin-num">{{ group.pages.length }} {{ group.pages.length === 1 ? 'página' : 'páginas' }}</span>
        </div>
        <div class="page-grid">
          @for (page of group.pages; track page.slug) {
            <a class="page-card accent-{{ accentFor(group.title) }}" [routerLink]="['/admin/paginas', page.slug]">
              <span class="page-top">
                <span class="page-icon"><i class="bi {{ icon(page) }}" aria-hidden="true"></i></span>
                <i class="bi bi-arrow-up-right page-goto" aria-hidden="true"></i>
              </span>
              <span class="row-copy">
                <strong>{{ label(page) }}</strong>
                <small>{{ blurb(page) }}</small>
              </span>
              <span class="card-cta">Editar <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
            </a>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .group-head {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 1.35rem 0 0;
    }
    .group-head .admin-group-title { margin: 0; }
    .group-head::after {
      content: '';
      flex: 1 1 auto;
      height: 1px;
      background: var(--admin-line);
      border-radius: 1px;
    }
    .page-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 215px), 1fr));
      gap: 12px;
      margin-top: 0.65rem;
    }
    .page-card {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 0.7rem;
      align-content: start;
      min-height: 154px;
      padding: 1rem 0.95rem 0.9rem;
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: var(--admin-radius);
      color: var(--admin-text);
      text-decoration: none;
      transition: border-color var(--admin-ease), box-shadow var(--admin-ease), transform var(--admin-ease);
    }
    .page-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--accent);
    }
    .accent-mark { --accent: var(--admin-mark); --accent-soft: var(--admin-mark-soft); --accent-ink: var(--admin-mark-ink); }
    .accent-ink { --accent: var(--admin-ink); --accent-soft: #ece8e2; --accent-ink: var(--admin-ink); }
    .accent-ok { --accent: var(--admin-ok); --accent-soft: var(--admin-ok-bg); --accent-ink: var(--admin-ok); }
    .accent-warn { --accent: var(--admin-warn); --accent-soft: var(--admin-warn-bg); --accent-ink: var(--admin-warn); }
    .accent-muted { --accent: var(--admin-line); --accent-soft: var(--admin-paper); --accent-ink: var(--admin-muted); }
    .page-card:hover {
      color: var(--admin-text);
      border-color: #b7b1a9;
      box-shadow: var(--admin-shadow);
      transform: translateY(-2px);
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
      background: var(--accent-soft);
      border: 1px solid transparent;
      color: var(--accent-ink);
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
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: auto;
      justify-self: start;
      min-height: 30px;
      padding: 0 0.7rem;
      border: 1px solid var(--admin-line);
      border-radius: 999px;
      background: var(--admin-surface);
      color: var(--admin-text);
      font-size: 0.75rem;
      font-weight: 600;
      transition: background var(--admin-ease), color var(--admin-ease), border-color var(--admin-ease);
    }
    .card-cta i {
      font-size: 0.8rem;
      transition: transform var(--admin-ease);
    }
    .page-card:hover .card-cta {
      background: var(--admin-ink);
      border-color: var(--admin-ink);
      color: #fff;
    }
    .page-card:hover .card-cta i { transform: translateX(2px); }
    @media (prefers-reduced-motion: reduce) {
      .page-card,
      .page-icon,
      .page-goto,
      .card-cta,
      .card-cta i {
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

  accentFor(title: string): string {
    switch (title) {
      case 'Apariencia': return 'mark';
      case 'Páginas': return 'ink';
      case 'Servicios': return 'ok';
      case 'Legal': return 'warn';
      default: return 'muted';
    }
  }
}
