import { describe, expect, it } from 'vitest';
import { groupClientItems } from './client-panels';

describe('groupClientItems', () => {
  it('agrupa por categoría y subcategoría conservando el índice original', () => {
    const groups = groupClientItems([
      { name: 'Ángel Farmacia', category: 'empresas', subcategory: 'Salud y Farmacia' },
      { name: 'CEBA Santo Domingo', category: 'educativas', subcategory: 'CEBA' },
      { name: 'Ohsana', category: 'empresas', subcategory: 'Salud y Farmacia' },
      { name: 'BAYER', category: 'alianzas', subcategory: 'Corporativas' },
    ]);
    expect(groups.map((group) => group.key)).toEqual(['empresas', 'educativas', 'alianzas']);
    expect(groups[0].subs[0].name).toBe('Salud y Farmacia');
    expect(groups[0].subs[0].indices).toEqual([0, 2]);
    expect(groups[1].subs[0].indices).toEqual([1]);
  });

  it('usa Empresas si falta categoría', () => {
    const groups = groupClientItems([{ name: 'Sin rubro' }]);
    expect(groups[0].key).toBe('empresas');
    expect(groups[0].subs[0].name).toBe('General');
  });
});
