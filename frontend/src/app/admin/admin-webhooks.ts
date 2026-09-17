import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsApiService } from '../cms/cms-api.service';

@Component({
  selector: 'app-admin-webhooks',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Webhooks</h1>
          <p class="admin-lead">Al publicar una página se avisa a estas URLs (firma HMAC). Sirve para CMS, indexación o Slack.</p>
        </div>
      </header>

      <div class="admin-card">
        <h2>Nuevo webhook</h2>
        <p class="card-sub">Usa una URL https. El evento habitual es <code>publish</code>.</p>
        <form class="create" (ngSubmit)="create()">
          <div class="admin-field url">
            <label for="wh-url">URL</label>
            <input id="wh-url" class="admin-control" name="url" [(ngModel)]="url" placeholder="https://…" required autocomplete="off">
          </div>
          <div class="admin-field">
            <label for="wh-events">Eventos</label>
            <input id="wh-events" class="admin-control" name="events" [(ngModel)]="events" placeholder="publish" autocomplete="off">
          </div>
          <button type="submit" class="admin-btn" [disabled]="saving()">{{ saving() ? 'Añadiendo…' : 'Añadir' }}</button>
        </form>
      </div>

      @if (secret()) {
        <p class="admin-banner ok"><span>Guarda este secreto, no se vuelve a mostrar: <code>{{ secret() }}</code></span></p>
      }
      @if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      }

      @if (items().length === 0) {
        <div class="empty-state">
          <strong>Sin webhooks</strong>
          <p>Añade una URL para recibir avisos al publicar.</p>
        </div>
      } @else {
        <ul class="row-list">
          @for (item of items(); track item.id) {
            <li class="row-card wh-row">
              <div class="grow">
                <strong class="url">{{ item.url }}</strong>
                <span class="wh-sub">
                  <code>{{ item.events }}</code>
                  <span class="pill sm" [class.ok]="item.active" [class.neutral]="!item.active">
                    {{ item.active ? 'Activo' : 'Pausado' }}
                  </span>
                </span>
              </div>
              <div class="actions">
                <button type="button" class="admin-btn ghost sm" (click)="test(item.id)">Probar</button>
                <button type="button" class="admin-btn ghost sm" (click)="toggle(item)">{{ item.active ? 'Pausar' : 'Activar' }}</button>
                <button type="button" class="admin-btn danger sm" (click)="remove(item.id)">Quitar</button>
              </div>
            </li>
          }
        </ul>
      }

      @if (log().length) {
        <div class="admin-card log-card">
          <h2>Últimas entregas</h2>
          <p class="card-sub">Resultado de los últimos envíos a cada URL.</p>
          <ul class="log">
            @for (row of log(); track row.id) {
              <li>
                <span class="pill sm" [class.ok]="row.status === 'ok' || row.status === '200'" [class.danger]="row.status !== 'ok' && row.status !== '200'">
                  {{ row.status }}
                </span>
                <span class="log-copy">
                  <strong>{{ row.event }}</strong>
                  <small>{{ row.created_at }}@if (row.last_error) { · {{ row.last_error }} }</small>
                </span>
              </li>
            }
          </ul>
        </div>
      }
    </section>
  `,
  styles: [`
    .wrap { max-width: 800px; }
    .create { display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.7rem; align-items: end; }
    .admin-banner.ok code, .card-sub code, .wh-sub code { font-family: ui-monospace, monospace; }
    .empty-state { margin-top: 0.9rem; }
    .wh-row strong.url { display: block; font-size: 0.875rem; overflow-wrap: anywhere; }
    .wh-sub { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.3rem; flex-wrap: wrap; }
    .wh-sub code {
      font-size: 0.72rem; background: var(--admin-paper); border: 1px solid var(--admin-line);
      padding: 0.1rem 0.45rem; border-radius: 6px; color: var(--admin-muted);
    }
    .pill.sm { min-height: 24px; font-size: 0.68rem; }
    .actions { display: flex; gap: 0.45rem; flex-wrap: wrap; justify-content: flex-end; }
    .log-card { margin-top: 0.9rem; }
    .log { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.45rem; }
    .log li {
      display: flex; gap: 0.7rem; align-items: flex-start;
      background: #faf9f7; border: 1px solid var(--admin-line);
      border-radius: 8px; padding: 0.55rem 0.7rem;
    }
    .log-copy { display: grid; gap: 0.1rem; min-width: 0; }
    .log-copy strong { font-size: 0.83rem; }
    .log-copy small { color: var(--admin-muted); font-size: 0.75rem; overflow-wrap: anywhere; }
    @media (max-width: 640px) {
      .create { grid-template-columns: 1fr; }
      .wh-row { flex-wrap: wrap; }
    }
  `],
})
export class AdminWebhooks implements OnInit {
  private api = inject(CmsApiService);
  items = signal<Array<{ id: number; url: string; events: string; active: boolean }>>([]);
  log = signal<Array<{ id: number; event: string; status: string; last_error: string; created_at: string }>>([]);
  error = signal('');
  secret = signal('');
  saving = signal(false);
  url = '';
  events = 'publish';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.error.set('');
    try {
      this.items.set(await this.api.listWebhooks());
    } catch {
      this.error.set('No se pudieron cargar los webhooks.');
    }
  }

  async create(): Promise<void> {
    this.saving.set(true);
    this.secret.set('');
    try {
      const res = await this.api.createWebhook({ url: this.url.trim(), events: this.events.trim() || 'publish' });
      this.secret.set(res.secret);
      this.url = '';
      await this.reload();
    } catch {
      this.error.set('No se pudo crear el webhook. Usa una URL https://');
    } finally {
      this.saving.set(false);
    }
  }

  async test(id: number): Promise<void> {
    try {
      const res = await this.api.testWebhook(id);
      this.log.set(await this.api.listWebhookDeliveries(id));
      if (!res.ok) {
        this.error.set(res.error || 'La prueba falló.');
      }
    } catch {
      this.error.set('No se pudo probar el webhook.');
    }
  }

  async toggle(item: { id: number; active: boolean }): Promise<void> {
    await this.api.patchWebhook(item.id, { active: !item.active });
    await this.reload();
  }

  async remove(id: number): Promise<void> {
    if (!confirm('¿Quitar este webhook?')) {
      return;
    }
    await this.api.deleteWebhook(id);
    await this.reload();
  }
}
