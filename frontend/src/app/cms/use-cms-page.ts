import { computed, inject } from '@angular/core';
import { CmsContentService } from './cms-content.service';
import { CmsEditorService } from './cms-editor.service';

export function useCmsPage(slug: string) {
  const cms = inject(CmsContentService);
  const editor = inject(CmsEditorService);
  cms.useSlug(slug);
  const page = computed(() => cms.pages()[slug] ?? {});
  const reasons = computed(() => (page()['reasons'] as Array<Record<string, string>>) ?? []);
  const cards = computed(() => (page()['cards'] as Array<Record<string, string>>) ?? []);
  return { cms, editor, page, reasons, cards };
}
