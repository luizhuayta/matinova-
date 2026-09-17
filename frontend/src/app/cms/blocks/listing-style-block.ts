import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsContentService } from '../cms-content.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, isInternalLink, propsPath } from '../block-registry';

@Component({
  selector: 'app-listing-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective],
  templateUrl: './listing-style-block.html',
  styleUrl: '../../pages/servicios/servicios.scss',
})
export class ListingStyleBlock {
  private cms = inject(CmsContentService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  cards = computed(() => asList(this.props()['cards']));
  isClientes = computed(() => this.cms.currentSlug() === 'clientes');

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  internal(link: string): boolean {
    return isInternalLink(link);
  }

  ctaLink(): string {
    return String(this.props()['link'] || '/contacto');
  }
}
