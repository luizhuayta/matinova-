import { Injectable, computed, signal } from '@angular/core';

export interface FieldPatch {
  slug: string;
  path: string;
  scope: 'page' | 'site';
  before: unknown;
  after: unknown;
}

@Injectable({ providedIn: 'root' })
export class CmsHistoryService {
  readonly undoStack = signal<FieldPatch[]>([]);
  readonly redoStack = signal<FieldPatch[]>([]);
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  push(patch: FieldPatch): void {
    this.undoStack.update((stack) => [...stack.slice(-79), patch]);
    this.redoStack.set([]);
  }

  dropLast(): void {
    this.undoStack.update((stack) => stack.slice(0, -1));
  }

  takeUndo(): FieldPatch | null {
    const stack = [...this.undoStack()];
    const last = stack.pop();
    if (!last) {
      return null;
    }
    this.undoStack.set(stack);
    this.redoStack.update((items) => [...items, last]);
    return last;
  }

  takeRedo(): FieldPatch | null {
    const stack = [...this.redoStack()];
    const last = stack.pop();
    if (!last) {
      return null;
    }
    this.redoStack.set(stack);
    this.undoStack.update((items) => [...items, last]);
    return last;
  }

  clear(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
  }

  items(): FieldPatch[] {
    return this.undoStack();
  }
}
