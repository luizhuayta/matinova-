import { Directive, OnDestroy, afterRenderEffect, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';

@Directive({
  selector: '[cmsList]',
  standalone: true,
  host: {
    class: 'cms-list-host',
    '[class.cms-list-editing]': 'editor.editMode()',
  },
})
export class CmsListDirective extends CmsEditableHost implements OnDestroy {
  readonly cmsList = input.required<string>();
  protected override hoverEnabled = true;
  protected override clickMode = 'prevent' as const;
  protected override removeClasses: string[] = [];

  constructor() {
    super();
    afterRenderEffect(() => {
      this.editor.editMode();
      this.cms.activeContent();
      this.syncHandles();
    });
  }

  protected fieldPath(): string {
    return this.cmsList();
  }

  override ngOnDestroy(): void {
    this.clearHandles();
    super.ngOnDestroy();
  }

  private clearHandles(): void {
    this.el.nativeElement.querySelectorAll(':scope > * > .cms-list-handle').forEach((node: Element) => node.remove());
  }

  private syncHandles(): void {
    const host = this.el.nativeElement;
    this.clearHandles();
    if (!this.editor.editMode()) {
      return;
    }
    const items = Array.from(host.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && !node.classList.contains('cms-list-handle')
    );
    items.forEach((child, index) => {
      if (getComputedStyle(child).position === 'static') {
        child.style.position = 'relative';
      }
      const bar = document.createElement('div');
      bar.className = 'cms-list-handle';
      const up = document.createElement('button');
      up.type = 'button';
      up.setAttribute('aria-label', 'Subir');
      up.textContent = '↑';
      up.disabled = index === 0;
      up.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.cms.moveListItem(this.cmsList(), index, index - 1);
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.setAttribute('aria-label', 'Bajar');
      down.textContent = '↓';
      down.disabled = index === items.length - 1;
      down.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.cms.moveListItem(this.cmsList(), index, index + 1);
      });
      bar.append(up, down);
      child.appendChild(bar);
    });
  }
}
