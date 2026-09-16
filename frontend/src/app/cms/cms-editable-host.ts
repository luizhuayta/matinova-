import { Directive, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';
import { CmsSelectionService } from './cms-selection.service';

@Directive()
export abstract class CmsEditableHost implements OnInit, OnDestroy {
  protected readonly el = inject(ElementRef<HTMLElement>);
  protected readonly cms = inject(CmsContentService);
  protected readonly editor = inject(CmsEditorService);
  protected readonly selection = inject(CmsSelectionService);
  protected hoverEnabled = true;
  protected clickMode: 'prevent' | 'stop' | 'off' = 'prevent';
  protected removeClasses = ['cms-editable', 'cms-placeholder', 'cms-selected'];

  protected abstract fieldPath(): string;

  ngOnInit(): void {
    this.selection.register(this.fieldPath(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.selection.unregister(this.fieldPath(), this.el.nativeElement);
    this.el.nativeElement.classList.remove(...this.removeClasses);
  }

  @HostListener('mouseenter')
  onEnter(): void {
    if (this.hoverEnabled && this.editor.editMode()) {
      this.selection.hover(this.fieldPath());
    }
  }

  @HostListener('mouseleave')
  onLeave(): void {
    if (this.hoverEnabled) {
      this.selection.leave(this.fieldPath());
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (this.clickMode === 'off' || !this.editor.editMode()) {
      return;
    }
    if (this.clickMode === 'prevent') {
      event.preventDefault();
    }
    event.stopPropagation();
    this.selection.selectFromPreview(this.fieldPath());
  }
}
