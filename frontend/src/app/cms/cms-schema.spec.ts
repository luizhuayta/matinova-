import { describe, expect, it } from 'vitest';
import { CMS_SCHEMA_VERSION, migrateCmsDocument, schemaForSlug } from './cms-schema';

describe('migrateCmsDocument', () => {
  it('añade seo y schemaVersion sin perder el título viejo', () => {
    const migrated = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    expect(migrated['schemaVersion']).toBe(CMS_SCHEMA_VERSION);
    expect((migrated['seo'] as { title: string }).title).toBe('Inicio');
    const sections = migrated['sections'] as Array<{ type: string }>;
    expect(sections.map((item) => item.type)).toContain('hero');
    expect(sections).toHaveLength(6);
  });

  it('es idempotente si el documento ya está al día', () => {
    const once = migrateCmsDocument({ title: 'Inicio' }, 'inicio');
    const twice = migrateCmsDocument(once, 'inicio');
    expect(twice).toEqual(once);
  });

  it('no inventa schema para contacto', () => {
    expect(schemaForSlug('contacto')).toBeNull();
  });
});
