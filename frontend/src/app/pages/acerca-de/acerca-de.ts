import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsEditorService } from '../../cms/cms-editor.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsImageDirective } from '../../cms/cms-image.directive';

@Component({
  selector: 'app-acerca-de',
  imports: [CommonModule, RouterLink, CmsTextDirective, CmsImageDirective],
  templateUrl: './acerca-de.html',
  styleUrl: './acerca-de.scss',
})
export class AcercaDe implements OnInit {
  private cms = inject(CmsContentService);
  private sanitizer = inject(DomSanitizer);
  editor = inject(CmsEditorService);
  page = computed(() => this.cms.pages()['acerca-de'] ?? {});
  stats = computed(() => (this.page()['stats'] as Array<Record<string, string>>) ?? []);
  features = computed(() => (this.page()['features'] as string[]) ?? []);
  team = computed(() => (this.page()['team'] as Array<Record<string, string>>) ?? []);
  contactCards = computed(() => (this.page()['contactCards'] as Array<Record<string, string>>) ?? []);
  videos = computed(() => (this.page()['videos'] as Array<Record<string, string>>) ?? []);

  ngOnInit(): void {
    this.cms.useSlug('acerca-de');
  }

  embed(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
