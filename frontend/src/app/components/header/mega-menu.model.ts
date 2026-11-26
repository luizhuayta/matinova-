import { CmsMenuItem } from '../../cms/cms.models';
import { CmsLocale } from '../../cms/locale.service';

export interface MegaMenuItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  queryParams?: Record<string, string>;
  /** Clase de Bootstrap Icons (p. ej. 'bi-cloud') */
  biIcon?: string;
  /** Símbolo de assets/icons/ui.svg (p. ej. 'handshake') */
  svgIcon?: string;
  /** Imagen pequeña opcional de /images/... */
  image?: string;
  /** Letra inicial de respaldo si no hay ícono ni imagen */
  monogram: string;
  /** Ruta de campo CMS para mantener edición inline (p. ej. 'navServices.0.label') */
  cmsTextPath?: string;
}

export interface MegaMenuGroup {
  id: string;
  panelId: string;
  triggerLabel: string;
  sectionLabel: string;
  sectionBiIcon?: string;
  sectionSvgIcon?: string;
  allLink?: string;
  allLabel?: string;
  items: MegaMenuItem[];
}

export interface ExtraNavEntry {
  kind: 'link' | 'group';
  slug: string;
  label: string;
  path: string;
  children?: CmsMenuItem[];
}

interface ItemMeta {
  biIcon?: string;
  svgIcon?: string;
  subtitleEs: string;
  subtitleEn: string;
}

const SERVICE_META: Record<string, ItemMeta> = {
  'servicios-saas': {
    biIcon: 'bi-cloud',
    subtitleEs: 'Plataformas en la nube a medida',
    subtitleEn: 'Cloud platforms built to scale',
  },
  saas: {
    biIcon: 'bi-cloud',
    subtitleEs: 'Plataformas en la nube a medida',
    subtitleEn: 'Cloud platforms built to scale',
  },
  'servicios-hardware': {
    biIcon: 'bi-pc-display',
    subtitleEs: 'Equipos, servidores y redes',
    subtitleEn: 'Workstations, servers & networks',
  },
  hardware: {
    biIcon: 'bi-pc-display',
    subtitleEs: 'Equipos, servidores y redes',
    subtitleEn: 'Workstations, servers & networks',
  },
  'servicios-software': {
    biIcon: 'bi-code-slash',
    subtitleEs: 'Desarrollo web, ERP y sistemas',
    subtitleEn: 'Web, ERP & custom software',
  },
  software: {
    biIcon: 'bi-code-slash',
    subtitleEs: 'Desarrollo web, ERP y sistemas',
    subtitleEn: 'Web, ERP & custom software',
  },
  'servicios-consultoria': {
    biIcon: 'bi-chat-dots',
    subtitleEs: 'Diagnóstico y arquitectura TI',
    subtitleEn: 'IT diagnostics & architecture',
  },
  consultoria: {
    biIcon: 'bi-chat-dots',
    subtitleEs: 'Diagnóstico y arquitectura TI',
    subtitleEn: 'IT diagnostics & architecture',
  },
  'servicios-soluciones-ti': {
    biIcon: 'bi-hdd-network',
    subtitleEs: 'Soporte, operación e infraestructura',
    subtitleEn: 'Support, operations & infrastructure',
  },
  'soluciones-ti': {
    biIcon: 'bi-hdd-network',
    subtitleEs: 'Soporte, operación e infraestructura',
    subtitleEn: 'Support, operations & infrastructure',
  },
};

const CLIENT_SECTOR_META: Record<string, ItemMeta> = {
  empresas: {
    biIcon: 'bi-building',
    subtitleEs: 'Sector privado y comercio',
    subtitleEn: 'Private sector & retail',
  },
  educativas: {
    biIcon: 'bi-mortarboard',
    subtitleEs: 'Institutos, colegios y UGEL',
    subtitleEn: 'Schools, institutes & academies',
  },
  alianzas: {
    svgIcon: 'handshake',
    subtitleEs: 'Convenios y socios estratégicos',
    subtitleEn: 'Strategic partners & agreements',
  },
};

export function monogramFor(label: string): string {
  const clean = (label || '').trim();
  const match = /[A-Za-zÀ-ÿ0-9]/.exec(clean);
  return (match ? match[0] : 'M').toUpperCase();
}

export function slugFromServicePath(path: string): string {
  const clean = (path || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase();
  return clean.replace(/\//g, '-');
}

export function buildServiceMegaItem(
  raw: Record<string, string>,
  index: number,
  prefixedPath: string,
  locale: CmsLocale
): MegaMenuItem {
  const label = String(raw['label'] || '').trim();
  const slug = slugFromServicePath(String(raw['path'] || ''));
  const tail = slug.startsWith('servicios-') ? slug.slice('servicios-'.length) : slug;
  const meta = SERVICE_META[slug] ?? SERVICE_META[tail];
  const customSub = String(raw['subtitle'] || raw['description'] || '').trim();
  const fallbackSub = locale === 'en' ? 'View service' : 'Ver servicio';
  const subtitle = customSub || (meta ? (locale === 'en' ? meta.subtitleEn : meta.subtitleEs) : fallbackSub);
  const customIcon = String(raw['icon'] || '').trim();

  return {
    id: slug || `service-${index}`,
    label,
    subtitle,
    path: prefixedPath,
    biIcon: customIcon.startsWith('bi-') ? customIcon : meta?.biIcon,
    svgIcon: meta?.svgIcon,
    monogram: monogramFor(label),
    cmsTextPath: `navServices.${index}.label`,
  };
}

export function buildClientMegaItem(
  key: string,
  label: string,
  clientsPath: string,
  locale: CmsLocale
): MegaMenuItem {
  const meta = CLIENT_SECTOR_META[key];
  const fallbackSub = locale === 'en' ? 'View projects' : 'Ver proyectos';
  const subtitle = meta ? (locale === 'en' ? meta.subtitleEn : meta.subtitleEs) : fallbackSub;
  return {
    id: `client-${key}`,
    label,
    subtitle,
    path: clientsPath,
    queryParams: { category: key },
    biIcon: meta?.biIcon,
    svgIcon: meta?.svgIcon,
    monogram: monogramFor(label),
  };
}

export function buildDynamicChildMegaItem(
  item: CmsMenuItem,
  prefixedPath: string,
  locale: CmsLocale
): MegaMenuItem {
  const slug = slugFromServicePath(item.path || item.slug);
  const meta = SERVICE_META[slug];
  const fallbackSub = locale === 'en' ? 'View section' : 'Ver sección';
  return {
    id: item.slug,
    label: item.title,
    subtitle: meta ? (locale === 'en' ? meta.subtitleEn : meta.subtitleEs) : fallbackSub,
    path: prefixedPath,
    biIcon: meta?.biIcon,
    svgIcon: meta?.svgIcon,
    monogram: monogramFor(item.title),
  };
}

/**
 * Agrupa ítems dinámicos del menú CMS: si existen páginas hijas bajo el prefijo de un ítem padre
 * (p. ej. `/recursos` y `/recursos/guias`), las convierte automáticamente en un grupo mega-menú.
 */
export function buildExtraNavEntries(items: CmsMenuItem[]): ExtraNavEntry[] {
  const normalized = items.map((item) => ({
    ...item,
    cleanPath: (item.path || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/',
  }));
  const childSlugs = new Set<string>();
  const childrenByParent = new Map<string, CmsMenuItem[]>();

  for (const parent of normalized) {
    if (parent.cleanPath === '/') {
      continue;
    }
    const prefix = `${parent.cleanPath}/`;
    const kids = normalized.filter((candidate) => candidate.slug !== parent.slug && candidate.cleanPath.startsWith(prefix));
    if (kids.length > 0) {
      childrenByParent.set(parent.slug, kids);
      kids.forEach((kid) => childSlugs.add(kid.slug));
    }
  }

  return normalized
    .filter((item) => !childSlugs.has(item.slug))
    .map((item) => {
      const children = childrenByParent.get(item.slug);
      if (children?.length) {
        return { kind: 'group' as const, slug: item.slug, label: item.title, path: item.path, children };
      }
      return { kind: 'link' as const, slug: item.slug, label: item.title, path: item.path };
    });
}
