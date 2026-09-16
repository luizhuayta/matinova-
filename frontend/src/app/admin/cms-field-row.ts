import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cms-field-row',
  standalone: true,
  template: `
    <div class="field">
      @if (controlId()) {
        <label [attr.for]="controlId()">{{ label() }}</label>
      } @else {
        <span class="lbl">{{ label() }}</span>
      }
      <ng-content />
      @if (note()) {
        <p class="len-note">{{ note() }}</p>
      }
      @if (hint()) {
        <details class="help">
          <summary>Ayuda</summary>
          <p>{{ hint() }}</p>
        </details>
      }
    </div>
  `,
  styleUrl: './cms-field-row.scss',
})
export class CmsFieldRow {
  readonly label = input.required<string>();
  readonly controlId = input('');
  readonly hint = input('');
  readonly note = input('');
}
