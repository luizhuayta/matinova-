export function isLiveHref(url: unknown): boolean {
  const value = String(url ?? '').trim();
  if (!value || value === '#') {
    return false;
  }
  if (/^javascript:/i.test(value)) {
    return false;
  }
  if (/\.(xyz|website)(\/|$|\?)/i.test(value)) {
    return false;
  }
  if (/makitoolsporu/i.test(value)) {
    return false;
  }
  return true;
}

export function isEmojiMark(value: unknown): boolean {
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(String(value ?? ''));
}

export function bootstrapIcon(icon: unknown, fallback = 'bi-circle'): string {
  const value = String(icon ?? '').trim();
  if (!value || isEmojiMark(value)) {
    return className(fallback);
  }
  if (value.startsWith('bi ')) {
    return value;
  }
  if (value.startsWith('bi-')) {
    return `bi ${value}`;
  }
  return className(fallback);
}

function className(icon: string): string {
  return icon.startsWith('bi ') ? icon : `bi ${icon.replace(/^bi-/, 'bi-')}`;
}

const STOCK_WEBP_STEMS = new Set([
  'consultoria',
  'giovani',
  'hardware2026',
  'imac',
  'imas',
  'imat',
  'microsoft3651',
  'saas',
  'saas2026',
  'software',
  'software-banner',
  'sol_ti',
  'soluciones',
  'taya',
]);

export function publicPhotoSrc(src: unknown): string {
  const value = String(src ?? '').trim();
  if (!value || value.includes('/uploads/')) {
    return value;
  }
  const file = value.split('?')[0];
  const base = file.replace(/^.*\//, '');
  const stem = base.replace(/\.(jpe?g|png)$/i, '');
  if (STOCK_WEBP_STEMS.has(stem) && /\.(jpe?g|png)$/i.test(base)) {
    return value.replace(/\.(jpe?g|png)(\?.*)?$/i, '.webp$2');
  }
  return value;
}

export function rasterFallback(src: unknown): string {
  const value = String(src ?? '').trim();
  if (!value) {
    return '';
  }
  if (value.includes('/uploads/')) {
    return value.replace(/\.webp($|\?)/i, '.jpg$1');
  }
  if (/\.webp$/i.test(value)) {
    return value.replace(/\.webp$/i, '.jpg');
  }
  return value;
}

export function webpSource(src: unknown): string {
  const value = String(src ?? '').trim();
  if (!value || !/\.webp$/i.test(value.split('?')[0])) {
    return '';
  }
  return value;
}

const UPLOAD_STEM = /(?:^|\/)uploads\/([a-f0-9]{16})(?:-(?:480|960))?\.(webp|jpe?g)$/i;

export function uploadMediaId(src: unknown): string {
  const value = String(src ?? '').trim().split('?')[0];
  const match = value.match(UPLOAD_STEM);
  return match ? match[1].toLowerCase() : '';
}

export type CmsImageFit = 'hero' | 'card' | 'full';

export function imageSizes(fit: CmsImageFit = 'full'): string {
  if (fit === 'hero') {
    return '(max-width: 900px) 100vw, 50vw';
  }
  if (fit === 'card') {
    return '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw';
  }
  return '100vw';
}

export function inferImageFit(el: HTMLElement): CmsImageFit {
  if (el.closest('.visual-frame, .page-hero-visual')) {
    return 'hero';
  }
  if (el.closest('.service-media, .gallery-grid, .team-photo, .reason-bay, .glass-media, .client-tile')) {
    return 'card';
  }
  return 'full';
}

export function buildSrcset(src: unknown, format: 'webp' | 'jpeg' = 'webp'): string {
  const id = uploadMediaId(src);
  if (!id) {
    return format === 'webp' ? webpSource(publicPhotoSrc(src)) : rasterFallback(src);
  }
  const ext = format === 'webp' ? 'webp' : 'jpg';
  return [
    `/api/uploads/${id}-480.${ext} 480w`,
    `/api/uploads/${id}-960.${ext} 960w`,
    `/api/uploads/${id}.${ext} 1920w`,
  ].join(', ');
}

export function webpSrcset(src: unknown): string {
  return buildSrcset(src, 'webp');
}

export function displayPhotoSrc(src: unknown): string {
  return webpSrcset(src) ? publicPhotoSrc(src) : publicPhotoSrc(rasterFallback(src));
}

export function rasterSrcset(src: unknown): string {
  return buildSrcset(src, 'jpeg');
}

export function srcsetFromVariants(
  variants: Array<{ width: number; url: string; kind?: string }> | undefined,
  format: 'webp' | 'jpeg'
): string {
  if (!variants?.length) {
    return '';
  }
  const wantJpeg = format === 'jpeg';
  return variants
    .filter((item) => {
      const jpeg = item.kind === 'raster' || /\.jpe?g($|\?)/i.test(item.url);
      return wantJpeg ? jpeg : !jpeg && /\.webp($|\?)/i.test(item.url);
    })
    .map((item) => `${item.url} ${item.width}w`)
    .join(', ');
}

export function isPlaceholderPhoto(src: unknown): boolean {
  const value = String(src ?? '').trim();
  if (!value) {
    return true;
  }
  return /handshake/i.test(value);
}

export function preferredCmsImage(...candidates: unknown[]): string {
  const values = candidates.map((item) => String(item ?? '').trim()).filter(Boolean);
  return values.find((item) => item.includes('/uploads/')) || values.find((item) => !isPlaceholderPhoto(item)) || '';
}

export function swapBrokenImage(event: Event, fallback: string): void {
  const img = event.target as HTMLImageElement | null;
  if (!img || img.dataset['illuFallback'] === '1') {
    return;
  }
  img.dataset['illuFallback'] = '1';
  img.removeAttribute('srcset');
  const picture = img.parentElement;
  if (picture?.tagName === 'PICTURE') {
    picture.querySelectorAll('source').forEach((source) => source.removeAttribute('srcset'));
  }
  img.src = fallback;
}
