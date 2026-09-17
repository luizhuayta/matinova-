import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { CmsContentService } from '../cms-content.service';
import { CmsEditorService } from '../cms-editor.service';
import {
  ABOUT_STYLE_TYPES,
  CONTACT_STYLE_TYPES,
  EXTRA_STYLE_TYPES,
  HOME_STYLE_TYPES,
  LEGAL_STYLE_TYPES,
  LISTING_STYLE_TYPES,
  SERVICE_STYLE_TYPES,
  pageBlocks,
  propsPath,
} from '../block-registry';
import { HomeStyleBlock } from './home-style-block';
import { AboutStyleBlock } from './about-style-block';
import { ListingStyleBlock } from './listing-style-block';
import { ServiceStyleBlock } from './service-style-block';
import { LegalStyleBlock } from './legal-style-block';
import { ContactFormBlock } from './contact-form-block';
import { ExtraStyleBlock } from './extra-style-block';
import { LibroReclamacionesComponent } from '../../components/libro-reclamaciones/libro-reclamaciones';

@Component({
  selector: 'app-cms-page-blocks',
  standalone: true,
  imports: [
    CommonModule,
    HomeStyleBlock,
    AboutStyleBlock,
    ListingStyleBlock,
    ServiceStyleBlock,
    LegalStyleBlock,
    ContactFormBlock,
    ExtraStyleBlock,
    LibroReclamacionesComponent,
  ],
  templateUrl: './cms-page-blocks.html',
  styles: [`
    :host { display: block; }
    .cms-blocks {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
    }
    .cms-block { position: relative; grid-column: span 12; }
    .cms-block.w-half { grid-column: span 6; }
    .cms-block.w-third { grid-column: span 4; }
    @media (max-width: 800px) {
      .cms-block.w-half, .cms-block.w-third { grid-column: span 12; }
    }
    .cms-block.is-hidden {
      opacity: 0.42;
      outline: 1px dashed #c8c2ba;
    }
    .cms-block-chrome {
      display: none;
    }
    :host-context([data-cms-mode='edit']) .cms-block-chrome {
      display: flex;
      gap: 6px;
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 20;
    }
    .cms-block-chrome button {
      border: 0;
      border-radius: 6px;
      background: rgba(20,24,31,.85);
      color: #fff;
      width: 32px;
      height: 32px;
      cursor: pointer;
    }
  `],
})
export class CmsPageBlocks {
  private cms = inject(CmsContentService);
  editor = inject(CmsEditorService);
  readonly slug = input('');

  blocks = computed(() => {
    const slug = this.slug() || this.cms.currentSlug();
    const page = slug === 'sitio' ? this.cms.site() : (this.cms.pages()[slug] ?? {});
    return pageBlocks(page);
  });

  visible = computed(() => {
    const all = this.blocks();
    if (this.editor.editMode()) {
      return all;
    }
    return all.filter((item) => !item.hidden);
  });

  group(type: string): string {
    const slug = this.slug() || this.cms.currentSlug();
    if (slug === 'acerca-de' && (type === 'about' || type === 'contactCards')) {
      return 'about';
    }
    if (HOME_STYLE_TYPES.has(type)) return 'home';
    if (ABOUT_STYLE_TYPES.has(type)) return 'about';
    if (LISTING_STYLE_TYPES.has(type)) return 'listing';
    if (SERVICE_STYLE_TYPES.has(type)) return 'service';
    if (LEGAL_STYLE_TYPES.has(type)) return 'legal';
    if (CONTACT_STYLE_TYPES.has(type)) return 'contact';
    if (EXTRA_STYLE_TYPES.has(type)) return 'extra';
    if (type === 'claimsBook') return 'claims';
    return 'extra';
  }

  realIndex(blockId: string): number {
    return this.blocks().findIndex((item) => item.id === blockId);
  }

  claimsPrefix(blockId: string): string {
    const index = this.realIndex(blockId);
    return index >= 0 ? propsPath(index) : '';
  }

  widthClass(block: { layout?: { width?: string } }): string {
    const width = block.layout?.width || 'full';
    if (width === 'half') return 'w-half';
    if (width === 'third') return 'w-third';
    return '';
  }

  layoutStyle(block: { layout?: { padding?: string; background?: string } }): Record<string, string> {
    const style: Record<string, string> = {};
    if (block.layout?.padding) style['padding'] = block.layout.padding;
    if (block.layout?.background) style['background'] = block.layout.background;
    return style;
  }
}
