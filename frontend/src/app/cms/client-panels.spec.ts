import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clientCategoryLabel,
  clientCountLabel,
  clientSubIcon,
  clientSubLabel,
  groupClientItems,
} from './client-panels';
import { activeCmsLocale } from './locale.service';

afterEach(() => {
  activeCmsLocale.set('es');
  vi.unstubAllGlobals();
});

describe('groupClientItems', () => {
  it('agrupa por categoría y subcategoría conservando el índice original', () => {
    const groups = groupClientItems([
      { name: 'Ángel Farmacia', category: 'empresas', subcategory: 'Salud y Farmacia' },
      { name: 'CEBA Santo Domingo', category: 'educativas', subcategory: 'CEBA' },
      { name: 'Ohsana', category: 'empresas', subcategory: 'Salud y Farmacia' },
      { name: 'BAYER', category: 'alianzas', subcategory: 'Corporativas' },
    ]);
    expect(groups.map((group) => group.key)).toEqual(['empresas', 'educativas', 'alianzas']);
    expect(groups.map((group) => group.label)).toEqual([
      'Empresas y comercio',
      'Instituciones educativas',
      'Alianzas',
    ]);
    expect(groups[0].subs[0].name).toBe('Salud y Farmacia');
    expect(groups[0].subs[0].indices).toEqual([0, 2]);
    expect(groups[1].subs[0].indices).toEqual([1]);
  });

  it('usa Empresas si falta categoría', () => {
    const groups = groupClientItems([{ name: 'Sin rubro' }]);
    expect(groups[0].key).toBe('empresas');
    expect(groups[0].subs[0].name).toBe('General');
  });

  it('asigna ícono de rubro y etiqueta de conteo en español', () => {
    expect(clientSubIcon('Salud y Farmacia')).toBe('hospital');
    expect(clientSubIcon('IESTP')).toBe('school');
    expect(clientCountLabel('educativas', 1)).toBe('1 institución');
    expect(clientCountLabel('educativas', 5)).toBe('5 instituciones');
    expect(clientCountLabel('empresas', 1)).toBe('1 cliente');
    expect(clientCountLabel('empresas', 32)).toBe('32 clientes');
    expect(clientCountLabel('alianzas', 1)).toBe('1 alianza');
    expect(clientCountLabel('alianzas', 4)).toBe('4 alianzas');
  });

  it('devuelve etiquetas y conteos en inglés cuando el locale es en', () => {
    expect(clientCategoryLabel('empresas', 'en')).toBe('Companies & retail');
    expect(clientCategoryLabel('educativas', 'en')).toBe('Educational institutions');
    expect(clientCategoryLabel('alianzas', 'en')).toBe('Alliances');
    expect(clientCategoryLabel('otros', 'en')).toBe('otros');

    expect(clientCountLabel('empresas', 1, 'en')).toBe('1 client');
    expect(clientCountLabel('empresas', 32, 'en')).toBe('32 clients');
    expect(clientCountLabel('educativas', 1, 'en')).toBe('1 institution');
    expect(clientCountLabel('educativas', 5, 'en')).toBe('5 institutions');
    expect(clientCountLabel('alianzas', 1, 'en')).toBe('1 alliance');
    expect(clientCountLabel('alianzas', 4, 'en')).toBe('4 alliances');
    expect(clientCountLabel('custom', 1, 'en')).toBe('1 entry');
    expect(clientCountLabel('custom', 3, 'en')).toBe('3 entries');

    const groups = groupClientItems(
      [
        { name: 'Acme', category: 'empresas' },
        { name: 'School', category: 'educativas' },
        { name: 'Partner', category: 'alianzas' },
      ],
      'en'
    );
    expect(groups.map((g) => g.label)).toEqual([
      'Companies & retail',
      'Educational institutions',
      'Alliances',
    ]);
  });

  it('resuelve el locale activo automáticamente en /en/clientes y en SSR', () => {
    vi.stubGlobal('window', { location: { pathname: '/en/clientes' } });
    expect(clientCategoryLabel('empresas')).toBe('Companies & retail');
    expect(clientCountLabel('educativas', 2)).toBe('2 institutions');

    vi.stubGlobal('window', { location: { pathname: '/clientes' } });
    expect(clientCategoryLabel('empresas')).toBe('Empresas y comercio');
    expect(clientCountLabel('educativas', 2)).toBe('2 instituciones');

    vi.unstubAllGlobals();
    activeCmsLocale.set('en');
    expect(clientCategoryLabel('alianzas')).toBe('Alliances');
    expect(clientCountLabel('alianzas', 3)).toBe('3 alliances');
  });

  it('traduce subcategorías de clientes en EN y mantiene íconos en ambos idiomas', () => {
    expect(clientSubLabel('Salud y Farmacia', 'es')).toBe('Salud y Farmacia');
    expect(clientSubLabel('Salud y Farmacia', 'en')).toBe('Health & Pharmacy');
    expect(clientSubLabel('Tecnología y Software', 'en')).toBe('Technology & Software');
    expect(clientSubLabel('Corporativas', 'en')).toBe('Corporate');
    expect(clientSubLabel('CEBA', 'en')).toBe('CEBA');
    expect(clientSubIcon('Health & Pharmacy')).toBe('hospital');
    expect(clientSubIcon('Technology & Software')).toBe('laptop');
    expect(clientSubIcon('Corporate')).toBe('building');
  });
});
