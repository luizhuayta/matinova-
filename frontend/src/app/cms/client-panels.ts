import { JsonMap } from './cms.models';

export const CLIENT_CATEGORY_ORDER = ['empresas', 'educativas', 'alianzas'] as const;

export const CLIENT_CATEGORY_META: Record<string, { label: string; icon: string; art: string; countLabel: string }> = {
  empresas: {
    label: 'Empresas y comercio',
    icon: 'building',
    art: 'assets/illustrations/clients-empresas.svg',
    countLabel: 'clientes',
  },
  educativas: {
    label: 'Instituciones educativas',
    icon: 'school',
    art: 'assets/illustrations/clients-educativas.svg',
    countLabel: 'instituciones',
  },
  alianzas: {
    label: 'Alianzas',
    icon: 'handshake',
    art: 'assets/illustrations/clients-alianzas.svg',
    countLabel: 'alianzas',
  },
};

const CLIENT_SUB_ICONS: Record<string, string> = {
  'salud y farmacia': 'hospital',
  automotriz: 'car',
  'tecnología y software': 'laptop',
  'tecnologia y software': 'laptop',
  'retail y moda': 'shopping-bag',
  agropecuario: 'sprout',
  'servicios y reparación': 'wrench',
  'servicios y reparacion': 'wrench',
  gastronomía: 'utensils',
  gastronomia: 'utensils',
  'educación y consultoría': 'graduation-cap',
  'educacion y consultoria': 'graduation-cap',
  'servicios profesionales': 'briefcase',
  entretenimiento: 'clapperboard',
  ceba: 'school',
  eespp: 'school',
  iespp: 'school',
  iestp: 'school',
  iei: 'school',
  'i.e. primaria/secundaria': 'school',
  'academias y formación': 'graduation-cap',
  'academias y formacion': 'graduation-cap',
  ugel: 'landmark',
  corporativas: 'building',
  tecnológicas: 'laptop',
  tecnologicas: 'laptop',
  gubernamentales: 'landmark',
  educativas: 'school',
};

export interface ClientSubPanel {
  name: string;
  icon: string;
  indices: number[];
}

export interface ClientPanel {
  key: string;
  label: string;
  icon: string;
  subs: ClientSubPanel[];
}

function categoryKey(item: JsonMap): string {
  const raw = String(item['category'] ?? '').trim().toLowerCase();
  return raw || 'empresas';
}

function subcategoryName(item: JsonMap): string {
  const raw = String(item['subcategory'] ?? '').trim();
  return raw || 'General';
}

export function clientCategoryLabel(key: string): string {
  return CLIENT_CATEGORY_META[key]?.label ?? key;
}

export function clientCategoryIcon(key: string): string {
  return CLIENT_CATEGORY_META[key]?.icon ?? 'building';
}

export function clientSectorArt(key: string): string {
  return CLIENT_CATEGORY_META[key]?.art ?? 'assets/illustrations/clients-empresas.svg';
}

export function clientCountLabel(key: string, count: number): string {
  const word = CLIENT_CATEGORY_META[key]?.countLabel ?? 'nombres';
  if (count === 1) {
    if (word === 'instituciones') {
      return '1 institución';
    }
    if (word === 'alianzas') {
      return '1 alianza';
    }
    if (word === 'clientes') {
      return '1 cliente';
    }
    return `1 ${word}`;
  }
  return `${count} ${word}`;
}

export function clientSubIcon(name: string): string {
  return CLIENT_SUB_ICONS[name.trim().toLowerCase()] ?? 'building';
}

export function panelItemCount(panel: ClientPanel): number {
  return panel.subs.reduce((sum, sub) => sum + sub.indices.length, 0);
}

export function groupClientItems(items: JsonMap[]): ClientPanel[] {
  const map = new Map<string, Map<string, ClientSubPanel>>();
  items.forEach((item, index) => {
    const key = categoryKey(item);
    const subName = subcategoryName(item);
    if (!map.has(key)) {
      map.set(key, new Map());
    }
    const subs = map.get(key)!;
    if (!subs.has(subName)) {
      subs.set(subName, {
        name: subName,
        icon: String(item['icon'] ?? ''),
        indices: [],
      });
    }
    const sub = subs.get(subName)!;
    if (!sub.icon && item['icon']) {
      sub.icon = String(item['icon']);
    }
    sub.indices.push(index);
  });

  const keys = [
    ...CLIENT_CATEGORY_ORDER.filter((key) => map.has(key)),
    ...[...map.keys()].filter((key) => !CLIENT_CATEGORY_ORDER.includes(key as (typeof CLIENT_CATEGORY_ORDER)[number])),
  ];

  return keys.map((key) => ({
    key,
    label: clientCategoryLabel(key),
    icon: clientCategoryIcon(key),
    subs: [...(map.get(key)?.values() ?? [])],
  }));
}
