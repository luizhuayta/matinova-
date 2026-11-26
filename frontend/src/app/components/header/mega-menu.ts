import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CmsTextDirective } from '../../cms/cms-text.directive';
import { MegaMenuItem } from './mega-menu.model';

@Component({
  selector: 'app-header-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, CmsTextDirective],
  template: `
    <div
      class="mega-panel"
      [class.is-open]="open()"
      [id]="panelId()"
      [hidden]="!open()"
      role="region"
      [attr.aria-label]="sectionLabel()"
      (pointerenter)="panelEnter.emit($event)"
      (pointerleave)="panelLeave.emit($event)"
    >
      <div class="mega-panel__inner">
        <div class="mega-panel__header">
          <div class="mega-panel__eyebrow">
            <span class="mega-panel__badge" aria-hidden="true">
              @if (sectionBiIcon()) {
                <i class="bi" [class]="sectionBiIcon()"></i>
              } @else if (sectionSvgIcon()) {
                <svg class="mega-panel__badge-svg"><use [attr.href]="'assets/icons/ui.svg#' + sectionSvgIcon()"></use></svg>
              } @else {
                <i class="bi bi-grid"></i>
              }
            </span>
            <span class="mega-panel__section-title">{{ sectionLabel() }}</span>
          </div>
          @if (allLink() && allLabel()) {
            <a class="mega-panel__all" [routerLink]="allLink()" (click)="itemSelect.emit()">
              {{ allLabel() }}<i class="bi bi-arrow-right mega-panel__all-arrow" aria-hidden="true"></i>
            </a>
          }
        </div>

        <div class="mega-panel__grid">
          @for (item of items(); track item.id) {
            <a
              class="mega-tile"
              [routerLink]="item.path"
              [queryParams]="item.queryParams ?? null"
              routerLinkActive="is-current"
              (click)="itemSelect.emit()"
            >
              <span class="mega-tile__icon" aria-hidden="true">
                @if (item.image) {
                  <img [src]="item.image" alt="" class="mega-tile__img" loading="lazy">
                } @else if (item.biIcon) {
                  <i class="bi" [class]="item.biIcon"></i>
                } @else if (item.svgIcon) {
                  <svg class="mega-tile__svg"><use [attr.href]="'assets/icons/ui.svg#' + item.svgIcon"></use></svg>
                } @else {
                  <span class="mega-tile__monogram">{{ item.monogram }}</span>
                }
              </span>
              <span class="mega-tile__copy">
                @if (item.cmsTextPath) {
                  <span class="mega-tile__title" [cmsText]="item.cmsTextPath" cmsScope="site">{{ item.label }}</span>
                } @else {
                  <span class="mega-tile__title">{{ item.label }}</span>
                }
                <span class="mega-tile__subtitle">{{ item.subtitle }}</span>
              </span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./mega-menu.scss'],
})
export class HeaderMegaMenu {
  readonly panelId = input.required<string>();
  readonly open = input.required<boolean>();
  readonly sectionLabel = input.required<string>();
  readonly sectionBiIcon = input<string | undefined>(undefined);
  readonly sectionSvgIcon = input<string | undefined>(undefined);
  readonly allLink = input<string | undefined>(undefined);
  readonly allLabel = input<string | undefined>(undefined);
  readonly items = input.required<MegaMenuItem[]>();

  readonly itemSelect = output<void>();
  readonly panelEnter = output<PointerEvent>();
  readonly panelLeave = output<PointerEvent>();
}
