import { JsonMap } from './cms.models';
import { BLOCK_CATALOG, PAGE_TEMPLATES } from './block-catalog.generated';
import type { SchemaField } from './cms-schema';
import type { CmsBlock, BlockTypeDef, PageTemplateDef } from './block-types';

export type { CmsBlock, BlockTypeDef, PageTemplateDef };
export { BLOCK_CATALOG, PAGE_TEMPLATES };

export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const BLOCK_TYPES = Object.values(BLOCK_CATALOG);

export const HOME_STYLE_TYPES = new Set(['hero', 'about', 'contactCards', 'services', 'innovative', 'testimonials']);
export const ABOUT_STYLE_TYPES = new Set(['pageHero', 'stats', 'team', 'videos']);
export const LISTING_STYLE_TYPES = new Set(['listingHero', 'serviceCards', 'cta']);
export const SERVICE_STYLE_TYPES = new Set(['serviceHero', 'reasons']);
export const LEGAL_STYLE_TYPES = new Set(['richText']);
export const CONTACT_STYLE_TYPES = new Set(['contactForm']);
export const EXTRA_STYLE_TYPES = new Set(['clients', 'clientStages', 'faq', 'gallery', 'map']);

export function blockTypeDef(type: string): BlockTypeDef | null {
  return BLOCK_CATALOG[type] ?? null;
}

export const DEFAULT_BG_IMAGE = '/images/redesign/section-bg.webp';

export function makeBlock(type: string, props?: JsonMap, hidden = false): CmsBlock {
  const def = BLOCK_CATALOG[type];
  return {
    id: newBlockId(),
    type,
    hidden,
    layout: { width: 'full', padding: '', background: '', backgroundImage: DEFAULT_BG_IMAGE },
    props: { ...(def?.defaults ?? {}), ...(props ?? {}) },
  };
}

export function blockHasBgImage(block: CmsBlock): boolean {
  return !!String(block.layout?.backgroundImage ?? '').trim();
}

export function blockLayoutStyle(block: CmsBlock): Record<string, string> {
  const style: Record<string, string> = {};
  const padding = block.layout?.padding;
  if (padding) {
    style['padding'] = padding;
  }
  const image = String(block.layout?.backgroundImage ?? '').trim();
  const background = String(block.layout?.background ?? '').trim();
  if (image) {
    style['backgroundImage'] = `linear-gradient(180deg, rgba(3, 11, 26, 0.6), rgba(3, 11, 26, 0.82)), url("${image}")`;
    style['backgroundSize'] = 'cover';
    style['backgroundPosition'] = 'center';
    style['backgroundColor'] = background && !/url|gradient/i.test(background) ? background : 'var(--dt-bg)';
  } else if (background) {
    style['background'] = background;
  }
  return style;
}

export function pageBlocks(content: JsonMap): CmsBlock[] {
  const raw = content['blocks'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((row): row is CmsBlock => !!row && typeof row === 'object' && typeof (row as CmsBlock).type === 'string');
}

export function visibleBlocks(content: JsonMap): CmsBlock[] {
  return pageBlocks(content).filter((block) => !block.hidden);
}

export function propsPath(index: number, field = ''): string {
  return field ? `blocks.${index}.props.${field}` : `blocks.${index}.props`;
}

export function blockLabel(type: string): string {
  return BLOCK_CATALOG[type]?.label || type;
}

export function asRecord(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {};
}

export function asList(value: unknown): Array<Record<string, string>> {
  return Array.isArray(value) ? (value as Array<Record<string, string>>) : [];
}

export function featureText(item: unknown): string {
  if (typeof item === 'string') {
    return item;
  }
  if (item && typeof item === 'object' && 'text' in item) {
    return String((item as { text?: unknown }).text ?? '');
  }
  return '';
}

export function isInternalLink(link: string): boolean {
  return link.startsWith('/');
}

export function youtubeEmbed(url: string): string {
  const value = (url || '').trim();
  if (!value) {
    return '';
  }
  if (value.includes('/embed/')) {
    return value;
  }
  const match = value.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : value;
}

export function mapEmbed(url: string): string {
  const value = (url || '').trim();
  if (!value) {
    return '';
  }
  if (value.includes('maps/embed') || value.includes('google.com/maps')) {
    return value;
  }
  return value;
}

function strListToFeatures(value: unknown): Array<Record<string, string>> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => (typeof item === 'string' ? { text: item } : asRecord(item)));
}

export function migratePageToBlocks(content: JsonMap, slug: string): JsonMap {
  if (Array.isArray(content['blocks']) && content['blocks'].length > 0) {
    return content;
  }
  let blocks: CmsBlock[] = [];
  if (slug === 'inicio') {
    blocks = blocksFromInicio(content);
  } else if (slug === 'acerca-de') {
    blocks = blocksFromAcerca(content);
  } else if (slug === 'servicios') {
    blocks = blocksFromServicios(content);
  } else if (slug === 'contacto') {
    blocks = blocksFromContacto(content);
  } else if (slug === 'privacidad' || slug === 'terminos') {
    blocks = blocksFromLegal(content);
  } else if (slug === 'libro-reclamaciones') {
    blocks = blocksFromLibro(content);
  } else if (slug.startsWith('servicios-')) {
    blocks = blocksFromServicePage(content);
  } else {
    blocks = [makeBlock('richText', { title: String(content['title'] ?? 'Página'), body: String(content['body'] ?? '<p></p>') })];
  }
  return {
    schemaVersion: 6,
    seo: (content['seo'] as JsonMap) ?? { title: '', description: '', image: '' },
    decorativeImagePaths: Array.isArray(content['decorativeImagePaths']) ? content['decorativeImagePaths'] : [],
    blocks,
  };
}

function blocksFromInicio(content: JsonMap): CmsBlock[] {
  const order = (content['sections'] as Array<{ type?: string; hidden?: boolean }>) ?? [
    { type: 'hero' },
    { type: 'about' },
    { type: 'contactCards' },
    { type: 'services' },
    { type: 'innovative' },
    { type: 'testimonials', hidden: true },
    { type: 'faq' },
  ];
  const blocks: CmsBlock[] = [];
  for (const row of order) {
    const type = String(row?.type ?? '');
    const hidden = !!row?.hidden;
    if (type === 'hero') {
      blocks.push(makeBlock('hero', {
        slides: content['slides'],
        subtitle: content['heroSubtitle'] ?? content['subtitle'],
        cta: content['heroCta'],
        ctaLink: content['heroCtaLink'],
      }, hidden));
    } else if (type === 'about') {
      blocks.push(makeBlock('about', { ...(asRecord(content['about'])), features: [] }, hidden));
    } else if (type === 'contactCards') {
      blocks.push(makeBlock('contactCards', { items: content['contactCards'] }, hidden));
    } else if (type === 'services') {
      blocks.push(makeBlock('services', asRecord(content['services']), hidden));
    } else if (type === 'innovative') {
      blocks.push(makeBlock('innovative', asRecord(content['innovative']), hidden));
    } else if (type === 'testimonials') {
      blocks.push(makeBlock('testimonials', asRecord(content['testimonials']), hidden));
    } else if (type === 'faq') {
      blocks.push(makeBlock('faq', asRecord(content['faq']), hidden));
    }
  }
  return blocks.length ? blocks : [makeBlock('hero')];
}

function blocksFromAcerca(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('pageHero', {
      badge: content['heroBadge'],
      title: content['heroTitle'],
      text: content['heroText'],
      cta: content['heroCta'],
      ctaLink: '/contacto',
    }),
    makeBlock('stats', { items: content['stats'] }),
    makeBlock('about', {
      tag: content['aboutTag'],
      title: content['aboutTitle'],
      text: content['aboutText'],
      image: content['aboutImage'],
      imageAlt: content['aboutImageAlt'] ?? '',
      cta: content['aboutCta'],
      ctaLink: '/contacto',
      features: strListToFeatures(content['features']),
    }),
    makeBlock('team', {
      tag: content['teamTag'],
      title: content['teamTitle'],
      text: content['teamText'],
      items: content['team'],
    }),
    makeBlock('contactCards', { items: content['contactCards'] }),
    makeBlock('videos', {
      tag: content['videosTag'],
      title: content['videosTitle'],
      text: content['videosText'],
      items: content['videos'],
    }),
  ];
}

function blocksFromServicios(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('listingHero', { image: content['heroImage'], title: content['heroTitle'], text: content['heroText'] }),
    makeBlock('serviceCards', { subtitle: content['subtitle'], title: content['title'], cards: content['cards'] }),
    makeBlock('cta', { title: content['ctaTitle'], text: content['ctaText'], button: content['ctaButton'], link: '/contacto' }),
  ];
}

function blocksFromServicePage(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('serviceHero', {
      heroImage: content['heroImage'],
      heroAlt: content['heroAlt'],
      image: content['image'],
      imageAlt: content['imageAlt'],
      label: content['label'],
      title: content['title'],
      text: content['text'],
      cta: content['cta'],
      ctaLink: '/contacto',
    }),
    makeBlock('reasons', {
      subtitle: content['reasonsSubtitle'],
      title: content['reasonsTitle'],
      items: content['reasons'],
    }),
  ];
}

function blocksFromContacto(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('pageHero', { badge: content['badge'], title: content['title'], text: content['text'] || content['heroText'] || '', cta: '', ctaLink: '' }),
    makeBlock('contactCards', { items: content['cards'] }),
    makeBlock('contactForm', {
      submitLabel: content['submitLabel'],
      destinationEmail: content['destinationEmail'],
      fields: content['fields'],
      placeholders: content['placeholders'],
    }),
    makeBlock('faq', {
      title: 'Preguntas de finanzas y TI',
      items: [
        { question: '¿Aplican detracción SUNAT a los servicios de TI?', answer: 'Si el contrato califica en el SPOT, aplicamos la tasa vigente sobre el comprobante electrónico. El CIIU y el porcentaje se confirman en la cotización, antes de iniciar el trabajo.' },
        { question: '¿Emiten factura electrónica y registran en SIRE?', answer: 'Sí. Emitimos comprobantes electrónicos y declaramos las operaciones en el SIRE de SUNAT. El RUC va en cada factura; no cerramos un trabajo sin voucher válido.' },
        { question: '¿Cuáles son los tiempos de soporte?', answer: 'Incidencias críticas de servidores: respuesta en menos de 15 minutos en horario de operación. El resto se agenda el mismo día hábil. El SLA queda escrito en el contrato, no en el chat.' },
        { question: '¿Pueden contratar con el Estado en un acuerdo marco?', answer: 'Trabajamos con entidades educativas y públicas. Cada convocatoria o acuerdo marco se revisa contra el expediente. Envíenos el número de procedimiento y confirmamos si calzamos antes de postular.' },
      ],
    }),
    makeBlock('map', {
      title: 'Dónde estamos',
      text: 'Urb. Libertad Mz. I Lt. 5, Calle Las Moras, San Vicente de Cañete, Lima, Perú.',
      embed: 'https://maps.google.com/maps?q=Urb.+Libertad+Calle+Las+Moras+San+Vicente+de+Ca%C3%B1ete&output=embed',
    }),
  ];
}

function blocksFromLegal(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('richText', {
      title: content['title'],
      lastUpdated: content['lastUpdated'],
      body: content['body'],
    }),
  ];
}

function blocksFromLibro(content: JsonMap): CmsBlock[] {
  return [
    makeBlock('claimsBook', {
      title: content['title'],
      company: content['company'],
      subtitle: content['subtitle'],
      logo: content['logo'],
      ruc: content['ruc'],
      destinationEmail: content['destinationEmail'],
      disclaimer1: content['disclaimer1'],
      disclaimer2: content['disclaimer2'],
      submitLabel: content['submitLabel'],
    }),
  ];
}

export function templateBlocks(template: string): CmsBlock[] {
  switch (template) {
    case 'home':
      return [makeBlock('hero'), makeBlock('about'), makeBlock('cta')];
    case 'service':
      return [makeBlock('serviceHero'), makeBlock('reasons')];
    case 'legal':
      return [makeBlock('richText')];
    case 'clients':
      return [
        makeBlock('listingHero', {
          image: '/carousel.jpg',
          title: 'Nuestros clientes',
          text: 'Empresas e instituciones que confían en nosotros para transformar su futuro tecnológico',
        }),
        makeBlock('clients', { layout: 'paneles' }),
        makeBlock('cta', {
          title: '¿Quieres ser parte de nuestros clientes satisfechos?',
          text: 'Cuéntanos tu proyecto y te mostramos casos similares.',
          button: 'Contáctanos',
          link: '/contacto',
        }),
      ];
    case 'contact':
      return [
        makeBlock('pageHero', { badge: 'CONTACTO', title: 'Hablemos', cta: '' }),
        makeBlock('contactCards'),
        makeBlock('contactForm'),
      ];
    default:
      return [makeBlock('richText', { title: 'Nueva página', body: '<p>Empieza a escribir o añade más secciones.</p>' })];
  }
}

export function findSchemaFieldIn(fields: SchemaField[], path: string): SchemaField | undefined {
  const parts = path.split('.');
  let nodes = fields;
  let field: SchemaField | undefined;
  let i = 0;
  while (i < parts.length) {
    field = nodes.find((item) => item.path === parts[i]);
    if (!field) {
      return undefined;
    }
    i += 1;
    if (i >= parts.length) {
      return field;
    }
    if (field.type === 'list' && /^\d+$/.test(parts[i])) {
      i += 1;
      nodes = field.item ?? [];
      if (i >= parts.length) {
        return field;
      }
      continue;
    }
    if (field.type === 'group') {
      nodes = field.children ?? [];
      continue;
    }
    return undefined;
  }
  return field;
}
