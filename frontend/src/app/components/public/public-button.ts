import { Directive, input } from '@angular/core';

@Directive({
  selector: 'a[publicBtn], button[publicBtn]',
  standalone: true,
  host: {
    class: 'public-btn',
    '[class.public-btn--navy]': 'tone() === "navy"',
    '[class.public-btn--accent]': 'tone() === "accent"',
    '[class.public-btn--ghost]': 'tone() === "ghost"',
    '[class.public-btn--soft]': 'tone() === "soft"',
  },
})
export class PublicButton {
  readonly tone = input<'primary' | 'navy' | 'accent' | 'ghost' | 'soft'>('primary');
}
