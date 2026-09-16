import { Component, computed, inject, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsSelectionService } from '../cms/cms-selection.service';
import { FieldDesc, addLabel, describeObject, fieldIcon, itemImage, itemTitle } from '../cms/cms-fields';
import { cmsControlId, JsonMap, getByPath } from '../cms/cms.models';
import { schemaFieldsAt, schemaForSlug, inspectorRootSchema } from '../cms/cms-schema';
import { CmsImageField } from './cms-image-field';
import { CmsRichField } from './cms-rich-field';

@Component({
  selector: 'app-cms-inspector',
  standalone: true,
  imports: [NgClass, FormsModule, CmsInspector, CmsImageField, CmsRichField, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './cms-inspector.html',
  styleUrl: './cms-inspector.scss',
})
export class CmsInspector {
  cms = inject(CmsContentService);
  selection = inject(CmsSelectionService);
  readonly rootPath = input('');
  readonly query = signal('');
  private typing = signal(new Set<string>());
  fields = computed(() => {
    this.cms.activeContent();
    const path = this.rootPath();
    const slug = this.cms.currentSlug();
    const schema = path ? schemaForSlug(slug) : inspectorRootSchema(slug, this.cms.activeContent());
    if (schema) {
      return schemaFieldsAt(schema, path);
    }
    const value = path ? getByPath(this.cms.activeContent(), path) : this.cms.activeContent();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [] as FieldDesc[];
    }
    return describeObject(value as JsonMap, path);
  });
  visibleFields = computed(() => {
    const all = this.fields();
    const q = this.query().trim().toLowerCase();
    if (this.rootPath() || !q) {
      return all;
    }
    return all.filter((field) => this.matches(field, q));
  });

  id(path: string): string {
    return cmsControlId(path);
  }

  onFocus(path: string): void {
    this.selection.selectFromPanel(path);
  }

  str(path: string): string {
    return this.cms.get<string>(path) ?? '';
  }

  num(path: string): number {
    return Number(this.cms.get<number>(path) ?? 0);
  }

  bool(path: string): boolean {
    return !!this.cms.get<boolean>(path);
  }

  list(path: string): unknown[] {
    return this.cms.get<unknown[]>(path) ?? [];
  }

  strings(path: string): string[] {
    return (this.cms.get<unknown[]>(path) ?? []).map((item) => String(item ?? ''));
  }

  itemTitle = itemTitle;
  add = addLabel;
  icon = fieldIcon;
  thumb = itemImage;

  end(path: string): void {
    this.typing.update((set) => {
      const next = new Set(set);
      next.delete(path);
      return next;
    });
  }

  setStr(path: string, value: string): void {
    const first = !this.typing().has(path);
    if (first) {
      this.typing.update((set) => new Set(set).add(path));
    }
    this.cms.set(path, value, 'page', first);
  }

  setNum(path: string, value: number | string): void {
    const first = !this.typing().has(path);
    if (first) {
      this.typing.update((set) => new Set(set).add(path));
    }
    this.cms.set(path, Number(value), 'page', first);
  }

  setBool(path: string, value: boolean): void {
    this.cms.set(path, value);
  }

  setStringItem(path: string, index: number, value: string): void {
    const key = `${path}.${index}`;
    const first = !this.typing().has(key);
    if (first) {
      this.typing.update((set) => new Set(set).add(key));
    }
    const list = [...this.strings(path)];
    list[index] = value;
    this.cms.set(path, list, 'page', first);
  }

  dropList(path: string, event: CdkDragDrop<unknown[]>): void {
    this.cms.moveListItem(path, event.previousIndex, event.currentIndex);
  }

  lengthNote(field: FieldDesc): string {
    const max = field.maxLength;
    if (!max) {
      return '';
    }
    const n = this.str(field.path).length;
    if (n < max * 0.8) {
      return '';
    }
    return `Un poco largo, en móvil se cortará (${n}/${max})`;
  }

  private matches(field: FieldDesc, q: string): boolean {
    if (field.label.toLowerCase().includes(q) || field.key.toLowerCase().includes(q)) {
      return true;
    }
    const value = this.cms.get(field.path);
    if (typeof value === 'string') {
      return value.toLowerCase().includes(q);
    }
    if (value == null) {
      return false;
    }
    try {
      return JSON.stringify(value).toLowerCase().includes(q);
    } catch {
      return false;
    }
  }
}
