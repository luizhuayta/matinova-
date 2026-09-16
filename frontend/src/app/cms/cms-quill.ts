import type QuillType from 'quill';

export const CMS_QUILL_TOOLBAR = [
  ['bold', 'italic'],
  [{ header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

export function bindQuillPaste(quill: QuillType): void {
  quill.clipboard.addMatcher(Node.ELEMENT_NODE, (_node, delta) => {
    const ops = ((delta as { ops?: Array<{ attributes?: Record<string, unknown> }> }).ops ?? []).map((op) => {
      if (!op.attributes) {
        return op;
      }
      const next = { ...op.attributes };
      delete next['color'];
      delete next['background'];
      delete next['font'];
      delete next['size'];
      delete next['align'];
      delete next['underline'];
      if (next['header'] === 1 || next['header'] === 3) {
        next['header'] = 2;
      }
      op.attributes = next;
      return op;
    });
    (delta as { ops: unknown }).ops = ops;
    return delta;
  });
}
