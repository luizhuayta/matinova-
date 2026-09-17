import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ChatService } from './chat';
import { HttpClient } from '@angular/common/http';

function service(post: (url: string, body: unknown) => ReturnType<typeof of>) {
  return new ChatService({ post } as unknown as HttpClient);
}

describe('ChatService.sendSmart', () => {
  it('usa /bot en modo clásico', () => {
    const urls: string[] = [];
    const svc = service((url) => {
      urls.push(url);
      return of({ reply: 'menu' });
    });
    let reply = '';
    svc.sendSmart('hola', 'clasico').subscribe((res) => {
      reply = res.reply;
    });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/bot');
    expect(urls[0]).not.toContain('/bot-ai');
    expect(reply).toBe('menu');
  });

  it('usa /bot-ai en modo ia', () => {
    const urls: string[] = [];
    const svc = service((url) => {
      urls.push(url);
      return of({ reply: 'ia', source: 'ia' });
    });
    svc.sendSmart('precios', 'ia').subscribe();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/bot-ai');
  });

  it('cae al bot clásico si la IA falla', () => {
    const urls: string[] = [];
    const svc = new ChatService({
      post: (url: string) => {
        urls.push(url);
        if (String(url).includes('bot-ai')) {
          return throwError(() => ({ status: 502 }));
        }
        return of({ reply: 'clasico', source: 'classic' });
      },
    } as unknown as HttpClient);
    let reply = '';
    svc.sendSmart('hola', 'ia').subscribe((res) => {
      reply = res.reply;
    });
    expect(urls[0]).toContain('/bot-ai');
    expect(urls[1]).toMatch(/\/bot$/);
    expect(reply).toBe('clasico');
  });

  it('propaga links del bot clásico', () => {
    const svc = service(() => of({
      reply: 'libro',
      links: [{ label: 'Libro', path: '/libro-reclamaciones' }],
      source: 'classic',
    }));
    let links: { path: string }[] = [];
    svc.sendSmart('reclamo', 'clasico').subscribe((res) => {
      links = res.links ?? [];
    });
    expect(links[0]?.path).toBe('/libro-reclamaciones');
  });
});
