import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsContentService } from '../cms/cms-content.service';
import { CmsMessage, labeledMessageFields } from '../cms/cms.models';

type MessageFilter = 'all' | 'contacto' | 'reclamacion' | 'accesibilidad';
type StatusFilter = 'all' | 'pendiente' | 'atendido';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Mensajes recibidos</h1>
          <p class="admin-lead">Consultas de contacto y hojas del libro de reclamaciones. Se guardan en la base y, si el SMTP está activo, también salen por correo.</p>
        </div>
        <div class="head-actions">
          <button type="button" class="admin-btn ghost sm" (click)="exportCsv()" [disabled]="items().length === 0">Exportar CSV</button>
        </div>
      </header>

      <div class="stat-grid">
        <div class="stat"><b>{{ total() }}</b><span>Registros</span></div>
        <div class="stat warn"><b>{{ pendingCount() }}</b><span>Pendientes</span></div>
        <div class="stat ok"><b>{{ doneCount() }}</b><span>Atendidos</span></div>
      </div>

      <div class="admin-seg" role="group" aria-label="Filtrar mensajes">
        <button type="button" [attr.aria-pressed]="filter() === 'all'" [class.active]="filter() === 'all'" (click)="setFilter('all')">Todos</button>
        <button type="button" [attr.aria-pressed]="filter() === 'contacto'" [class.active]="filter() === 'contacto'" (click)="setFilter('contacto')">Contacto</button>
        <button type="button" [attr.aria-pressed]="filter() === 'reclamacion'" [class.active]="filter() === 'reclamacion'" (click)="setFilter('reclamacion')">Reclamaciones</button>
        <button type="button" [attr.aria-pressed]="filter() === 'accesibilidad'" [class.active]="filter() === 'accesibilidad'" (click)="setFilter('accesibilidad')">Accesibilidad</button>
      </div>

      <div class="admin-toolbar">
        <div class="grow">
          <input
            type="search"
            [(ngModel)]="query"
            (keyup.enter)="reload()"
            placeholder="Buscar ticket, correo o texto"
            aria-label="Buscar mensajes"
          >
        </div>
        <select class="fixed" [(ngModel)]="status" (ngModelChange)="reload()" aria-label="Estado">
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="atendido">Atendidos</option>
        </select>
        <button type="button" class="admin-btn fixed" (click)="reload()">Buscar</button>
      </div>

      @if (loading()) {
        <div class="admin-group" aria-busy="true">
          <div class="admin-skel"></div>
          <div class="admin-skel"></div>
        </div>
      } @else if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <strong>Sin mensajes{{ filter() === 'all' ? '' : ' de este tipo' }}</strong>
          <p>Cuando alguien escriba desde la web, aparecerá aquí.</p>
        </div>
      } @else {
        <ul class="row-list">
          @for (item of items(); track item.id) {
            <li class="msg-card" [class.expanded]="openId() === item.id">
              <button type="button" class="msg-head" (click)="toggle(item.id)" [attr.aria-expanded]="openId() === item.id">
                <span class="msg-copy">
                  <strong>{{ item.subject }}</strong>
                  <span class="msg-meta">
                    <span class="pill sm" [class.warn]="item.kind === 'reclamacion'" [class.neutral]="item.kind !== 'reclamacion'">
                      {{ item.kind === 'reclamacion' ? 'Reclamación' : (item.kind === 'accesibilidad' ? 'Accesibilidad' : 'Contacto') }}
                    </span>
                    @if (item.ticket) {
                      <code class="ticket-inline">{{ item.ticket }}</code>
                    }
                    <time>{{ item.created_at | date:'d/M/yyyy, H:mm' }}</time>
                  </span>
                </span>
                <span class="pill sm" [class.ok]="item.status === 'atendido'" [class.warn]="item.status !== 'atendido'">
                  {{ item.status === 'atendido' ? 'Atendido' : 'Pendiente' }}
                </span>
                <i class="bi chev" [class.bi-chevron-down]="openId() !== item.id" [class.bi-chevron-up]="openId() === item.id" aria-hidden="true"></i>
              </button>
              @if (openId() === item.id) {
                <div class="msg-body">
                  <p class="mail-line">Correo: {{ item.mail_sent ? 'enviado' : 'no enviado (revisar SMTP)' }}</p>
                  <dl class="fields">
                    @for (field of fields(item); track field.label + field.value) {
                      <div class="field">
                        <dt>{{ field.label }}</dt>
                        <dd>{{ field.value }}</dd>
                      </div>
                    }
                  </dl>
                  <div class="msg-actions">
                    <button type="button" class="admin-btn sm" [class.ghost]="item.status === 'atendido'" (click)="toggleStatus(item)" [disabled]="savingId() === item.id">
                      {{ savingId() === item.id ? 'Guardando…' : (item.status === 'atendido' ? 'Marcar pendiente' : 'Marcar atendido') }}
                    </button>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
        @if (total() > limit) {
          <div class="pager">
            <button type="button" class="admin-btn ghost sm" [disabled]="page() <= 1" (click)="goPage(page() - 1)">Anterior</button>
            <span class="admin-num">Página {{ page() }}</span>
            <button type="button" class="admin-btn ghost sm" [disabled]="page() * limit >= total()" (click)="goPage(page() + 1)">Siguiente</button>
          </div>
        }
      }
    </section>
  `,
  styleUrl: './styles/messages.scss',
})
export class AdminMessages implements OnInit {
  private cms = inject(CmsContentService);
  items = signal<CmsMessage[]>([]);
  total = signal(0);
  page = signal(1);
  readonly limit = 50;
  filter = signal<MessageFilter>('all');
  status: StatusFilter = 'all';
  query = '';
  openId = signal<number | null>(null);
  loading = signal(true);
  error = signal('');
  savingId = signal<number | null>(null);

  pendingCount = computed(() => this.items().filter((m) => m.status !== 'atendido').length);
  doneCount = computed(() => this.items().filter((m) => m.status === 'atendido').length);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  setFilter(kind: MessageFilter): void {
    this.filter.set(kind);
    this.page.set(1);
    void this.reload();
  }

  goPage(next: number): void {
    this.page.set(Math.max(1, next));
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.cms.listMessages({
        kind: this.filter() === 'all' ? undefined : this.filter(),
        status: this.status === 'all' ? undefined : this.status,
        q: this.query.trim() || undefined,
        page: this.page(),
        limit: this.limit,
      });
      this.items.set(res.items);
      this.total.set(res.total);
      this.openId.set(res.items[0]?.id ?? null);
    } catch {
      this.error.set('No se pudieron cargar los mensajes. Revisa tu conexión.');
    } finally {
      this.loading.set(false);
    }
  }

  toggle(id: number): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  async toggleStatus(item: CmsMessage): Promise<void> {
    const next = item.status === 'atendido' ? 'pendiente' : 'atendido';
    this.savingId.set(item.id);
    try {
      const saved = await this.cms.patchMessage(item.id, { status: next });
      this.items.update((list) => list.map((row) => (row.id === item.id ? { ...row, ...saved } : row)));
    } catch {
      this.error.set('No se pudo actualizar el estado.');
    } finally {
      this.savingId.set(null);
    }
  }

  exportCsv(): void {
    const rows = this.items();
    const header = ['id', 'tipo', 'ticket', 'estado', 'correo_enviado', 'asunto', 'fecha'];
    const lines = [header.join(',')];
    for (const item of rows) {
      const cells = [
        item.id,
        item.kind,
        item.ticket ?? '',
        item.status ?? 'pendiente',
        item.mail_sent ? 'si' : 'no',
        item.subject,
        item.created_at,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
      lines.push(cells.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mensajes-mattinnova.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  fields(item: CmsMessage) {
    return labeledMessageFields(item.payload ?? {});
  }
}
