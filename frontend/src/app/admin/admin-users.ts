import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsApiService } from '../cms/cms-api.service';

interface AdminUser {
  id: number;
  username: string;
  role: string;
  active: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="wrap">
      <header class="page-head">
        <div class="grow">
          <h1>Usuarios del panel</h1>
          <p class="admin-lead">Crea cuentas, cambia el rol o desactiva el acceso. Solo el administrador ve esta pantalla.</p>
        </div>
      </header>

      <div class="admin-card">
        <h2>Nueva cuenta</h2>
        <p class="card-sub">El editor puede modificar contenido; el administrador además gestiona usuarios e integraciones.</p>
        <form class="create" (ngSubmit)="create()">
          <div class="admin-field">
            <label for="u-name">Usuario</label>
            <input id="u-name" class="admin-control" name="username" [(ngModel)]="username" placeholder="Ej. maria" required autocomplete="off">
          </div>
          <div class="admin-field">
            <label for="u-pass">Contraseña</label>
            <input id="u-pass" class="admin-control" name="password" [(ngModel)]="password" type="password" placeholder="Mínimo 8 caracteres" required autocomplete="new-password">
          </div>
          <div class="admin-field">
            <label for="u-role">Rol</label>
            <select id="u-role" class="admin-control" name="role" [(ngModel)]="role">
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" class="admin-btn" [disabled]="saving()">{{ saving() ? 'Creando…' : 'Crear usuario' }}</button>
        </form>
        @if (formError()) {
          <p class="admin-banner error">{{ formError() }}</p>
        }
        @if (ok()) {
          <p class="admin-banner ok">{{ ok() }}</p>
        }
      </div>

      @if (error()) {
        <p class="admin-banner error" role="alert">{{ error() }}</p>
      }

      <ul class="row-list">
        @for (item of items(); track item.id) {
          <li class="row-card user-row" [class.inactive]="!item.active">
            <span class="avatar-circle" [class.soft]="item.role !== 'admin'" aria-hidden="true">
              {{ initial(item.username) }}
            </span>
            <div class="grow">
              <strong>{{ item.username }}</strong>
              <span class="user-sub">
                <span class="pill sm" [class.dark]="item.role === 'admin'" [class.neutral]="item.role !== 'admin'">
                  {{ item.role === 'admin' ? 'Administrador' : 'Editor' }}
                </span>
                <span class="pill sm" [class.ok]="item.active" [class.danger]="!item.active">
                  {{ item.active ? 'Activo' : 'Inactivo' }}
                </span>
              </span>
            </div>
            <div class="actions">
              <select class="admin-control sm" [ngModel]="item.role" (ngModelChange)="setRole(item, $event)" [attr.aria-label]="'Rol de ' + item.username">
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
              <button type="button" class="admin-btn ghost sm" [class.danger]="item.active" (click)="toggleActive(item)">
                {{ item.active ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    .wrap { max-width: 760px; }
    .create {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.7rem;
    }
    .create .admin-btn { grid-column: 1 / -1; justify-self: start; }
    .admin-card .admin-banner { margin-top: 0.8rem; }
    .user-row.inactive { opacity: 0.75; }
    .user-row strong { display: block; font-size: 0.95rem; }
    .user-sub { display: flex; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap; }
    .pill.sm { min-height: 24px; font-size: 0.68rem; }
    .actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .admin-control.sm { min-height: 34px; width: auto; font-size: 0.8125rem; }
    @media (max-width: 560px) {
      .create { grid-template-columns: 1fr; }
      .user-row { flex-wrap: wrap; }
      .actions { width: 100%; }
    }
  `],
})
export class AdminUsers implements OnInit {
  private api = inject(CmsApiService);
  items = signal<AdminUser[]>([]);
  error = signal('');
  formError = signal('');
  ok = signal('');
  saving = signal(false);
  username = '';
  password = '';
  role = 'editor';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  initial(name: string): string {
    return (name || '?').slice(0, 1).toUpperCase();
  }

  async reload(): Promise<void> {
    this.error.set('');
    try {
      this.items.set(await this.api.listUsers());
    } catch {
      this.error.set('No se pudieron cargar los usuarios.');
    }
  }

  async create(): Promise<void> {
    this.formError.set('');
    this.ok.set('');
    this.saving.set(true);
    try {
      await this.api.createUser({ username: this.username.trim(), password: this.password, role: this.role });
      this.username = '';
      this.password = '';
      this.ok.set('Usuario creado.');
      await this.reload();
    } catch (err) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.formError.set(message || 'No se pudo crear el usuario.');
    } finally {
      this.saving.set(false);
    }
  }

  async setRole(item: AdminUser, role: string): Promise<void> {
    try {
      await this.api.patchUser(item.id, { role });
      await this.reload();
    } catch {
      this.error.set('No se pudo cambiar el rol.');
    }
  }

  async toggleActive(item: AdminUser): Promise<void> {
    try {
      await this.api.patchUser(item.id, { active: !item.active });
      await this.reload();
    } catch {
      this.error.set('No se pudo actualizar el estado.');
    }
  }
}
