import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsContentService } from '../../cms/cms-content.service';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { CmsRichDirective } from '../../cms/cms-rich.directive';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule, CmsTextDirective, CmsRichDirective],
  templateUrl: './terminos.html',
  styleUrl: './terminos.scss',
})
export class Terminos implements OnInit {
  private cms = inject(CmsContentService);
  page = computed(() => this.cms.pages()['terminos'] ?? {});

  ngOnInit(): void {
    this.cms.useSlug('terminos');
  }
}
