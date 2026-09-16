import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { CmsSelectionService } from './cms-selection.service';

@Directive({
  selector: '[cmsList]',
  standalone: true,
})
export class CmsListDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private selection = inject(CmsSelectionService);
  readonly cmsList = input.required<string>();

  ngOnInit(): void {
    this.selection.register(this.cmsList(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.selection.unregister(this.cmsList(), this.el.nativeElement);
  }
}
