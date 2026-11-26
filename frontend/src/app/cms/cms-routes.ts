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
  clientes: '/clientes',
  sitio: '/',
};

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
  clientes: 'Clientes',
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
  clientes: { icon: 'bi-building', blurb: 'Logos, casos y fases' },
};

export const PAGE_GROUPS: { title: string; slugs: string[] }[] = [
  { title: 'Apariencia', slugs: ['sitio'] },
  { title: 'Páginas', slugs: ['inicio', 'acerca-de', 'contacto', 'clientes'] },
  { title: 'Servicios', slugs: ['servicios', 'servicios-software', 'servicios-hardware', 'servicios-saas', 'servicios-consultoria', 'servicios-soluciones-ti'] },
  { title: 'Legal', slugs: ['privacidad', 'terminos', 'libro-reclamaciones'] },
];

export const PATH_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/servicios': 'Servicios',
  '/servicios/software': 'Software',
  '/servicios/saas': 'SaaS',
  '/servicios/consultoria': 'Consultoría',
  '/servicios/soluciones-ti': 'Soluciones TI',
  '/servicios/hardware': 'Hardware',
  '/acerca-de': 'Acerca de',
  '/contacto': 'Contacto',
  '/libro-reclamaciones': 'Libro de reclamaciones',
  '/clientes': 'Clientes',
  '/privacidad': 'Privacidad',
  '/terminos': 'Términos',
};

export const CHATBOT_PATH_LABELS: Record<string, string> = {
  ...PATH_LABELS,
  '/servicios/software': 'Software y web',
  '/servicios/consultoria': 'Consultoría TI',
};

export const CHATBOT_PATH_LABELS_EN: Record<string, string> = {
  '/': 'Home',
  '/servicios': 'Services',
  '/servicios/software': 'Software & web',
  '/servicios/saas': 'SaaS',
  '/servicios/consultoria': 'IT consulting',
  '/servicios/soluciones-ti': 'IT solutions',
  '/servicios/hardware': 'Hardware',
  '/acerca-de': 'About',
  '/contacto': 'Contact',
  '/libro-reclamaciones': 'Claims book',
  '/clientes': 'Clients',
  '/privacidad': 'Privacy',
  '/terminos': 'Terms',
};

export const CHATBOT_WELCOME_LINKS = [
  { label: 'Servicios', path: '/servicios' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Contacto', path: '/contacto' },
] as const;

export const CHATBOT_WELCOME_LINKS_EN = [
  { label: 'Services', path: '/servicios' },
  { label: 'Clients', path: '/clientes' },
  { label: 'Contact', path: '/contacto' },
] as const;

export const KNOWN_NAV_PATHS = new Set(
  Object.entries(SLUG_PATHS)
    .filter(([slug]) => slug !== 'sitio')
    .map(([, path]) => path)
);

export function publicPathLabel(path: string, locale: 'es' | 'en' = 'es'): string {
  if (locale === 'en') {
    return CHATBOT_PATH_LABELS_EN[path] ?? path;
  }
  return CHATBOT_PATH_LABELS[path] ?? PATH_LABELS[path] ?? path;
}
