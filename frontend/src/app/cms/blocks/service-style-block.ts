import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, isInternalLink, propsPath } from '../block-registry';

@Component({
  selector: 'app-service-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective],
  templateUrl: './service-style-block.html',
  styleUrl: '../../pages/servicios/software/software.scss',
})
export class ServiceStyleBlock {
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  reasons = computed(() => asList(this.props()['items']));

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  internal(link: string): boolean {
    return isInternalLink(link);
  }

  ctaLink(): string {
    return String(this.props()['ctaLink'] || '/contacto');
  }
}
