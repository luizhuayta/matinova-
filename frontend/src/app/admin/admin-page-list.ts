import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsPageSummary, PAGE_LABELS, PAGE_META, groupPages } from '../cms/cms.models';

@Component({
  selector: 'app-admin-page-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-page-list.html',
  styleUrl: './styles/page-list.scss',
})
export class AdminPageList {
  readonly pages = input.required<CmsPageSummary[]>();
  readonly remove = output<CmsPageSummary>();

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
