import { FieldDesc, FieldKind, fieldLabel } from './cms-fields';
import { JsonMap } from './cms.models';
import { BLOCK_CATALOG, CmsBlock, findSchemaFieldIn, migratePageToBlocks, pageBlocks } from './block-registry';

export const CMS_SCHEMA_VERSION = 5;

export type SchemaKind =
  | 'text'
  | 'area'
  | 'rich'
  | 'link'
  | 'image'
  | 'bool'
  | 'number'
  | 'select'
  | 'color'
  | 'embed'
  | 'list'
  | 'group'
  | 'blocks';

export interface SchemaField {
  path: string;
  type: SchemaKind;
  label: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  maxLength?: number;
  options?: { value: string; label: string }[];
  item?: SchemaField[];
  children?: SchemaField[];
  min?: number;
}

export const INICIO_SECTION_TYPES = [
  { value: 'hero', label: 'Banner' },
  { value: 'about', label: 'Quiénes somos' },
  { value: 'contactCards', label: 'Tarjetas de contacto' },
  { value: 'services', label: 'Servicios' },
  { value: 'innovative', label: 'Servicios innovadores' },
  { value: 'testimonials', label: 'Opiniones' },
] as const;

export const DEFAULT_INICIO_SECTIONS = INICIO_SECTION_TYPES.map((item) => ({
  type: item.value,
  hidden: false,
}));

const SEO_FIELDS: SchemaField[] = [
  { path: 'title', type: 'text', label: 'Título SEO', maxLength: 70, description: 'Aparece en la pestaña y en Google.' },
  { path: 'description', type: 'area', label: 'Descripción SEO', maxLength: 160 },
  { path: 'image', type: 'image', label: 'Imagen para compartir' },
];

const SLIDE_ITEM: SchemaField[] = [
  { path: 'badge', type: 'text', label: 'Etiqueta' },
  { path: 'title', type: 'area', label: 'Título', maxLength: 180 },
  { path: 'image', type: 'image', label: 'Imagen' },
];

const CARD_ITEM: SchemaField[] = [
  { path: 'title', type: 'text', label: 'Título' },
  { path: 'text', type: 'area', label: 'Texto' },
];

const SERVICE_CARD_ITEM: SchemaField[] = [
  { path: 'img', type: 'image', label: 'Imagen' },
  { path: 'alt', type: 'text', label: 'Texto de la imagen' },
  { path: 'title', type: 'text', label: 'Título' },
  { path: 'text', type: 'area', label: 'Texto' },
];

const INNOVATIVE_ITEM: SchemaField[] = [
  { path: 'title', type: 'text', label: 'Título' },
  { path: 'desc', type: 'area', label: 'Descripción' },
  { path: 'img', type: 'image', label: 'Imagen' },
];

const TESTIMONIAL_ITEM: SchemaField[] = [
  { path: 'text', type: 'area', label: 'Opinión' },
  { path: 'client', type: 'text', label: 'Cliente' },
  { path: 'role', type: 'text', label: 'Rol' },
  { path: 'company', type: 'text', label: 'Empresa' },
  { path: 'rating', type: 'number', label: 'Estrellas (1-5)', default: 5 },
  { path: 'logo', type: 'image', label: 'Logo' },
];

const NAV_SERVICE_ITEM: SchemaField[] = [
  { path: 'label', type: 'text', label: 'Texto' },
  { path: 'path', type: 'link', label: 'Enlace' },
];

export const SITE_SCHEMA: SchemaField[] = [
  { path: 'showSplash', type: 'bool', label: 'Mostrar pantalla de bienvenida' },
  { path: 'splashSeconds', type: 'number', label: 'Segundos de bienvenida', description: 'Cuántos segundos se muestra la bienvenida.' },
  { path: 'founderName', type: 'text', label: 'Nombre del fundador' },
  { path: 'founderRole', type: 'text', label: 'Cargo del fundador' },
  { path: 'founderImage', type: 'image', label: 'Foto del fundador' },
  { path: 'splashTagline', type: 'area', label: 'Frase de bienvenida' },
  { path: 'logo', type: 'image', label: 'Logo' },
  { path: 'logoAlt', type: 'text', label: 'Texto del logo', description: 'Se lee en voz alta si la imagen no carga.' },
  {
    path: 'nav',
    type: 'group',
    label: 'Menú',
    children: [
      { path: 'inicio', type: 'text', label: 'Inicio' },
      { path: 'acerca', type: 'text', label: 'Acerca de' },
      { path: 'academy', type: 'text', label: 'Academia' },
      { path: 'academyUrl', type: 'link', label: 'URL de la academia' },
      { path: 'servicios', type: 'text', label: 'Servicios' },
      { path: 'contacto', type: 'text', label: 'Contacto' },
    ],
  },
  { path: 'navServices', type: 'list', label: 'Servicios del menú', item: NAV_SERVICE_ITEM },
  { path: 'showClientsToggle', type: 'bool', label: 'Mostrar menú Clientes' },
  { path: 'clientsLabel', type: 'text', label: 'Texto del menú Clientes' },
  { path: 'showCtaBanner', type: 'bool', label: 'Mostrar aviso superior' },
  { path: 'ctaText', type: 'area', label: 'Texto' },
  { path: 'ctaEmail', type: 'text', label: 'Correo' },
  { path: 'ctaButton', type: 'text', label: 'Botón' },
  { path: 'showWhatsapp', type: 'bool', label: 'Mostrar botón de WhatsApp' },
  { path: 'whatsappNumber', type: 'text', label: 'Número de WhatsApp', description: 'Código de país y número, sin el signo +.' },
  { path: 'whatsappMessage', type: 'area', label: 'Mensaje inicial de WhatsApp' },
  { path: 'whatsappTooltip', type: 'text', label: 'Texto al pasar el mouse' },
  {
    path: 'showChatbot',
    type: 'bool',
    label: 'Mostrar chatbot',
    description: 'El modo clásico o IA se configura en Panel → Chatbot.',
  },
  { path: 'cookieText', type: 'area', label: 'Texto de cookies' },
  { path: 'cookieAccept', type: 'text', label: 'Botón aceptar cookies' },
  { path: 'cookieReject', type: 'text', label: 'Botón rechazar cookies' },
  { path: 'animateCarousels', type: 'bool', label: 'Animar carruseles' },
  {
    path: 'footer',
    type: 'group',
    label: 'Pie de página',
    children: [
      { path: 'desc', type: 'area', label: 'Descripción' },
      { path: 'quickTitle', type: 'text', label: 'Título de enlaces rápidos' },
      { path: 'popularTitle', type: 'text', label: 'Título de enlaces populares' },
      { path: 'contactTitle', type: 'text', label: 'Título de contacto' },
      { path: 'tagline', type: 'text', label: 'Frase' },
      { path: 'address', type: 'text', label: 'Dirección' },
      { path: 'phone', type: 'text', label: 'Teléfono' },
      { path: 'email', type: 'text', label: 'Correo' },
      { path: 'copyright', type: 'text', label: 'Copyright' },
      { path: 'privacy', type: 'text', label: 'Privacidad' },
      { path: 'terms', type: 'text', label: 'Términos' },
      { path: 'libroImage', type: 'image', label: 'Imagen del libro' },
      { path: 'youtube', type: 'link', label: 'YouTube' },
      { path: 'facebook', type: 'link', label: 'Facebook' },
      { path: 'linkedin', type: 'link', label: 'LinkedIn' },
      { path: 'instagram', type: 'link', label: 'Instagram' },
    ],
  },
  {
    path: 'defaultLocale',
    type: 'select',
    label: 'Idioma por defecto',
    options: [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
    ],
  },
  { path: 'seo', type: 'group', label: 'SEO', children: SEO_FIELDS },
];

export const INICIO_SCHEMA: SchemaField[] = [
  {
    path: 'sections',
    type: 'list',
    label: 'Orden de secciones',
    description: 'Reordena, duplica u oculta las secciones que ya existen. No se pueden inventar tipos nuevos.',
    item: [
      {
        path: 'type',
        type: 'select',
        label: 'Sección',
        options: INICIO_SECTION_TYPES.map((item) => ({ value: item.value, label: item.label })),
        default: 'hero',
      },
      { path: 'hidden', type: 'bool', label: 'Ocultar en la web', default: false },
    ],
  },
  { path: 'slides', type: 'list', label: 'Banners', item: SLIDE_ITEM },
  { path: 'heroCta', type: 'text', label: 'Botón del banner' },
  { path: 'heroCtaLink', type: 'link', label: 'Enlace del banner', description: 'Ruta de la web (/contacto) o un enlace https://' },
  {
    path: 'about',
    type: 'group',
    label: 'Quiénes somos',
    children: [
      { path: 'tag', type: 'text', label: 'Etiqueta' },
      { path: 'title', type: 'text', label: 'Título' },
      { path: 'text', type: 'area', label: 'Texto' },
      { path: 'image', type: 'image', label: 'Imagen' },
      { path: 'imageAlt', type: 'text', label: 'Texto de la imagen' },
      { path: 'cta', type: 'text', label: 'Botón' },
    ],
  },
  { path: 'contactCards', type: 'list', label: 'Tarjetas de contacto', item: CARD_ITEM },
  {
    path: 'services',
    type: 'group',
    label: 'Servicios',
    children: [
      { path: 'tag', type: 'text', label: 'Etiqueta' },
      { path: 'title', type: 'text', label: 'Título' },
      { path: 'cards', type: 'list', label: 'Tarjetas', item: SERVICE_CARD_ITEM },
    ],
  },
  {
    path: 'innovative',
    type: 'group',
    label: 'Servicios innovadores',
    children: [
      { path: 'tag', type: 'text', label: 'Etiqueta' },
      { path: 'title', type: 'text', label: 'Título' },
      { path: 'text', type: 'area', label: 'Texto' },
      { path: 'cta', type: 'text', label: 'Botón' },
      { path: 'items', type: 'list', label: 'Elementos', item: INNOVATIVE_ITEM },
    ],
  },
  {
    path: 'testimonials',
    type: 'group',
    label: 'Opiniones',
    children: [
      { path: 'tag', type: 'text', label: 'Etiqueta' },
      { path: 'title', type: 'text', label: 'Título' },
      { path: 'text', type: 'area', label: 'Texto' },
      { path: 'cta', type: 'text', label: 'Botón' },
      { path: 'items', type: 'list', label: 'Comentarios', item: TESTIMONIAL_ITEM },
    ],
  },
  { path: 'seo', type: 'group', label: 'SEO', children: SEO_FIELDS },
];

export const PAGE_BLOCKS_SCHEMA: SchemaField[] = [
  {
    path: 'blocks',
    type: 'blocks',
    label: 'Secciones de la página',
    description: 'Añade, reordena, duplica u oculta secciones. Elige el tipo en el catálogo.',
  },
  { path: 'seo', type: 'group', label: 'SEO', children: SEO_FIELDS },
];

const PAGE_SCHEMA_BY_SLUG: Record<string, SchemaField[]> = {
  inicio: PAGE_BLOCKS_SCHEMA,
  'acerca-de': PAGE_BLOCKS_SCHEMA,
  servicios: PAGE_BLOCKS_SCHEMA,
  'servicios-saas': PAGE_BLOCKS_SCHEMA,
  'servicios-hardware': PAGE_BLOCKS_SCHEMA,
  'servicios-software': PAGE_BLOCKS_SCHEMA,
  'servicios-consultoria': PAGE_BLOCKS_SCHEMA,
  'servicios-soluciones-ti': PAGE_BLOCKS_SCHEMA,
  contacto: PAGE_BLOCKS_SCHEMA,
  clientes: PAGE_BLOCKS_SCHEMA,
  privacidad: PAGE_BLOCKS_SCHEMA,
  terminos: PAGE_BLOCKS_SCHEMA,
  'libro-reclamaciones': PAGE_BLOCKS_SCHEMA,
};

export function schemaForSlug(slug: string): SchemaField[] | null {
  if (slug === 'sitio') {
    return SITE_SCHEMA;
  }
  return PAGE_SCHEMA_BY_SLUG[slug] ?? PAGE_BLOCKS_SCHEMA;
}

const INICIO_SECTION_BLOCKS: Record<string, string[]> = {
  hero: ['slides', 'heroCta', 'heroCtaLink'],
  about: ['about'],
  contactCards: ['contactCards'],
  services: ['services'],
  innovative: ['innovative'],
  testimonials: ['testimonials'],
};

export function inspectorRootSchema(slug: string, content: JsonMap): SchemaField[] | null {
  if (slug === 'sitio') {
    return SITE_SCHEMA;
  }
  if (Array.isArray(content['blocks']) || schemaForSlug(slug)) {
    return PAGE_BLOCKS_SCHEMA;
  }
  const schema = schemaForSlug(slug);
  if (!schema) {
    return null;
  }
  if (slug !== 'inicio') {
    return schema;
  }
  const byPath = new Map(schema.map((field) => [field.path, field]));
  const out: SchemaField[] = [];
  const used = new Set<string>(['seo']);
  const sectionsField = byPath.get('sections');
  if (sectionsField) {
    out.push(sectionsField);
    used.add('sections');
  }
  const rows = Array.isArray(content['sections']) ? (content['sections'] as Array<{ type?: string }>) : [];
  for (const row of rows) {
    for (const path of INICIO_SECTION_BLOCKS[String(row?.type ?? '')] ?? []) {
      const field = byPath.get(path);
      if (field && !used.has(path)) {
        out.push(field);
        used.add(path);
      }
    }
  }
  for (const field of schema) {
    if (!used.has(field.path)) {
      out.push(field);
      used.add(field.path);
    }
  }
  const seo = byPath.get('seo');
  if (seo) {
    out.push(seo);
  }
  return out;
}

export function labelForPath(slug: string, path: string): string {
  const schema = schemaForSlug(slug);
  if (!schema) {
    const leaf = path.split('.').pop() ?? path;
    return fieldLabel(leaf);
  }
  const field = findSchemaField(schema, path);
  if (field?.label) {
    return field.label;
  }
  const leaf = path.split('.').pop() ?? path;
  return fieldLabel(leaf);
}

export function migrateCmsDocument(content: JsonMap, slug: string): JsonMap {
  const next = { ...content };
  let version = Number(next['schemaVersion'] ?? 0);
  if (version < 1) {
    const seo = next['seo'];
    if (!seo || typeof seo !== 'object' || Array.isArray(seo)) {
      next['seo'] = {
        title: String(next['title'] ?? (slug === 'sitio' ? 'Matt Innova Solution' : '')),
        description: '',
        image: String(next['logo'] ?? next['heroImage'] ?? ''),
      };
    }
    next['schemaVersion'] = 1;
    version = 1;
  }
  if (version < 2) {
    if (slug === 'inicio') {
      const sections = next['sections'];
      if (!Array.isArray(sections) || sections.length === 0) {
        next['sections'] = DEFAULT_INICIO_SECTIONS.map((item) => ({ ...item }));
      }
    }
    next['schemaVersion'] = 2;
    version = 2;
  }
  if (version < 3) {
    if (!Array.isArray(next['decorativeImagePaths'])) {
      next['decorativeImagePaths'] = [];
    }
    next['schemaVersion'] = 3;
    version = 3;
  }
  if (version < 4) {
    if (slug !== 'sitio') {
      Object.assign(next, migratePageToBlocks(next, slug));
    }
    next['schemaVersion'] = 4;
  }
  if (version < 5) {
    if (slug !== 'sitio') {
      const blocks = pageBlocks(next);
      next['blocks'] = blocks.map((block) => ({
        ...block,
        layout: {
          width: (block as CmsBlock & { layout?: { width?: string } }).layout?.width || 'full',
          padding: (block as CmsBlock & { layout?: { padding?: string } }).layout?.padding || '',
          background: (block as CmsBlock & { layout?: { background?: string } }).layout?.background || '',
        },
      }));
    } else {
      if (!next['defaultLocale']) next['defaultLocale'] = 'es';
      if (!Array.isArray(next['locales'])) next['locales'] = ['es', 'en'];
    }
    next['schemaVersion'] = 5;
  }
  if (slug === 'sitio') {
    if (next['chatbotMode'] !== 'ia' && next['chatbotMode'] !== 'clasico') {
      next['chatbotMode'] = 'clasico';
    }
    if (!next['aiProvider']) next['aiProvider'] = 'openrouter';
    if (!next['aiModel']) next['aiModel'] = 'openai/gpt-4o-mini';
    if (!next['aiBaseUrl']) next['aiBaseUrl'] = 'https://openrouter.ai/api/v1';
  }
  return next;
}

export function blankFromSchema(fields: SchemaField[]): JsonMap {
  const out: JsonMap = {};
  for (const field of fields) {
    if (field.default !== undefined) {
      out[field.path] = structuredClone(field.default);
      continue;
    }
    switch (field.type) {
      case 'bool':
        out[field.path] = false;
        break;
      case 'number':
        out[field.path] = 0;
        break;
      case 'list':
        out[field.path] = [];
        break;
      case 'group':
        out[field.path] = blankFromSchema(field.children ?? []);
        break;
      default:
        out[field.path] = '';
    }
  }
  return out;
}

export function humanChangeLine(slug: string, path: string): string {
  const leaf = path.replace(/^blocks\.\d+\.props\./, '');
  if (/slides\.\d+\.title$/.test(leaf) || /slides\.\d+\.title$/.test(path)) {
    return 'Cambiaste el titular de la portada';
  }
  if (/slides\.\d+\.image$/.test(leaf) || /slides\.\d+\.image$/.test(path)) {
    return 'Cambiaste una foto de la portada';
  }
  if (leaf.includes('items') && path.includes('testimonials')) {
    return leaf.endsWith('.text') ? 'Cambiaste una opinión' : 'Cambiaste datos de una opinión';
  }
  const label = labelForPath(slug, path);
  return `Cambiaste ${label.toLowerCase()}`;
}

export function minListLength(slug: string, path: string): number {
  if (path.startsWith('blocks.')) {
    return 0;
  }
  return 0;
}

export function minListLengthFor(content: JsonMap, path: string): number {
  const match = path.match(/^blocks\.(\d+)\.props\.(.+)$/);
  if (!match) {
    return 0;
  }
  const blocks = pageBlocks(content);
  const block = blocks[Number(match[1])];
  if (!block) {
    return 0;
  }
  const field = findSchemaFieldIn(BLOCK_CATALOG[block.type]?.schema ?? [], match[2]);
  return field?.min ?? 0;
}

export function altPathForImage(path: string): string | null {
  if (path === 'logo') {
    return 'logoAlt';
  }
  if (path.endsWith('.image')) {
    return `${path}Alt`;
  }
  if (path.endsWith('.img')) {
    return path.replace(/\.img$/, '.alt');
  }
  if (path.endsWith('.logo') && path !== 'logo') {
    return path.replace(/\.logo$/, '.alt');
  }
  if (path.endsWith('.heroImage')) {
    return path.replace(/\.heroImage$/, '.heroAlt');
  }
  return null;
}

export function itemFieldsAt(schema: SchemaField[] | null, listPath: string, content?: JsonMap): SchemaField[] | null {
  const match = listPath.match(/^blocks\.(\d+)\.props(?:\.(.+))?$/);
  if (match && content) {
    const blocks = pageBlocks(content);
    const block = blocks[Number(match[1])] as CmsBlock | undefined;
    const schemaOf = BLOCK_CATALOG[block?.type ?? '']?.schema ?? [];
    const inner = match[2] ?? '';
    if (!inner) {
      return schemaOf;
    }
    const field = findSchemaFieldIn(schemaOf, inner);
    return field?.type === 'list' ? field.item ?? null : null;
  }
  if (!schema) {
    return null;
  }
  const field = findSchemaField(schema, listPath);
  return field?.type === 'list' ? field.item ?? null : null;
}

export function schemaFieldsAt(schema: SchemaField[], rootPath: string): FieldDesc[] {
  if (!rootPath) {
    return schema.map((field) => toDesc(field, ''));
  }
  const parts = rootPath.split('.');
  let nodes = schema;
  let i = 0;
  while (i < parts.length) {
    const field = nodes.find((item) => item.path === parts[i]);
    if (!field) {
      return [];
    }
    i += 1;
    if (i >= parts.length) {
      if (field.type === 'group') {
        return (field.children ?? []).map((item) => toDesc(item, rootPath));
      }
      return [];
    }
    if (field.type === 'list' && /^\d+$/.test(parts[i])) {
      i += 1;
      nodes = field.item ?? [];
      if (i >= parts.length) {
        return nodes.map((item) => toDesc(item, rootPath));
      }
      continue;
    }
    if (field.type === 'group') {
      nodes = field.children ?? [];
      continue;
    }
    return [];
  }
  return nodes.map((item) => toDesc(item, rootPath));
}

function findSchemaField(schema: SchemaField[], path: string): SchemaField | undefined {
  const parts = path.split('.');
  let nodes = schema;
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

function toDesc(field: SchemaField, prefix: string): FieldDesc {
  const kind = schemaKindToField(field.type);
  return {
    key: field.path,
    path: prefix ? `${prefix}.${field.path}` : field.path,
    label: field.label,
    kind,
    hint: field.description,
    rows: field.type === 'area' ? 4 : undefined,
    options: field.options,
    maxLength: field.maxLength,
  };
}

function schemaKindToField(type: SchemaKind): FieldKind {
  switch (type) {
    case 'link':
      return 'link';
    case 'embed':
      return 'embed';
    case 'select':
      return 'select';
    case 'color':
      return 'color';
    case 'list':
      return 'list';
    case 'group':
      return 'group';
    case 'bool':
      return 'bool';
    case 'number':
      return 'number';
    case 'image':
      return 'image';
    case 'rich':
      return 'rich';
    case 'area':
      return 'area';
    case 'blocks':
      return 'blocks';
    default:
      return 'text';
  }
}
