import { Injectable, signal } from '@angular/core';
import { cmsControlId } from './cms.models';
import { labelForPath } from './cms-schema';

@Injectable({ providedIn: 'root' })
export class CmsSelectionService {
  private nodes = new Map<string, HTMLElement>();
  readonly hoverPath = signal('');
  readonly selectedPath = signal('');
  slug = 'inicio';

  register(path: string, el: HTMLElement): void {
    this.nodes.set(path, el);
    el.dataset['cmsPath'] = path;
  }

  unregister(path: string, el: HTMLElement): void {
    if (this.nodes.get(path) === el) {
      this.nodes.delete(path);
    }
  }

  label(path: string): string {
    return labelForPath(this.slug, path);
  }

  hover(path: string): void {
    this.hoverPath.set(path);
  }

  leave(path: string): void {
    if (this.hoverPath() === path) {
      this.hoverPath.set('');
    }
  }

  selectFromPreview(path: string): void {
    this.selectedPath.set(path);
    this.focusPanel(path);
  }

  selectFromPanel(path: string): void {
    this.selectedPath.set(path);
    this.scrollPreview(path);
  }

  focusPanel(path: string): void {
    const id = cmsControlId(path);
    const box = document.getElementById(id);
    box?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const focusable = box?.querySelector<HTMLElement>('input, textarea, select, [contenteditable="true"], button');
    focusable?.focus({ preventScroll: true });
  }

  scrollPreview(path: string): void {
    const node = this.nodes.get(path);
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}
