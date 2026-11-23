import { isInternalLink } from './block-registry';
import { imageSizes, isLiveHref, rasterFallback, rasterSrcset, webpSrcset } from './public-url';
import type { CmsImageFit } from './public-url';

export interface AccentPart {
  text: string;
  accent: boolean;
}

export function splitAccent(title: unknown, accent: unknown): AccentPart[] {
  const text = String(title ?? '');
  if (!text) {
    return [];
  }
  const needle = String(accent ?? '').trim();
  if (!needle) {
    return [{ text, accent: false }];
  }
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) {
    return [{ text, accent: false }];
  }
  const before = text.slice(0, index);
  const match = text.slice(index, index + needle.length);
  const after = text.slice(index + needle.length);
  return [
    ...(before ? [{ text: before, accent: false }] : []),
    { text: match, accent: true },
    ...(after ? [{ text: after, accent: false }] : []),
  ];
}

export function resolveHref(raw: unknown, hrefFor: (path: string) => string, fallback = ''): string {
  const value = String(raw || fallback || '');
  if (!value) {
    return '';
  }
  return isInternalLink(value) ? hrefFor(value) : value;
}

export function aboutVisual(src: unknown): string {
  const img = String(src ?? '').trim();
  if (!img || /about-image|carousel|handshake/i.test(img)) {
    return 'assets/illustrations/why-us.svg';
  }
  return img;
}

export function contactCardHref(card: Record<string, string>, whatsappFallback = '51992422219'): string {
  const title = String(card['title'] || '').toLowerCase();
  const text = String(card['text'] || '').trim();
  if (title.includes('whatsapp')) {
    const fromText = text.replace(/\D/g, '');
    const digits = fromText.length >= 11 ? fromText : whatsappFallback.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }
  if (title.includes('correo') || title.includes('email') || title.includes('mail')) {
    const email = text.match(/[^\s]+@[^\s]+/)?.[0] || text;
    return email ? `mailto:${email}` : '';
  }
  return '';
}

export function contactIconName(icon: unknown, index: number): string {
  const value = String(icon ?? '').toLowerCase();
  if (value.includes('envelope') || value.includes('mail')) {
    return 'mail';
  }
  if (value.includes('whatsapp') || value.includes('telephone') || value.includes('phone')) {
    return 'message';
  }
  if (value.includes('geo') || value.includes('pin') || value.includes('map')) {
    return 'map-pin';
  }
  return ['map-pin', 'mail', 'message'][index] ?? 'map-pin';
}

export function pictureSources(src: unknown, fit: CmsImageFit = 'full'): {
  webp: string;
  raster: string;
  rasterSrcset: string;
  sizes: string;
} {
  return {
    webp: webpSrcset(src),
    raster: rasterFallback(src),
    rasterSrcset: rasterSrcset(src),
    sizes: imageSizes(fit),
  };
}

export function isInternalHref(link: string): boolean {
  return isInternalLink(link);
}

export function isLiveLink(link: string): boolean {
  return isLiveHref(link);
}
