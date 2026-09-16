export type FieldKind =
  | 'text'
  | 'area'
  | 'rich'
  | 'url'
  | 'link'
  | 'email'
  | 'tel'
  | 'bool'
  | 'number'
  | 'image'
  | 'list'
  | 'group'
  | 'strings'
  | 'select'
  | 'color'
  | 'embed';

export interface FieldDesc {
  key: string;
  path: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  maxLength?: number;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  image: 'Imagen',
  img: 'Imagen',
  alt: 'Texto de la imagen',
  text: 'Texto',
  desc: 'Descripción',
  cta: 'Botón',
  label: 'Etiqueta',
  path: 'Ruta',
  link: 'Enlace',
  email: 'Correo',
  phone: 'Teléfono',
  name: 'Nombre',
  role: 'Cargo',
  heroImage: 'Imagen del banner',
  heroTitle: 'Título del banner',
  heroText: 'Texto del banner',
  heroAlt: 'Texto de la imagen del banner',
  heroBadge: 'Etiqueta del banner',
  aboutTag: 'Etiqueta de quiénes somos',
  aboutTitle: 'Título de quiénes somos',
  aboutText: 'Texto de quiénes somos',
  aboutImage: 'Imagen de quiénes somos',
  aboutCta: 'Botón de quiénes somos',
  features: 'Puntos destacados',
  team: 'Equipo',
  teamTag: 'Etiqueta del equipo',
  teamTitle: 'Título del equipo',
  teamText: 'Texto del equipo',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  videos: 'Videos',
  videosTag: 'Etiqueta de videos',
  videosTitle: 'Título de videos',
  videosText: 'Texto de videos',
  embed: 'Enlace de YouTube',
  user: 'Usuario',
  subtitle: 'Subtítulo',
  ctaTitle: 'Título del llamado',
  reasons: 'Motivos',
  reasonsSubtitle: 'Subtítulo de motivos',
  reasonsTitle: 'Título de motivos',
  imageAlt: 'Texto de la imagen',
  submitLabel: 'Texto del botón enviar',
  fields: 'Textos del formulario',
  subject: 'Asunto',
  message: 'Mensaje',
  destinationEmail: 'Correo donde llegan los mensajes',
  disclaimer1: 'Aviso legal 1',
  disclaimer2: 'Aviso legal 2',
  body: 'Texto de la página',
  lastUpdated: 'Última actualización',
  ruc: 'RUC',
  stats: 'Cifras',
  icon: 'Icono',
  number: 'Número',
};

const IMAGE_KEYS = /^(logo|img|image|photo|banner|heroImage|founderImage|aboutImage|libroImage)$/i;
const RICH_KEYS = /^(body)$/i;
const AREA_KEYS = /^(text|desc|message|tagline|splashTagline|aboutText|cookieText|videosText|teamText|heroText|ctaText)$/i;
const URL_KEYS = /^(path|link|url|href|embed|academyUrl|heroCtaLink|linkedin|github|youtube|facebook|instagram)$/i;
const EMAIL_KEYS = /(^email$|Email$)/;
const TEL_KEYS = /^(phone|whatsappNumber|tel)$/i;

const FIELD_HINTS: Record<string, string> = {
  whatsappNumber: 'Código de país y número, sin el signo +.',
  whatsappMessage: 'Este texto se abre en WhatsApp.',
  whatsappTooltip: 'Aparece al pasar el mouse por el botón.',
  heroCtaLink: 'Ruta de la web (/contacto) o un enlace https://',
  path: 'Ruta interna, por ejemplo /servicios/saas',
  academyUrl: 'Enlace completo, con https://',
  embed: 'Pega el enlace del video de YouTube.',
  splashSeconds: 'Cuántos segundos se muestra la bienvenida.',
  destinationEmail: 'Aquí llegan los mensajes del formulario.',
  logoAlt: 'Se lee en voz alta si la imagen no carga.',
  imageAlt: 'Se lee en voz alta si la imagen no carga.',
};

const ADD_LABELS: Record<string, string> = {
  Banners: 'Añadir banner',
  Tarjetas: 'Añadir tarjeta',
  'Tarjetas de contacto': 'Añadir tarjeta',
  Elementos: 'Añadir elemento',
  Opiniones: 'Añadir opinión',
  Cifras: 'Añadir cifra',
  Videos: 'Añadir video',
  Equipo: 'Añadir persona',
  'Puntos destacados': 'Añadir punto',
  Comentarios: 'Añadir comentario',
  Motivos: 'Añadir motivo',
  'Servicios del menú': 'Añadir servicio',
};

export function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }
  return key
    .replace(/[._]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

export function isImageField(key: string, value: unknown): boolean {
  if (IMAGE_KEYS.test(key) || /Image$/i.test(key)) {
    return true;
  }
  if (typeof value !== 'string' || !value) {
    return false;
  }
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(value);
}

export function blankClone(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [];
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, blankClone(nested)]));
  }
  if (typeof value === 'boolean') {
    return false;
  }
  if (typeof value === 'number') {
    return 0;
  }
  return '';
}

export function fieldHint(key: string): string | undefined {
  return FIELD_HINTS[key];
}

export function addLabel(label: string): string {
  return ADD_LABELS[label] || 'Añadir';
}

export function fieldIcon(kind: FieldKind): string {
  switch (kind) {
    case 'image':
      return 'bi-image';
    case 'list':
    case 'strings':
      return 'bi-card-list';
    case 'group':
      return 'bi-folder2';
    case 'bool':
      return 'bi-toggles';
    case 'rich':
      return 'bi-textarea-t';
    case 'area':
      return 'bi-text-paragraph';
    case 'url':
    case 'link':
      return 'bi-link-45deg';
    case 'embed':
      return 'bi-youtube';
    case 'color':
      return 'bi-palette';
    case 'select':
      return 'bi-ui-checks';
    case 'email':
      return 'bi-envelope';
    case 'tel':
      return 'bi-telephone';
    case 'number':
      return 'bi-123';
    default:
      return 'bi-input-cursor-text';
  }
}

export function describeObject(obj: Record<string, unknown>, prefix = ''): FieldDesc[] {
  return Object.entries(obj)
    .filter(([key]) => key !== 'schemaVersion' && key !== 'decorativeImagePaths')
    .map(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const label = fieldLabel(key);
    const hint = fieldHint(key);
    if (typeof value === 'boolean') {
      return { key, path, label, kind: 'bool' as const, hint };
    }
    if (typeof value === 'number') {
      return { key, path, label, kind: 'number' as const, hint };
    }
    if (Array.isArray(value)) {
      const kind = value.every((item) => item == null || typeof item === 'string' || typeof item === 'number')
        ? 'strings'
        : 'list';
      return { key, path, label, kind, hint };
    }
    if (value && typeof value === 'object') {
      return { key, path, label, kind: 'group' as const, hint };
    }
    if (typeof value === 'string' && isImageField(key, value)) {
      return { key, path, label, kind: 'image' as const, hint };
    }
    if (typeof value === 'string' && (RICH_KEYS.test(key) || /<[a-z][\s\S]*>/i.test(value))) {
      return { key, path, label, kind: 'rich' as const, hint };
    }
    if (typeof value === 'string' && EMAIL_KEYS.test(key)) {
      return { key, path, label, kind: 'email' as const, hint };
    }
    if (typeof value === 'string' && TEL_KEYS.test(key)) {
      return { key, path, label, kind: 'tel' as const, hint };
    }
    if (typeof value === 'string' && URL_KEYS.test(key)) {
      return { key, path, label, kind: 'url' as const, hint };
    }
    if (typeof value === 'string' && (AREA_KEYS.test(key) || value.length > 120)) {
      return { key, path, label, kind: 'area' as const, hint, rows: 5 };
    }
    if (typeof value === 'string' && value.length > 36) {
      return { key, path, label, kind: 'area' as const, hint, rows: 2 };
    }
    return { key, path, label, kind: 'text' as const, hint };
  });
}

export function itemImage(item: unknown): string | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const data = item as Record<string, unknown>;
  for (const key of ['image', 'img', 'photo', 'logo', 'heroImage']) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

export function itemTitle(item: unknown, index: number): string {
  if (item && typeof item === 'object') {
    const data = item as Record<string, unknown>;
    const title = data['title'] || data['name'] || data['client'] || data['label'] || data['badge'];
    if (typeof title === 'string' && title.trim()) {
      return title;
    }
  }
  if (typeof item === 'string' && item.trim()) {
    return item;
  }
  return 'Sin título';
}
