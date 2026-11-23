import { describe, expect, it } from 'vitest';
import { bootstrapIcon, buildSrcset, imageSizes, isEmojiMark, isLiveHref, isPlaceholderPhoto, preferredCmsImage, publicPhotoSrc, rasterFallback, uploadMediaId, webpSource, webpSrcset } from './public-url';

describe('public-url helpers', () => {
  it('rejects hash, demo, and typo URLs', () => {
    expect(isLiveHref('#')).toBe(false);
    expect(isLiveHref('https://electrihouse.xyz/')).toBe(false);
    expect(isLiveHref('http://arcangelfarmacia.website/')).toBe(false);
    expect(isLiveHref('https://makitoolsporu.com/')).toBe(false);
    expect(isLiveHref('http://tecnocom.edu.pe/')).toBe(true);
  });

  it('maps emoji icons to Bootstrap and keeps bi classes', () => {
    expect(isEmojiMark('🎯')).toBe(true);
    expect(bootstrapIcon('🎯', 'bi-calendar3')).toBe('bi bi-calendar3');
    expect(bootstrapIcon('bi-people')).toBe('bi bi-people');
  });

  it('only emits a webp source when the CMS URL is already webp', () => {
    expect(webpSource('imac.jpg')).toBe('');
    expect(webpSource('/ServidoresHPE.png')).toBe('');
    expect(webpSource('/INFRAESTRUCTURAIT.jpg')).toBe('');
    expect(webpSource('software.webp')).toBe('software.webp');
    expect(webpSource('/api/uploads/27dd730a948402a6.webp')).toBe('/api/uploads/27dd730a948402a6.webp');
    expect(rasterFallback('imac.webp')).toBe('imac.jpg');
    expect(rasterFallback('software.webp')).toBe('software.jpg');
    expect(rasterFallback('software.png')).toBe('software.png');
    expect(rasterFallback('imas.jpg')).toBe('imas.jpg');
    expect(rasterFallback('/api/uploads/c52b088f5b3f3081.webp')).toBe('/api/uploads/c52b088f5b3f3081.jpg');
  });

  it('serves stock founder/team webp instead of the locked jpg', () => {
    expect(publicPhotoSrc('taya.jpg')).toBe('taya.webp');
    expect(publicPhotoSrc('giovani.jpg')).toBe('giovani.webp');
    expect(publicPhotoSrc('/taya.jpg')).toBe('/taya.webp');
    expect(publicPhotoSrc('carousel.jpg')).toBe('carousel.jpg');
    expect(publicPhotoSrc('/api/uploads/abc.webp')).toBe('/api/uploads/abc.webp');
  });

  it('prefers a CMS upload over a stock photo', () => {
    expect(preferredCmsImage('/software.webp', '/api/uploads/abc.webp')).toBe('/api/uploads/abc.webp');
    expect(preferredCmsImage('/api/uploads/a.webp', '/api/uploads/b.webp')).toBe('/api/uploads/a.webp');
    expect(preferredCmsImage('about-image.jpg', '')).toBe('about-image.jpg');
    expect(preferredCmsImage('', '/INFRAESTRUCTURAIT.jpg')).toBe('/INFRAESTRUCTURAIT.jpg');
    expect(isPlaceholderPhoto('about-image.jpg')).toBe(false);
    expect(isPlaceholderPhoto('/carousel.jpg')).toBe(false);
    expect(isPlaceholderPhoto('/api/uploads/abc.webp')).toBe(false);
  });

  it('builds srcset for CMS uploads and sizes by fit', () => {
    expect(uploadMediaId('/api/uploads/27dd730a948402a6.webp')).toBe('27dd730a948402a6');
    expect(uploadMediaId('/api/uploads/27dd730a948402a6-480.webp')).toBe('27dd730a948402a6');
    expect(uploadMediaId('software.webp')).toBe('');
    expect(webpSrcset('/api/uploads/27dd730a948402a6.webp')).toBe(
      '/api/uploads/27dd730a948402a6-480.webp 480w, /api/uploads/27dd730a948402a6-960.webp 960w, /api/uploads/27dd730a948402a6.webp 1920w'
    );
    expect(buildSrcset('/api/uploads/27dd730a948402a6.webp', 'jpeg')).toContain('-480.jpg 480w');
    expect(webpSrcset('software.webp')).toBe('software.webp');
    expect(imageSizes('hero')).toContain('50vw');
    expect(imageSizes('card')).toContain('33vw');
  });
});
