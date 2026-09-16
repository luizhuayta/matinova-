import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsRichDirective } from '../../cms/cms-rich.directive';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CommonModule, CmsTextDirective, CmsRichDirective],
  templateUrl: './privacidad.html',
  styleUrl: './privacidad.scss',
})
export class Privacidad implements OnInit {
  private cms = inject(CmsContentService);
  page = computed(() => this.cms.pages()['privacidad'] ?? {});

  ngOnInit(): void {
    this.cms.useSlug('privacidad');
  }
}
