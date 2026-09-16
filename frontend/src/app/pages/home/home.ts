import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';
import { DEFAULT_INICIO_SECTIONS } from '../../cms/cms-schema';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, CmsTextDirective, CmsImageDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  currentSlide = 0;
  currentServiceSlide = 0;
  currentTestimonialSlide = 0;
  private heroIntervalId: ReturnType<typeof setInterval> | undefined;
  private serviceIntervalId: ReturnType<typeof setInterval> | undefined;
  private testimonialIntervalId: ReturnType<typeof setInterval> | undefined;

  page = computed(() => this.cms.pages()['inicio'] ?? {});
  slides = computed(() => (this.page()['slides'] as Array<Record<string, string>>) ?? []);
  services = computed(() => (this.page()['services'] as Record<string, unknown>) ?? {});
  serviceCards = computed(() => (this.services()['cards'] as Array<Record<string, string>>) ?? []);
  about = computed(() => (this.page()['about'] as Record<string, string>) ?? {});
  contactCards = computed(() => (this.page()['contactCards'] as Array<Record<string, string>>) ?? []);
  innovative = computed(() => (this.page()['innovative'] as Record<string, unknown>) ?? {});
  innovativeItems = computed(() => (this.innovative()['items'] as Array<Record<string, string>>) ?? []);
  testimonials = computed(() => (this.page()['testimonials'] as Record<string, unknown>) ?? {});
  testimonialItems = computed(() => (this.testimonials()['items'] as Array<Record<string, string>>) ?? []);
  animate = computed(() => this.cms.site()['animateCarousels'] !== false && !this.editor.editMode());
  visibleSections = computed(() => {
    const list = (this.page()['sections'] as Array<{ type: string; hidden?: boolean }>) ?? [];
    const source = list.length ? list : DEFAULT_INICIO_SECTIONS;
    return source.filter((item) => !item.hidden);
  });
  heroCtaLink = computed(() => String(this.page()['heroCtaLink'] || '/servicios/soluciones-ti'));
  heroCtaInternal = computed(() => this.heroCtaLink().startsWith('/'));

  ngOnInit(): void {
    this.cms.useSlug('inicio');
    this.iniciarCarruselesAutomaticos();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.heroIntervalId) clearInterval(this.heroIntervalId);
    if (this.serviceIntervalId) clearInterval(this.serviceIntervalId);
    if (this.testimonialIntervalId) clearInterval(this.testimonialIntervalId);
  }

  private iniciarCarruselesAutomaticos(): void {
    this.clearTimers();
    if (!this.animate()) {
      return;
    }
    this.heroIntervalId = setInterval(() => this.nextSlide(), 4000);
    this.serviceIntervalId = setInterval(() => this.nextServiceSlide(), 2000);
    this.testimonialIntervalId = setInterval(() => this.nextTestimonialSlide(), 2000);
  }

  nextSlide(): void {
    const n = this.slides().length;
    if (n) this.currentSlide = (this.currentSlide + 1) % n;
  }

  nextServiceSlide(): void {
    const maxSlides = Math.max(0, this.innovativeItems().length - 2);
    if (maxSlides) this.currentServiceSlide = (this.currentServiceSlide + 1) % maxSlides;
  }

  nextTestimonialSlide(): void {
    const max = Math.max(0, this.testimonialItems().length - 1);
    if (max) this.currentTestimonialSlide = (this.currentTestimonialSlide + 1) % max;
  }

  setSlide(index: number) { this.currentSlide = index; }

  heroImage(): string {
    return this.slides()[this.currentSlide]?.['image'] || 'carousel.jpg';
  }
}
