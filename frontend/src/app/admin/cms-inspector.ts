import { Component, computed, inject, input, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsSelectionService } from '../cms/cms-selection.service';
import { FieldDesc, addLabel, itemImage, itemTitle } from '../cms/cms-fields';
import { cmsControlId } from '../cms/cms.models';
import { schemaFieldsAt, schemaForSlug, inspectorRootSchema } from '../cms/cms-schema';
import { BLOCK_CATALOG, BLOCK_TYPES, CmsBlock, pageBlocks } from '../cms/block-registry';
import { CmsImageField } from './cms-image-field';
import { CmsRichField } from './cms-rich-field';
import { CmsFieldRow } from './cms-field-row';

@Component({
  selector: 'app-cms-inspector',
  standalone: true,
  imports: [FormsModule, CmsInspector, CmsImageField, CmsRichField, CmsFieldRow, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './cms-inspector.html',
  styleUrl: './cms-inspector.scss',
})
export class CmsInspector {
  cms = inject(CmsContentService);
  selection = inject(CmsSelectionService);
  readonly rootPath = input('');
  readonly query = signal('');
  private typing = signal(new Set<string>());
  readonly pickerOpen = signal(false);
  readonly pickerQuery = signal('');
  readonly insertAt = signal<number | null>(null);
  fields = computed(() => {
    this.cms.activeContent();
    const path = this.rootPath();
    const slug = this.cms.currentSlug();
    const content = this.cms.activeContent();
    const blockMatch = path.match(/^blocks\.(\d+)(?:\.(props(?:\.(.*))?))?$/);
    if (blockMatch) {
      const blocks = pageBlocks(content);
      const block = blocks[Number(blockMatch[1])];
      const schema = BLOCK_CATALOG[block?.type ?? '']?.schema ?? [];
      const rest = blockMatch[3] ?? '';
      const base = `blocks.${blockMatch[1]}.props`;
      return schemaFieldsAt(schema, rest).map((field) => ({
        ...field,
        path: field.path.startsWith(base) ? field.path : `${base}.${field.path}`,
      }));
    }
    const schema = path ? schemaForSlug(slug) : inspectorRootSchema(slug, content);
    if (schema) {
      return schemaFieldsAt(schema, path);
    }
    return [] as FieldDesc[];
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

  hintOf(field: FieldDesc): string {
    if (field.kind === 'rich') {
      return 'Puedes poner negrita, listas y enlaces.';
    }
    if (field.kind === 'embed') {
      return field.hint || 'Pega el enlace del video de YouTube.';
    }
    return field.hint ?? '';
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

  blocks(): CmsBlock[] {
    return pageBlocks(this.cms.activeContent());
  }

  catalog() {
    const q = this.pickerQuery().trim().toLowerCase();
    const all = BLOCK_TYPES;
    if (!q) {
      return all;
    }
    return all.filter((item) =>
      `${item.label} ${item.category} ${item.description}`.toLowerCase().includes(q)
    );
  }

  categories(): string[] {
    return [...new Set(this.catalog().map((item) => item.category))];
  }

  catalogBy(category: string) {
    return this.catalog().filter((item) => item.category === category);
  }

  openPicker(index: number | null = null): void {
    this.insertAt.set(index);
    this.pickerQuery.set('');
    this.pickerOpen.set(true);
  }

  addBlock(type: string): void {
    this.cms.addBlock(type, this.insertAt() ?? undefined);
    this.pickerOpen.set(false);
  }

  blockLabel(type: string): string {
    return BLOCK_CATALOG[type]?.label || type;
  }

  layoutWidth(item: CmsBlock): string {
    return item.layout?.width || 'full';
  }

  layoutBg(item: CmsBlock): string {
    return item.layout?.background || '';
  }

  layoutPad(item: CmsBlock): string {
    return item.layout?.padding || '';
  }

  hasTestimonials(): boolean {
    return this.blocks().some((item) => item.type === 'testimonials');
  }
}
