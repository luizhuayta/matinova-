import { JsonMap } from './cms.models';
import type { SchemaField } from './cms-schema';

export interface CmsBlock {
  id: string;
  type: string;
  hidden?: boolean;
  layout?: {
    width?: 'full' | 'half' | 'third' | string;
    padding?: string;
    background?: string;
  };
  props: JsonMap;
}

export interface BlockTypeDef {
  type: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  schema: SchemaField[];
  defaults: JsonMap;
}

export interface PageTemplateDef {
  id: string;
  label: string;
  description: string;
}

export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function field(path: string, type: SchemaField['type'], label: string, extra: Partial<SchemaField> = {}): SchemaField {
  return { path, type, label, ...extra };
}

const SLIDE_ITEM: SchemaField[] = [
  field('badge', 'text', 'Etiqueta'),
  field('title', 'area', 'Título', { maxLength: 180 }),
  field('image', 'image', 'Imagen'),
];
const CARD_ITEM: SchemaField[] = [
  field('title', 'text', 'Título'),
  field('text', 'area', 'Texto'),
  field('icon', 'text', 'Icono'),
];
const SERVICE_CARD: SchemaField[] = [
  field('img', 'image', 'Imagen'),
  field('alt', 'text', 'Texto de la imagen'),
  field('title', 'text', 'Título'),
  field('text', 'area', 'Texto'),
];
const LINK_CARD: SchemaField[] = [
  field('path', 'link', 'Enlace'),
  field('img', 'image', 'Imagen'),
  field('title', 'text', 'Título'),
  field('text', 'area', 'Texto'),
  field('link', 'text', 'Texto del enlace'),
];
const INNOVATIVE_ITEM: SchemaField[] = [
  field('title', 'text', 'Título'),
  field('desc', 'area', 'Descripción'),
  field('img', 'image', 'Imagen'),
];
const TESTIMONIAL_ITEM: SchemaField[] = [
  field('text', 'area', 'Opinión'),
  field('client', 'text', 'Cliente'),
  field('role', 'text', 'Rol'),
  field('company', 'text', 'Empresa'),
  field('rating', 'number', 'Estrellas (1-5)'),
  field('logo', 'image', 'Logo'),
];
const STAT_ITEM: SchemaField[] = [
  field('icon', 'text', 'Icono'),
  field('number', 'text', 'Número'),
  field('label', 'text', 'Etiqueta'),
];
const TEAM_ITEM: SchemaField[] = [
  field('name', 'text', 'Nombre'),
  field('role', 'text', 'Cargo'),
  field('image', 'image', 'Foto'),
  field('linkedin', 'link', 'LinkedIn'),
  field('github', 'link', 'GitHub'),
];
const VIDEO_ITEM: SchemaField[] = [
  field('embed', 'embed', 'Enlace de YouTube'),
  field('user', 'text', 'Usuario'),
  field('title', 'text', 'Título'),
];
const REASON_ITEM: SchemaField[] = [
  field('img', 'image', 'Imagen'),
  field('title', 'text', 'Título'),
  field('text', 'area', 'Texto'),
];
const CLIENT_ITEM: SchemaField[] = [
  field('logo', 'image', 'Logo'),
  field('name', 'text', 'Nombre'),
  field('url', 'link', 'Enlace'),
  field('alt', 'text', 'Texto de la imagen'),
  field('text', 'area', 'Caso de éxito'),
  field('icon', 'text', 'Icono (si no hay logo)'),
  field('category', 'select', 'Panel', {
    options: [
      { value: 'empresas', label: 'Empresas y E-commerce' },
      { value: 'educativas', label: 'Instituciones Educativas' },
      { value: 'alianzas', label: 'Alianzas Institucionales' },
    ],
  }),
  field('subcategory', 'text', 'Subcategoría / rubro'),
];
const STAGE_ITEM: SchemaField[] = [
  field('step', 'text', 'Paso'),
  field('title', 'text', 'Título'),
  field('text', 'area', 'Texto'),
  field('image', 'image', 'Imagen'),
];
const FAQ_ITEM: SchemaField[] = [
  field('question', 'text', 'Pregunta'),
  field('answer', 'area', 'Respuesta'),
];
const GALLERY_ITEM: SchemaField[] = [
  field('image', 'image', 'Imagen'),
  field('alt', 'text', 'Texto de la imagen'),
  field('caption', 'text', 'Pie de foto'),
];

export const PAGE_TEMPLATES: PageTemplateDef[] = [
  { id: 'blank', label: 'En blanco', description: 'Una sección de texto para empezar.' },
  { id: 'home', label: 'Portada', description: 'Banner, quiénes somos y un llamado.' },
  { id: 'service', label: 'Servicio', description: 'Banner, texto e ítems de beneficios.' },
  { id: 'legal', label: 'Legal', description: 'Título y texto largo.' },
  { id: 'clients', label: 'Clientes', description: 'Paneles por rubro, logos y llamado a contacto.' },
  { id: 'contact', label: 'Contacto', description: 'Tarjetas y formulario.' },
];

export const BLOCK_CATALOG: Record<string, BlockTypeDef> = {
  hero: {
    type: 'hero',
    label: 'Banner carrusel',
    icon: 'bi-images',
    category: 'Portada',
    description: 'Fotos grandes que rotan con título y botón.',
    schema: [
      field('slides', 'list', 'Banners', { item: SLIDE_ITEM }),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
    ],
    defaults: {
      slides: [{ badge: 'NUEVO', title: 'Título del banner', image: 'carousel.jpg' }],
      cta: 'Aprender más',
      ctaLink: '/contacto',
    },
  },
  about: {
    type: 'about',
    label: 'Quiénes somos',
    icon: 'bi-people',
    category: 'Contenido',
    description: 'Imagen, texto y botón. Puedes añadir puntos destacados.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('image', 'image', 'Imagen'),
      field('imageAlt', 'text', 'Texto de la imagen'),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
      field('features', 'list', 'Puntos destacados', { item: [field('text', 'text', 'Texto')] }),
    ],
    defaults: {
      tag: 'QUIÉNES SOMOS',
      title: 'Título de la sección',
      text: 'Describe aquí tu empresa.',
      image: 'about-image.jpg',
      imageAlt: '',
      cta: 'Leer más',
      ctaLink: '/acerca-de',
      features: [],
    },
  },
  contactCards: {
    type: 'contactCards',
    label: 'Tarjetas de contacto',
    icon: 'bi-geo-alt',
    category: 'Contacto',
    description: 'Dirección, correo o teléfono en tarjetas.',
    schema: [field('items', 'list', 'Tarjetas', { item: CARD_ITEM })],
    defaults: { items: [{ title: 'Contacto', text: 'Escribe aquí el dato', icon: 'bi-geo-alt-fill' }] },
  },
  services: {
    type: 'services',
    label: 'Servicios (cuadrícula)',
    icon: 'bi-grid',
    category: 'Servicios',
    description: 'Tarjetas con foto, título y texto.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('cards', 'list', 'Tarjetas', { item: SERVICE_CARD }),
    ],
    defaults: {
      tag: 'QUÉ HACEMOS',
      title: 'Ofrecemos servicios',
      cards: [{ img: 'imac.jpg', alt: '', title: 'Servicio', text: 'Descripción del servicio.' }],
    },
  },
  innovative: {
    type: 'innovative',
    label: 'Carrusel de servicios',
    icon: 'bi-collection',
    category: 'Servicios',
    description: 'Texto a un lado y tarjetas que se deslizan.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
      field('items', 'list', 'Elementos', { item: INNOVATIVE_ITEM }),
    ],
    defaults: {
      tag: 'SERVICIOS INNOVADORES',
      title: 'Conozca nuestros servicios',
      text: '',
      cta: 'Descubrir más',
      ctaLink: '/servicios',
      items: [{ title: 'Servicio', desc: 'Descripción corta.', img: 'sol_ti.jpg' }],
    },
  },
  testimonials: {
    type: 'testimonials',
    label: 'Opiniones',
    icon: 'bi-chat-quote',
    category: 'Clientes',
    description: 'Comentarios de clientes con logo.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
      field('items', 'list', 'Comentarios', { item: TESTIMONIAL_ITEM }),
    ],
    defaults: {
      tag: 'CLIENTES SATISFECHOS',
      title: 'Opiniones y casos de éxito',
      text: '',
      cta: 'Aprender más',
      ctaLink: '/contacto',
      items: [{ text: 'Excelente servicio.', client: 'Cliente', role: 'Cliente Satisfecho', company: 'Matt Innova Solution', rating: 5, logo: 'logo.svg' }],
    },
  },
  pageHero: {
    type: 'pageHero',
    label: 'Portada de página',
    icon: 'bi-window',
    category: 'Portada',
    description: 'Título, texto y botón sobre un fondo.',
    schema: [
      field('badge', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
      field('image', 'image', 'Imagen de fondo'),
    ],
    defaults: {
      badge: 'SECCIÓN',
      title: 'Título de la página',
      text: '',
      cta: 'Contáctanos',
      ctaLink: '/contacto',
      image: '',
    },
  },
  stats: {
    type: 'stats',
    label: 'Cifras',
    icon: 'bi-graph-up',
    category: 'Contenido',
    description: 'Números destacados: años, clientes, proyectos.',
    schema: [field('items', 'list', 'Cifras', { item: STAT_ITEM })],
    defaults: { items: [{ icon: '🎯', number: '+10', label: 'Años' }] },
  },
  team: {
    type: 'team',
    label: 'Equipo',
    icon: 'bi-person-badge',
    category: 'Contenido',
    description: 'Fotos y cargos de las personas del equipo.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('items', 'list', 'Personas', { item: TEAM_ITEM }),
    ],
    defaults: {
      tag: 'NUESTRO EQUIPO',
      title: 'Conoce al equipo',
      text: '',
      items: [{ name: 'Nombre', role: 'Cargo', image: 'taya.jpg', linkedin: '#', github: '#' }],
    },
  },
  videos: {
    type: 'videos',
    label: 'Videos',
    icon: 'bi-youtube',
    category: 'Contenido',
    description: 'Videos de YouTube embebidos.',
    schema: [
      field('tag', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('items', 'list', 'Videos', { item: VIDEO_ITEM }),
    ],
    defaults: {
      tag: 'NOVEDADES',
      title: 'Videos',
      text: '',
      items: [
        {
          embed: 'https://www.youtube.com/embed/RtNdTuCxWoI',
          user: '@mattinnovasolution',
          title: 'Video',
        },
      ],
    },
  },
  listingHero: {
    type: 'listingHero',
    label: 'Banner de listado',
    icon: 'bi-image',
    category: 'Portada',
    description: 'Imagen ancha con título encima.',
    schema: [
      field('image', 'image', 'Imagen'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
    ],
    defaults: { image: '/carousel.jpg', title: 'Nuestros servicios', text: '' },
  },
  serviceCards: {
    type: 'serviceCards',
    label: 'Listado con enlaces',
    icon: 'bi-card-list',
    category: 'Servicios',
    description: 'Tarjetas que llevan a otra página.',
    schema: [
      field('subtitle', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('cards', 'list', 'Tarjetas', { item: LINK_CARD }),
    ],
    defaults: {
      subtitle: 'CONOCE NUESTROS',
      title: 'Servicios',
      cards: [{ path: '/contacto', img: '/software.png', title: 'Servicio', text: 'Descripción.', link: 'Ver más →' }],
    },
  },
  cta: {
    type: 'cta',
    label: 'Llamado a la acción',
    icon: 'bi-megaphone',
    category: 'Contenido',
    description: 'Título, texto y botón para contactar.',
    schema: [
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('button', 'text', 'Botón'),
      field('link', 'link', 'Enlace'),
    ],
    defaults: {
      title: '¿Listo para transformar tu negocio?',
      text: 'Contáctanos y descubre cómo podemos ayudarte.',
      button: 'Contáctanos',
      link: '/contacto',
    },
  },
  serviceHero: {
    type: 'serviceHero',
    label: 'Detalle de servicio',
    icon: 'bi-layers',
    category: 'Servicios',
    description: 'Banner, foto y texto introductorio.',
    schema: [
      field('heroImage', 'image', 'Imagen del banner'),
      field('heroAlt', 'text', 'Texto del banner'),
      field('image', 'image', 'Imagen'),
      field('imageAlt', 'text', 'Texto de la imagen'),
      field('label', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('cta', 'text', 'Botón'),
      field('ctaLink', 'link', 'Enlace del botón'),
    ],
    defaults: {
      heroImage: '/carousel.jpg',
      heroAlt: '',
      image: '/software.png',
      imageAlt: '',
      label: 'SERVICIO',
      title: 'Nombre del servicio',
      text: 'Describe el servicio.',
      cta: 'Contáctanos',
      ctaLink: '/contacto',
    },
  },
  reasons: {
    type: 'reasons',
    label: 'Motivos / beneficios',
    icon: 'bi-check2-square',
    category: 'Servicios',
    description: 'Por qué elegirte, con foto y texto.',
    schema: [
      field('subtitle', 'text', 'Etiqueta'),
      field('title', 'text', 'Título'),
      field('items', 'list', 'Motivos', { item: REASON_ITEM }),
    ],
    defaults: {
      subtitle: 'RAZONES POR LAS CUALES',
      title: 'Debes elegirnos',
      items: [{ img: '/integridad.jpg', title: 'Motivo', text: 'Explica el beneficio.' }],
    },
  },
  richText: {
    type: 'richText',
    label: 'Texto largo',
    icon: 'bi-textarea-t',
    category: 'Contenido',
    description: 'Título y contenido con negritas, listas y enlaces.',
    schema: [
      field('title', 'text', 'Título'),
      field('lastUpdated', 'text', 'Última actualización'),
      field('body', 'rich', 'Texto'),
    ],
    defaults: { title: 'Título', lastUpdated: '', body: '<p>Escribe el contenido aquí.</p>' },
  },
  contactForm: {
    type: 'contactForm',
    label: 'Formulario de contacto',
    icon: 'bi-envelope',
    category: 'Contacto',
    description: 'Formulario que envía mensajes al correo que indiques.',
    schema: [
      field('submitLabel', 'text', 'Texto del botón enviar'),
      field('destinationEmail', 'text', 'Correo donde llegan los mensajes'),
      field('fields', 'group', 'Campos visibles', {
        children: [
          field('name', 'bool', 'Nombre'),
          field('email', 'bool', 'Correo'),
          field('phone', 'bool', 'Teléfono'),
          field('subject', 'bool', 'Asunto'),
          field('message', 'bool', 'Mensaje'),
        ],
      }),
      field('placeholders', 'group', 'Textos de ayuda', {
        children: [
          field('name', 'text', 'Nombre'),
          field('email', 'text', 'Correo'),
          field('phone', 'text', 'Teléfono'),
          field('subject', 'text', 'Asunto'),
          field('message', 'text', 'Mensaje'),
        ],
      }),
    ],
    defaults: {
      submitLabel: 'Enviar mensaje',
      destinationEmail: 'contacto@mattinnovasolution.com',
      fields: { name: true, email: true, phone: true, subject: true, message: true },
      placeholders: {
        name: 'Su nombre',
        email: 'Su correo electrónico',
        phone: 'Teléfono (9 dígitos)',
        subject: 'Asunto',
        message: 'Mensaje',
      },
    },
  },
  claimsBook: {
    type: 'claimsBook',
    label: 'Libro de reclamaciones',
    icon: 'bi-journal-text',
    category: 'Legal',
    description: 'Textos del libro virtual. Los campos del reclamo los pide la ley.',
    schema: [
      field('title', 'text', 'Título'),
      field('company', 'text', 'Empresa'),
      field('subtitle', 'area', 'Subtítulo'),
      field('logo', 'image', 'Logo'),
      field('ruc', 'text', 'RUC'),
      field('destinationEmail', 'text', 'Correo de destino'),
      field('disclaimer1', 'area', 'Aviso legal 1'),
      field('disclaimer2', 'area', 'Aviso legal 2'),
      field('submitLabel', 'text', 'Texto del botón enviar'),
    ],
    defaults: {
      title: 'Libro de Reclamaciones Virtual',
      company: 'Matt Innova Solution',
      subtitle: '',
      logo: 'logo.svg',
      ruc: '',
      destinationEmail: 'libroreclamaciones@mattinnovasolution.com',
      disclaimer1: '',
      disclaimer2: '',
      submitLabel: 'Enviar reclamación virtual',
    },
  },
  clients: {
    type: 'clients',
    label: 'Clientes',
    icon: 'bi-building',
    category: 'Clientes',
    description: 'Logos, nombres y casos. Elige paneles, cuadrícula, carrusel o casos.',
    schema: [
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('layout', 'select', 'Diseño', {
        options: [
          { value: 'paneles', label: 'Paneles / acordeón' },
          { value: 'logos-grid', label: 'Cuadrícula de logos' },
          { value: 'carrusel', label: 'Carrusel' },
          { value: 'casos', label: 'Casos de éxito' },
        ],
      }),
      field('items', 'list', 'Clientes', { item: CLIENT_ITEM }),
    ],
    defaults: {
      title: 'Nuestros clientes',
      text: '',
      layout: 'paneles',
      items: [{ logo: '', name: 'Cliente', url: '', alt: 'Cliente', text: '', icon: '', category: 'empresas', subcategory: '' }],
    },
  },
  clientStages: {
    type: 'clientStages',
    label: 'Fases de clientes',
    icon: 'bi-diagram-3',
    category: 'Clientes',
    description: 'Pasos o etapas del trabajo con clientes.',
    schema: [
      field('title', 'text', 'Título'),
      field('text', 'area', 'Texto'),
      field('stages', 'list', 'Fases', { item: STAGE_ITEM }),
    ],
    defaults: {
      title: 'Cómo trabajamos con clientes',
      text: '',
      stages: [{ step: '01', title: 'Diagnóstico', text: 'Entendemos tu necesidad.', image: '' }],
    },
  },
  faq: {
    type: 'faq',
    label: 'Preguntas frecuentes',
    icon: 'bi-question-circle',
    category: 'Contenido',
    description: 'Pregunta y respuesta en lista.',
    schema: [field('title', 'text', 'Título'), field('items', 'list', 'Preguntas', { item: FAQ_ITEM })],
    defaults: {
      title: 'Preguntas frecuentes',
      items: [{ question: '¿Cómo empezamos?', answer: 'Escríbenos y agendamos una reunión.' }],
    },
  },
  gallery: {
    type: 'gallery',
    label: 'Galería',
    icon: 'bi-images',
    category: 'Contenido',
    description: 'Varias fotos en cuadrícula.',
    schema: [field('title', 'text', 'Título'), field('items', 'list', 'Fotos', { item: GALLERY_ITEM })],
    defaults: { title: 'Galería', items: [{ image: 'carousel.jpg', alt: '', caption: '' }] },
  },
  map: {
    type: 'map',
    label: 'Mapa',
    icon: 'bi-map',
    category: 'Contacto',
    description: 'Mapa embebido (Google Maps u otro iframe https).',
    schema: [
      field('title', 'text', 'Título'),
      field('embed', 'embed', 'Enlace del mapa'),
      field('text', 'area', 'Texto'),
    ],
    defaults: { title: 'Dónde estamos', embed: '', text: '' },
  },
};

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

export function makeBlock(type: string, props?: JsonMap, hidden = false): CmsBlock {
  const def = BLOCK_CATALOG[type];
  return {
    id: newBlockId(),
    type,
    hidden,
    layout: { width: 'full', padding: '', background: '' },
    props: { ...(def?.defaults ?? {}), ...(props ?? {}) },
  };
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
    schemaVersion: 5,
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
    { type: 'testimonials' },
  ];
  const blocks: CmsBlock[] = [];
  for (const row of order) {
    const type = String(row?.type ?? '');
    const hidden = !!row?.hidden;
    if (type === 'hero') {
      blocks.push(makeBlock('hero', { slides: content['slides'], cta: content['heroCta'], ctaLink: content['heroCtaLink'] }, hidden));
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
    makeBlock('pageHero', { badge: content['badge'], title: content['title'], text: '', cta: '', ctaLink: '' }),
    makeBlock('contactCards', { items: content['cards'] }),
    makeBlock('contactForm', {
      submitLabel: content['submitLabel'],
      destinationEmail: content['destinationEmail'],
      fields: content['fields'],
      placeholders: content['placeholders'],
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
