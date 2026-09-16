export const API_URL = '/api';

export type JsonMap = Record<string, unknown>;

export interface CmsPageSummary {
  slug: string;
  title: string;
  updated_at?: string | null;
}

export interface CmsMessage {
  id: number;
  kind: string;
  subject: string;
  payload: JsonMap;
  ticket?: string | null;
  created_at: string;
}

export interface CmsMediaItem {
  id: number;
  original_name: string;
  url: string;
  mime: string;
  size_bytes: number;
  created_at: string;
  width?: number | null;
  height?: number | null;
  variants?: Array<{ width: number; file: string; url: string }>;
}

export const PAGE_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  'acerca-de': 'Acerca de',
  servicios: 'Servicios',
  'servicios-software': 'Software',
  'servicios-hardware': 'Hardware',
  'servicios-saas': 'SaaS',
  'servicios-consultoria': 'Consultoría',
  'servicios-soluciones-ti': 'Soluciones TI',
  contacto: 'Contacto',
  privacidad: 'Privacidad',
  terminos: 'Términos',
  'libro-reclamaciones': 'Libro de reclamaciones',
  sitio: 'Apariencia del sitio',
};

export const PAGE_META: Record<string, { icon: string; blurb: string }> = {
  sitio: { icon: 'bi-palette', blurb: 'Logo, menú, WhatsApp y pie' },
  inicio: { icon: 'bi-house', blurb: 'Banner, servicios y opiniones' },
  'acerca-de': { icon: 'bi-people', blurb: 'Equipo, cifras y videos' },
  contacto: { icon: 'bi-envelope', blurb: 'Formulario y datos de contacto' },
  servicios: { icon: 'bi-grid', blurb: 'Listado de servicios' },
  'servicios-software': { icon: 'bi-code-slash', blurb: 'Página de software' },
  'servicios-hardware': { icon: 'bi-pc-display', blurb: 'Página de hardware' },
  'servicios-saas': { icon: 'bi-cloud', blurb: 'Página de SaaS' },
  'servicios-consultoria': { icon: 'bi-chat-dots', blurb: 'Página de consultoría' },
  'servicios-soluciones-ti': { icon: 'bi-hdd-network', blurb: 'Página de soluciones TI' },
  privacidad: { icon: 'bi-shield-check', blurb: 'Texto legal' },
  terminos: { icon: 'bi-file-text', blurb: 'Texto legal' },
  'libro-reclamaciones': { icon: 'bi-journal-text', blurb: 'Textos y correo del libro' },
};

export const PAGE_GROUPS: { title: string; slugs: string[] }[] = [
  { title: 'Apariencia', slugs: ['sitio'] },
  { title: 'Páginas', slugs: ['inicio', 'acerca-de', 'contacto'] },
  { title: 'Servicios', slugs: ['servicios', 'servicios-software', 'servicios-hardware', 'servicios-saas', 'servicios-consultoria', 'servicios-soluciones-ti'] },
  { title: 'Legal', slugs: ['privacidad', 'terminos', 'libro-reclamaciones'] },
];

export function groupPages(pages: CmsPageSummary[]): { title: string; pages: CmsPageSummary[] }[] {
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const used = new Set<string>();
  const groups = PAGE_GROUPS.map((group) => {
    const items = group.slugs
      .map((slug) => bySlug.get(slug))
      .filter((page): page is CmsPageSummary => !!page);
    items.forEach((page) => used.add(page.slug));
    return { title: group.title, pages: items };
  }).filter((group) => group.pages.length > 0);
  const rest = pages.filter((page) => !used.has(page.slug));
  if (rest.length) {
    groups.push({ title: 'Otras', pages: rest });
  }
  return groups;
}

export const MESSAGE_FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  email: 'Correo',
  phone: 'Teléfono',
  subject: 'Asunto',
  message: 'Mensaje',
  fullname: 'Nombre',
  documentType: 'Tipo de documento',
  documentNumber: 'Número de documento',
  address: 'Domicilio',
  typeOfBien: 'Tipo de bien',
  claimedAmount: 'Monto reclamado (S/)',
  amountNotApplicable: 'Monto no aplica',
  descriptionBien: 'Descripción del bien',
  typeOfAccion: 'Tipo',
  details: 'Detalle',
  consumerPedido: 'Pedido del consumidor',
  isMinor: 'Menor de edad',
  guardianName: 'Apoderado',
};

export function labeledMessageFields(payload: JsonMap): { label: string; value: string }[] {
  return Object.entries(payload)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      let text: string;
      if (typeof value === 'boolean') {
        text = value ? 'Sí' : 'No';
      } else if (typeof value === 'object') {
        text = JSON.stringify(value);
      } else {
        text = String(value);
      }
      return { label: MESSAGE_FIELD_LABELS[key] || key, value: text };
    });
}

export function getByPath(obj: unknown, path: string): unknown {
  if (!path) {
    return obj;
  }
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) {
      return undefined;
    }
    if (Array.isArray(acc)) {
      return acc[Number(key)];
    }
    if (typeof acc === 'object') {
      return (acc as JsonMap)[key];
    }
    return undefined;
  }, obj);
}

export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone = structuredClone(obj) as JsonMap | unknown[];
  let cursor: JsonMap | unknown[] = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const asIndex = Array.isArray(cursor);
    const current = asIndex ? (cursor as unknown[])[Number(key)] : (cursor as JsonMap)[key];
    if (current == null) {
      const next = /^\d+$/.test(nextKey) ? [] : {};
      if (asIndex) {
        (cursor as unknown[])[Number(key)] = next;
      } else {
        (cursor as JsonMap)[key] = next;
      }
    }
    cursor = (asIndex ? (cursor as unknown[])[Number(key)] : (cursor as JsonMap)[key]) as JsonMap | unknown[];
  }
  const last = keys[keys.length - 1];
  if (Array.isArray(cursor)) {
    cursor[Number(last)] = value;
  } else {
    cursor[last] = value;
  }
  return clone as T;
}

export function cmsControlId(path: string): string {
  return 'cms-' + path.replace(/[^a-z0-9]+/gi, '-');
}

export const SLUG_PATHS: Record<string, string> = {
  inicio: '/',
  'acerca-de': '/acerca-de',
  servicios: '/servicios',
  'servicios-software': '/servicios/software',
  'servicios-hardware': '/servicios/hardware',
  'servicios-saas': '/servicios/saas',
  'servicios-consultoria': '/servicios/consultoria',
  'servicios-soluciones-ti': '/servicios/soluciones-ti',
  contacto: '/contacto',
  privacidad: '/privacidad',
  terminos: '/terminos',
  'libro-reclamaciones': '/libro-reclamaciones',
  sitio: '/',
};

export interface CmsDocResponse {
  content: JsonMap;
  version: number;
  updated_at?: string | null;
  hasDraft?: boolean;
  slug?: string;
  title?: string;
  schemaVersion?: number;
}

export interface CmsRevision {
  id: number;
  author: string;
  created_at: string;
  snapshot: JsonMap;
}

export interface ImageMeta {
  width: number;
  height: number;
}

export function changedPaths(before: unknown, after: unknown, prefix = ''): string[] {
  if (before === after) {
    return [];
  }
  if (typeof before !== 'object' || typeof after !== 'object' || !before || !after) {
    return [prefix || '(documento)'];
  }
  const keys = new Set([...Object.keys(before as JsonMap), ...Object.keys(after as JsonMap)]);
  const out: string[] = [];
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const left = (before as JsonMap)[key];
    const right = (after as JsonMap)[key];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      if (left && right && typeof left === 'object' && typeof right === 'object') {
        out.push(...changedPaths(left, right, path));
      } else {
        out.push(path);
      }
    }
  }
  return out;
}

const ROUTE_SLUGS: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_PATHS)
    .filter(([slug]) => slug !== 'sitio')
    .map(([slug, path]) => [path, slug])
);

export function slugFromRoute(url: string): string | null {
  if (url === '/' || url === '') {
    return 'inicio';
  }
  return ROUTE_SLUGS[url] ?? null;
}
