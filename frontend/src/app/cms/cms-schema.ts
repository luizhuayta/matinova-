import { FieldDesc, FieldKind, fieldLabel } from './cms-fields';
import { JsonMap } from './cms.models';
import { BLOCK_CATALOG, CmsBlock, DEFAULT_BG_IMAGE, findSchemaFieldIn, migratePageToBlocks, pageBlocks } from './block-registry';

export const CMS_SCHEMA_VERSION = 6;

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

const DEFAULT_INICIO_SECTIONS = [
  { type: 'hero', hidden: false },
  { type: 'about', hidden: false },
  { type: 'contactCards', hidden: false },
  { type: 'services', hidden: false },
  { type: 'innovative', hidden: false },
  { type: 'testimonials', hidden: true },
  { type: 'faq', hidden: false },
];

const SEO_FIELDS: SchemaField[] = [
  { path: 'title', type: 'text', label: 'Título SEO', maxLength: 70, description: 'Aparece en la pestaña y en Google.' },
  { path: 'description', type: 'area', label: 'Descripción SEO', maxLength: 160 },
  { path: 'image', type: 'image', label: 'Imagen para compartir' },
];

const NAV_SERVICE_ITEM: SchemaField[] = [
  { path: 'label', type: 'text', label: 'Texto' },
  { path: 'path', type: 'link', label: 'Enlace' },
];

const SPLASH_IMAGE_ITEM: SchemaField[] = [
  { path: 'image', type: 'image', label: 'Imagen' },
  { path: 'alt', type: 'text', label: 'Texto de la imagen' },
];

export const DEFAULT_SPLASH_IMAGES = [
  { image: 'splash/mis-academy.webp', alt: 'MIS Academy' },
  { image: 'splash/matt-innova.webp', alt: 'Matt Innova Solution' },
];

export const SITE_SCHEMA: SchemaField[] = [
  { path: 'showSplash', type: 'bool', label: 'Mostrar pantalla de bienvenida' },
  { path: 'splashSeconds', type: 'number', label: 'Segundos de bienvenida', description: 'Cuántos segundos se muestra la bienvenida.' },
  {
    path: 'splashImages',
    type: 'list',
    label: 'Imágenes de la pantalla de carga',
    description: 'Agrega, quita o reordena las marcas que aparecen al cargar el sitio.',
    item: SPLASH_IMAGE_ITEM,
  },
  { path: 'splashTagline', type: 'area', label: 'Frase de bienvenida' },
  { path: 'splashLabel', type: 'text', label: 'Etiqueta de carga', description: 'Texto sobre la barra, por ejemplo CARGANDO…' },
  { path: 'founderName', type: 'text', label: 'Nombre del fundador' },
  { path: 'founderRole', type: 'text', label: 'Cargo del fundador' },
  { path: 'founderImage', type: 'image', label: 'Foto del fundador' },
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

export function inspectorRootSchema(slug: string, _content: JsonMap): SchemaField[] | null {
  if (slug === 'sitio') {
    return SITE_SCHEMA;
  }
  return PAGE_BLOCKS_SCHEMA;
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
          backgroundImage: (block as CmsBlock & { layout?: { backgroundImage?: string } }).layout?.backgroundImage || '',
        },
      }));
    } else {
      if (!next['defaultLocale']) next['defaultLocale'] = 'es';
      if (!Array.isArray(next['locales'])) next['locales'] = ['es', 'en'];
    }
    next['schemaVersion'] = 5;
  }
  if (version < 6) {
    if (slug !== 'sitio') {
      const blocks = pageBlocks(next);
      next['blocks'] = blocks.map((block) => ({
        ...block,
        layout: {
          width: (block as CmsBlock & { layout?: { width?: string } }).layout?.width || 'full',
          padding: (block as CmsBlock & { layout?: { padding?: string } }).layout?.padding || '',
          background: (block as CmsBlock & { layout?: { background?: string } }).layout?.background || '',
          backgroundImage: String((block as CmsBlock & { layout?: { backgroundImage?: string } }).layout?.backgroundImage ?? '').trim() || DEFAULT_BG_IMAGE,
        },
      }));
    }
    next['schemaVersion'] = 6;
  }
  if (slug === 'sitio') {
    if (next['chatbotMode'] !== 'ia' && next['chatbotMode'] !== 'clasico') {
      next['chatbotMode'] = 'clasico';
    }
    if (!next['aiProvider']) next['aiProvider'] = 'openrouter';
    if (!next['aiModel']) next['aiModel'] = 'openai/gpt-4o-mini';
    if (!next['aiBaseUrl']) next['aiBaseUrl'] = 'https://openrouter.ai/api/v1';
    if (!('splashImages' in next)) {
      next['splashImages'] = DEFAULT_SPLASH_IMAGES.map((item) => ({ ...item }));
    }
    if (!next['splashLabel']) {
      next['splashLabel'] = 'CARGANDO…';
    }
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
  if (/blocks\.\d+\.layout\.backgroundImage$/.test(path)) {
    return 'Cambiaste la imagen de fondo de una sección';
  }
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
