import { JsonMap } from './cms.models';

export const CLIENT_CATEGORY_ORDER = ['empresas', 'educativas', 'alianzas'] as const;

export const CLIENT_CATEGORY_META: Record<string, { label: string; icon: string }> = {
  empresas: { label: 'Empresas y E-commerce', icon: 'bi-building' },
  educativas: { label: 'Instituciones Educativas', icon: 'bi-mortarboard' },
  alianzas: { label: 'Alianzas Institucionales', icon: 'bi-handshake' },
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
  return CLIENT_CATEGORY_META[key]?.icon ?? 'bi-folder';
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
