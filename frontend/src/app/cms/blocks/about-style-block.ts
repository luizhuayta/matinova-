import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, isInternalLink, propsPath, youtubeEmbed } from '../block-registry';

@Component({
  selector: 'app-about-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective],
  templateUrl: './about-style-block.html',
  styleUrl: '../../pages/acerca-de/acerca-de.scss',
})
export class AboutStyleBlock {
  private sanitizer = inject(DomSanitizer);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  props = computed(() => this.block().props);
  items = computed(() => asList(this.props()['items']));
  features = computed(() => {
    const raw = this.props()['features'];
    return Array.isArray(raw) ? raw : [];
  });

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  featurePath(i: number): string {
    const item = this.features()[i];
    return typeof item === 'string' ? this.path(`features.${i}`) : this.path(`features.${i}.text`);
  }

  hasLink(url: unknown): boolean {
    const value = String(url ?? '').trim();
    return value !== '' && value !== '#';
  }

  internal(link: string): boolean {
    return isInternalLink(link);
  }

  linkOf(): string {
    return String(this.props()['ctaLink'] || '');
  }

  embed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbed(url));
  }
}
