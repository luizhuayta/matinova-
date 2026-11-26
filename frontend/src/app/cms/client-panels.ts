import { JsonMap } from './cms.models';
import { CmsLocale, activeCmsLocale } from './locale.service';

export const CLIENT_CATEGORY_ORDER = ['empresas', 'educativas', 'alianzas'] as const;

export interface ClientCategoryMeta {
  label: string;
  labelEn: string;
  icon: string;
  art: string;
  countLabel: string;
  countSingular: string;
  countLabelEn: string;
  countSingularEn: string;
}

export const CLIENT_CATEGORY_META: Record<string, ClientCategoryMeta> = {
  empresas: {
    label: 'Empresas y comercio',
    labelEn: 'Companies & retail',
    icon: 'building',
    art: 'assets/illustrations/clients-empresas.svg',
    countLabel: 'clientes',
    countSingular: 'cliente',
    countLabelEn: 'clients',
    countSingularEn: 'client',
  },
  educativas: {
    label: 'Instituciones educativas',
    labelEn: 'Educational institutions',
    icon: 'school',
    art: 'assets/illustrations/clients-educativas.svg',
    countLabel: 'instituciones',
    countSingular: 'institución',
    countLabelEn: 'institutions',
    countSingularEn: 'institution',
  },
  alianzas: {
    label: 'Alianzas',
    labelEn: 'Alliances',
    icon: 'handshake',
    art: 'assets/illustrations/clients-alianzas.svg',
    countLabel: 'alianzas',
    countSingular: 'alianza',
    countLabelEn: 'alliances',
    countSingularEn: 'alliance',
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

function resolveClientLocale(locale?: CmsLocale): CmsLocale {
  if (locale) {
    return locale;
  }
  const active = activeCmsLocale();
  if (typeof window !== 'undefined' && typeof window.location?.pathname === 'string') {
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/admin/')) {
      return active;
    }
    if (path === '/en' || path.startsWith('/en/')) {
      return 'en';
    }
    return 'es';
  }
  return active;
}

function categoryKey(item: JsonMap): string {
  const raw = String(item['category'] ?? '').trim().toLowerCase();
  return raw || 'empresas';
}

function subcategoryName(item: JsonMap): string {
  const raw = String(item['subcategory'] ?? '').trim();
  return raw || 'General';
}

export function clientCategoryLabel(key: string, locale?: CmsLocale): string {
  const meta = CLIENT_CATEGORY_META[key];
  if (!meta) {
    return key;
  }
  return resolveClientLocale(locale) === 'en' ? meta.labelEn : meta.label;
}

export function clientCategoryIcon(key: string): string {
  return CLIENT_CATEGORY_META[key]?.icon ?? 'building';
}

export function clientSectorArt(key: string): string {
  return CLIENT_CATEGORY_META[key]?.art ?? 'assets/illustrations/clients-empresas.svg';
}

export function clientCountLabel(key: string, count: number, locale?: CmsLocale): string {
  const meta = CLIENT_CATEGORY_META[key];
  if (resolveClientLocale(locale) === 'en') {
    const singular = meta?.countSingularEn ?? 'entry';
    const plural = meta?.countLabelEn ?? 'entries';
    return `${count} ${count === 1 ? singular : plural}`;
  }
  const singular = meta?.countSingular ?? 'nombre';
  const plural = meta?.countLabel ?? 'nombres';
  return `${count} ${count === 1 ? singular : plural}`;
}

export function clientSubIcon(name: string): string {
  return CLIENT_SUB_ICONS[name.trim().toLowerCase()] ?? 'building';
}

export function panelItemCount(panel: ClientPanel): number {
  return panel.subs.reduce((sum, sub) => sum + sub.indices.length, 0);
}

export function groupClientItems(items: JsonMap[], locale?: CmsLocale): ClientPanel[] {
  const resolvedLocale = resolveClientLocale(locale);
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
    label: clientCategoryLabel(key, resolvedLocale),
    icon: clientCategoryIcon(key),
    subs: [...(map.get(key)?.values() ?? [])],
  }));
}
