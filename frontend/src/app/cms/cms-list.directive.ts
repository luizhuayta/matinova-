import { Directive, input } from '@angular/core';
import { CmsEditableHost } from './cms-editable-host';

@Directive({
  selector: '[cmsList]',
  standalone: true,
})
export class CmsListDirective extends CmsEditableHost {
  readonly cmsList = input.required<string>();
  protected override hoverEnabled = false;
  protected override clickMode = 'off' as const;
  protected override removeClasses: string[] = [];

  protected fieldPath(): string {
    return this.cmsList();
  }
}
