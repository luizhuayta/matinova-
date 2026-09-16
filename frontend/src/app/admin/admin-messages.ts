import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsMessage, labeledMessageFields } from '../cms/cms.models';

type MessageFilter = 'all' | 'contacto' | 'reclamacion';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="wrap">
      <h1>Mensajes recibidos</h1>
      <p class="admin-lead">Consultas de contacto y hojas del libro de reclamaciones.</p>

      <div class="filters" role="tablist" aria-label="Filtrar mensajes">
        <button type="button" role="tab" [attr.aria-selected]="filter() === 'all'" [class.active]="filter() === 'all'" (click)="filter.set('all')">Todos</button>
        <button type="button" role="tab" [attr.aria-selected]="filter() === 'contacto'" [class.active]="filter() === 'contacto'" (click)="filter.set('contacto')">Contacto</button>
        <button type="button" role="tab" [attr.aria-selected]="filter() === 'reclamacion'" [class.active]="filter() === 'reclamacion'" (click)="filter.set('reclamacion')">Reclamaciones</button>
      </div>

      @if (loading()) {
        <div class="admin-group">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      } @else if (visible().length === 0) {
        <p class="admin-empty">Aún no hay mensajes{{ filter() === 'all' ? '' : ' de este tipo' }}. Cuando alguien escriba desde la web, aparecerán aquí.</p>
      } @else {
        <ul class="msg-list">
          @for (item of visible(); track item.id) {
            <li>
              <button type="button" class="msg-head" (click)="toggle(item.id)" [attr.aria-expanded]="openId() === item.id">
                <span class="admin-chip" [class.warn]="item.kind === 'reclamacion'">
                  {{ item.kind === 'reclamacion' ? 'Reclamación' : 'Contacto' }}
                </span>
                <strong>{{ item.subject }}</strong>
                <time>{{ item.created_at | date:'d/M/yyyy, H:mm' }}</time>
                <i class="bi" [class.bi-chevron-down]="openId() !== item.id" [class.bi-chevron-up]="openId() === item.id" aria-hidden="true"></i>
              </button>
              @if (openId() === item.id) {
                <div class="msg-body">
                  @if (item.ticket) {
                    <p class="ticket">Ticket {{ item.ticket }}</p>
                  }
                  @for (field of fields(item); track field.label + field.value) {
                    <div class="field">
                      <dt>{{ field.label }}</dt>
                      <dd>{{ field.value }}</dd>
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .wrap { max-width: 860px; }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 1.1rem 0 0.35rem;
      padding: 4px;
      width: fit-content;
      background: #fff;
      border: 1px solid var(--admin-line);
      border-radius: 12px;
    }
    .filters button {
      min-height: 40px;
      padding: 0 0.9rem;
      border-radius: 8px;
      background: transparent;
      color: var(--admin-muted);
      font-weight: 600;
    }
    .filters button.active {
      background: var(--admin-blue-btn);
      color: #fff;
    }
    .msg-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 10px; }
    li {
      background: var(--admin-surface);
      border: 1px solid var(--admin-line);
      border-radius: 12px;
      overflow: hidden;
    }
    .msg-head {
      width: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: 0.75rem;
      align-items: center;
      min-height: 56px;
      padding: 0.7rem 1rem;
      background: transparent;
      text-align: left;
    }
    .msg-head strong {
      font-size: 0.95rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .msg-head time { color: var(--admin-muted); font-size: 0.8rem; }
    .msg-body {
      display: grid;
      gap: 0.75rem;
      padding: 0 1rem 1rem;
      border-top: 1px solid var(--admin-line);
      padding-top: 0.9rem;
    }
    .ticket { font-weight: 600; color: var(--admin-text); }
    .field dt {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--admin-muted);
      margin-bottom: 0.15rem;
    }
    .field dd {
      margin: 0;
      color: var(--admin-text);
      white-space: pre-wrap;
    }
    @media (max-width: 640px) {
      .msg-head {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }
      .msg-head time { display: none; }
    }
  `],
})
export class AdminMessages implements OnInit {
  private cms = inject(CmsContentService);
  items = signal<CmsMessage[]>([]);
  filter = signal<MessageFilter>('all');
  openId = signal<number | null>(null);
  loading = signal(true);
  error = signal('');
  visible = computed(() => {
    const kind = this.filter();
    const list = this.items();
    return kind === 'all' ? list : list.filter((item) => item.kind === kind);
  });

  async ngOnInit(): Promise<void> {
    try {
      const items = await this.cms.listMessages();
      this.items.set(items);
      this.openId.set(items[0]?.id ?? null);
    } catch {
      this.error.set('No se pudieron cargar los mensajes. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  toggle(id: number): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  fields(item: CmsMessage) {
    return labeledMessageFields(item.payload ?? {});
  }
}
