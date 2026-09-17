import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsContentService } from '../cms-content.service';
import { CmsEditorService } from '../cms-editor.service';
import { CmsTextDirective } from '../cms-text.directive';
import { CmsImageDirective } from '../cms-image.directive';
import { CmsLinkDirective } from '../cms-link.directive';
import { CmsListDirective } from '../cms-list.directive';
import { CmsBlock, asList, featureText, isInternalLink, propsPath } from '../block-registry';

@Component({
  selector: 'app-home-style-block',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective, CmsLinkDirective, CmsListDirective],
  templateUrl: './home-style-block.html',
  styleUrl: '../../pages/home/home.scss',
  styles: [`
    .features-list { display: grid; gap: 0.6rem; margin: 1rem 0 1.4rem; }
    .feature-item { display: flex; gap: 0.5rem; align-items: flex-start; }
    .feature-icon { color: #0066ff; font-weight: 700; }
  `],
})
export class HomeStyleBlock implements OnDestroy {
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  readonly block = input.required<CmsBlock>();
  readonly index = input.required<number>();
  currentSlide = 0;
  currentServiceSlide = 0;
  currentTestimonialSlide = 0;
  private timers: ReturnType<typeof setInterval>[] = [];

  p = computed(() => propsPath(this.index()));
  props = computed(() => this.block().props);
  slides = computed(() => asList(this.props()['slides']));
  serviceCards = computed(() => asList(this.props()['cards']));
  items = computed(() => asList(this.props()['items']));
  features = computed(() => {
    const raw = this.props()['features'];
    return Array.isArray(raw) ? raw : [];
  });
  animate = computed(() => this.cms.site()['animateCarousels'] !== false && !this.editor.editMode());
  ctaLink = computed(() => String(this.props()['ctaLink'] || this.props()['cta'] && '/contacto' || ''));

  constructor() {
    queueMicrotask(() => this.startTimers());
  }

  ngOnDestroy(): void {
    this.timers.forEach((id) => clearInterval(id));
  }

  path(field: string): string {
    return propsPath(this.index(), field);
  }

  featurePath(i: number): string {
    const item = this.features()[i];
    return typeof item === 'string' ? this.path(`features.${i}`) : this.path(`features.${i}.text`);
  }

  featureValue(item: unknown): string {
    return featureText(item);
  }

  internal(link: string): boolean {
    return isInternalLink(link);
  }

  private startTimers(): void {
    if (!this.animate()) {
      return;
    }
    const type = this.block().type;
    if (type === 'hero') {
      this.timers.push(setInterval(() => {
        const n = this.slides().length;
        if (n) this.currentSlide = (this.currentSlide + 1) % n;
      }, 4000));
    }
    if (type === 'innovative') {
      this.timers.push(setInterval(() => {
        const max = this.serviceSlideCount();
        if (max) this.currentServiceSlide = (this.currentServiceSlide + 1) % max;
      }, 2000));
    }
    if (type === 'testimonials') {
      this.timers.push(setInterval(() => {
        const max = this.testimonialSlideCount();
        if (max) this.currentTestimonialSlide = (this.currentTestimonialSlide + 1) % max;
      }, 2000));
    }
  }

  setSlide(index: number): void {
    this.currentSlide = index;
  }

  setServiceSlide(index: number): void {
    this.currentServiceSlide = index;
  }

  setTestimonialSlide(index: number): void {
    this.currentTestimonialSlide = index;
  }

  serviceSlideCount(): number {
    return Math.max(0, this.items().length - 2);
  }

  testimonialSlideCount(): number {
    return Math.max(0, this.items().length - 1);
  }

  stars(item: Record<string, string>): number[] {
    const raw = Number(item['rating']);
    const n = Number.isFinite(raw) && raw > 0 ? Math.min(5, Math.round(raw)) : 5;
    return Array.from({ length: n }, (_, i) => i);
  }

  heroImage(): string {
    return this.slides()[this.currentSlide]?.['image'] || 'carousel.jpg';
  }

  linkOf(): string {
    return String(this.props()['ctaLink'] || '');
  }
}
